import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InternalLayoutComponent } from '../../components/internal-layout/internal-layout.component';
import { ListaLancamentosComponent, ItemExtrato } from '../../components/lista-lancamentos/lista-lancamentos.component';
import { MoedaCentavosPipe } from '../../pipes/moeda-centavos.pipe';
import { db } from '../../core/db/app-database';
import { Conta } from '../../models/conta.model';
import { Agregador } from '../../models/agregador.model';
import { LancamentoService } from '../../core/service/lancamento.service';

type TipoAba = 'contas' | 'lancamentos';

export interface ItemListaContas {
  type: 'conta' | 'agregador';
  id: number;
  titulo: string;
  icone?: string;
  saldo_atual: number;
  ordem_listagem: number;
  contasFilhas?: Conta[];
  rawItem: Conta | Agregador;
}

@Component({
  selector: 'app-lancamentos',
  standalone: true,
  imports: [
    CommonModule,
    InternalLayoutComponent,
    ListaLancamentosComponent,
    MoedaCentavosPipe,
    RouterLink
  ],
  templateUrl: './lancamentos.component.html',
  styleUrl: './lancamentos.component.scss'
})
export class LancamentosComponent implements OnInit {
  abaAtiva: TipoAba = 'contas';

  itensRaiz: ItemListaContas[] = [];
  agregadorSelecionado: ItemListaContas | null = null;
  contaSelecionadaAviso: string | null = null;
  carregando: boolean = true;

