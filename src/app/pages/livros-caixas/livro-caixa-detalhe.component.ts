import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { db } from '../../core/db/app-database';
import { LivroCaixa } from '../../models/livro-caixa.model';
import { Categoria } from '../../models/categoria.model';
import { ConfigService } from '../../services/config.service';
import { InternalLayoutComponent } from '../../components/internal-layout/internal-layout.component';
import { MoedaCentavosPipe } from '../../pipes/moeda-centavos.pipe';
import { LivroCaixaService } from '../../services/livro-caixa.service';

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
  private livroCaixaService = inject(LivroCaixaService);

  ataId: number | null = null;
  livro: LivroCaixa | null = null;
  versaoAtiva: 'v1' | 'v2' = 'v1';

  linhasReceitas: LinhaLivroCaixa[] = [];
  linhasDespesas: LinhaLivroCaixa[] = [];
  linhasBensMateriais: LinhaLivroCaixa[] = [];
  linhasResumoCaixa: LinhaLivroCaixa[] = [];

  carregando: boolean = true;
  recalculando: boolean = false;
  excluindo: boolean = false;

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

      // 1. Buscar todas as categorias ativas e os lançamentos vinculados a esta Ata
      const todasCategorias = await db.categorias.filter(c => c.ativo !== false).toArray();
      const lancamentosDaAta = await db.lancamentos
        .filter(l => Number(l.ata_livro_caixa_id) === id)
        .toArray();

      const saldoFinalAtaAnterior = await this.buscarSaldoFinalAtaAnterior(id);

      // 2. Preserva apenas os campos manuais salvos; as demais categorias são apuradas do zero via lancamentosDaAta
      // 2. Preserva os campos manuais e os snapshots das contas ('Décima' e 'Conselhos') salvos na Ata
      const valoresSalvos = registro.valoresCategorias || {};
      const valoresManuaisBase: { [id: number]: number } = {
        20: valoresSalvos[20] || 0,
        50: valoresSalvos[50] || 0,
        51: valoresSalvos[51] || 0,
        52: valoresSalvos[52] || 0,
        75: valoresSalvos[75] || 0,
        77: valoresSalvos[77] || 0
      };

      // 3. Consolidar valores e totalizadores via serviço centralizado
      const valoresApurados = this.livroCaixaService.consolidarValoresAta({
        categorias: todasCategorias,
        lancamentos: lancamentosDaAta,
        valoresBase: valoresManuaisBase,
        saldoFinalAtaAnterior,
        versaoLivro: this.versaoAtiva,
        zerarPaisAntesDeSomar: true
      });

      // Persistir mapa atualizado no registro da Ata para manter histórico consistente
      await db.livros_caixas.update(id, {
        valoresCategorias: valoresApurados,
        versaoLivro: this.versaoAtiva,
        updatedAt: new Date().toISOString()
      });
      this.livro.valoresCategorias = valoresApurados;

      // Propagar o Saldo Final atualizado em cascata para as Atas posteriores (id > id)
      const saldoFinalAtualizado = this.livroCaixaService.extrairSaldoFinal(valoresApurados, this.versaoAtiva);
      await this.livroCaixaService.recalcularAtasPosteriores(id, saldoFinalAtualizado);

      // 4. Filtrar categorias exibíveis no Livro Oficial (linhas 00 a 36) compatíveis com V1/V2
      const categoriasDoLivro = todasCategorias
        .filter(c => {
          const v = (c.versao_livro || 'all').toLowerCase();
          const pertenceVersao = v === 'all' || v === this.versaoAtiva;
          const prefixoNumerico = this.extrairNumeroLinha(c.titulo);
          return pertenceVersao && prefixoNumerico !== null && prefixoNumerico <= 36;
        })
        .sort((a, b) => (a.id || 0) - (b.id || 0));

      // 5. Separar em grupos visuais para leitura limpa
      this.linhasReceitas = [];
      this.linhasDespesas = [];
      this.linhasBensMateriais = [];
      this.linhasResumoCaixa = [];

      for (const cat of categoriasDoLivro) {
        const numLinha = this.extrairNumeroLinha(cat.titulo) ?? 0;
        const tituloExibicao = this.versaoAtiva === 'v2' && cat.titulo_dois ? cat.titulo_dois : cat.titulo;
        const linha: LinhaLivroCaixa = {
          categoria: cat,
          tituloExibicao,
          valorCentavos: valoresApurados[cat.id!] || 0,
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

    return this.livroCaixaService.extrairSaldoFinal(
      ataAnterior.valoresCategorias,
      ataAnterior.versaoLivro || 'v1'
    );
  }
}
