export interface Categoria {
  id?: number;
  title: string;
  pai: number | null;
  ativo: boolean;
  positivo: boolean;
  auto: boolean;
  descricao: string | null;
  updatedAt?: string;
}

// Interface auxiliar para renderização hierárquica na tela
export interface CategoriaNode extends Categoria {
  expanded?: boolean;
  filhas?: Categoria[];
}
