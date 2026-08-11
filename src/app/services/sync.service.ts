import { Injectable, inject } from '@angular/core';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db, UnidadeLocal } from '../core/db/app-database';
import { Favorecido } from '../models/favorecido.model';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private isOnline = navigator.onLine;
  private readonly DOC_ID = 'unidade_principal';
  private configService = inject(ConfigService);

  private unsubscribeUnidadeSnapshot?: Unsubscribe;
  private unsubscribeFavorecidosSnapshot?: Unsubscribe;

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.sincronizar();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  public async sincronizar(): Promise<void> {
    console.log('[SyncEngine] Iniciando tentativa de sincronização...');

    if (!this.isOnline) {
      console.warn('[SyncEngine] Cancelado: Navegador está offline.');
      return;
    }

    const config = this.configService.obterConfiguracaoFirebase();
    if (!config || !config.apiKey || !config.projectId) {
      console.warn('[SyncEngine] Cancelado: Configurações do Firebase não encontradas.');
      return;
    }

    const perfil = config.perfil || 'membro';
    console.log(`[SyncEngine] Perfil detectado: "${perfil}"`);

    try {
      const app = getApps().length === 0 ? initializeApp(config) : getApp();
      const firestore = getFirestore(app);

      // ==========================================
      // 1. SINCRONIZAÇÃO DE UNIDADE LOCAL
      // ==========================================
      await this.sincronizarUnidade(firestore, perfil);

      // ==========================================
      // 2. SINCRONIZAÇÃO DE FAVORECIDOS
      // ==========================================
      await this.sincronizarFavorecidos(firestore, perfil);

    } catch (error) {
      console.error('[SyncEngine] ERRO CRÍTICO no Firebase/Firestore:', error);
    }
  }

  /**
   * Métodos internos para UNIDADE
   */
  private async sincronizarUnidade(firestore: any, perfil: string): Promise<void> {
    const docRef = doc(firestore, 'unidades', this.DOC_ID);

    // Upload (Tesoureiro)
    if (perfil === 'tesoureiro') {
      const pendente = await db.unidades.get(this.DOC_ID);

      if (pendente && pendente.statusSync === 'PENDENTE') {
        const dataToUpload = {
          ...pendente,
          id: this.DOC_ID,
          statusSync: 'SINCRONIZADO'
        };

        await setDoc(docRef, dataToUpload, { merge: true });
        await db.unidades.update(this.DOC_ID, { statusSync: 'SINCRONIZADO' });
        console.log('[SyncEngine] Unidade enviada para o Firebase!');
      }
    }

    // Download Inicial
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const dadosRemotos = docSnap.data() as UnidadeLocal;
      const dadoLocal = await db.unidades.get(this.DOC_ID);

      if (!dadoLocal || (dadosRemotos.updatedAt && dadosRemotos.updatedAt > (dadoLocal.updatedAt || 0))) {
        await db.unidades.put({
          ...dadosRemotos,
          id: this.DOC_ID,
          statusSync: 'SINCRONIZADO'
        });
      }
    }

    // Realtime Listener Unidade
    if (this.unsubscribeUnidadeSnapshot) this.unsubscribeUnidadeSnapshot();

    this.unsubscribeUnidadeSnapshot = onSnapshot(docRef, async (snapshot) => {
      if (snapshot.exists()) {
        const dadosRemotos = snapshot.data() as UnidadeLocal;
        const dadoLocal = await db.unidades.get(this.DOC_ID);

        if (!dadoLocal || (dadosRemotos.updatedAt && dadosRemotos.updatedAt > (dadoLocal.updatedAt || 0))) {
          await db.unidades.put({
            ...dadosRemotos,
            id: this.DOC_ID,
            statusSync: 'SINCRONIZADO'
          });
        }
      }
    });
  }

  /**
   * Métodos internos para FAVORECIDOS
   */
  private async sincronizarFavorecidos(firestore: any, perfil: string): Promise<void> {
    const favorecidosRef = collection(firestore, 'favorecidos');

    // ==========================================
    // 1. UPLOAD DE PENDENTES (Tesoureiro)
    // ==========================================
    if (perfil === 'tesoureiro') {
      const pendentes = await db.favorecidos.filter(f => f.sincronizado === false).toArray();

      for (const item of pendentes) {
        try {
          // Se não tiver firebaseId por algum motivo herdado, gera o doc na hora
          const docRef = item.firebaseId
            ? doc(firestore, 'favorecidos', item.firebaseId)
            : doc(collection(firestore, 'favorecidos'));

          const firebaseId = docRef.id;

          // Garante que o firebaseId e status atualizados estejam salvos localmente
          if (item.id) {
            await db.favorecidos.update(item.id, {
              firebaseId: firebaseId,
              sincronizado: true
            });
          }

          // Envia a alteração ou criação para o MESMO documento no Firestore
          await setDoc(docRef, {
            titulo: item.titulo,
            ativo: item.ativo,
            atualizadoEm: item.atualizadoEm,
            idLocal: item.id
          }, { merge: true });

        } catch (e) {
          console.error('[SyncEngine] Erro ao enviar favorecido:', item, e);
        }
      }
    }

    // ==========================================
    // 2. REALTIME LISTEN EM FAVORECIDOS (Download)
    // ==========================================
    if (this.unsubscribeFavorecidosSnapshot) this.unsubscribeFavorecidosSnapshot();

    this.unsubscribeFavorecidosSnapshot = onSnapshot(
      favorecidosRef,
      async (snapshot) => {
        // Ignora alterações locais pendentes de envio do próprio cliente
        if (snapshot.metadata.hasPendingWrites) {
          return;
        }

        for (const docChange of snapshot.docChanges()) {
          const data = docChange.doc.data() as Favorecido & { idLocal?: number };
          const firebaseId = docChange.doc.id;

          if (docChange.type === 'added' || docChange.type === 'modified') {

            // 🔍 Busca 1: Pelo firebaseId no Dexie
            let local = await db.favorecidos.where('firebaseId').equals(firebaseId).first();

            // 🔍 Busca 2: Pelo idLocal (se retornado do Firebase)
            if (!local && data.idLocal) {
              local = await db.favorecidos.get(data.idLocal);
            }

            // 🔍 Busca 3: Por título/nome (evita duplicar registros criados sem firebaseId)
            if (!local) {
              local = await db.favorecidos
                .filter(f => f.titulo.toLowerCase() === data.titulo.toLowerCase())
                .first();
            }

            const dadosParaSalvar: Favorecido = {
              firebaseId,
              titulo: data.titulo,
              ativo: data.ativo,
              atualizadoEm: data.atualizadoEm || new Date().toISOString(),
              sincronizado: true
            };

            if (local && local.id) {
              // 🟡 Registro já existe: Atualiza na mesma chave primária (id)
              await db.favorecidos.put({
                ...dadosParaSalvar,
                id: local.id
              });
            } else {
              // 🟢 Registro realmente não existe: Insere novo
              await db.favorecidos.add(dadosParaSalvar);
            }
          }

          if (docChange.type === 'removed') {
            const local = await db.favorecidos.where('firebaseId').equals(firebaseId).first();
            if (local?.id) {
              await db.favorecidos.delete(local.id);
            }
          }
        }
      },
      (error) => {
        if (error.code !== 'aborted') {
          console.error('[SyncEngine] Erro no listener de favorecidos:', error);
        }
      }
    );
  }

  /**
   * Exclusão direta no Firestore chamada ao excluir localmente
   */
  public async removerFavorecidoRemoto(firebaseId: string): Promise<void> {
    if (!this.isOnline) return;

    try {
      const config = this.configService.obterConfiguracaoFirebase();
      if (!config) return;

      const app = getApps().length === 0 ? initializeApp(config) : getApp();
      const firestore = getFirestore(app);

      await deleteDoc(doc(firestore, 'favorecidos', firebaseId));
      console.log('[SyncEngine] Favorecido excluído do Firestore:', firebaseId);
    } catch (e) {
      console.error('[SyncEngine] Erro ao excluir favorecido remoto:', e);
    }
  }
}
