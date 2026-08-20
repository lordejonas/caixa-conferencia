export interface Lancamento {
  id?: number; // Auto-incrementado localmente
  datahorario: string; // Formato ISO 8601 (ex: '2026-08-20T11:37:18.000Z')
  favorecido_id?: number | null;
  categoria_id?: number | null;
  origem_conta_id: number;
  destino_conta_id?: number | null;
  origem_montante: number; // Padrão: 0
  destino_montante: number; // Padrão: 0
  nota?: string | null;
  arredondamento_id?: number | null;
  ata_livro_caixa_id?: number | null;

  // Atributos para controle de sincronização
  firebaseId?: string;
  sincronizado?: boolean;
  updatedAt?: string;
}
