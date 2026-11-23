import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { db } from '../../core/db/app-database';
import { LivroCaixa } from '../../models/livro-caixa.model';
import { Categoria } from '../../models/categoria.model';
import { Lancamento } from '../../models/lancamento.model';
import { ConfigService } from '../../services/config.service';
import { InternalLayoutComponent } from '../../components/internal-layout/internal-layout.component';
import { MoedaCentavosPipe } from '../../pipes/moeda-centavos.pipe';

export interface LinhaLivroCaixa {
  categoria: Categoria;
  tituloExibicao: string;
  valorCentavos: number;
  ehSubcategoria: boolean;
  ehTotalizador: boolean;
}

@Component({
  selector: 'app-livro-caixa-detalhe',
  standalone: true,
  imports: [CommonModule, RouterLink, InternalLayoutComponent, MoedaCentavosPipe],
  templateUrl: './livro-caixa-detalhe.component.html',
  styleUrl: './livro-caixa-detalhe.component.scss'
})
export class LivroCaixaDetalheComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private configService = inject(ConfigService);
  private cdr = inject(ChangeDetectorRef);

  ataId: number | null = null;
  livro: LivroCaixa | null = null;
  versaoAtiva: 'v1' | 'v2' = 'v1';

  linhasReceitas: LinhaLivroCaixa[] = [];
  linhasDespesas: LinhaLivroCaixa[] = [];
  //linhasQuantitativosEFinal: LinhaLivroCaixa[] = [];
  linhasBensMateriais: LinhaLivroCaixa[] = [];
  linhasResumoCaixa: LinhaLivroCaixa[] = [];

  carregando: boolean = true;
  recalculando: boolean = false;

  async ngOnInit(): Promise<void> {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.ataId = Number(idParam);
      await this.carregarEApurarAta(this.ataId);
    } else {
      this.router.navigate(['/caixa']);
    }
  }

  get totalFamilias(): number {
    if (!this.livro) return 0;
    return (this.livro.familiasAjudaMaterial || 0) + (this.livro.familiasAjudaEspiritual || 0);
  }

  get totalPresentes(): number {
    if (!this.livro) return 0;
    return (
      (this.livro.confrades || 0) +
      (this.livro.consorcias || 0) +
      (this.livro.aspirantes || 0) +
      (this.livro.visitantes || 0)
    );
  }

  async carregarEApurarAta(id: number): Promise<void> {
    this.carregando = true;
    try {
      const registro = await db.livros_caixas.get(id);
      if (!registro) {
        alert('Ata não encontrada.');
        this.router.navigate(['/caixa']);
        return;
      }

      this.livro = registro;
      const versaoConfig = this.configService.obterVersaoLivro().toLowerCase();
      this.versaoAtiva = versaoConfig === 'v2' ? 'v2' : 'v1';

      // 1. Buscar todas as categorias ativas e lançamentos vinculados a esta Ata
      const todasCategorias = await db.categorias.filter(c => c.ativo !== false).toArray();
      const lancamentosDaAta = await db.lancamentos
        .filter(l => Number(l.ata_livro_caixa_id) === id)
        .toArray();

      const saldoFinalAtaAnterior = await this.buscarSaldoFinalAtaAnterior(id);

      // 2. Apurar valores brutos por categoria a partir dos lançamentos
      const valoresPorCategoria = this.calcularValoresPorCategoria(
        todasCategorias,
        lancamentosDaAta,
        registro.valoresCategorias || {},
        saldoFinalAtaAnterior
      );

      // Persistir mapa atualizado no registro da Ata para manter histórico consistente
      await db.livros_caixas.update(id, {
        valoresCategorias: valoresPorCategoria,
        versaoLivro: this.versaoAtiva,
        updatedAt: new Date().toISOString()
      });
      this.livro.valoresCategorias = valoresPorCategoria;

      // 3. Filtrar categorias exibíveis no Livro Oficial (linhas 00 a 36) compatíveis com V1/V2
      const categoriasDoLivro = todasCategorias
        .filter(c => {
          const v = (c.versao_livro || 'all').toLowerCase();
          const pertenceVersao = v === 'all' || v === this.versaoAtiva;
          // Exclui categorias operacionais internas (50-Extra Caixa, 52-Movimentações, 53-Arredondamento, etc.)
          const prefixoNumerico = this.extrairNumeroLinha(c.titulo);
          return pertenceVersao && prefixoNumerico !== null && prefixoNumerico <= 36;
        })
        .sort((a, b) => (a.id || 0) - (b.id || 0));

      // 4. Separar em grupos visuais para leitura limpa
      this.linhasReceitas = [];
      this.linhasDespesas = [];
      //this.linhasQuantitativosEFinal = [];
      this.linhasBensMateriais = [];
      this.linhasResumoCaixa = [];

      for (const cat of categoriasDoLivro) {
        const numLinha = this.extrairNumeroLinha(cat.titulo) ?? 0;
        const tituloExibicao = this.versaoAtiva === 'v2' && cat.titulo_dois ? cat.titulo_dois : cat.titulo;
        const linha: LinhaLivroCaixa = {
          categoria: cat,
          tituloExibicao,
          valorCentavos: valoresPorCategoria[cat.id!] || 0,
          ehSubcategoria: cat.pai !== null && cat.pai !== undefined,
          ehTotalizador: cat.auto === true && cat.id !== 1 // 00-Saldo de Abertura não é soma da ata
        };

        if (numLinha <= 15) {
          this.linhasReceitas.push(linha);
        } else if (numLinha >= 16 && numLinha <= 30) {
          this.linhasDespesas.push(linha);
        } else if (numLinha >= 31 && numLinha <= 33) {
          this.linhasBensMateriais.push(linha);
        } else if (numLinha >= 34 && numLinha <= 36) {
          this.linhasResumoCaixa.push(linha);
        }
      }
    } catch (error) {
      console.error('Erro ao apurar valores da Ata:', error);
    } finally {
      this.carregando = false;
      this.cdr.detectChanges();
    }
  }

  async recalcularManualmente(): Promise<void> {
    if (!this.ataId || this.recalculando) return;
    this.recalculando = true;
    await this.carregarEApurarAta(this.ataId);
    this.recalculando = false;
  }

  excluindo: boolean = false;

  async excluirAta(): Promise<void> {
    if (!this.ataId || this.excluindo) return;

    const confirmou = confirm(
      `Deseja realmente excluir a Ata #${this.ataId}?\n\nOs lançamentos financeiros vinculados a ela não serão apagados, apenas desvinculados.`
    );

    if (!confirmou) return;

    this.excluindo = true;

    try {
      await db.transaction('rw', [db.livros_caixas, db.lancamentos], async () => {
        // 1. Desvincula lançamentos associados a esta Ata
        const lancamentosVinculados = await db.lancamentos
          .filter(l => Number(l.ata_livro_caixa_id) === this.ataId)
          .toArray();

        for (const lanc of lancamentosVinculados) {
          if (lanc.id !== undefined) {
            await db.lancamentos.update(lanc.id, {
              ata_livro_caixa_id: null,
              sincronizado: false,
              updatedAt: new Date().toISOString()
            });
          }
        }

        // 2. Exclui o registro da Ata
        await db.livros_caixas.delete(this.ataId!);
      });

      this.router.navigate(['/caixa']);
    } catch (error) {
      console.error('Erro ao excluir Ata:', error);
      alert('Ocorreu um erro ao excluir a Ata.');
    } finally {
      this.excluindo = false;
      this.cdr.detectChanges();
    }
  }

 /**
   * Consolida os lançamentos da Ata, soma filhas nas categorias Pai
   * e calcula os totalizadores automáticos de V1 e V2.
   */
  private calcularValoresPorCategoria(
    categorias: Categoria[],
    lancamentos: Lancamento[],
    valoresManuaisSalvos: { [id: number]: number },
    saldoFinalAtaAnterior: number | null
  ): { [id: number]: number } {
    // 1. Inicia o mapa zerado e preserva SOMENTE os campos manuais do formulário
    const mapa: { [id: number]: number } = {};
    const idsManuais = [20, 50, 51, 52]; // 14-Saldo anterior (1ª Ata) e Bens Materiais (31, 32, 33)

    for (const idManual of idsManuais) {
      if (valoresManuaisSalvos[idManual] !== undefined) {
        mapa[idManual] = valoresManuaisSalvos[idManual] || 0;
      }
    }

    // 2. Soma absoluta dos lançamentos vinculados à Ata por categoria_id (ignorando transferências)
    for (const lanc of lancamentos) {
      if (lanc.destino_conta_id !== null && lanc.destino_conta_id !== undefined) {
        continue;
      }
      if (!lanc.categoria_id) continue;

      const catId = Number(lanc.categoria_id);
      mapa[catId] = (mapa[catId] || 0) + Math.abs(lanc.origem_montante || 0);
    }

    // 3. Consolida subcategorias nas categorias Pai (ex: 03.1 + 03.2 + 03.3 -> 03)
    for (const cat of categorias) {
      if (cat.id && cat.pai) {
        const paiId = Number(cat.pai);
        mapa[paiId] = (mapa[paiId] || 0) + (mapa[cat.id] || 0);
      }
    }

    // --- CÁLCULOS DOS TOTALIZADORES OFICIAIS ---
    // 06-Subtotal (id: 10) = soma das linhas 01 a 05 (ids: 2, 3, 4, 8, 9)
    const subtotal06 = (mapa[2] || 0) + (mapa[3] || 0) + (mapa[4] || 0) + (mapa[8] || 0) + (mapa[9] || 0);
    mapa[10] = subtotal06;

    // 13-Soma da Receita da semana (id: 19) = linha 06 (10) + linhas 07 a 12 (ids: 11, 12, 15, 16, 17, 18)
    const somaReceita13 =
      subtotal06 +
      (mapa[11] || 0) +
      (mapa[12] || 0) +
      (mapa[15] || 0) +
      (mapa[16] || 0) +
      (mapa[17] || 0) +
      (mapa[18] || 0);
    mapa[19] = somaReceita13;

    // 14-Saldo anterior (id: 20)
    // Se existe Ata anterior, herda o Saldo Final (linha 29) dela.
    // Caso seja a 1ª Ata, utiliza o saldo manual salvo ou 00-Saldo de Abertura (id: 1) se houver lançamento.
    if (saldoFinalAtaAnterior !== null) {
      mapa[20] = saldoFinalAtaAnterior;
    } else if ((mapa[1] || 0) > 0 && !(mapa[20] > 0)) {
      mapa[20] = mapa[1];
    }

    const saldoAnterior14 = mapa[20] || 0;

    // 15-Total da Receita (V2 id: 21 | V1 id: 72) = linha 13 + linha 14
    const totalReceita15 = somaReceita13 + saldoAnterior14;
    mapa[21] = totalReceita15;
    mapa[72] = totalReceita15;

    // 28-Soma das despesas da semana (id: 47) = linhas 16 a 27 (ids: 22, 24, 27, 29, 30, 31, 39, 40, 41, 42, 43, 46)
    const somaDespesas28 =
      (mapa[22] || 0) +
      (mapa[24] || 0) +
      (mapa[27] || 0) +
      (mapa[29] || 0) +
      (mapa[30] || 0) +
      (mapa[31] || 0) +
      (mapa[39] || 0) +
      (mapa[40] || 0) +
      (mapa[41] || 0) +
      (mapa[42] || 0) +
      (mapa[43] || 0) +
      (mapa[46] || 0);
    mapa[47] = somaDespesas28;

    // 29-Saldo final (V1 id: 48 | V2 id: 73) = linha 15 - linha 28
    const saldoFinal29 = totalReceita15 - somaDespesas28;
    mapa[48] = saldoFinal29;
    mapa[73] = saldoFinal29;

    // 30-Balanço / Total Despesas + Saldo Final (V1 id: 49 | V2 id: 74) = linha 28 + linha 29
    const balanco30 = somaDespesas28 + saldoFinal29;
    mapa[49] = balanco30;
    mapa[74] = balanco30;

    // Linhas 34, 35 e 36 específicas por versão
    if (this.versaoAtiva === 'v1') {
      // 34-Décimas a enviar (id: 75) = 10% do Subtotal 06 menos Décima já paga (id: 41)
      const decimaDevida = Math.round(subtotal06 * 0.10) - (mapa[41] || 0);
      mapa[75] = decimaDevida > 0 ? decimaDevida : 0;

      // 35-Outras contribuições a enviar (id: 77) = Linha 08 (id: 12) - Repasses efetuados (id: 43)
      const outrasContribuicoes = (mapa[12] || 0) - (mapa[43] || 0);
      mapa[77] = outrasContribuicoes > 0 ? outrasContribuicoes : 0;

      // 36-Total de recursos com a Tesouraria (id: 79) = linhas 29 + 34 + 35
      mapa[79] = (mapa[48] || 0) + (mapa[75] || 0) + (mapa[77] || 0);
    } else {
      // V2: 34-Total das Receitas (=Nº 15) (id: 76)
      mapa[76] = totalReceita15;
      // V2: 35-Total das Despesas (=Nº 30) (id: 78)
      mapa[78] = balanco30;
      // V2: 36-Saldo disponível ou déficit acumulado (id: 80) = Nº 15 - Nº 30
      mapa[80] = totalReceita15 - balanco30;
    }

    return mapa;
  }

  private extrairNumeroLinha(titulo: string): number | null {
    const match = titulo.match(/^(\d{2})-/);
    return match ? Number(match[1]) : null;
  }

  private async buscarSaldoFinalAtaAnterior(ataAtualId: number): Promise<number | null> {
    const atasAnteriores = await db.livros_caixas
      .where('id')
      .below(ataAtualId)
      .sortBy('id');

    if (atasAnteriores.length === 0) {
      return null; // Indica que é a primeira Ata do sistema
    }

    const ataAnterior = atasAnteriores[atasAnteriores.length - 1];
    if (!ataAnterior.valoresCategorias) {
      return 0;
    }

    const versaoAnterior = (ataAnterior.versaoLivro || 'v1').toLowerCase();
    return versaoAnterior === 'v2'
      ? (ataAnterior.valoresCategorias[73] ?? ataAnterior.valoresCategorias[48] ?? 0)
      : (ataAnterior.valoresCategorias[48] ?? ataAnterior.valoresCategorias[73] ?? 0);
  }
}
