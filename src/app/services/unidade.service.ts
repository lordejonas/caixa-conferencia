import { Injectable } from '@angular/core';
import { db} from '../core/db/app-database';
import { UnidadeLocal } from '../models/unidade.model';
import { SyncService } from '../core/service/sync.service';
import { liveQuery } from 'dexie';
import { Observable, from } from 'rxjs';

export type UnidadeVicentina = UnidadeLocal;

@Injectable({
  providedIn: 'root'
})
export class UnidadeService {

  constructor(private syncService: SyncService) {
    // Dispara a sincronização imediatamente ao carregar o serviço
    this.syncService.sincronizar();
  }

  async salvar(unidade: Omit<UnidadeLocal, 'updatedAt' | 'statusSync'>): Promise<void> {
    const registro: UnidadeLocal = {
      ...unidade,
      id: 'unidade_principal',
      updatedAt: Date.now(),
      statusSync: 'PENDENTE'
    };

    // 1. Gravação local imediata no IndexedDB
    await db.unidades.put(registro);

    // 2. Dispara envio em background para a nuvem
    await this.syncService.sincronizar();
  }

  obterUnidadeObservable(): Observable<UnidadeVicentina | undefined> {
    // Força uma nova tentativa de sincronia ao escutar os dados na tela
    this.syncService.sincronizar();
    return from(liveQuery(() => db.unidades.get('unidade_principal')));
  }
}
