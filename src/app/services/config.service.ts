import { Injectable } from '@angular/core';
import { FirebaseUserConfig } from '../models/firebase-config.model';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly STORAGE_KEY = 'ssvp_firebase_config';
  private readonly VERSAO_LIVRO_KEY = 'app_versao_livro';

  salvarConfiguracaoFirebase(config: FirebaseUserConfig): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
  }

  obterConfiguracaoFirebase(): FirebaseUserConfig | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  removerConexao(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  obterVersaoLivro(): string {
    return localStorage.getItem(this.VERSAO_LIVRO_KEY) || 'v1'; // valor padrão
  }

  salvarVersaoLivro(versao: string): void {
    localStorage.setItem(this.VERSAO_LIVRO_KEY, versao);
  }
}
