import { Injectable } from '@angular/core';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc } from 'firebase/firestore';
import { db } from '../core/db/app-database';
import { Favorecido } from '../models/favorecido.model';
import { SyncService } from './sync.service';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class FavorecidoService {

  constructor(
    private syncService: SyncService,
    private configService: ConfigService
  ) {}

  async listarTodos(): Promise<Favorecido[]> {
    return await db.favorecidos.toArray();
  }

  async buscarPorId(id: number): Promise<Favorecido | undefined> {
    return await db.favorecidos.get(id);
  }

  // 🟢 Adicionar
  async adicionar(dados: { titulo: string; ativo: boolean }): Promise<number> {
    let firebaseIdGenerated: string | undefined;

    // Gera o ID do Firebase previamente para garantir consistência
    try {
      const config = this.configService.obterConfiguracaoFirebase();
      if (config && config.apiKey) {
        const app = getApps().length === 0 ? initializeApp(config) : getApp();
        const firestore = getFirestore(app);
        const refColecao = collection(firestore, 'favorecidos');
        firebaseIdGenerated = doc(refColecao).id; // 👈 ID gerado na hora!
      }
    } catch (e) {
      console.warn('Não foi possível pré-gerar firebaseId offline, será gerado na sync.', e);
    }

    const novoFavorecido: Favorecido = {
      firebaseId: firebaseIdGenerated,
      titulo: dados.titulo,
      ativo: dados.ativo,
      atualizadoEm: new Date().toISOString(),
      sincronizado: false
    };

    const idLocal = await db.favorecidos.add(novoFavorecido);

    // Dispara a sincronização em segundo plano
    this.syncService.sincronizar();

    return idLocal;
  }

  // 🟡 Atualizar
  async atualizar(favorecido: Favorecido): Promise<number> {
    if (!favorecido.id) throw new Error('ID é obrigatório para atualização.');

    // Busca o registro atual do banco local para preservar o firebaseId caso não venha no parâmetro
    const registroExistente = await db.favorecidos.get(favorecido.id);

    const dadosAtualizados: Favorecido = {
      ...favorecido,
      firebaseId: favorecido.firebaseId || registroExistente?.firebaseId, // 👈 Preserva sempre o firebaseId!
      atualizadoEm: new Date().toISOString(),
      sincronizado: false
    };

    await db.favorecidos.put(dadosAtualizados);

    // Dispara a sincronização em segundo plano
    this.syncService.sincronizar();

    return favorecido.id;
  }

  // 🔴 Excluir
  async excluir(id: number): Promise<void> {
    const favorecido = await this.buscarPorId(id);

    if (favorecido) {
      await db.favorecidos.delete(id);

      if (favorecido.firebaseId) {
        this.syncService.removerFavorecidoRemoto(favorecido.firebaseId);
      }
    }
  }
}
