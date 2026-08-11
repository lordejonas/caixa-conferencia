import Dexie, { Table } from 'dexie';
import { Favorecido } from '../../models/favorecido.model';

export interface UnidadeLocal {
  id?: string;
  tipoUnidade: string;
  nomeUnidade: string;
  local?: string;
  dataFundacao?: string;
  dataAgregacao?: string;
  codigo?: string;
  conselhoParticular?: string;
  conselhoCentral?: string;
  conselhoMetropolitano?: string;
  updatedAt: number;
  statusSync: 'PENDENTE' | 'SINCRONIZADO';
}

export class AppDatabase extends Dexie {
  unidades!: Table<UnidadeLocal, string>;
  favorecidos!: Table<Favorecido, number>; // 🟢 Nova tabela adicionada

  constructor() {
    super('LivroCaixaDB');

    // Versão 1 (Legado - Mantido para preservar os dados de Unidades)
    this.version(1).stores({
      unidades: 'id, statusSync, updatedAt'
    });

    // Versão 2 (Nova estrutura com a tabela de favorecidos)
    this.version(2).stores({
      unidades: 'id, statusSync, updatedAt',
      favorecidos: '++id, firebaseId, sincronizado, ativo' // ++id é chave primária auto-incremento
    });
  }
}

export const db = new AppDatabase();
