import { Injectable, inject } from '@angular/core';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  deleteDoc,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../db/app-database';
import { UnidadeLocal } from '../../models/unidade.model';
import { Favorecido } from '../../models/favorecido.model';
import { Categoria } from '../../models/categoria.model';
import { Conta } from '../../models/conta.model';
import { Agregador } from '../../models/agregador.model';
import { ConfigService } from '../../services/config.service';

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private isOnline = navigator.onLine;
  private readonly DOC_ID = 'unidade_principal';
  private configService = inject(ConfigService);

  private unsubscribeUnidadeSnapshot?: Unsubscribe;
  private unsubscribeFavorecidosSnapshot?: Unsubscribe;
  private unsubscribeCategoriasSnapshot?: Unsubscribe;
  private unsubscribeAgregadoresSnapshot?: Unsubscribe;
  private unsubscribeContasSnapshot?: Unsubscribe;

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

      // 1. SINCRONIZAÇÃO DE UNIDADE LOCAL
      await this.sincronizarUnidade(firestore, perfil);

      // 2. SINCRONIZAÇÃO DE FAVORECIDOS
      await this.sincronizarFavorecidos(firestore, perfil);

      // 3. SINCRONIZAÇÃO DE CATEGORIAS
      await this.sincronizarCategorias(firestore, perfil);

      // 4. SINCRONIZAÇÃO DE AGREGADORES (Antes de contas para manter integridade das chaves)
      await this.sincronizarAgregadores(firestore, perfil);

      // 5. SINCRONIZAÇÃO DE CONTAS
      await this.sincronizarContas(firestore, perfil);

    } catch (error) {
      console.error('[SyncEngine] ERRO CRÍTICO no Firebase/Firestore:', error);
    }
  }

  /**
   * Métodos internos para UNIDADE
   */
  private async sincronizarUnidade(firestore: any, perfil: string): Promise<void> {
    const docRef = doc(firestore, 'unidades', this.DOC_ID);

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

    if (perfil === 'tesoureiro') {
      const pendentes = await db.favorecidos.filter(f => f.sincronizado === false).toArray();

      for (const item of pendentes) {
        try {
          const docRef = item.firebaseId
            ? doc(firestore, 'favorecidos', item.firebaseId)
            : doc(collection(firestore, 'favorecidos'));

          const firebaseId = docRef.id;

          if (item.id) {
            await db.favorecidos.update(item.id, {
              firebaseId: firebaseId,
              sincronizado: true
            });
          }

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

    if (this.unsubscribeFavorecidosSnapshot) this.unsubscribeFavorecidosSnapshot();

    this.unsubscribeFavorecidosSnapshot = onSnapshot(
      favorecidosRef,
      async (snapshot) => {
        if (snapshot.metadata.hasPendingWrites) return;

        for (const docChange of snapshot.docChanges()) {
          const data = docChange.doc.data() as Favorecido & { idLocal?: number };
          const firebaseId = docChange.doc.id;

          if (docChange.type === 'added' || docChange.type === 'modified') {
            let local = await db.favorecidos.where('firebaseId').equals(firebaseId).first();

            if (!local && data.idLocal) {
              local = await db.favorecidos.get(data.idLocal);
            }

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
              await db.favorecidos.put({
                ...dadosParaSalvar,
                id: local.id
              });
            } else {
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
   * Métodos internos para CATEGORIAS
   */
  private async sincronizarCategorias(firestore: any, perfil: string): Promise<void> {
    const categoriasRef = collection(firestore, 'categorias');

    // 1. Upload de Categorias do Banco Local para o Firestore (Somente Tesoureiro)
    if (perfil === 'tesoureiro') {
      const categoriasLocais = await db.categorias.toArray();

      for (const item of categoriasLocais) {
        try {
          const docRef = doc(firestore, 'categorias', String(item.id || item.title));

          await setDoc(docRef, {
            id: item.id,
            title: item.title,
            pai: item.pai,
            ativo: item.ativo,
            descricao: item.descricao || null,
            updatedAt: item.updatedAt || new Date().toISOString()
          }, { merge: true });

        } catch (e) {
          console.error('[SyncEngine] Erro ao enviar categoria:', item, e);
        }
      }
    }

    // 2. Realtime Listener para Download automático
    if (this.unsubscribeCategoriasSnapshot) this.unsubscribeCategoriasSnapshot();

    this.unsubscribeCategoriasSnapshot = onSnapshot(
      categoriasRef,
      async (snapshot) => {
        if (snapshot.metadata.hasPendingWrites) return;

        for (const docChange of snapshot.docChanges()) {
          const data = docChange.doc.data() as Categoria;

          if (docChange.type === 'added' || docChange.type === 'modified') {
            let local = data.id ? await db.categorias.get(data.id) : null;

            if (!local) {
              local = await db.categorias
                .filter(c => c.title === data.title && c.pai === data.pai)
                .first();
            }

            const dadosParaSalvar: Categoria = {
              id: data.id || local?.id,
              title: data.title,
              pai: data.pai ?? null,
              ativo: data.ativo ?? true,
              positivo: data.positivo ?? true,
              auto: data.auto ?? false,
              descricao: data.descricao || null,
              updatedAt: data.updatedAt || new Date().toISOString()
            };

            if (local && local.id) {
              await db.categorias.put(dadosParaSalvar);
            } else {
              await db.categorias.add(dadosParaSalvar);
            }
          }

          if (docChange.type === 'removed') {
            if (data.id) {
              await db.categorias.delete(data.id);
            }
          }
        }
      },
      (error) => {
        if (error.code !== 'aborted') {
          console.error('[SyncEngine] Erro no listener de categorias:', error);
        }
      }
    );
  }

  /**
  * Métodos internos para AGREGADORES
  */
  private async sincronizarAgregadores(firestore: any, perfil: string): Promise<void> {
    const agregadoresRef = collection(firestore, 'agregadores');

    // 1. Upload de Agregadores locais para o Firestore (Tesoureiro)
    if (perfil === 'tesoureiro') {
      const agregadoresLocais = await db.agregadores.toArray();

      for (const item of agregadoresLocais) {
        try {
          const docRef = item.firebaseId
            ? doc(firestore, 'agregadores', item.firebaseId)
            : doc(firestore, 'agregadores', String(item.id));

          const firebaseId = docRef.id;

          if (item.id && !item.firebaseId) {
            await db.agregadores.update(item.id, { firebaseId });
          }

          await setDoc(docRef, {
            id: item.id,
            nome: item.nome,
            icone: item.icone || null,
            descricao: item.descricao || null,
            ativo: item.ativo ?? true,
            contabilizar_totais: item.contabilizar_totais ?? null, // 👈 Mapeado no Upload
            ordem_listagem: item.ordem_listagem || null,
            updatedAt: item.updatedAt || new Date().toISOString(),
            firebaseId
          }, { merge: true });

        } catch (e) {
          console.error('[SyncEngine] Erro ao enviar agregador:', item, e);
        }
      }
    }

    // 2. Realtime Listener para Download automático
    if (this.unsubscribeAgregadoresSnapshot) this.unsubscribeAgregadoresSnapshot();

    this.unsubscribeAgregadoresSnapshot = onSnapshot(
      agregadoresRef,
      async (snapshot) => {
        if (snapshot.metadata.hasPendingWrites) return;

        for (const docChange of snapshot.docChanges()) {
          const data = docChange.doc.data() as Agregador;
          const firebaseId = docChange.doc.id;

          if (docChange.type === 'added' || docChange.type === 'modified') {
            // 1. Busca pelo firebaseId
            let local = await db.agregadores.where('firebaseId').equals(firebaseId).first();

            // 2. Se não achou pelo firebaseId, busca pelo Nome
            if (!local && data.nome) {
              local = await db.agregadores
                .filter(a => a.nome.toLowerCase() === data.nome.toLowerCase())
                .first();
            }

            const dadosParaSalvar: Agregador = {
              nome: data.nome,
              icone: data.icone || undefined,
              descricao: data.descricao || null,
              ativo: data.ativo ?? true,
              contabilizar_totais: data.contabilizar_totais ?? null,
              ordem_listagem: data.ordem_listagem || null,
              updatedAt: data.updatedAt || new Date().toISOString(),
              firebaseId
            };

            if (local && local.id) {
              await db.agregadores.put({
                ...dadosParaSalvar,
                id: local.id
              });
            } else {
              await db.agregadores.add(dadosParaSalvar);
            }
          }

          if (docChange.type === 'removed') {
            const local = await db.agregadores.where('firebaseId').equals(firebaseId).first();
            if (local?.id) {
              await db.agregadores.delete(local.id);
            }
          }
        }
      },
      (error) => {
        if (error.code !== 'aborted') {
          console.error('[SyncEngine] Erro no listener de agregadores:', error);
        }
      }
    );
  }

  /**
   * Métodos internos para CONTAS
   */
  private async sincronizarContas(firestore: any, perfil: string): Promise<void> {
    const contasRef = collection(firestore, 'contas');

    // 1. Upload de Contas locais para o Firestore (Tesoureiro)
    if (perfil === 'tesoureiro') {
      const contasLocais = await db.contas.toArray();

      for (const item of contasLocais) {
        try {
          const docRef = item.firebaseId
          ? doc(firestore, 'contas', item.firebaseId)
          : doc(firestore, 'contas', String(item.id));

          const firebaseId = docRef.id;

          if (item.id && !item.firebaseId) {
            await db.contas.update(item.id, { firebaseId });
          }

          await setDoc(docRef, {
            id: item.id,
            titulo: item.titulo,
            icone: item.icone || null,
            saldo_atual: item.saldo_atual ?? 0,
            ativo: item.ativo ?? true,
            contabilizar_totais: item.contabilizar_totais ?? null, // 👈 Mapeado no Upload
            id_conta_arredondamento: item.id_conta_arredondamento || null,
            id_agregador: item.id_agregador || null,
            minimo_arredondamento: item.minimo_arredondamento || 1,
            ordem_listagem: item.ordem_listagem || null,
            updatedAt: item.updatedAt || new Date().toISOString(),
            firebaseId
          }, { merge: true });

        } catch (e) {
          console.error('[SyncEngine] Erro ao enviar conta:', item, e);
        }
      }
    }

    // 2. Realtime Listener para Download automático
    if (this.unsubscribeContasSnapshot) this.unsubscribeContasSnapshot();

    this.unsubscribeContasSnapshot = onSnapshot(
      contasRef,
      async (snapshot) => {
        if (snapshot.metadata.hasPendingWrites) return;

        for (const docChange of snapshot.docChanges()) {
          const data = docChange.doc.data() as Conta;
          const firebaseId = docChange.doc.id;

          if (docChange.type === 'added' || docChange.type === 'modified') {
            // 1. Busca pelo firebaseId
            let local = await db.contas.where('firebaseId').equals(firebaseId).first();

            // 2. Se não achou pelo firebaseId, busca pelo Título
            if (!local && data.titulo) {
              local = await db.contas
                .filter(c => c.titulo.toLowerCase() === data.titulo.toLowerCase())
                .first();
            }

            const dadosParaSalvar: Conta = {
              titulo: data.titulo,
              icone: data.icone || undefined,
              saldo_atual: data.saldo_atual ?? 0,
              ativo: data.ativo ?? true,
              contabilizar_totais: data.contabilizar_totais ?? null,
              id_conta_arredondamento: data.id_conta_arredondamento || null,
              id_agregador: data.id_agregador || null,
              minimo_arredondamento: data.minimo_arredondamento || 1,
              ordem_listagem: data.ordem_listagem || null,
              updatedAt: data.updatedAt || new Date().toISOString(),
              firebaseId
            };

            if (local && local.id) {
              await db.contas.put({
                ...dadosParaSalvar,
                id: local.id
              });
            } else {
              await db.contas.add(dadosParaSalvar);
            }
          }

          if (docChange.type === 'removed') {
            const local = await db.contas.where('firebaseId').equals(firebaseId).first();
            if (local?.id) {
              await db.contas.delete(local.id);
            }
          }
        }
      },
      (error) => {
        if (error.code !== 'aborted') {
          console.error('[SyncEngine] Erro no listener de contas:', error);
        }
      }
    );
  }

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
