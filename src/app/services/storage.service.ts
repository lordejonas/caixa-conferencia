import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() { }

  // Grava dados no localStorage convertendo para String JSON
  set(key: string, value: any): void {
    try {
      const data = JSON.stringify(value);
      localStorage.setItem(key, data);
    } catch (e) {
      console.error('Erro ao salvar no localStorage', e);
    }
  }

  // Lê dados do localStorage e converte de volta para Objeto JavaScript
  get<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) as T : null;
    } catch (e) {
      console.error('Erro ao ler do localStorage', e);
      return null;
    }
  }

  // Remove uma chave específica
  remove(key: string): void {
    localStorage.removeItem(key);
  }

  // Limpa todo o armazenamento do app
  clear(): void {
    localStorage.clear();
  }
}
