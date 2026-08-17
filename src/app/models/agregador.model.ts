export interface Agregador {
  id?: number;
  nome: string;
  icone?: string;
  descricao?: string | null;
  ativo: boolean;
  ordem_listagem: number | null;
  updatedAt?: string;
  firebaseId?: string;
  sincronizado?: boolean;
}
