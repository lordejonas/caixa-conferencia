import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InternalLayoutComponent } from '../../components/internal-layout/internal-layout.component';
import { MoedaCentavosPipe } from '../../pipes/moeda-centavos.pipe';
import { db } from '../../core/db/app-database'; // Importe seu serviço/instância do Dexie
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
  carregando: boolean = true; // 👈 Estado de carregamento inicial

  constructor(private cdr: ChangeDetectorRef) {} // 👈 Injeta o detector de mudanças

  async ngOnInit(): Promise<void> {
    await this.carregarDadosContas();
  }

  selecionarAba(aba: TipoAba): void {
    this.abaAtiva = aba;
    if (aba === 'contas') {
      this.agregadorSelecionado = null;
      this.contaSelecionadaAviso = null;
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

      // 1. Mapear Agregadores
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

      // 2. Mapear Contas Raiz (sem id_agregador)
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

      // 3. Ordenar por ordem_listagem
      listaGeral.sort((a, b) => a.ordem_listagem - b.ordem_listagem);

      this.itensRaiz = listaGeral;
    } catch (error) {
      console.error('Erro ao carregar contas do IndexedDB:', error);
    } finally {
      this.carregando = false;
      this.cdr.detectChanges(); // 👈 Força o Angular a renderizar os dados atualizados
    }
  }



  // Métodos auxiliares para cálculo dos saldos na classe do componente:
  get saldoLiquido(): number {
    if (!this.itensRaiz) return 0;

    // Soma o saldo de todas as contas onde contabilizar_totais NÃO é null
    return this.extrairContasDaLista().reduce((acc, conta) => {
      if (conta.contabilizar_totais !== null) {
        return acc + (conta.saldo_atual || 0);
      }
      return acc;
    }, 0);
  }

  get saldoBruto(): number {
    if (!this.itensRaiz) return 0;

    // Soma apenas o saldo das contas onde contabilizar_totais === true
    return this.extrairContasDaLista().reduce((acc, conta) => {
      if (conta.contabilizar_totais === true) {
        return acc + (conta.saldo_atual || 0);
      }
      return acc;
    }, 0);
  }

  // Método auxiliar interno atualizado
  private extrairContasDaLista(): Conta[] {
    if (this.agregadorSelecionado) {
      return this.agregadorSelecionado.contasFilhas || [];
    }

    const contas: Conta[] = [];

    if (this.itensRaiz) {
      for (const item of this.itensRaiz) {
        if (item.type === 'conta') {
          // 🟢 Asserção explícita indicando ao TS que neste ponto o item representa uma Conta
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
      this.contaSelecionadaAviso = `Lançamentos em desenvolvimento para "${item.titulo}"...`;
    }
  }

  voltarParaRaizAgregador(): void {
    this.agregadorSelecionado = null;
    this.contaSelecionadaAviso = null;
  }
}
