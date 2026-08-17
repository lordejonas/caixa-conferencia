export interface Conta {
  id?: number;
  titulo: string;
  icone?: string;
  saldo_atual: number | null;
  ativo: boolean;
  id_conta_arredondamento: number | null;
  id_agregador: number | null;
  minimo_arredondamento: number;
  ordem_listagem: number | null;
  updatedAt?: string;
  firebaseId?: string;
  sincronizado?: boolean;
}
