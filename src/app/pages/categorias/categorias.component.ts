import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { InternalLayoutComponent } from '../../components/internal-layout/internal-layout.component';
import { CategoriaService } from '../../services/categoria.service';
import { SyncService } from '../../core/service/sync.service';
import { Categoria, CategoriaNode } from '../../models/categoria.model';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [InternalLayoutComponent],
  templateUrl: './categorias.component.html',
  styleUrl: './categorias.component.scss'
})
export class CategoriasComponent implements OnInit {
  categoriasTree: CategoriaNode[] = [];
  loading = true;
  erroMsg: string | null = null;
  totalGeral = 0;

  private syncService = inject(SyncService);

  constructor(
    private categoriaService: CategoriaService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.carregarCategorias();
    // Inicia a verificação de sincronização global ao entrar na tela
    this.syncService.sincronizar();
  }

  async carregarCategorias() {
    this.loading = true;
    this.erroMsg = null;
    this.cdr.detectChanges();

    try {
      const listaPlana = await this.categoriaService.getCategorias();
      this.totalGeral = listaPlana.length;
      this.categoriasTree = this.agruparCategorias(listaPlana);
    } catch (err: any) {
      console.error('Erro ao buscar categorias:', err);
      this.erroMsg = 'Não foi possível carregar as categorias do banco local.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  private agruparCategorias(lista: Categoria[]): CategoriaNode[] {
    const pais: CategoriaNode[] = lista
      .filter(c => c.pai === null)
      .map(p => ({ ...p, expanded: false, filhas: [] }));

    pais.forEach(pai => {
      if (pai.id !== undefined) {
        pai.filhas = lista.filter(c => c.pai === pai.id);
      }
    });

    return pais;
  }

  toggleExpand(categoria: CategoriaNode) {
    if (categoria.filhas && categoria.filhas.length > 0) {
      categoria.expanded = !categoria.expanded;
    }
  }

  async onGerarCategorias() {
    this.loading = true;
    this.erroMsg = null;
    this.cdr.detectChanges();

    try {
      await this.categoriaService.gerarCategoriasIniciais();
      await this.carregarCategorias();
      // Dispara sincronização após seeding inicial
      this.syncService.sincronizar();
    } catch (err: any) {
      console.error('Erro ao gerar categorias:', err);
      this.erroMsg = 'Falha ao gravar categorias no banco.';
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
