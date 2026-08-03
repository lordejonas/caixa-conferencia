import Dexie, { Table } from 'dexie';

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

  constructor() {
    super('LivroCaixaDB');
    this.version(1).stores({
      unidades: 'id, statusSync, updatedAt'
    });
  }
}

export const db = new AppDatabase();
