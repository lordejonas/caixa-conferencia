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
    const lancamentoPai = await db.lancamentos.get(lancamentoPaiId);
    if (!lancamentoPai || !lancamentoPai.id) return;

    // 1. Carregar Categoria e Conta associadas ao lançamento pai
    const categoriaId = lancamentoPai.categoria_id ? Number(lancamentoPai.categoria_id) : null;
    const contaOrigemId = Number(lancamentoPai.origem_conta_id);

    const categoria = categoriaId ? await db.categorias.get(categoriaId) : null;
    const contaOrigem = await db.contas.get(contaOrigemId);

    // 2. Buscar se já existe um lançamento de arredondamento vinculado a este Pai
    const arredondamentoExistente = await db.lancamentos
      .filter(l => Number(l.arredondamento_id) === Number(lancamentoPai.id))
      .first();

    // LOGS DE DIAGNÓSTICO
    //console.log('--- DIAGNÓSTICO DE ARREDONDAMENTO ---');
    //console.log('Categoria encontrada:', categoria);
    //console.log('É Decimável?:', categoria?.decimavel);
    //console.log('Conta Origem encontrada:', contaOrigem);
    //console.log('ID Conta Arredondamento:', contaOrigem?.id_conta_arredondamento);


    // 3. Regras de Elegibilidade:
    //    - Categoria deve ter `decimavel === true`
    //    - Conta de Origem deve ter `id_conta_arredondamento` configurado
    const eDecimavel = categoria?.decimavel === true;
    const contaArredondamentoId = contaOrigem?.id_conta_arredondamento
      ? Number(contaOrigem.id_conta_arredondamento)
      : null;

    if (!eDecimavel || !contaArredondamentoId) {
      // Se não for mais elegível, removemos o arredondamento anterior (se existir)
      if (arredondamentoExistente) {
        await this.removerArredondamento(arredondamentoExistente);
      }
      return;
    }

    // 4. Busca a categoria "53-Arredondamento" para vincular ao lançamento filho
    const categoriaArredondamento = await db.categorias
      .filter(c => c.titulo === '53-Arredondamento' || c.titulo_dois === '53-Arredondamento')
      .first();

    const categoriaArredondamentoId = categoriaArredondamento?.id ?? null;

    // 5. Trabalhar com Montante em Centavos Inteiros (ex: R$ 25,75 -> 2575 centavos)
    const montantePaiCentavos = Number(lancamentoPai.origem_montante || 0);

    // Extrai a parte fracionária (ex: 2575 % 100 = 75 centavos)
    // Usamos Math.abs para tratar receitas (+2575) e despesas (-2575) corretamente
    const centavosRestantesAbs = Math.abs(montantePaiCentavos) % 100;

    // Preserva o sinal da transação original (positivo ou negativo)
    const centavosRestantes = montantePaiCentavos >= 0 ? centavosRestantesAbs : -centavosRestantesAbs;

    // 6. Se NÃO houver centavos (valor redondo, ex: R$ 25,00 -> centavosRestantes === 0):
    if (centavosRestantes === 0) {
      if (arredondamentoExistente) {
        await this.removerArredondamento(arredondamentoExistente);
      }
      return;
    }

    // 7. Novo valor do Pai em centavos (ex: 2575 - 75 = 2500 centavos -> R$ 25,00)
    const novoMontantePaiRedondo = montantePaiCentavos - centavosRestantes;

    await db.transaction('rw', [db.lancamentos, db.contas], async () => {
      // 6.1 Atualiza o Lançamento Pai com o valor arredondado (R$ 25,00)
      await db.lancamentos.update(lancamentoPai.id!, {
        origem_montante: novoMontantePaiRedondo,
        updatedAt: this.obterDataIsoLocal(),
        sincronizado: false
      });

      // 7.2 Ajusta o saldo da Conta de Origem (Reduz os 75 centavos do saldo da conta origem)
      if (contaOrigem) {
        const contaAtual = await db.contas.get(contaOrigemId);
        if (contaAtual) {
          await db.contas.update(contaOrigemId, {
            saldo_atual: (contaAtual.saldo_atual || 0) - centavosRestantes,
            updatedAt: this.obterDataIsoLocal()
          });
        }
      }

      // 7.3 Criar ou Atualizar o Lançamento Filho de Arredondamento (75 centavos -> R$ 0,75)
      const contaArred = await db.contas.get(contaArredondamentoId);

      if (arredondamentoExistente && arredondamentoExistente.id !== undefined) {
        // Atualiza lançamento de arredondamento existente
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
        // Cria o novo lançamento de Arredondamento na conta "Arredondamento Espécie"
        const novoArredondamento: Lancamento = {
          datahorario: lancamentoPai.datahorario,
          origem_conta_id: contaArredondamentoId,
          destino_conta_id: null,
          favorecido_id: lancamentoPai.favorecido_id ?? null,
          categoria_id: categoriaArredondamentoId, // Sem categoria
          origem_montante: centavosRestantes, // Salva os 75 centavos em modo inteiro
          destino_montante: 0,
          nota: `Arredondamento referente ao lançamento #${lancamentoPai.id}`,
          arredondamento_id: lancamentoPai.id, // Vínculo com o lançamento pai
          ata_livro_caixa_id: lancamentoPai.ata_livro_caixa_id ?? null,
          sincronizado: false,
          updatedAt: this.obterDataIsoLocal()
        };

        await db.lancamentos.add(novoArredondamento);

        if (contaArred) {
          await db.contas.update(contaArredondamentoId, {
            saldo_atual: (contaArred.saldo_atual || 0) + centavosRestantes,
            updatedAt: this.obterDataIsoLocal()
          });
        }
      }
    });
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
