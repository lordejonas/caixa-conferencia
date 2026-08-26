import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dataLancamento',
  standalone: true
})
export class DataLancamentoPipe implements PipeTransform {
  transform(dataIso: string | undefined | null): string {
    if (!dataIso) return '';

    const data = new Date(dataIso);
    if (isNaN(data.getTime())) return '';

    const anoAtual = new Date().getFullYear();
    const anoData = data.getFullYear();

    // Obtém o dia da semana abreviado em português (ex: sab)
    const diaSemana = data
      .toLocaleDateString('pt-BR', { weekday: 'short' })
      .replace('.', '')
      .toLowerCase();

    const dia = data.getDate();

    // Obtém o mês abreviado em português (ex: ago)
    const mes = data
      .toLocaleDateString('pt-BR', { month: 'short' })
      .replace('.', '')
      .toLowerCase();

    const hora = String(data.getHours()).padStart(2, '0');
    const minutos = String(data.getMinutes()).padStart(2, '0');

    if (anoData === anoAtual) {
      return `${diaSemana}, ${dia} de ${mes} ${hora}:${minutos}`;
    }

    return `${diaSemana}, ${dia} de ${mes} de ${anoData} ${hora}:${minutos}`;
  }
}
