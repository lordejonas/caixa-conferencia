import { Injectable, inject } from '@angular/core';
import { db } from '../db/app-database';
import { SyncService } from './sync.service';

@Injectable({
  providedIn: 'root'
})
export class LancamentoService {
  private syncService = inject(SyncService);

  /**
   * Exclui um lançamento pelo ID e reajusta o saldo atual das contas envolvidas.
   */
  async excluirLancamento(id: number): Promise<void> {
    let firebaseIdParaRemover: string | undefined = undefined;

    await db.transaction('rw', [db.lancamentos, db.contas], async () => {
      const lancamento = await db.lancamentos.get(id);
      if (!lancamento) {
        throw new Error('Lançamento não encontrado.');
      }

      firebaseIdParaRemover = lancamento.firebaseId;
      const agoraIso = new Date().toISOString();

      // 1. Estornar saldo da Conta Origem (se houver)
      if (lancamento.origem_conta_id && lancamento.origem_montante !== undefined) {
        const contaOrigem = await db.contas.get(Number(lancamento.origem_conta_id));
        if (contaOrigem) {
          const novoSaldo = (contaOrigem.saldo_atual || 0) - lancamento.origem_montante;
          await db.contas.update(contaOrigem.id!, {
            saldo_atual: novoSaldo,
            updatedAt: agoraIso
          });
        }
      }

      // 2. Estornar saldo da Conta Destino (se for transferência)
      if (lancamento.destino_conta_id && lancamento.destino_montante !== undefined) {
        const contaDestino = await db.contas.get(Number(lancamento.destino_conta_id));
        if (contaDestino) {
          const novoSaldo = (contaDestino.saldo_atual || 0) - lancamento.destino_montante;
          await db.contas.update(contaDestino.id!, {
            saldo_atual: novoSaldo,
            updatedAt: agoraIso
          });
        }
      }

      // 3. Excluir o lançamento do banco local
      await db.lancamentos.delete(id);
    });

    // 4. Se o lançamento já estava sincronizado na nuvem, remove do Firestore
    if (firebaseIdParaRemover) {
      await this.syncService.removerLancamentoRemoto(firebaseIdParaRemover);
    }
  }
}
