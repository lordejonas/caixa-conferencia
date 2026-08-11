export interface Favorecido {
  id?: number;              // ID local auto-incrementado (Dexie)
  firebaseId?: string;      // ID do documento no Cloud Firestore
  titulo: string;
  ativo: boolean;
  atualizadoEm?: string;     // ISO String da data da última alteração
  sincronizado?: boolean;    // false = pendente | true = sincronizado com Firebase
}

// Configuração da tabela no Dexie (Schema)
// '++id' indica chave primária numérica auto-incrementada
// db.version(1).stores({ favorecidos: '++id, titulo, ativo' });
