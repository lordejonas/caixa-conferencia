import { Categoria } from '../models/categoria.model';

export const DEFAULT_CATEGORIAS: Omit<Categoria, 'id'>[] = [
  {
    titulo: '00-Saldo de Abertura',
    titulo_dois: '00-Saldo de Abertura',
    pai: null,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: false,
    descricao: 'Primeiro valor inserido na conta'
  },
  {
    titulo: '01-Coleta reunião',
    titulo_dois: '01-Coleta reunião',
    pai: null,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: true,
    descricao: null
  },
  {
    titulo: '02-Subscritores e Benfeitores',
    titulo_dois: '02-Subscritores e Benfeitores',
    pai: null,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: true,
    descricao: null
  },
  {
    titulo: '03-Doações Recebidas',
    titulo_dois: '03-Doações Recebidas',
    pai: null,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: true,
    descricao: null
  },
  {
    titulo: '03.1-Porta Igreja',
    titulo_dois: '03.1-Porta Igreja',
    pai: 4,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: true,
    descricao: null
  },
  {
    titulo: '03.2-Juros Poupança',
    titulo_dois: '03.2-Juros Poupança',
    pai: 4,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: true,
    descricao: null
  },
  {
    titulo: '03.3-Doações Avulsas',
    titulo_dois: '03.3-Doações Avulsas',
    pai: 4,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: true,
    descricao: null
  },
  {
    titulo: '04-Receitas Líquidas com Eventos',
    titulo_dois: '04-Receitas Líquidas com Eventos',
    pai: null,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: true,
    descricao: 'Rifa, Bazar, almoços etc.'
  },
  {
    titulo: '05-Outras Receitas Sujeitas a Décimas',
    titulo_dois: '05-Outras Receitas Sujeitas a Décimas',
    pai: null,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: true,
    descricao: null
  },
  {
    titulo: '06-Subtotal',
    titulo_dois: '06-Subtotal',
    pai: null,
    ativo: true,
    positivo: true,
    auto: true,
    decimavel: false,
    descricao: 'Valor base para cálculo da Décima'
  },
  {
    titulo: '07-Subvenções Oficiais',
    titulo_dois: '07-Subvenções Oficiais',
    pai: null,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '08-Contribuição da Solidariedade e Coleta de Ozanam',
    titulo_dois: '08-Contribuição da Solidariedade e Coleta de Ozanam',
    pai: null,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '08.1-Contribuição da Solidariedade',
    titulo_dois: '08.1-Contribuição da Solidariedade',
    pai: 12,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '08.2-Coleta de Ozanam',
    titulo_dois: '08.2-Coleta de Ozanam',
    pai: 12,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '09-União Fraternal',
    titulo_dois: '09-União Fraternal',
    pai: null,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: false,
    descricao: 'Contribuições Recebidas de Unidades Vicentinas'
  },
  {
    titulo: '10-Outras',
    titulo_dois: '10-Outras',
    pai: null,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '11-Recebimentos para Repasse CMB',
    titulo_dois: '11-Recebimentos para Repasse CMB',
    pai: null,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '12-Recebimentos para Repasses',
    titulo_dois: '12-Recebimentos para Repasses',
    pai: null,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '13-Total dos Recebimentos',
    titulo_dois: '13-Total dos Recebimentos',
    pai: null,
    ativo: true,
    positivo: true,
    auto: true,
    decimavel: false,
    descricao: 'Somas da linha 06 a linha 12'
  },
  {
    titulo: '14-Saldo final da semana anterior',
    titulo_dois: '14-Saldo final da semana anterior',
    pai: null,
    ativo: true,
    positivo: true,
    auto: true,
    decimavel: false,
    descricao: 'Igual ao Saldo final do MÊS anterior'
  },
  {
    titulo: '15-Balanço Receitas',
    titulo_dois: '15-Balanço Receitas',
    pai: null,
    ativo: true,
    positivo: true,
    auto: true,
    decimavel: false,
    descricao: 'soma da linha 13 + linha 14'
  },
  {
    titulo: '16-Despesas com Cestas Básicas',
    titulo_dois: '16-Despesas com Cestas Básicas',
    pai: null,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: 'alimentos, produto de higiene e limpeza  etc.'
  },
  {
    titulo: '16.1-Despesas básicas',
    titulo_dois: '16.1-Despesas básicas',
    pai: 22,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '16.2-Medicamento',
    titulo_dois: '16.2-Medicamento',
    pai: 22,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '16.3-Material Escolar',
    titulo_dois: '16.3-Material Escolar',
    pai: 22,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '16.4-Enxoval Bebê',
    titulo_dois: '16.4-Enxoval Bebê',
    pai: 22,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '16.5-Vestuário',
    titulo_dois: '16.5-Vestuário',
    pai: 22,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '17-Despesas com Moradias dos Assistidos',
    titulo_dois: '17-Despesas com Moradias dos Assistidos',
    pai: null,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: 'Material Construção, Ajuda Financeira etc.'
  },
  {
    titulo: '17.1-Material de construção',
    titulo_dois: '17.1-Material de construção',
    pai: 28,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '17.2-Ajuda Empreendedora',
    titulo_dois: '17.2-Ajuda Empreendedora',
    pai: 28,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '18-Pagamentos de contas Assistidos',
    titulo_dois: '18-Pagamentos de contas Assistidos',
    pai: null,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: 'água, luz, gás, transporte etc.'
  },
  {
    titulo: '19-Despesas com Obras Especiais',
    titulo_dois: '19-Despesas com Obras Especiais',
    pai: null,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '20-União Fraternal',
    titulo_dois: '20-União Fraternal',
    pai: null,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: 'Contribuições a Unidades Vicentinas'
  },
  {
    titulo: '21-Outras Despesas com as famílias',
    titulo_dois: '21-Outras Despesas com as famílias',
    pai: null,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '21.1-Datas Comemorativas',
    titulo_dois: '21.1-Datas Comemorativas',
    pai: 34,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '21.2-Dev. Espiritual/Humano',
    titulo_dois: '21.2-Dev. Espiritual/Humano',
    pai: 34,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: 'Promoção eventos: terços, passeios'
  },
  {
    titulo: '21.3-Frete/Transporte',
    titulo_dois: '21.3-Frete/Transporte',
    pai: 34,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '21.4-Outras',
    titulo_dois: '21.4-Outras',
    pai: 34,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '22-Despesas Ajudas Emergenciais',
    titulo_dois: '22-Despesas Ajudas Emergenciais',
    pai: null,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '23-Despesas Administrativas e de Consumo da Conferência',
    titulo_dois: '23-Despesas Administrativas e de Consumo da Conferência',
    pai: null,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '24-Décima paga ao Conselho Particular',
    titulo_dois: '24-Décima paga ao Conselho Particular',
    pai: null,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: '10% do valor da linha 6'
  },
  {
    titulo: '25-Repasse CMB',
    titulo_dois: '25-Repasse CMB',
    pai: null,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '26-Repasses Cont. Solidariedade / Col. Ozanam',
    titulo_dois: '26-Repasses Cont. Solidariedade / Col. Ozanam',
    pai: null,
    ativo: true,
    positivo: false,
    auto: true,
    decimavel: false,
    descricao: 'Linha 8'
  },
  {
    titulo: '26.1-Repasses Contribuição da Solidariedade',
    titulo_dois: '26.1-Repasses Contribuição da Solidariedade',
    pai: 43,
    ativo: true,
    positivo: false,
    auto: true,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '26.2-Repasses Coleta de Ozanam',
    titulo_dois: '26.2-Repasses Coleta de Ozanam',
    pai: 43,
    ativo: true,
    positivo: false,
    auto: true,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '27-Repasses Referentes a linha 12',
    titulo_dois: '27-Repasses Referentes a linha 12',
    pai: null,
    ativo: true,
    positivo: false,
    auto: true,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '28-Total dos Pagamentos',
    titulo_dois: '28-Total dos Pagamentos',
    pai: null,
    ativo: true,
    positivo: false,
    auto: true,
    decimavel: false,
    descricao: 'Somar da linha 16 a linha 27'
  },
  {
    titulo: '29-Saldo no final da semana',
    titulo_dois: '29-Saldo no final da semana',
    pai: null,
    ativo: true,
    positivo: false,
    auto: true,
    decimavel: false,
    descricao: 'linha 15 menos linha 28'
  },
  {
    titulo: '30-Balanço Despesas',
    titulo_dois: '30-Balanço Despesas',
    pai: null,
    ativo: true,
    positivo: false,
    auto: true,
    decimavel: false,
    descricao: 'Somar linha 28 + linha 29'
  },
  {
    titulo: '50-Receitas Extra Caixa',
    titulo_dois: '50-Receitas Extra Caixa',
    pai: null,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '50.1-Eventos',
    titulo_dois: '50.1-Eventos',
    pai: 50,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '50.2-Produtos',
    titulo_dois: '50.2-Produtos',
    pai: 50,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '51-Despesas Extra Caixa',
    titulo_dois: '51-Despesas Extra Caixa',
    pai: null,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '51.1-Eventos',
    titulo_dois: '51.1-Eventos',
    pai: 53,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '51.2-Produtos',
    titulo_dois: '51.2-Produtos',
    pai: 53,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '52-Movimentações',
    titulo_dois: '52-Movimentações',
    pai: null,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '52.1-Transferência',
    titulo_dois: '52.1-Transferência',
    pai: 56,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '52.2-Depósito',
    titulo_dois: '52.2-Depósito',
    pai: 56,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '52.3-Saque',
    titulo_dois: '52.3-Saque',
    pai: 56,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '52.4-Empréstimo',
    titulo_dois: '52.4-Empréstimo',
    pai: 56,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '52.5-Repasse Décima',
    titulo_dois: '52.5-Repasse Décima',
    pai: 56,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '52.6-Repasse Extra Caixa',
    titulo_dois: '52.6-Repasse Extra Caixa',
    pai: 56,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '52.7-Repasse contribuições',
    titulo_dois: '52.7-Repasse contribuições',
    pai: 56,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '52.8-Repasse membros',
    titulo_dois: '52.8-Repasse membros',
    pai: 56,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '53-Arredondamento',
    titulo_dois: '53-Arredondamento',
    pai: null,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: false,
    descricao: null
  },
  {
    titulo: '54-Provisório',
    titulo_dois: '54-Provisório',
    pai: null,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    descricao: null
  }
];
