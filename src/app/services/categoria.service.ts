import { Injectable } from '@angular/core';
import { db } from '../core/db/app-database';
import { Categoria } from '../models/categoria.model';
import { DEFAULT_CATEGORIAS } from '../data/default-categorias.data';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {

  async getCategorias(): Promise<Categoria[]> {
    const categorias = await db.categorias.toArray();
    return categorias.sort((a, b) => a.title.localeCompare(b.title));
  }

  async gerarCategoriasIniciais(): Promise<void> {
    const total = await db.categorias.count();
    if (total === 0) {
      const now = new Date().toISOString();
      const categoriasComData = DEFAULT_CATEGORIAS.map(cat => ({
        ...cat,
        updatedAt: now
      }));
      await db.categorias.bulkAdd(categoriasComData as Categoria[]);
    }
  }
}
