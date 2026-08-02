import { Injectable } from '@angular/core';

export interface UnidadeVicentina {
  tipoUnidade: 'Conferência' | 'Conselho Particular' | 'Conselho Central' | '';
  nomeUnidade: string;
  local?: string;
  dataFundacao?: string;
  dataAgregacao?: string;
  codigo?: string;
  conselhoParticular?: string;
  conselhoCentral?: string;
  conselhoMetropolitano?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UnidadeService {
  // Armazena a única unidade em memória
  private unidade: UnidadeVicentina | null = null;

  salvar(unidade: UnidadeVicentina): void {
    this.unidade = { ...unidade };
    console.log('Unidade salva/atualizada em memória:', this.unidade);
  }

  obterUnidade(): UnidadeVicentina | null {
    return this.unidade;
  }

  existeUnidade(): boolean {
    return this.unidade !== null;
  }
}
