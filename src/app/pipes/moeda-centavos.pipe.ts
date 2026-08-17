import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'moedaCentavos',
  standalone: true
})
export class MoedaCentavosPipe implements PipeTransform {
  transform(valorCentavos: number | null | undefined): string {
    if (valorCentavos == null || isNaN(valorCentavos)) return '0,00 R$';

    const valorDecimal = valorCentavos / 100;
    const partes = valorDecimal.toFixed(2).split('.');
    let inteiro = partes[0];
    const decimal = partes[1];

    // Separa os milhares por espaço
    inteiro = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    return `${inteiro},${decimal} R$`;
  }
}
