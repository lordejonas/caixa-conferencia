import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InternalLayoutComponent } from '../../components/internal-layout/internal-layout.component';
import { ListaLancamentosComponent, ItemExtrato } from '../../components/lista-lancamentos/lista-lancamentos.component';
import { MoedaCentavosPipe } from '../../pipes/moeda-centavos.pipe';
import { db } from '../../core/db/app-database';
import { Conta } from '../../models/conta.model';
import { Agregador } from '../../models/agregador.model';

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
    private router: Router
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

      const todasContas = await db.contas.toArray();
      const mapaContas = new Map<number, string>(todasContas.map(c => [c.id!, c.titulo]));

      const categorias = await db.categorias.toArray();
      const mapaCategorias = new Map<number, string>(categorias.map(c => [c.id!, c.titulo]));

      const favorecidos = await db.favorecidos.toArray();
      const mapaFavorecidos = new Map<number, string>(favorecidos.map(f => [f.id!, f.titulo]));

      const lancamentosBrutos = await db.lancamentos.toArray();

      lancamentosBrutos.sort(
        (a, b) => new Date(b.datahorario).getTime() - new Date(a.datahorario).getTime()
      );

      this.todosLancamentos = lancamentosBrutos.map((l) => {
        const ehTransferencia = l.origem_conta_id !== null && l.destino_conta_id !== null;

        let tipoMov: 'entrada' | 'saida' | 'transferencia' = 'entrada';
        let montanteCalculado = l.origem_montante || l.destino_montante || 0;

        if (ehTransferencia) {
          tipoMov = 'transferencia';
        } else if (l.origem_conta_id !== null) {
          tipoMov = montanteCalculado >= 0 ? 'entrada' : 'saida';
        } else {
          tipoMov = montanteCalculado >= 0 ? 'entrada' : 'saida';
        }

        const nomeOrigem = l.origem_conta_id
          ? mapaContas.get(l.origem_conta_id) || 'Conta Removida'
          : 'Sem Origem';

        return {
          id: l.id!,
          datahorario: l.datahorario,
          nomeContaOrigem: nomeOrigem,
          tipoMovimentacao: tipoMov,
          categoriaNome: l.categoria_id ? mapaCategorias.get(l.categoria_id) : undefined,
          favorecidoNome: l.favorecido_id ? mapaFavorecidos.get(l.favorecido_id) : undefined,
          nota: l.nota || undefined,
          montante: montanteCalculado
        };
      });
    } catch (error) {
      console.error('Erro ao carregar lançamentos:', error);
    } finally {
      this.carregandoLancamentos = false;
      this.cdr.detectChanges();
    }
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
      // Navega para o extrato da conta clicada
      this.router.navigate(['/contas', item.id, 'extrato']);
    }
  }

  voltarParaRaizAgregador(): void {
    this.agregadorSelecionado = null;
    this.contaSelecionadaAviso = null;
  }
}
