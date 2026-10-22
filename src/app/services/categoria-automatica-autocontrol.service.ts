import { Injectable } from '@angular/core';
import { db } from '../core/db/app-database';
import { Lancamento } from '../models/lancamento.model';

@Injectable({
  providedIn: 'root'
})
export class CategoriaEspelhadaAutocontrolService {

  private readonly MAPEAMENTO_CATEGORIAS: Record<number, number> = {
    16: 42, // '10-Doações Materiais recebidas' -> '25-Doações materiais distribuídas'
    12: 43, // '08-Contrib. da Solidariedade e Col. de Ozanam' -> '26-Repasses Cont. Solidariedade / Col. Ozanam'
    13: 44, // '08.1-Contrib. da Solidariedade' -> '26.1-Repasses Contrib. da Solidariedade'
    14: 45, // '08.2-Coleta de Ozanam' -> '26.2-Repasses Coleta de Ozanam'
    18: 46  // '12-Recebimentos para Repasses' -> '27-Repasses efetuados (linha 12)'
  };

  private readonly REGRAS_CONTA_CONSELHOS = [12, 13, 14, 18];

  async processarCategoriaEspelhada(lancamentoPaiId: number): Promise<void> {
    if (!lancamentoPaiId) return;

    try {
      // 1. CONSULTAS E BUSCAS FORA DA TRANSAÇÃO (Evita abortar a transação)
      const lancamentoPai = await db.lancamentos.get(lancamentoPaiId);
      if (!lancamentoPai || !lancamentoPai.categoria_id) return;

      const categoriaDestinoId = this.MAPEAMENTO_CATEGORIAS[lancamentoPai.categoria_id];

      // Busca lançamento espelhado existente vinculado ao Pai
      const espelhadoExistente = await db.lancamentos
        .filter(l => Number(l.arredondamento_id) === Number(lancamentoPaiId))
        .first();

      // Se a categoria do Pai não exige espelhamento
      if (!categoriaDestinoId) {
        if (espelhadoExistente && espelhadoExistente.id) {
          await this.removerEspelhadoEEstornarSaldo(espelhadoExistente);
        }
        return;
      }

      // Determina a conta destino (se for regra de conselhos, busca ID fora da transação)
      let contaEspelhoId = lancamentoPai.origem_conta_id;
      if (this.REGRAS_CONTA_CONSELHOS.includes(lancamentoPai.categoria_id)) {
        const idContaConselhos = await this.obterIdContaConselhos();
        if (idContaConselhos) {
          contaEspelhoId = idContaConselhos;
        }
      }

      // Timestamp +1 minuto
      const dataOriginal = new Date(lancamentoPai.datahorario);
      const dataMaisUmMinuto = new Date(dataOriginal.getTime() + 60 * 1000);
      const dataHorarioFormatado = this.formatarDataIsoLocal(dataMaisUmMinuto);

      // Inverte o montante
      const valorInvertido = (lancamentoPai.origem_montante || 0) * -1;

      // 2. TRANSAÇÃO LIMPA APENAS PARA ESCRITA
      await db.transaction('rw', [db.lancamentos, db.contas], async () => {
        if (espelhadoExistente && espelhadoExistente.id) {
          // --- EDIÇÃO DE ESPELHADO EXISTENTE ---
          const valorAnterior = espelhadoExistente.origem_montante || 0;
          const contaAnteriorId = espelhadoExistente.origem_conta_id;

          if (contaAnteriorId !== contaEspelhoId) {
            await this.atualizarSaldoConta(contaAnteriorId, -valorAnterior);
            await this.atualizarSaldoConta(contaEspelhoId, valorInvertido);
          } else {
            const diferencaMontante = valorInvertido - valorAnterior;
            await this.atualizarSaldoConta(contaEspelhoId, diferencaMontante);
          }

          await db.lancamentos.update(espelhadoExistente.id, {
            datahorario: dataHorarioFormatado,
            origem_conta_id: contaEspelhoId,
            categoria_id: categoriaDestinoId,
            origem_montante: valorInvertido,
            favorecido_id: lancamentoPai.favorecido_id ?? null,
            ata_livro_caixa_id: lancamentoPai.ata_livro_caixa_id ?? null,
            sincronizado: false,
            updatedAt: this.obterDataIsoLocal()
          });

        } else {
          // --- INSERÇÃO DE NOVO ESPELHADO ---
          const novoEspelhado: Lancamento = {
            datahorario: dataHorarioFormatado,
            origem_conta_id: contaEspelhoId,
            destino_conta_id: null,
            favorecido_id: lancamentoPai.favorecido_id ?? null,
            categoria_id: categoriaDestinoId,
            origem_montante: valorInvertido,
            destino_montante: 0,
            nota: `Lançamento automático espelhado referente ao lançamento #${lancamentoPai.id}`,
            arredondamento_id: lancamentoPai.id,
            ata_livro_caixa_id: lancamentoPai.ata_livro_caixa_id ?? null,
            sincronizado: false,
            updatedAt: this.obterDataIsoLocal()
          };

          // Sanitiza chaves undefined
          Object.keys(novoEspelhado).forEach(key => {
            if ((novoEspelhado as any)[key] === undefined) {
              delete (novoEspelhado as any)[key];
            }
          });

          const idNovoEspelhado = await db.lancamentos.add(novoEspelhado);
          //console.log('✅ [CategoriaEspelhada] Lançamento espelhado PERSISTIDO! ID:', idNovoEspelhado);

          await this.atualizarSaldoConta(contaEspelhoId, valorInvertido);
        }
      });

    } catch (err) {
      console.error('[CategoriaEspelhada] Erro na transação Dexie:', err);
    }
  }

  private async obterIdContaConselhos(): Promise<number | null> {
    const contas = await db.contas.toArray();
    const conta = contas.find(c => c.titulo?.trim().toLowerCase() === 'conselhos');
    return conta?.id ?? null;
  }

  private async atualizarSaldoConta(contaId: number, valorDelta: number): Promise<void> {
    const conta = await db.contas.get(Number(contaId));
    if (conta && conta.id !== undefined) {
      await db.contas.update(conta.id, {
        saldo_atual: (conta.saldo_atual || 0) + valorDelta,
        updatedAt: this.obterDataIsoLocal()
      });
    }
  }

  private async removerEspelhadoEEstornarSaldo(espelhado: Lancamento): Promise<void> {
    if (!espelhado || !espelhado.id) return;

    await db.transaction('rw', [db.lancamentos, db.contas], async () => {
      await this.atualizarSaldoConta(espelhado.origem_conta_id, -(espelhado.origem_montante || 0));
      await db.lancamentos.delete(espelhado.id!);
    });
  }

  private formatarDataIsoLocal(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    const horas = String(data.getHours()).padStart(2, '0');
    const minutos = String(data.getMinutes()).padStart(2, '0');
    const segundos = String(data.getSeconds()).padStart(2, '0');

    return `${ano}-${mes}-${dia}T${horas}:${minutos}:${segundos}`;
  }

  private obterDataIsoLocal(): string {
    return this.formatarDataIsoLocal(new Date());
  }
}
