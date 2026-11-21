import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { db } from '../../core/db/app-database';
import { LivroCaixa } from '../../models/livro-caixa.model';
import { InternalLayoutComponent } from '../../components/internal-layout/internal-layout.component';
import { MoedaCentavosPipe } from '../../pipes/moeda-centavos.pipe';

@Component({
  selector: 'app-livros-caixas',
  standalone: true,
  imports: [CommonModule, RouterLink, InternalLayoutComponent, MoedaCentavosPipe],
  templateUrl: './livros-caixas.component.html',
  styleUrl: './livros-caixas.component.scss'
})
export class LivrosCaixasComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  livrosCaixas: LivroCaixa[] = [];
  carregando: boolean = true;

  async ngOnInit(): Promise<void> {
    await this.carregarLivrosCaixas();
  }

  async carregarLivrosCaixas(): Promise<void> {
    this.carregando = true;
    try {
      // Busca as atas ordenadas da mais recente para a mais antiga pelo número da Ata (id)
      this.livrosCaixas = await db.livros_caixas.orderBy('id').reverse().toArray();
    } catch (error) {
      console.error('Erro ao carregar livros-caixa do Dexie:', error);
      this.livrosCaixas = [];
    } finally {
      this.carregando = false;
      this.cdr.detectChanges();
    }
  }

  obterSaldoFinalAta(livro: LivroCaixa): number {
    if (!livro.valoresCategorias) return 0;
    // Linha 29 - Saldo final (id 48 na V1, id 73 na V2)
    const versao = (livro.versaoLivro || 'v1').toLowerCase();
    return versao === 'v2'
      ? (livro.valoresCategorias[73] || 0)
      : (livro.valoresCategorias[48] || 0);
  }

  obterTotalPresentes(livro: LivroCaixa): number {
    return (
      (livro.confrades || 0) +
      (livro.consorcias || 0) +
      (livro.aspirantes || 0) +
      (livro.visitantes || 0)
    );
  }

  obterTotalFamilias(livro: LivroCaixa): number {
    return (livro.familiasAjudaMaterial || 0) + (livro.familiasAjudaEspiritual || 0);
  }
}
