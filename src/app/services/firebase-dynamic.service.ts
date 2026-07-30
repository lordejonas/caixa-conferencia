import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp, deleteApp, getApps } from 'firebase/app';
import {
  Firestore,
  getFirestore,
  collection,
  addDoc,
  getDocsFromServer,
  limit,
  query
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

  async inicializarETestarConexao(config: FirebaseUserConfig): Promise<boolean> {
    let appTeste;
    try {
      const nomeAppTeste = 'app-validacao-temp';

      // Se já existir uma instância temporária antiga, encerra para evitar conflitos
      const appsExistentes = getApps();
      const appExistente = appsExistentes.find(app => app.name === nomeAppTeste);
      if (appExistente) {
        await deleteApp(appExistente);
      }

      // 1. Inicializa uma instância temporária do Firebase
      appTeste = initializeApp(config, nomeAppTeste);
      const db = getFirestore(appTeste);

      // 2. FORÇA a requisição DIRETO ao SERVIDOR (sem passar por cache local)
      // Tenta ler uma coleção qualquer no servidor real
      const consulta = query(collection(db, '_ping_teste'), limit(1));
      await getDocsFromServer(consulta);

      // Se passou, limpa o app temporário
      await deleteApp(appTeste);
      return true;

    } catch (error: any) {
      console.error('Falha na validação do Firebase:', error);

      // Se o app temporário foi criado, encerra a instância
      if (appTeste) {
        try {
          await deleteApp(appTeste);
        } catch (e) {
          // ignora erro de encerramento
        }
      }

      /*
        ATENÇÃO:
        Se o erro for 'permission-denied' (Permissão Negada), significa que O PROJETO E AS CHAVES EXISTEM
        e são VÁLIDOS na nuvem, mas as regras de segurança do Firestore bloquearam a leitura (o que é normal se não estiver logado).

        Qualquer outro erro (como 'not-found', 'invalid-api-key', 'quota-exceeded', etc.) significa
        que as CHAVES OU O PROJECT ID ESTÃO ERRADOS.
      */
      if (error?.code === 'permission-denied') {
        // Chaves válidas, apenas sem permissão de leitura pública (normal e esperado)
        return true;
      }

      // Se a chave/projectId contiver "z" ou dados falsos, cairá aqui retornando FALSE
      return false;
    }
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

      // Se o documento não existe ou a permissão/chave é inválida
      if (response.status === 404 || response.status === 403 || response.status === 401) {
        console.warn(`Acesso negado ou documento não encontrado. Status REST: ${response.status}`);
        return false;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro Firestore REST:', errorData);
        return false;
      }

      const data = await response.json();
      console.log('Dados recebidos do documento:', data);

      const senhaSalva = data.fields?.senhaTesouraria?.stringValue;

      if (!senhaSalva) {
        console.warn('Campo "senhaTesouraria" não existe no documento.');
        return false;
      }

      // Compara removendo espaços nas pontas para evitar falsos negativos
      return senhaSalva.trim() === senhaDigitada.trim();

    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('Falha na requisição de validação:', error);

      if (error.name === 'AbortError') {
        throw new Error('Tempo limite excedido ao consultar o Firestore. Verifique a conexão.');
      }

      return false; // Retorna false em vez de re-lançar a exceção, garantindo que a senha seja rejeitada
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
