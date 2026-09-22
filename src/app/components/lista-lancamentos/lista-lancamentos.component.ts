import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ItemExtrato {
  id: number;
  datahorario: string | Date;
  nomeContaOrigem: string;
  nomeContaDestino?: string;
  tipoMovimentacao: 'entrada' | 'saida' | 'transferencia';
  categoriaNome?: string;
  favorecidoNome?: string;
  nota?: string;
  montante: number;
}

@Component({
  selector: 'app-lista-lancamentos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-lancamentos.component.html',
  styleUrls: ['./lista-lancamentos.component.scss']
})
export class ListaLancamentosComponent {
  @Input() lancamentos: ItemExtrato[] = [];
  @Input() carregando = false;
  @Input() mensagemVazia = 'Nenhum lançamento encontrado.';
  @Input() exibirBotaoSaldoAbertura = false;

  @Output() aoClicarSaldoAbertura = new EventEmitter<void>();
  @Output() aoAlterar = new EventEmitter<ItemExtrato>();
  @Output() aoExcluir = new EventEmitter<ItemExtrato>();

  itemSelecionado: ItemExtrato | null = null;
  confirmandoExclusao = false;
  private timerLongPress: any = null;

  iniciarPressionar(item: ItemExtrato): void {
    this.cancelarPressionar();
    this.timerLongPress = setTimeout(() => {
      this.itemSelecionado = item;
      this.confirmandoExclusao = false;
    }, 400);
  }

  cancelarPressionar(): void {
    if (this.timerLongPress) {
      clearTimeout(this.timerLongPress);
      this.timerLongPress = null;
    }
  }

  fecharOpcoes(): void {
    this.itemSelecionado = null;
    this.confirmandoExclusao = false;
  }

  acaoAlterar(): void {
    if (this.itemSelecionado) {
      this.aoAlterar.emit(this.itemSelecionado);
    }
    this.fecharOpcoes();
  }

  /* --- FLUXO DE EXCLUSÃO --- */

  solicitarConfirmacaoExclusao(): void {
    this.confirmandoExclusao = true;
  }

  confirmarExclusao(): void {
    if (this.itemSelecionado) {
      this.aoExcluir.emit(this.itemSelecionado);
    }
    this.fecharOpcoes();
  }

  /* --- MÉTODOS AUXILIARES --- */

  obterDescricaoConta(item: ItemExtrato): string {
    if (item.tipoMovimentacao === 'transferencia' && item.nomeContaDestino) {
      return `${item.nomeContaOrigem} ➔ ${item.nomeContaDestino}`;
    }
    return item.nomeContaOrigem;
  }

  getIconeClass(item: ItemExtrato): string {
    switch (item.tipoMovimentacao) {
      case 'entrada': return 'bi bi-arrow-down-left';  // Sudoeste (Verde)
      case 'saida': return 'bi bi-arrow-up-right';     // Nordeste (Vermelho)
      case 'transferencia': return 'bi bi-arrow-left-right'; // Dupla (Marrom)
      default: return 'bi bi-circle';
    }
  }

  formatarMoedaCustom(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  formatarDataCustom(data: string | Date): string {
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
