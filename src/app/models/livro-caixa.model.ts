export interface DadosIniciais {
  numeroAta: number;
  dataReuniao: string;
  saldoAnterior: number;
  decimasAcumuladas: number;
  repasseDecimas: number;
  outrasContribuicoes: number;
  repasseContribuicoes: number;
}

// Representa a estrutura de cada lançamento (com suporte a descrições dinâmicas de "Outros")
export interface ItemLancamento {
  valor: number;
  descricaoCustomizada?: string;
}

export interface Receitas {
  vf1?: number;  // Coleta na reunião
  vf2?: number;  // Subscritores
  vf3?: number;  // Doações
  vf4?: number;  // Eventos/Bazar
  vf5?: number;  // Outras sujeitas a décimas
  vf7?: number;  // Subvenção oficial
  vf8?: number;  // Coleta Ozanam / Solidariedade
  vf9?: number;  // União Fraternal
  vf10?: ItemLancamento; // Outros 1
  vf11?: ItemLancamento; // Outros 2
  vf12?: number; // Recebimentos p/ repasse
}

export interface Despesas {
  vf16?: number; // Cestas básicas
  vf17?: number; // Moradia
  vf18?: number; // Contas (água/luz)
  vf19?: number; // Obras especiais
  vf20?: number; // União Fraternal (Saída)
  vf21?: ItemLancamento; // Outros 1
  vf22?: ItemLancamento; // Outros 2
  vf23?: number; // Despesas administrativas
  vf25?: ItemLancamento; // Outros 3
}

export interface TotaisCaixa {
  subtotalBaseDecima: number; // vf6
  somaReceitaSemana: number;  // vf13
  balancoTotalReceita: number; // vf15
  decimasPagas: number;       // vf24 (10% sobre vf6)
  repasseOzanam: number;      // vf26 (igual a vf8)
  repasseLinha12: number;     // vf27 (igual a vf12)
  somaDespesaSemana: number;  // vf28
  saldoFinalSemana: number;   // vf29
  balancoFinal: number;       // vf30
  decimasEnviarCP: number;    // vf34
  outrosRepassesCP: number;   // vf35
  totalRecursosTesouraria: number; // vf36
}

export interface LivroCaixa {
  dadosIniciais: DadosIniciais;
  receitas: Receitas;
  despesas: Despesas;
}
