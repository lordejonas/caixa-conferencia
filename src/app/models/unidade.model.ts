export interface UnidadeLocal {
  id?: string;
  tipoUnidade: string;
  nomeUnidade: string;
  local?: string;
  dataFundacao?: string;
  dataAgregacao?: string;
  codigo?: string;
  conselhoParticular?: string;
  conselhoCentral?: string;
  conselhoMetropolitano?: string;
  updatedAt: number;
  statusSync: 'PENDENTE' | 'SINCRONIZADO';
}
