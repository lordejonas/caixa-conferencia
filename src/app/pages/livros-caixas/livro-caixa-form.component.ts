import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { db } from '../../core/db/app-database';
import { LivroCaixa } from '../../models/livro-caixa.model';
import { Lancamento } from '../../models/lancamento.model';
import { ConfigService } from '../../services/config.service';
import { InternalLayoutComponent } from '../../components/internal-layout/internal-layout.component';
import { MoedaCentavosPipe } from '../../pipes/moeda-centavos.pipe';

export interface ItemLancamentoSelecao {
  lancamento: Lancamento;
  selecionado: boolean;
  nomeCategoria: string;
}

@Component({
  selector: 'app-livro-caixa-form',
  standalone: true,
  imports: [CommonModule, FormsModule, InternalLayoutComponent, MoedaCentavosPipe],
  templateUrl: './livro-caixa-form.component.html',
  styleUrl: './livro-caixa-form.component.scss'
})
export class LivroCaixaFormComponent implements OnInit {
  private location = inject(Location);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private configService = inject(ConfigService);
  private cdr = inject(ChangeDetectorRef);

  isSalvando: boolean = false;
  idEdicao: number | null = null;

  // Campos do Formulário
  numeroAta: number | null = null;
  dataIso: string = new Date().toISOString().substring(0, 10);
  horaIso: string = new Date().toTimeString().substring(0, 5);

  // Saldo Anterior (Linha 14 - ID 20)
  saldoAnteriorReais: string = '';
  possuiAtaAnterior: boolean = false;

  // Assistência (inicializados como null para carregar em branco)
  familiasAjudaMaterial: number | null = null;
  familiasAjudaEspiritual: number | null = null;
  totalPessoasAssistidas: number | null = null;

  // Presença (inicializados como null para carregar em branco)
  confrades: number | null = null;
  consorcias: number | null = null;
  aspirantes: number | null = null;
  visitantes: number | null = null;

  // Lançamentos e transferências disponíveis para associação
  //itensLancamentos: ItemLancamentoSelecao[] = [];
  // Lançamentos agrupados por bloco para associação
  itensReceitas: ItemLancamentoSelecao[] = [];
  itensDespesas: ItemLancamentoSelecao[] = [];
  itensTransferencias: ItemLancamentoSelecao[] = [];

  // Bens Materiais Distribuídos (Linhas 31, 32 e 33 -> IDs 50, 51 e 52)
  cestasBasicasKg: number | null = null;
  roupasCalcadosUnid: number | null = null;
  outrosBensMateriais: number | null = null;

  // Mantém os valores das categorias caso esteja em modo de edição
  private valoresCategoriasExistentes: { [categoriaId: number]: number } = {};

  async ngOnInit(): Promise<void> {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.idEdicao = Number(idParam);
      await this.carregarDadosEdicao(this.idEdicao);
    } else {
      await this.sugerirProximoNumeroAta();
    }

    if (this.numeroAta) {
      await this.atualizarSaldoAnteriorAutomatico(this.numeroAta);
    }

