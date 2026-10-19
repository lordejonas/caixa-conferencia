import { Injectable } from '@angular/core';
import { db } from '../core/db/app-database';
import { Lancamento } from '../models/lancamento.model';

@Injectable({
  providedIn: 'root'
})
export class ArredondamentoAutocontrolService {

  /**
   * Processa o arredondamento de centavos para um lançamento recém-criado ou editado.
   * Deve ser chamado DEPOIS que o lançamento pai já foi salvo no Dexie.
   *
   * @param lancamentoPaiId ID do lançamento principal.
   */
  async processarArredondamento(lancamentoPaiId: number): Promise<void> {
    if (!lancamentoPaiId) return;

    try {
      // 1. CARREGAR DADOS E CONSULTAR BANCO FORA DA TRANSAÇÃO (Igual ao DecimaService)
      const lancamentoPai = await db.lancamentos.get(lancamentoPaiId);
      if (!lancamentoPai || !lancamentoPai.id) return;

      const categoriaId = lancamentoPai.categoria_id ? Number(lancamentoPai.categoria_id) : null;
      const contaOrigemId = Number(lancamentoPai.origem_conta_id);

      const categoria = categoriaId ? await db.categorias.get(categoriaId) : null;
      const contaOrigem = await db.contas.get(contaOrigemId);

      // Busca lançamento filho de arredondamento já existente
      const arredondamentoExistente = await db.lancamentos
        .filter(l => Number(l.arredondamento_id) === Number(lancamentoPai.id))
        .first();

      // 2. REGRAS DE ELEGIBILIDADE
      const eDecimavel = categoria?.decimavel === true;
      const contaArredondamentoId = contaOrigem?.id_conta_arredondamento
        ? Number(contaOrigem.id_conta_arredondamento)
        : null;

      if (!eDecimavel || !contaArredondamentoId) {
        if (arredondamentoExistente) {
          await this.removerArredondamento(arredondamentoExistente);
        }
        return;
      }

      // Busca Categoria 53-Arredondamento
      const categorias = await db.categorias.toArray();
      const categoriaArredondamento = categorias.find(
        c => c.titulo.includes('53') || c.titulo.toLowerCase().includes('arredondamento')
      );
      const categoriaArredondamentoId = categoriaArredondamento?.id ?? null;

      // 3. CÁLCULO DOS CENTAVOS
      const montantePaiCentavos = Number(lancamentoPai.origem_montante || 0);
      const centavosRestantesAbs = Math.abs(montantePaiCentavos) % 100;
      const centavosRestantes = montantePaiCentavos >= 0 ? centavosRestantesAbs : -centavosRestantesAbs;

      if (centavosRestantes === 0) {
        if (arredondamentoExistente) {
          await this.removerArredondamento(arredondamentoExistente);
        }
        return;
      }

      const novoMontantePaiRedondo = montantePaiCentavos - centavosRestantes;

      // 4. TRANSAÇÃO LIMPA E DIRETA PARA GRAVAÇÃO (SEM ASYNCS INTERMEDIÁRIOS)
      await db.transaction('rw', [db.lancamentos, db.contas], async () => {
        // A. Atualiza Lançamento Pai com o valor arredondado (ex: R$ 7,00)
        await db.lancamentos.update(lancamentoPai.id!, {
          origem_montante: novoMontantePaiRedondo,
          updatedAt: this.obterDataIsoLocal(),
          sincronizado: false
        });

        // B. Estorna os centavos do saldo da Conta de Origem
        const contaAtualOrigem = await db.contas.get(contaOrigemId);
        if (contaAtualOrigem) {
          await db.contas.update(contaOrigemId, {
            saldo_atual: (contaAtualOrigem.saldo_atual || 0) - centavosRestantes,
            updatedAt: this.obterDataIsoLocal()
          });
        }

        // C. Cria ou Atualiza o Filho na Conta de Arredondamento
        const contaArred = await db.contas.get(contaArredondamentoId);

        if (arredondamentoExistente && arredondamentoExistente.id !== undefined) {
          const montanteAnteriorArred = arredondamentoExistente.origem_montante || 0;
          const diferencaSaldoArred = centavosRestantes - montanteAnteriorArred;

          await db.lancamentos.update(arredondamentoExistente.id, {
            origem_conta_id: contaArredondamentoId,
            origem_montante: centavosRestantes,
            datahorario: lancamentoPai.datahorario,
            ata_livro_caixa_id: lancamentoPai.ata_livro_caixa_id ?? null,
            sincronizado: false,
            updatedAt: this.obterDataIsoLocal()
          });

          if (contaArred) {
            await db.contas.update(contaArredondamentoId, {
              saldo_atual: (contaArred.saldo_atual || 0) + diferencaSaldoArred,
              updatedAt: this.obterDataIsoLocal()
            });
          }
        } else {
          // Cria o novo Lançamento Filho
          const novoArredondamento: Lancamento = {
            datahorario: lancamentoPai.datahorario,
            origem_conta_id: contaArredondamentoId,
            destino_conta_id: null,
            favorecido_id: lancamentoPai.favorecido_id ?? null,
            categoria_id: categoriaArredondamentoId,
            origem_montante: centavosRestantes,
            destino_montante: 0,
            nota: `Arredondamento referente ao lançamento #${lancamentoPai.id}`,
            arredondamento_id: lancamentoPai.id,
            ata_livro_caixa_id: lancamentoPai.ata_livro_caixa_id ?? null,
            sincronizado: false,
            updatedAt: this.obterDataIsoLocal()
          };

          // Limpa chaves undefined
          Object.keys(novoArredondamento).forEach(key => {
            if ((novoArredondamento as any)[key] === undefined) {
              delete (novoArredondamento as any)[key];
            }
          });

          const idFilho = await db.lancamentos.add(novoArredondamento);
          console.log('✅ [Arredondamento] Lançamento filho PERSISTIDO COM SUCESSO! ID:', idFilho);

          if (contaArred) {
            await db.contas.update(contaArredondamentoId, {
              saldo_atual: (contaArred.saldo_atual || 0) + centavosRestantes,
              updatedAt: this.obterDataIsoLocal()
            });
          }
        }
      });

    } catch (err) {
      console.error('[Arredondamento] Erro na transação Dexie:', err);
    }
  }

  /**
   * Remove o lançamento de arredondamento e estorna o saldo da conta de arredondamento.
   */
  async removerArredondamento(arredondamento: Lancamento): Promise<void> {
    if (!arredondamento || !arredondamento.id) return;

    await db.transaction('rw', [db.lancamentos, db.contas], async () => {
      const contaArred = await db.contas.get(Number(arredondamento.origem_conta_id));
      if (contaArred && contaArred.id !== undefined) {
        await db.contas.update(contaArred.id, {
          saldo_atual: (contaArred.saldo_atual || 0) - (arredondamento.origem_montante || 0),
          updatedAt: this.obterDataIsoLocal()
        });
      }
      await db.lancamentos.delete(arredondamento.id!);
    });
  }

  /**
   * Método auxiliar para exclusão de lançamentos Pai a partir da tela de listagem/exclusão.
   */
  async removerArredondamentoDoPai(lancamentoPaiId: number): Promise<void> {
    const arredondamento = await db.lancamentos
      .filter(l => Number(l.arredondamento_id) === Number(lancamentoPaiId))
      .first();

    if (arredondamento) {
      await this.removerArredondamento(arredondamento);
    }
  }

  private obterDataIsoLocal(): string {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    const segundos = String(agora.getSeconds()).padStart(2, '0');

    return `${ano}-${mes}-${dia}T${horas}:${minutos}:${segundos}`;
  }
}
