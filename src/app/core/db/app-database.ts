import Dexie, { Table } from 'dexie';
import { UnidadeLocal } from '../../models/unidade.model';
import { Favorecido } from '../../models/favorecido.model';
import { Categoria } from '../../models/categoria.model';
import { Conta } from '../../models/conta.model';
import { Agregador } from '../../models/agregador.model';
import { Lancamento } from '../../models/lancamento.model';

export class AppDatabase extends Dexie {
  unidades!: Table<UnidadeLocal, string>;
  favorecidos!: Table<Favorecido, number>;
  categorias!: Table<Categoria, number>;
  contas!: Table<Conta, number>;
  agregadores!: Table<Agregador, number>;
  lancamentos!: Table<Lancamento, number>;

  constructor() {
    super('LivroCaixaDB');

    // Versões anteriores (1 a 8)...
    this.version(1).stores({ unidades: 'id, statusSync, updatedAt' });
    this.version(2).stores({ unidades: 'id, statusSync, updatedAt', favorecidos: '++id, firebaseId, sincronizado, ativo' });
    this.version(3).stores({ unidades: 'id, statusSync, updatedAt', favorecidos: '++id, firebaseId, sincronizado, ativo', categorias: '++id, title, pai, ativo' });
    this.version(6).stores({ unidades: 'id', favorecidos: '++id, firebaseId, titulo, sincronizado', categorias: '++id, title, pai, ativo', contas: '++id, firebaseId, titulo, ativo, id_agregador, ordem_listagem', agregadores: '++id, firebaseId, nome, ativo, ordem_listagem' });
    this.version(7).stores({ unidades: 'id', favorecidos: '++id, firebaseId, titulo, sincronizado', categorias: '++id, title, pai, ativo', contas: '++id, firebaseId, titulo, ativo, id_agregador, ordem_listagem, contabilizar_totais', agregadores: '++id, firebaseId, nome, ativo, ordem_listagem, contabilizar_totais' });
    this.version(8).stores({
      unidades: 'id',
      favorecidos: '++id, firebaseId, titulo, sincronizado',
      categorias: '++id, title, pai, ativo',
      contas: '++id, firebaseId, titulo, ativo, id_agregador, ordem_listagem, contabilizar_totais',
      agregadores: '++id, firebaseId, nome, ativo, ordem_listagem, contabilizar_totais',
      lancamentos: '++id, firebaseId, sincronizado, datahorario, origem_conta_id, destino_conta_id, favorecido_id, categoria_id'
    });

    // 🟢 Versão 9 (Atualização do esquema de Categoria: title -> titulo)
    this.version(9).stores({
      unidades: 'id',
      favorecidos: '++id, firebaseId, titulo, sincronizado',
      categorias: '++id, titulo, pai, ativo',
      contas: '++id, firebaseId, titulo, ativo, id_agregador, ordem_listagem, contabilizar_totais',
      agregadores: '++id, firebaseId, nome, ativo, ordem_listagem, contabilizar_totais',
      lancamentos: '++id, firebaseId, sincronizado, datahorario, origem_conta_id, destino_conta_id, favorecido_id, categoria_id'
    });
  }
}

export const db = new AppDatabase();
