import { Injectable } from '@angular/core';
import { db } from '../core/db/app-database';
import { Lancamento } from '../models/lancamento.model';

@Injectable({
  providedIn: 'root'
})
export class ArredondamentoAutocontrolService {

  async processarArredondamento(lancamentoPaiId: number): Promise<void> {
    if (!lancamentoPaiId) return;

    try {
      // 1. CARREGAR DADOS TOTALMENTE FORA DA TRANSAÇÃO
      const lancamentoPai = await db.lancamentos.get(lancamentoPaiId);
      if (!lancamentoPai || !lancamentoPai.id) return;

      const categoriaId = lancamentoPai.categoria_id ? Number(lancamentoPai.categoria_id) : null;
      const contaOrigemId = Number(lancamentoPai.origem_conta_id);

      const categoria = categoriaId ? await db.categorias.get(categoriaId) : null;
      const contaOrigem = await db.contas.get(contaOrigemId);

      const arredondamentoExistente = await db.lancamentos
        .filter(l => Number(l.arredondamento_id) === Number(lancamentoPai.id))
        .first();

      // 2. REGRAS DE ELEGIBILIDADE
      const eDecimavel = categoria?.decimavel === true;
      const contaArredondamentoId = contaOrigem?.id_conta_arredondamento
        ? Number(contaOrigem.id_conta_arredondamento)
        : null;

      console.log('🔍 [Arredondamento] Elegibilidade:', {
        categoria: categoria?.titulo,
        decimavel: eDecimavel,
        contaOrigem: contaOrigem?.titulo,
        contaArredondamentoId
      });

      if (!eDecimavel || !contaArredondamentoId) {
        if (arredondamentoExistente) {
          await this.removerArredondamento(arredondamentoExistente);
        }
        return;
      }

      // Busca Categoria 53-Arredondamento fora da transação
      const categorias = await db.categorias.toArray();
      const categoriaArredondamento = categorias.find((c: any) => {
        const texto = String(c.titulo || c.nome || c.descricao || '').toLowerCase();
        return texto.includes('53') || texto.includes('arredondamento');
      });
      const categoriaArredondamentoId = categoriaArredondamento?.id ? Number(categoriaArredondamento.id) : null;

      if (!categoriaArredondamentoId) {
        console.warn('⚠️ [Arredondamento] Categoria 53 não encontrada no Dexie.');
        return;
      }

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

      // 4. TRANSAÇÃO DE ESCRITA NO DEXIE
      await db.transaction('rw', [db.lancamentos, db.contas], async () => {
        // A. Atualiza Lançamento Pai com valor redondo (ex: 700 centavos)
        await db.lancamentos.update(lancamentoPai.id!, {
          origem_montante: novoMontantePaiRedondo,
          updatedAt: this.obterDataIsoLocal(),
          sincronizado: false
        });

        // B. Estorna os centavos da Conta de Origem
        const contaAtualOrigem = await db.contas.get(contaOrigemId);
        if (contaAtualOrigem) {
          await db.contas.update(contaOrigemId, {
            saldo_atual: (contaAtualOrigem.saldo_atual || 0) - centavosRestantes,
            sincronizado: false,
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
              sincronizado: false,
              updatedAt: this.obterDataIsoLocal()
            });
          }
        } else {
          const novoArredondamento: Lancamento = {
            categoria_id: categoriaArredondamentoId,
            origem_conta_id: contaArredondamentoId,
            destino_conta_id: null,
            favorecido_id: lancamentoPai.favorecido_id ?? null,
            origem_montante: centavosRestantes,
            destino_montante: 0,
            datahorario: lancamentoPai.datahorario,
            ata_livro_caixa_id: null, // 👈 OBRIGATÓRIO: null para não ser varrido/deletado pelo DecimaService!
            nota: `Arredondamento referente ao lançamento #${lancamentoPai.id}`,
            arredondamento_id: lancamentoPai.id,
            sincronizado: false,
            updatedAt: this.obterDataIsoLocal()
          };

          const idFilho = await db.lancamentos.add(novoArredondamento);
          console.log('✅ [Arredondamento] Lançamento filho PERSISTIDO! ID:', idFilho);

          if (contaArred) {
            await db.contas.update(contaArredondamentoId, {
              saldo_atual: (contaArred.saldo_atual || 0) + centavosRestantes,
              sincronizado: false,
              updatedAt: this.obterDataIsoLocal()
            });
          }
        }
      });

    } catch (err) {
      console.error('❌ [Arredondamento] Erro na transação Dexie:', err);
    }
  }

  async removerArredondamento(arredondamento: Lancamento): Promise<void> {
    if (!arredondamento || !arredondamento.id) return;

    await db.transaction('rw', [db.lancamentos, db.contas], async () => {
      const contaArred = await db.contas.get(Number(arredondamento.origem_conta_id));
      if (contaArred && contaArred.id !== undefined) {
        await db.contas.update(contaArred.id, {
          saldo_atual: (contaArred.saldo_atual || 0) - (arredondamento.origem_montante || 0),
          sincronizado: false,
          updatedAt: this.obterDataIsoLocal()
        });
      }
      await db.lancamentos.delete(arredondamento.id!);
    });
  }

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
