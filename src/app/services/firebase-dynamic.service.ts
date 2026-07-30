import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp, deleteApp, getApps } from 'firebase/app';
import {
  Firestore,
  getFirestore,
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
        // Limpa instâncias anteriores antes de recriar
        const apps = getApps();
        for (const app of apps) {
          deleteApp(app);
        }

        this.app = initializeApp(userConfig);
        this.db = getFirestore(this.app);

        return true;
      } catch (error) {
        console.error('Erro ao conectar ao Firebase:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Valida a senha usando a API REST do Firestore via fetch (evita travamentos de SDK/Cache).
   */
  public async validarSenhaTesoureiro(config: FirebaseUserConfig, senhaDigitada: string): Promise<boolean> {
    const projectId = config.projectId?.trim();
    const apiKey = config.apiKey?.trim();

    if (!projectId || !apiKey) {
      console.error('Projeto ou API Key ausentes.');
      return false;
    }

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/configuracoes/geral?key=${apiKey}`;

    console.log('Iniciando validação de senha via REST em:', url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('Timeout atingido, abortando fetch...');
      controller.abort();
    }, 3000); // 3 segundos limite

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('Resposta recebida do Firestore REST. Status:', response.status);

      if (response.status === 404) {
        console.warn('Documento configuracoes/geral não encontrado no Firestore.');
        return false;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro Firestore REST:', errorData);
        throw new Error('Chave de API inválida ou erro de acesso ao Firestore.');
      }

      const data = await response.json();
      console.log('Dados recebidos do documento:', data);

      const senhaSalva = data.fields?.senhaTesouraria?.stringValue;

      if (!senhaSalva) {
        console.warn('Campo "senhaTesouraria" não existe no documento.');
        return false;
      }

      return senhaSalva === senhaDigitada;
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('Falha na requisição de validação:', error);
      if (error.name === 'AbortError') {
        throw new Error('Tempo limite excedido ao consultar o Firestore. Verifique a conexão.');
      }
      throw error;
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
    const apps = getApps();
    for (const app of apps) {
      deleteApp(app);
    }
    this.app = null;
    this.db = null;
    this.configService.removerConexao();
  }

  get firestore(): Firestore | null {
    return this.db;
  }

  get estaConectado(): boolean {
    return this.db !== null;
  }
}
