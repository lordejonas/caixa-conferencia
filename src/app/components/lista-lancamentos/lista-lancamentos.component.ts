import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ItemExtrato {
  id: number;
  datahorario: string | Date;
  nomeContaOrigem: string;
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
  @Input() carregando: boolean = false;
  @Input() mensagemVazia: string = 'Nenhum lançamento encontrado.';

  // Retorna a classe FontAwesome adequada para cada fluxo
  getIconeClass(item: ItemExtrato): string {
    if (item.tipoMovimentacao === 'transferencia') {
      return 'fa-solid fa-right-left'; // Seta dupla para transferência
    }

    // Seta para baixo (entrada) e seta para cima (saída)
    return item.montante < 0 ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down';
  }


  formatarMoedaCustom(valor: number): string {
    const valorAbsoluto = Math.abs(valor);
    const partes = valorAbsoluto.toFixed(2).split('.');
    const inteiroComEspaco = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const centavos = partes[1];
    const prefixo = valor < 0 ? '-' : '';
    return `${prefixo}${inteiroComEspaco},${centavos} R$`;
  }

  formatarDataCustom(dataInput: string | Date): string {
    const data = new Date(dataInput);
    if (isNaN(data.getTime())) return '';

    const anoAtual = new Date().getFullYear();
    const anoData = data.getFullYear();

    const diasSemana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

    const diaSemana = diasSemana[data.getDay()];
    const dia = data.getDate();
    const mes = meses[data.getMonth()];
    const horas = String(data.getHours()).padStart(2, '0');
    const minutos = String(data.getMinutes()).padStart(2, '0');

    if (anoData === anoAtual) {
      return `${diaSemana}, ${dia} de ${mes} ${horas}:${minutos}`;
    } else {
      return `${diaSemana}, ${dia} de ${mes} de ${anoData} ${horas}:${minutos}`;
    }
  }
}
