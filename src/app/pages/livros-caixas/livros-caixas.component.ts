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

  mesReferencia: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  // Lista completa carregada do Dexie (ex: db.livros_caixas.orderBy('id').reverse().toArray())
  todasAtas: LivroCaixa[] = [];

  async ngOnInit(): Promise<void> {
    this.carregando = true;
    try {
      // Carrega as Atas ordenadas da mais recente para a mais antiga
      this.livrosCaixas = await db.livros_caixas.orderBy('id').reverse().toArray();

      // Posiciona o mês de referência na última Ata cadastrada, se existir
      if (this.livrosCaixas.length > 0) {
        // Garante que pegamos a Ata de maior ID (ou dataReuniao mais recente)
        const ultimaAta = this.livrosCaixas.reduce((maisRecente, atual) =>
          (atual.id || 0) > (maisRecente.id || 0) ? atual : maisRecente
        );

        if (ultimaAta.dataReuniao) {
          const [anoStr, mesStr] = ultimaAta.dataReuniao.substring(0, 10).split('-');
          const ano = Number(anoStr);
          const mes = Number(mesStr) - 1; // Mês em Date vai de 0 a 11

          if (!isNaN(ano) && !isNaN(mes)) {
            this.mesReferencia = new Date(ano, mes, 1);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar livros-caixa:', error);
    } finally {
      this.carregando = false;
      this.cdr.detectChanges();
    }
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

  /**
   * Retorna apenas as Atas cuja dataReuniao pertence ao mês e ano selecionados.
   */
  get atasDoMesSelecionado(): LivroCaixa[] {
    const anoRef = this.mesReferencia.getFullYear();
    const mesRef = this.mesReferencia.getMonth(); // 0 a 11

    return this.todasAtas.filter(ata => {
      if (!ata.dataReuniao) return false;
      // Extrai YYYY-MM-DD diretamente da string ISO para evitar deslocamento de fuso horário
      const [anoStr, mesStr] = ata.dataReuniao.substring(0, 10).split('-');
      return Number(anoStr) === anoRef && (Number(mesStr) - 1) === mesRef;
    });
  }

  /**
   * Formata o rótulo central (ex: "Novembro / 2026") com a primeira letra maiúscula.
   */
  get descricaoMesAnoReferencia(): string {
    const formatado = this.mesReferencia.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric'
    });
    return formatado.charAt(0).toUpperCase() + formatado.slice(1);
  }

  /**
   * Navega para o mês anterior (-1) ou próximo mês (+1).
   */
  alterarMesReferencia(deltaMeses: number): void {
    this.mesReferencia = new Date(
      this.mesReferencia.getFullYear(),
      this.mesReferencia.getMonth() + deltaMeses,
      1
    );
  }

  get livrosCaixasFiltrados(): LivroCaixa[] {
    const anoRef = this.mesReferencia.getFullYear();
    const mesRef = this.mesReferencia.getMonth();

    return (this.livrosCaixas || []).filter(livro => {
      if (!livro.dataReuniao) return false;
      const [anoStr, mesStr] = livro.dataReuniao.substring(0, 10).split('-');
      return Number(anoStr) === anoRef && (Number(mesStr) - 1) === mesRef;
    });
  }
}
