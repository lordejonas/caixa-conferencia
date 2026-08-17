import Dexie, { Table } from 'dexie';
import { UnidadeLocal } from '../../models/unidade.model';
import { Favorecido } from '../../models/favorecido.model';
import { Categoria } from '../../models/categoria.model';
import { Conta } from '../../models/conta.model';
import { Agregador } from '../../models/agregador.model';

export class AppDatabase extends Dexie {
  unidades!: Table<UnidadeLocal, string>;
  favorecidos!: Table<Favorecido, number>;
  categorias!: Table<Categoria, number>;
  contas!: Table<Conta, number>;
  agregadores!: Table<Agregador, number>;

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

    // 🟢 Versão 4 (Contas)
    this.version(6).stores({
      unidades: 'id',
      favorecidos: '++id, firebaseId, titulo, sincronizado',
      categorias: '++id, title, pai, ativo',
      contas: '++id, firebaseId, titulo, ativo, id_agregador, ordem_listagem',
      agregadores: '++id, firebaseId, nome, ativo, ordem_listagem'
    });
  }
}

export const db = new AppDatabase();