    await this.carregarLancamentosDisponiveis();
    this.cdr.detectChanges();
  }

  private async sugerirProximoNumeroAta(): Promise<void> {
    const ultimoLivro = await db.livros_caixas.orderBy('id').last();
    this.numeroAta = ultimoLivro && ultimoLivro.id ? ultimoLivro.id + 1 : 1;
  }

  private async carregarDadosEdicao(id: number): Promise<void> {
    const livro = await db.livros_caixas.get(id);
    if (livro) {
      this.numeroAta = livro.id ?? id;
      if (livro.dataReuniao) {
        const [dataPart, horaPart] = livro.dataReuniao.split('T');
        this.dataIso = dataPart;
        this.horaIso = horaPart ? horaPart.substring(0, 5) : '00:00';
      }
      this.familiasAjudaMaterial = livro.familiasAjudaMaterial || null;
      this.familiasAjudaEspiritual = livro.familiasAjudaEspiritual || null;
      this.totalPessoasAssistidas = livro.totalPessoasAssistidas || null;

      this.confrades = livro.confrades || null;
      this.consorcias = livro.consorcias || null;
      this.aspirantes = livro.aspirantes || null;
      this.visitantes = livro.visitantes || null;

      this.valoresCategoriasExistentes = livro.valoresCategorias || {};
      this.cestasBasicasKg = this.valoresCategoriasExistentes[50] || null;
      this.roupasCalcadosUnid = this.valoresCategoriasExistentes[51] || null;
      this.outrosBensMateriais = this.valoresCategoriasExistentes[52] || null;
    }
  }

  async aoAlterarNumeroAta(): Promise<void> {
    if (this.numeroAta && this.numeroAta > 0) {
      await this.atualizarSaldoAnteriorAutomatico(Number(this.numeroAta));
      this.cdr.detectChanges();
    }
  }

  private async atualizarSaldoAnteriorAutomatico(numeroAtaAtual: number): Promise<void> {
    const atasAnteriores = await db.livros_caixas
      .where('id')
      .below(numeroAtaAtual)
      .sortBy('id');

    if (atasAnteriores.length > 0) {
      this.possuiAtaAnterior = true;
      const ataAnterior = atasAnteriores[atasAnteriores.length - 1];
      const versaoAnterior = (ataAnterior.versaoLivro || 'v1').toLowerCase();
      const saldoCentavos = versaoAnterior === 'v2'
        ? (ataAnterior.valoresCategorias?.[73] ?? ataAnterior.valoresCategorias?.[48] ?? 0)
        : (ataAnterior.valoresCategorias?.[48] ?? ataAnterior.valoresCategorias?.[73] ?? 0);

      this.saldoAnteriorReais = (saldoCentavos / 100).toFixed(2).replace('.', ',');
    } else {
      this.possuiAtaAnterior = false;
      const saldoSalvo = this.valoresCategoriasExistentes[20] || 0;
      this.saldoAnteriorReais = saldoSalvo > 0
        ? (saldoSalvo / 100).toFixed(2).replace('.', ',')
        : '';
    }
  }

  private converterReaisParaCentavos(valorTexto: string): number {
    if (!valorTexto) return 0;
    const limpo = valorTexto.toString().replace(/\./g, '').replace(',', '.').trim();
    const numero = parseFloat(limpo);
    return isNaN(numero) ? 0 : Math.round(numero * 100);
  }

  private async carregarLancamentosDisponiveis(): Promise<void> {
    const [todasCategorias, todosLancamentos, todasContas] = await Promise.all([
      db.categorias.toArray(),
      db.lancamentos.toArray(),
      db.contas.toArray()
    ]);

    const versaoAtual = this.configService.obterVersaoLivro().toLowerCase();
    const mapaCategorias = new Map<number, { titulo: string; positivo: boolean }>();

    for (const cat of todasCategorias) {
      if (cat.id !== undefined) {
        const titulo = versaoAtual === 'v2' && cat.titulo_dois ? cat.titulo_dois : cat.titulo;
        mapaCategorias.set(cat.id, {
          titulo,
          positivo: cat.positivo === true
        });
      }
    }

    const mapaContas = new Map<number, string>();
    for (const conta of todasContas) {
      if (conta.id !== undefined) {
        mapaContas.set(conta.id, conta.titulo);
      }
    }

    const filtrados = todosLancamentos.filter(l => {
      const ataId = l.ata_livro_caixa_id;
      const semVinculo = ataId === null || ataId === undefined;
      const pertenceAEsteLivro = this.idEdicao !== null && Number(ataId) === this.idEdicao;
      return semVinculo || pertenceAEsteLivro;
    });

    filtrados.sort((a, b) => (b.datahorario || '').localeCompare(a.datahorario || ''));

    this.itensReceitas = [];
    this.itensDespesas = [];
    this.itensTransferencias = [];

    for (const lanc of filtrados) {
      const selecionado = this.idEdicao !== null && Number(lanc.ata_livro_caixa_id) === this.idEdicao;
      const ehTransferencia = lanc.destino_conta_id !== null && lanc.destino_conta_id !== undefined;

      if (ehTransferencia) {
        const nomeOrigem = mapaContas.get(Number(lanc.origem_conta_id)) || 'Conta origem';
        const nomeDestino = mapaContas.get(Number(lanc.destino_conta_id)) || 'Conta destino';

        this.itensTransferencias.push({
          lancamento: lanc,
          selecionado,
          nomeCategoria: `${nomeOrigem} → ${nomeDestino}`
        });
        continue;
      }

      const infoCat = lanc.categoria_id ? mapaCategorias.get(Number(lanc.categoria_id)) : undefined;
      const item: ItemLancamentoSelecao = {
        lancamento: lanc,
        selecionado,
        nomeCategoria: infoCat ? infoCat.titulo : 'Sem categoria'
      };

      const ehReceita = infoCat ? infoCat.positivo : (lanc.origem_montante > 0);
      if (ehReceita) {
        this.itensReceitas.push(item);
      } else {
        this.itensDespesas.push(item);
      }
    }
  }

  get todosItensLancamentos(): ItemLancamentoSelecao[] {
    return [...this.itensReceitas, ...this.itensDespesas, ...this.itensTransferencias];
  }

  get totalLancamentosDisponiveis(): number {
    return this.todosItensLancamentos.length;
  }

  get totalLancamentosSelecionados(): number {
    return this.todosItensLancamentos.filter(item => item.selecionado).length;
  }

  alternarTodosLancamentos(selecionar: boolean): void {
    for (const item of this.todosItensLancamentos) {
      item.selecionado = selecionar;
    }
  }

  // Getters calculados dinamicamente
  get totalFamiliasAssistidas(): number {
    return (Number(this.familiasAjudaMaterial) || 0) + (Number(this.familiasAjudaEspiritual) || 0);
  }

  get totalPresentesReuniao(): number {
    return (
      (Number(this.confrades) || 0) +
      (Number(this.consorcias) || 0) +
      (Number(this.aspirantes) || 0) +
      (Number(this.visitantes) || 0)
    );
  }

  async salvar(): Promise<void> {
    if (this.isSalvando) return;

    if (!this.numeroAta || this.numeroAta <= 0) {
      alert('Por favor, informe um Número de Ata válido.');
      return;
    }

    if (!this.dataIso || !this.horaIso) {
      alert('Por favor, informe a data e hora da reunião.');
      return;
    }

    this.isSalvando = true;

    try {
      const numeroAtaNumerico = Number(this.numeroAta);

      if (!this.idEdicao) {
        const ataExistente = await db.livros_caixas.get(numeroAtaNumerico);
        if (ataExistente) {
          alert(`Já existe um registro cadastrado para a Ata nº ${numeroAtaNumerico}.`);
          this.isSalvando = false;
          return;
        }
      }

      if (this.possuiAtaAnterior) {
        await this.atualizarSaldoAnteriorAutomatico(numeroAtaNumerico);
      }

      const saldoAnteriorCentavos = this.converterReaisParaCentavos(this.saldoAnteriorReais);

      const valoresAtualizados: { [categoriaId: number]: number } = {
        ...this.valoresCategoriasExistentes,
        20: saldoAnteriorCentavos, // 14-Saldo anterior
        50: Number(this.cestasBasicasKg) || 0,
        51: Number(this.roupasCalcadosUnid) || 0,
        52: Number(this.outrosBensMateriais) || 0
      };

      if (!this.idEdicao) {
        valoresAtualizados[21] = saldoAnteriorCentavos;
        valoresAtualizados[72] = saldoAnteriorCentavos;
        valoresAtualizados[48] = saldoAnteriorCentavos;
        valoresAtualizados[73] = saldoAnteriorCentavos;
      }

      const versaoAtual = this.configService.obterVersaoLivro().toLowerCase();
      const dataReuniaoIso = `${this.dataIso}T${this.horaIso}:00`;
      const agoraIso = new Date().toISOString();

      const registro: LivroCaixa = {
        id: numeroAtaNumerico,
        dataReuniao: dataReuniaoIso,
        familiasAjudaMaterial: Number(this.familiasAjudaMaterial) || 0,
        familiasAjudaEspiritual: Number(this.familiasAjudaEspiritual) || 0,
        totalPessoasAssistidas: Number(this.totalPessoasAssistidas) || 0,
        confrades: Number(this.confrades) || 0,
        consorcias: Number(this.consorcias) || 0,
        aspirantes: Number(this.aspirantes) || 0,
        visitantes: Number(this.visitantes) || 0,
        valoresCategorias: valoresAtualizados,
        versaoLivro: versaoAtual,
        sincronizado: false,
        updatedAt: agoraIso
      };

      await db.transaction('rw', [db.livros_caixas, db.lancamentos], async () => {
        // 1. Salva ou atualiza a Ata
        await db.livros_caixas.put(registro);

        // 2. Atualiza o vínculo ata_livro_caixa_id nos lançamentos e transferências listados
        for (const item of this.todosItensLancamentos) {
          if (item.lancamento.id === undefined) continue;

          const novoVinculo = item.selecionado ? numeroAtaNumerico : null;
          const vinculoAtual = item.lancamento.ata_livro_caixa_id ?? null;

          if (novoVinculo !== vinculoAtual) {
            await db.lancamentos.update(item.lancamento.id, {
              ata_livro_caixa_id: novoVinculo,
              sincronizado: false,
              updatedAt: agoraIso
            });
          }
        }
      });

      // Redireciona direto para a apuração/detalhamento da Ata para visualizar os cálculos
      this.router.navigate(['/caixa', numeroAtaNumerico]);
    } catch (error) {
      console.error('Erro ao salvar Ata do Livro Caixa:', error);
      alert('Ocorreu um erro ao salvar a Ata.');
    } finally {
      this.isSalvando = false;
    }
  }

  cancelar(): void {
    this.location.back();
  }
}
