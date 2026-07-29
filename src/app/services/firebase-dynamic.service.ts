import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp, deleteApp, getApps, getApp } from 'firebase/app';
import {
  Firestore,
  initializeFirestore,
  persistentLocalCache,
  doc,
  getDoc,
  collection,
  addDoc
} from 'firebase/firestore';
import { ConfigService } from './config.service';
import { FirebaseUserConfig } from '../models/firebase-config.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseDynamicService {
  private app: FirebaseApp | null = null;
  private db: Firestore | null = null;

  constructor(private configService: ConfigService) {
    this.inicializarSeConfigurado();
  }

  public inicializarSeConfigurado(): boolean {
    const userConfig = this.configService.obterConfiguracaoFirebase();

    if (userConfig && userConfig.apiKey && userConfig.projectId) {
      try {
        const APP_NAME = 'conferencia-app';

        // 1. Se a aplicação já existir na memória, encerra/deleta antes de recriar
        const appsExistentes = getApps();
        const appExistente = appsExistentes.find(a => a.name === APP_NAME);

        if (appExistente) {
          deleteApp(appExistente);
        }

        // 2. Inicializa a instância do Firebase com as configurações atualizadas
        this.app = initializeApp(userConfig, APP_NAME);

        // 3. Ativa o Firestore com suporte offline
        this.db = initializeFirestore(this.app, {
          localCache: persistentLocalCache()
        });

        return true;
      } catch (error) {
        console.error('Erro ao conectar ao Firebase:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Valida a senha digitada pelo usuário comparando com o documento salvo na nuvem.
   */
  public async validarSenhaTesoureiro(configTemporaria: FirebaseUserConfig, senhaDigitada: string): Promise<boolean> {
    const TEMP_APP_NAME = 'temp-auth-app';
    let tempApp: FirebaseApp | null = null;

    try {
      // Limpa instância temporária anterior se existir
      const appsExistentes = getApps();
      const tempExistente = appsExistentes.find(a => a.name === TEMP_APP_NAME);
      if (tempExistente) {
        await deleteApp(tempExistente);
      }

      // Cria uma conexão temporária para verificar a senha
      tempApp = initializeApp(configTemporaria, TEMP_APP_NAME);
      const tempDb = initializeFirestore(tempApp, { localCache: persistentLocalCache() });

      // Busca a senha cadastrada na coleção 'configuracoes', documento 'geral'
      const docRef = doc(tempDb, 'configuracoes', 'geral');
      const docSnap = await getDoc(docRef);

      // Fecha a instância temporária imediatamente após a leitura
      await deleteApp(tempApp);

      if (docSnap.exists()) {
        const dados = docSnap.data();
        return dados['senhaTesouraria'] === senhaDigitada;
      } else {
        console.warn('Documento configuracoes/geral não encontrado no Firestore. Aceitando senha padrão.');
        return senhaDigitada === 'ssvp1234';
      }
    } catch (error) {
      if (tempApp) {
        await deleteApp(tempApp);
      }
      console.error('Erro ao validar senha do Tesoureiro:', error);
      return false;
    }
  }

  public async salvarLancamento(lancamento: any): Promise<void> {
    const userConfig = this.configService.obterConfiguracaoFirebase();

    if (this.db && userConfig?.perfil === 'tesoureiro') {
      await this.gravarNoFirestore(lancamento);
    } else {
      await this.salvarLocalmente(lancamento);
    }
  }

  private async gravarNoFirestore(lancamento: any): Promise<void> {
    if (!this.db) return;
    const lancamentosRef = collection(this.db, 'lancamentos');
    await addDoc(lancamentosRef, {
      ...lancamento,
      criadoEm: new Date()
    });
  }

  private async salvarLocalmente(lancamento: any): Promise<void> {
    console.log('Gravando apenas na base local:', lancamento);
  }

  public desconectar(): void {
    if (this.app) {
      deleteApp(this.app);
      this.app = null;
      this.db = null;
    }
    this.configService.removerConexao();
  }

  get firestore(): Firestore | null {
    return this.db;
  }

  get estaConectado(): boolean {
    return this.db !== null;
  }
}
