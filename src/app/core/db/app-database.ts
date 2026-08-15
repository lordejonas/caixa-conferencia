import Dexie, { Table } from 'dexie';
import { UnidadeLocal } from '../../models/unidade.model';
import { Favorecido } from '../../models/favorecido.model';
import { Categoria } from '../../models/categoria.model';

export class AppDatabase extends Dexie {
  unidades!: Table<UnidadeLocal, string>;
  favorecidos!: Table<Favorecido, number>;
  categorias!: Table<Categoria, number>;

  constructor() {
    super('LivroCaixaDB');

    // Versão 1 (Legado)
    this.version(1).stores({
      unidades: 'id, statusSync, updatedAt'
    });

    // Versão 2 (Favorecidos)
    this.version(2).stores({
      unidades: 'id, statusSync, updatedAt',
      favorecidos: '++id, firebaseId, sincronizado, ativo'
    });

    // Versão 3 (Categorias)
    this.version(3).stores({
      unidades: 'id, statusSync, updatedAt',
      favorecidos: '++id, firebaseId, sincronizado, ativo',
      categorias: '++id, title, pai, ativo'
    });
  }
}

export const db = new AppDatabase();
