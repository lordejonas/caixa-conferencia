import { Injectable } from '@angular/core';
import { db } from '../core/db/app-database';
import { Conta } from '../models/conta.model';
import { DEFAULT_CONTAS_TIPO_1, DEFAULT_CONTAS_TIPO_2, DEFAULT_AGREGADORES_TIPO_2 } from '../data/default-contas.data';

@Injectable({
  providedIn: 'root'
})
export class ContaService {

  async getContas(): Promise<Conta[]> {
    return await db.contas.orderBy('ordem_listagem').toArray();
  }

  /**
   * Seeding de Contas Tipo 1
   */
  async gerarContasTipo1(): Promise<void> {
    const now = new Date().toISOString();
    const contasParaInserir = DEFAULT_CONTAS_TIPO_1.map(conta => ({
      ...conta,
      updatedAt: now
    }));

    await db.transaction('rw', [db.contas, db.agregadores], async () => {
      await db.contas.clear();
      await db.agregadores.clear();
      await db.contas.bulkAdd(contasParaInserir as Conta[]);
    });
  }

  /**
   * Seeding de Contas Tipo 2 (com Agregadores)
   */
  async gerarContasTipo2(): Promise<void> {
    const now = new Date().toISOString();

    await db.transaction('rw', [db.contas, db.agregadores], async () => {
      await db.contas.clear();
      await db.agregadores.clear();

      // 1. Criar os agregadores padrão
      const agregadoresParaInserir = DEFAULT_AGREGADORES_TIPO_2.map(agregador => ({
        ...agregador,
        updatedAt: now
      }));
      await db.agregadores.bulkAdd(agregadoresParaInserir as any);

      // 2. Criar as contas
      const contasParaInserir = DEFAULT_CONTAS_TIPO_2.map(conta => ({
        ...conta,
        updatedAt: now
      }));
      await db.contas.bulkAdd(contasParaInserir as Conta[]);
    });
  }
}
