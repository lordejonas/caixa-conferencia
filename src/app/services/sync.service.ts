import { Injectable, inject } from '@angular/core';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db, UnidadeLocal } from '../core/db/app-database';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private isOnline = navigator.onLine;
  private readonly DOC_ID = 'unidade_principal';
  private configService = inject(ConfigService);

  // Guarda a referência para cancelar a escuta anterior quando uma nova for criada
  private unsubscribeSnapshot?: Unsubscribe;

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
      const docRef = doc(firestore, 'unidades', this.DOC_ID);

      // 1. UPLOAD (Tesoureiro)
      if (perfil === 'tesoureiro') {
        const pendente = await db.unidades.get(this.DOC_ID);
        console.log('[SyncEngine] Registro local encontrado no IndexedDB:', pendente);

        if (pendente && pendente.statusSync === 'PENDENTE') {
          console.log('[SyncEngine] Enviando dados para o Firestore...');
          const dataToUpload = {
            ...pendente,
            id: this.DOC_ID,
            statusSync: 'SINCRONIZADO'
          };

          await setDoc(docRef, dataToUpload, { merge: true });
          await db.unidades.update(this.DOC_ID, { statusSync: 'SINCRONIZADO' });
          console.log('[SyncEngine] Unidade enviada para o Firebase com sucesso!');
        } else {
          console.log('[SyncEngine] Nenhum dado com statusSync "PENDENTE" para enviar.');
        }
      } else {
        console.warn(`[SyncEngine] Upload ignorado. O perfil "${perfil}" não tem permissão de escrita.`);
      }

      // 2. DOWNLOAD IMEDIATO
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
          console.log('[SyncEngine] Dados do Firebase baixados e salvos no IndexedDB local.');
        }
      }

      // 3. LISTEN EM TEMPO REAL (Cancela escuta anterior se existir)
      if (this.unsubscribeSnapshot) {
        this.unsubscribeSnapshot();
      }

      this.unsubscribeSnapshot = onSnapshot(
        docRef,
        async (snapshot) => {
          if (snapshot.exists()) {
            const dadosRemotos = snapshot.data() as UnidadeLocal;
            const dadoLocal = await db.unidades.get(this.DOC_ID);

            if (!dadoLocal || (dadosRemotos.updatedAt && dadosRemotos.updatedAt > (dadoLocal.updatedAt || 0))) {
              await db.unidades.put({
                ...dadosRemotos,
                id: this.DOC_ID,
                statusSync: 'SINCRONIZADO'
              });
              console.log('[SyncEngine] Atualização remota recebida via Snapshot.');
            }
          }
        },
        (error) => {
          // Trata o encerramento do Firestore sem estourar Uncaught Error no console
          if (error.code === 'aborted') {
            console.log('[SyncEngine] Listener antigo encerrado pelo Firebase.');
          } else {
            console.error('[SyncEngine] Erro no listener em tempo real:', error);
          }
        }
      );

    } catch (error) {
      console.error('[SyncEngine] ERRO CRÍTICO no Firebase/Firestore:', error);
    }
  }
}
