import { Injectable } from '@angular/core';
import { FirebaseUserConfig } from '../models/firebase-config.model';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly STORAGE_KEY = 'ssvp_firebase_config';

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
}
