import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function dataValidaValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    if (!valor) {
      return null; // Campo opcional
    }

    // Aceita apenas formato DD/MM/AAAA completo
    const regexData = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = valor.match(regexData);

    if (!match) {
      return { dataInexistente: true };
    }

    const dia = parseInt(match[1], 10);
    const mes = parseInt(match[2], 10) - 1; // Mês em JS vai de 0 a 11
    const ano = parseInt(match[3], 10);

    const dataObjeto = new Date(ano, mes, dia);

    if (
      dataObjeto.getFullYear() === ano &&
      dataObjeto.getMonth() === mes &&
      dataObjeto.getDate() === dia
    ) {
      return null; // Data válida
    }

    return { dataInexistente: true };
  };
}
