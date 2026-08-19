export interface Agregador {
  id?: number;
  nome: string;
  icone?: string;
  descricao?: string | null;
  ativo: boolean;
  contabilizar_totais?: boolean | null;
  ordem_listagem: number | null;
  updatedAt?: string;
  firebaseId?: string;
  sincronizado?: boolean;
}