  // Propriedades para a aba Lançamentos
  todosLancamentos: ItemExtrato[] = [];
  carregandoLancamentos: boolean = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private lancamentoService: LancamentoService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.carregarDadosContas();
  }

  async selecionarAba(aba: TipoAba): Promise<void> {
    this.abaAtiva = aba;
    if (aba === 'contas') {
      this.agregadorSelecionado = null;
      this.contaSelecionadaAviso = null;
    } else if (aba === 'lancamentos' && this.todosLancamentos.length === 0) {
      await this.carregarTodosLancamentos();
    }
  }

  /**
   * Carrega e estrutura as Contas e Agregadores
   */
  async carregarDadosContas(): Promise<void> {
    try {
      this.carregando = true;

      const contas: Conta[] = await db.contas.toArray();
      const agregadores: Agregador[] = await db.agregadores.toArray();

      const listaGeral: ItemListaContas[] = [];

      for (const ag of agregadores) {
        const contasDoAgregador = contas.filter(c => c.id_agregador === ag.id);

        const saldoTotalAgregador = contasDoAgregador.reduce(
          (acc, c) => acc + (c.saldo_atual || 0),
          0
        );

        contasDoAgregador.sort((a, b) => (a.ordem_listagem || 0) - (b.ordem_listagem || 0));

        listaGeral.push({
          type: 'agregador',
          id: ag.id!,
          titulo: ag.nome,
          icone: ag.icone || '📁',
          saldo_atual: saldoTotalAgregador,
          ordem_listagem: ag.ordem_listagem || 0,
          contasFilhas: contasDoAgregador,
          rawItem: ag
        });
      }

      const contasRaiz = contas.filter(c => !c.id_agregador);
      for (const c of contasRaiz) {
        listaGeral.push({
          type: 'conta',
          id: c.id!,
          titulo: c.titulo,
          icone: c.icone || '🏦',
          saldo_atual: c.saldo_atual || 0,
          ordem_listagem: c.ordem_listagem || 0,
          rawItem: c
        });
      }

      listaGeral.sort((a, b) => a.ordem_listagem - b.ordem_listagem);

      this.itensRaiz = listaGeral;
    } catch (error) {
      console.error('Erro ao carregar contas do IndexedDB:', error);
    } finally {
      this.carregando = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Carrega a lista completa para a aba Lançamentos
   */
  async carregarTodosLancamentos(): Promise<void> {
    try {
      this.carregandoLancamentos = true;

      const lancamentosBrutos = await db.lancamentos.toArray();

      const todasContas = await db.contas.toArray();
      const mapaContas = new Map<number, string>(todasContas.map(c => [c.id!, c.titulo]));

      const categorias = await db.categorias.toArray();
      const mapaCategorias = new Map<number, string>(categorias.map(c => [c.id!, c.titulo]));

      const favorecidos = await db.favorecidos.toArray();
      const mapaFavorecidos = new Map<number, string>(favorecidos.map(f => [f.id!, f.titulo]));

      lancamentosBrutos.sort(
        (a, b) => new Date(b.datahorario).getTime() - new Date(a.datahorario).getTime()
      );

      this.todosLancamentos = lancamentosBrutos.map((l) => {
        const orig = l.origem_montante || 0;
        const dest = l.destino_montante || 0;

        const ehTransferencia = (orig !== 0 && dest !== 0 && (orig === -dest)) || !!l.destino_conta_id;

        let montanteEmCentavos = orig || dest;
        let tipoMov: 'entrada' | 'saida' | 'transferencia' = 'entrada';

        if (ehTransferencia) {
          tipoMov = 'transferencia';
        } else {
          tipoMov = montanteEmCentavos < 0 ? 'saida' : 'entrada';
        }

        const nomeOrigem = mapaContas.get(l.origem_conta_id) || 'Sem Conta';
        const nomeDestino = l.destino_conta_id ? mapaContas.get(l.destino_conta_id) : undefined;

        return {
          id: l.id!,
          datahorario: l.datahorario,
          nomeContaOrigem: nomeOrigem,
          nomeContaDestino: nomeDestino,
          tipoMovimentacao: tipoMov,
          categoriaNome: l.categoria_id ? mapaCategorias.get(l.categoria_id) : undefined,
          favorecidoNome: l.favorecido_id ? mapaFavorecidos.get(l.favorecido_id) : undefined,
          nota: l.nota || undefined,
          montante: montanteEmCentavos / 100
        };
      });
    } catch (error) {
      console.error('Erro ao carregar lançamentos:', error);
    } finally {
      this.carregandoLancamentos = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Calcula o saldo total baseado apenas nos lançamentos visíveis/listados em tela.
   * Transferências somam 0 no geral (pois uma conta entra e a outra sai).
   * Lançamentos comuns somam entradas (+ / receita) e saídas (- / despesa).
   */
  get saldoTotalLancamentos(): number {
    if (!this.todosLancamentos || this.todosLancamentos.length === 0) return 0;

    const totalEmReais = this.todosLancamentos.reduce((acc, item) => {
      if (item.tipoMovimentacao === 'transferencia') {
        return acc; // Transferência não altera o saldo global
      }
      return acc + (item.montante || 0);
    }, 0);

    // Multiplica por 100 para converter em centavos antes do Pipe MoedaCentavos
    return Math.round(totalEmReais * 100);
  }

  get saldoLiquido(): number {
    if (!this.itensRaiz) return 0;
    return this.extrairContasDaLista().reduce((acc, conta) => {
      if (conta.contabilizar_totais !== null) {
        return acc + (conta.saldo_atual || 0);
      }
      return acc;
    }, 0);
  }

  get saldoBruto(): number {
    if (!this.itensRaiz) return 0;
    return this.extrairContasDaLista().reduce((acc, conta) => {
      if (conta.contabilizar_totais === true) {
        return acc + (conta.saldo_atual || 0);
      }
      return acc;
    }, 0);
  }

  obterClasseSaldo(valor: number | null | undefined): string {
    if (valor === null || valor === undefined || valor === 0) {
      return 'saldo-zero';
    }
    return valor > 0 ? 'saldo-positivo' : 'saldo-negativo';
  }

  private extrairContasDaLista(): Conta[] {
    if (this.agregadorSelecionado) {
      return this.agregadorSelecionado.contasFilhas || [];
    }

    const contas: Conta[] = [];
    if (this.itensRaiz) {
      for (const item of this.itensRaiz) {
        if (item.type === 'conta') {
          contas.push(item as unknown as Conta);
        } else if (item.type === 'agregador' && item.contasFilhas) {
          contas.push(...item.contasFilhas);
        }
      }
    }
    return contas;
  }

  onClickItem(item: ItemListaContas | Conta): void {
    if ('type' in item && item.type === 'agregador') {
      this.agregadorSelecionado = item;
      this.contaSelecionadaAviso = null;
    } else {
      this.router.navigate(['/contas', item.id, 'extrato']);
    }
  }

  voltarParaRaizAgregador(): void {
    this.agregadorSelecionado = null;
    this.contaSelecionadaAviso = null;
  }

  async excluirLancamento(item: ItemExtrato): Promise<void> {
    try {
      await this.lancamentoService.excluirLancamento(item.id);
      await this.carregarTodosLancamentos();
      await this.carregarDadosContas();
    } catch (error) {
      console.error('Erro ao excluir lançamento:', error);
      alert('Ocorreu um erro ao tentar excluir o lançamento.');
    }
  }

  alterarLancamento(item: ItemExtrato): void {
    if (item.tipoMovimentacao === 'transferencia') {
      this.router.navigate(['/lancamentos/transferencia/editar', item.id]);
    } else {
      this.router.navigate(['/lancamentos/editar', item.id]);
    }
  }
}
