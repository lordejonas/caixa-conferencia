import { Injectable, inject } from '@angular/core';
import { db } from '../db/app-database';
import { SyncService } from './sync.service';
import { DecimaAutocontrolService } from '../../services/decima-autocontrol.service'; // <-- Importado

@Injectable({
  providedIn: 'root'
})
export class LancamentoService {
  private syncService = inject(SyncService);
  private decimaService = inject(DecimaAutocontrolService); // <-- Injetado

  /**
   * Exclui um lançamento pelo ID, reajusta o saldo das contas e atualiza a décima.
   */
  async excluirLancamento(id: number): Promise<void> {
    let firebaseIdParaRemover: string | undefined = undefined;
    let ataLivroCaixaId: number | null | undefined = null;

    await db.transaction('rw', [db.lancamentos, db.contas], async () => {
      const lancamento = await db.lancamentos.get(id);
      if (!lancamento) {
        throw new Error('Lançamento não encontrado.');
      }

      firebaseIdParaRemover = lancamento.firebaseId;
      ataLivroCaixaId = lancamento.ata_livro_caixa_id; // Armazena a ata do lançamento antes de excluir
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

    // 4. Recalcular e atualizar a décima referente a esta ata
    await this.decimaService.processarDecimaParaAta(ataLivroCaixaId);

    // 5. Se o lançamento já estava sincronizado na nuvem, remove do Firestore
    if (firebaseIdParaRemover) {
      await this.syncService.removerLancamentoRemoto(firebaseIdParaRemover);
    }
  }
}
