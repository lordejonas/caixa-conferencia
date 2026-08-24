export interface Categoria {
  id?: number;
  titulo: string;
  titulo_dois: string;
  pai: number | null;
  ativo: boolean;
  positivo: boolean;
  auto: boolean;
  decimavel: boolean;
  descricao: string | null;
  updatedAt?: string;
}

// Interface auxiliar para renderização hierárquica na tela
export interface CategoriaNode extends Categoria {
  expanded?: boolean;
  filhas?: Categoria[];
}
