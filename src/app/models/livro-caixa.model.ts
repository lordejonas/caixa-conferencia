export interface ItemLivroCaixa {
  categoriaId: number;
  titulo: string;       // Preenchido a partir de Categoria.titulo (ou titulo_dois)
  valorCentavos: number; // Saldo totalizado da categoria naquela ata/reunião
}

export interface LivroCaixa {
  id?: number; // Número da Ata (chave primária)
  dataReuniao: string; // Formato ISO (YYYY-MM-DDTHH:mm:00)

  // Assistência
  familiasAjudaMaterial: number;
  familiasAjudaEspiritual: number;
  totalPessoasAssistidas: number;

  // Presença na Reunião
  confrades: number;
  consorcias: number;
  aspirantes: number;
  visitantes: number;

  // Valores associados às categorias (chave: categoria.id -> valor: montante em centavos)
  valoresCategorias: { [categoriaId: number]: number };

  // Metadados de controle e sincronização
  versaoLivro: string; // 'v1' | 'v2'
  sincronizado?: boolean;
  updatedAt?: string;
  firebaseId?: string;
}
