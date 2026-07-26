import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp, deleteApp } from 'firebase/app';
import { Firestore, initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import { ConfigService } from './config.service';

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
        // Inicializa a instância nomeada do App
        this.app = initializeApp(userConfig, 'conferencia-app');

        // Ativa o Firestore com persistência offline nativa (IndexedDB)
        this.db = initializeFirestore(this.app, {
          localCache: persistentLocalCache()
        });

        return true;
      } catch (error) {
        console.error('Erro ao conectar ao Firebase fornecido:', error);
        return false;
      }
    }
    return false;
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
