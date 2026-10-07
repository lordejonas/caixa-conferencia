import { Categoria } from '../models/categoria.model';

export const DEFAULT_CATEGORIAS: Categoria[] = [
  {
    id: 1,
    titulo: '00-Saldo de Abertura', /*01*/
    titulo_dois: '00-Saldo de Abertura',
    pai: null,
    ativo: true,
    positivo: true,
    auto: true,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: 'Primeiro valor inserido na conta'
  },
  {
    id: 2,
    titulo: '01-Coleta reunião',/*02*/
    titulo_dois: '01-Coleta na reunião durante o mês',
    pai: null,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: true,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 3,
    titulo: '02-Subscritores e Benfeitores',/*03*/
    titulo_dois: '02-Subscritores e Benfeitores',
    pai: null,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: true,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 4,
    titulo: '03-Outras doações Recebidas',/*04*/
    titulo_dois: '03-Outras doações Recebidas',
    pai: null,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: true,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: 'exclusivamente em R$'
  },
  {
    id: 5,
    titulo: '03.1-Porta Igreja',/*05*/
    titulo_dois: '03.1-Porta Igreja',
    pai: 4,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: true,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 6,
    titulo: '03.2-Juros Poupança',/*06*/
    titulo_dois: '03.2-Juros Poupança',
    pai: 4,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: true,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 7,
    titulo: '03.3-Doações Avulsas',/*07*/
    titulo_dois: '03.3-Doações Avulsas',
    pai: 4,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: true,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 8,
    titulo: '04-Resultado líquido com realização de evento',/*08*/
    titulo_dois: '04-Resultado líquidos com eventos',
    pai: null,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: true,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: 'Rifa, Bazar, almoços etc.'
  },
  {
    id: 9,
    titulo: '05-Outros',/*09*/
    titulo_dois: '05-Outros',
    pai: null,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: true,
    versao_livro: 'all',
    permite_descricao_livre : true,
    descricao: 'em R$ (sujeito ao recolhimento de Décima)'
  },
  {
    id: 10,
    titulo: '06-Subtotal',/*10*/
    titulo_dois: '06-Subtotal',
    pai: null,
    ativo: true,
    positivo: true,
    auto: true,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: 'valor base de cálculo da Décima da semana/mês'
  },
  {
    id: 11,
    titulo: '07-Subvenções Oficiais',/*11*/
    titulo_dois: '07-Subvenções Oficiais',
    pai: null,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: 'dos Poderes Públicos'
  },
  {
    id: 12,
    titulo: '08-Contrib. da Solidariedade e Col. de Ozanam',/*12*/
    titulo_dois: '08-Contrib. da Solidariedade e Col. de Ozanam',
    pai: null,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 13,
    titulo: '08.1-Contrib. da Solidariedade',/*13*/
    titulo_dois: '08.1-Contrib. da Solidariedade',
    pai: 12,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 14,
    titulo: '08.2-Coleta de Ozanam',/*14*/
    titulo_dois: '08.2-Coleta de Ozanam',
    pai: 12,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 15,
    titulo: '09-União Fraternal',/*15*/
    titulo_dois: '09-União Fraternal',
    pai: null,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: 'Contribuições Recebidas de Unidades Vicentinas'
  },
  {
    id: 16,
    titulo: '10-Doações Materiais recebidas',/*16*/
    titulo_dois: '10-Doações Materiais recebidas',
    pai: null,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 17,
    titulo: '11-Outros',/*17*/
    titulo_dois: '11-Outros',
    pai: null,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : true,
    descricao: null
  },
  {
    id: 18,
    titulo: '12-Recebimentos para Repasses',/*18*/
    titulo_dois: '12-Recebimentos para Repasses',
    pai: null,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: 'Exemp.: assinatura do Boletim brasileiro'
  },
  {
    id: 19,
    titulo: '13-Soma da Receita da semana',/*19*/
    titulo_dois: '13-Soma da Receita da semana',
    pai: null,
    ativo: true,
    positivo: true,
    auto: true,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: 'Somas da linha 06 a linha 12'
  },
  {
    id: 20,
    titulo: '14-Saldo anterior',/*20*/
    titulo_dois: '14-Saldo no início do mês',
    pai: null,
    ativo: true,
    positivo: true,
    auto: true,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: 'Igual ao Saldo final do MÊS anterior'
  },
  {
    id: 21,
    titulo: '15-Total da Receita',/*21*/
    titulo_dois: '15-Total Recebimentos + Saldo início do mês',
    pai: null,
    ativo: true,
    positivo: true,
    auto: true,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: 'soma da linha 13 + linha 14'
  },
  {
    id: 22,
    titulo: '16-Cestas básicas',/*22*/
    titulo_dois: '16-Cestas básicas',
    pai: null,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: 'alimentos, produto de higiene e limpeza  etc.'
  },
  {
    id: 23,
    titulo: '16.1-Alimentos, higiene e limpeza',/*23*/
    titulo_dois: '16.1-Alimentos, higiene e limpeza',
    pai: 22,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 24,
    titulo: '17-Moradias e saúde dos Assistidos',/*24*/
    titulo_dois: '17-Moradias e saúde dos Assistidos',
    pai: null,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: 'Material Construção, Medicamentos,Ajuda Financeira etc.'
  },
  {
    id: 25,
    titulo: '17.1-Medicamento',/*25*/
    titulo_dois: '17.1-Medicamento',
    pai: 24,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 26,
    titulo: '17.2-Material de construção',/*26*/
    titulo_dois: '17.2-Material de construção',
    pai: 24,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 27,
    titulo: '18-Contas de famílias assistidas',/*27*/
    titulo_dois: '18-Contas de famílias assistidas',
    pai: null,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: 'água, luz, gás, transporte etc.'
  },
  {
    id: 28,
    titulo: '18.1-Ajuda Empreendedora',/*28*/
    titulo_dois: '18.1-Ajuda Empreendedora',
    pai: 27,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 29,
    titulo: '19-Despesas com Obras Especiais',/*29*/
    titulo_dois: '19-Despesas com Obras Especiais',
    pai: null,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 30,
    titulo: '20-União Fraternal',/*30*/
    titulo_dois: '20-União Fraternal',
    pai: null,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: 'Contribuições a Unidades Vicentinas'
  },
  {
    id: 31,
    titulo: '21-Vales distribuídos e outras ajudas',/*31*/
    titulo_dois: '21-Vales distribuídos e outras ajudas',
    pai: null,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: "passagens, fralda, escola, etc"
  },
  {
    id: 32,
    titulo: '21.1-Datas Comemorativas',/*32*/
    titulo_dois: '21.1-Datas Comemorativas',
    pai: 31,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 33,
    titulo: '21.2-Dev. Espiritual/Humano',/*33*/
    titulo_dois: '21.2-Dev. Espiritual/Humano',
    pai: 31,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: 'Promoção eventos: terços, passeios'
  },
  {
    id: 34,
    titulo: '21.3-Frete/Transporte',/*34*/
    titulo_dois: '21.3-Frete/Transporte',
    pai: 31,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 35,
    titulo: '21.4-Material Escolar',/*35*/
    titulo_dois: '21.4-Material Escolar',
    pai: 31,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 36,
    titulo: '21.5-Enxoval Bebê',/*36*/
    titulo_dois: '21.5-Enxoval Bebê',
    pai: 31,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 37,
    titulo: '21.6-Vestuário',/*37*/
    titulo_dois: '21.6-Vestuário',
    pai: 31,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 38,
    titulo: '21.7-Outros',/*38*/
    titulo_dois: '21.7-Outros',
    pai: 31,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : true,
    descricao: null
  },
  {
    id: 39,
    titulo: '22-Outros',/*39*/
    titulo_dois: '22-Outros',
    pai: null,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : true,
    descricao: null
  },
  {
    id: 40,
    titulo: '23-Despesas Administrativas e de Consumo da Conferência',/*40*/
    titulo_dois: '23-Despesas Administrativas e de Consumo da Conferência',
    pai: null,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 41,
    titulo: '24-Décima paga ao Conselho Particular',/*41*/
    titulo_dois: '24-Décima paga ao Conselho Particular',
    pai: null,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: '10% do valor da linha 6'
  },
  {
    id: 42,
    titulo: '25-Doações materiais distribuídas',/*42*/
    titulo_dois: '25-Doações materiais distribuídas',
    pai: null,
    ativo: true,
    positivo: false,
    auto: true,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: 'alimentos, roupas, calçados e outros'
  },
  {
    id: 43,
    titulo: '26-Repasses Cont. Solidariedade / Col. Ozanam',/*43*/
    titulo_dois: '26-Repasses Cont. Solidariedade / Col. Ozanam',
    pai: null,
    ativo: true,
    positivo: false,
    auto: true,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: 'Linha 8'
  },
  {
    id: 44,
    titulo: '26.1-Repasses Contrib. da Solidariedade',/*44*/
    titulo_dois: '26.1-Repasses Contrib. da Solidariedade',
    pai: 43,
    ativo: true,
    positivo: false,
    auto: true,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 45,
    titulo: '26.2-Repasses Coleta de Ozanam',/*45*/
    titulo_dois: '26.2-Repasses Coleta de Ozanam',
    pai: 43,
    ativo: true,
    positivo: false,
    auto: true,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 46,
    titulo: '27-Repasses efetuados (linha 12)',/*46*/
    titulo_dois: '27-Repasses efetuados (linha 12)',
    pai: null,
    ativo: true,
    positivo: false,
    auto: true,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 47,
    titulo: '28-Soma das despesas da semana',/*47*/
    titulo_dois: '28-Total dos Pagamentos',
    pai: null,
    ativo: true,
    positivo: false,
    auto: true,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: 'Somar da linha 16 a linha 27'
  },
  {
    id: 48,
    titulo: '29-Saldo no final da semana',/*48*/
    titulo_dois: '29-Saldo no final do mês',
    pai: null,
    ativo: true,
    positivo: false,
    auto: true,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: 'linha 15 menos linha 28'
  },
  {
    id: 49,
    titulo: '30-Balanço Despesas',/*49*/
    titulo_dois: '30-Balanço Despesas',
    pai: null,
    ativo: true,
    positivo: false,
    auto: true,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: 'Somar linha 28 + linha 29'
  },
  {
    id: 50,
    titulo: '31-Cestas básicas - em kg',/*50*/
    titulo_dois: 'Total de Alimentos Doados em Kg/mês',
    pai: null,
    ativo: true,
    positivo: true,
    auto: true,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: 'alimentos, produtos de higiene e limpeza'
  },
  {
    id: 51,
    titulo: '32-Roupas, calçados – em unidades',/*51*/
    titulo_dois: '32-Roupas, calçados – em unidades',
    pai: null,
    ativo: true,
    positivo: true,
    auto: true,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: 'alimentos, produtos de higiene e limpeza'
  },
  {
    id: 52,
    titulo: '33-Outros',/*52*/
    titulo_dois: '33-Outros',
    pai: null,
    ativo: true,
    positivo: true,
    auto: true,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : true,
    descricao: '(Exemplos: Muletas, eletrodomésticos e etc.)'
  },
  {
    id: 53,
    titulo: '50-Receitas Extra Caixa',/*53*/
    titulo_dois: '50-Receitas Extra Caixa',
    pai: null,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 54,
    titulo: '50.1-Eventos',/*54*/
    titulo_dois: '50.1-Eventos',
    pai: 53,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 55,
    titulo: '50.2-Produtos',/*55*/
    titulo_dois: '50.2-Produtos',
    pai: 53,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 56,
    titulo: '50.3-Outros',/*56*/
    titulo_dois: '50.3-Outros',
    pai: 53,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : true,
    descricao: null
  },
  {
    id: 57,
    titulo: '51-Despesas Extra Caixa',/*57*/
    titulo_dois: '51-Despesas Extra Caixa',
    pai: null,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 58,
    titulo: '51.1-Eventos',/*58*/
    titulo_dois: '51.1-Eventos',
    pai: 57,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 59,
    titulo: '51.2-Produtos',/*59*/
    titulo_dois: '51.2-Produtos',
    pai: 57,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 60,
    titulo: '51.4-Outros',/*60*/
    titulo_dois: '51.4-Outros',
    pai: 57,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : true,
    descricao: null
  },
  {
    id: 61,
    titulo: '52-Movimentações',/*61*/
    titulo_dois: '52-Movimentações',
    pai: null,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 62,
    titulo: '52.1-Transferência',/*62*/
    titulo_dois: '52.1-Transferência',
    pai: 58,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 63,
    titulo: '52.2-Depósito',/*63*/
    titulo_dois: '52.2-Depósito',
    pai: 58,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 64,
    titulo: '52.3-Saque',/*64*/
    titulo_dois: '52.3-Saque',
    pai: 58,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 65,
    titulo: '52.4-Empréstimo',/*65*/
    titulo_dois: '52.4-Empréstimo',
    pai: 58,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 66,
    titulo: '52.5-Repasse Décima',/*66*/
    titulo_dois: '52.5-Repasse Décima',
    pai: 58,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 67,
    titulo: '52.6-Repasse Extra Caixa',/*67*/
    titulo_dois: '52.6-Repasse Extra Caixa',
    pai: 58,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 68,
    titulo: '52.7-Repasse contribuições',/*68*/
    titulo_dois: '52.7-Repasse contribuições',
    pai: 58,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 69,
    titulo: '52.8-Repasse membros',/*69*/
    titulo_dois: '52.8-Repasse membros',
    pai: 58,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 70,
    titulo: '53-Arredondamento',/*70*/
    titulo_dois: '53-Arredondamento',
    pai: null,
    ativo: true,
    positivo: true,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  },
  {
    id: 71,
    titulo: '54-Provisório',/*71*/
    titulo_dois: '54-Provisório',
    pai: null,
    ativo: true,
    positivo: false,
    auto: false,
    decimavel: false,
    versao_livro: 'all',
    permite_descricao_livre : false,
    descricao: null
  }
];
