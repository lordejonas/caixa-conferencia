export interface Categoria {
  id?: number;
  titulo: string;
  titulo_dois: string;
  pai: number | null;
  ativo: boolean;
  positivo: boolean;
  auto: boolean;
  decimavel: boolean;
  versao_livro: string;
  permite_descricao_livre : boolean;
  descricao: string | null;
  updatedAt?: string;
}

// Interface auxiliar para renderização hierárquica na tela
export interface CategoriaNode extends Categoria {
  expanded?: boolean;
  filhas?: Categoria[];
}
