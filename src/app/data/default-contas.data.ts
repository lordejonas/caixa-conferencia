import { Conta } from '../models/conta.model';
import { Agregador } from '../models/agregador.model';

// Agregadores Padrão
export const DEFAULT_AGREGADORES_TIPO_2: Omit<Agregador, 'id'>[] = [
  {
    nome: 'Arredondamentos',
    icone: '🔃', // Mãozinhas/setas de ciclo indicando ajuste e arredondamento continuo
    descricao: 'Reúne as contas de arredondamento de espécie e banco',
    ativo: true,
    contabilizar_totais: null,
    ordem_listagem: 3
  }
];

// Contas - Tipo 1 (Simplificado)
export const DEFAULT_CONTAS_TIPO_1: Omit<Conta, 'id'>[] = [
  {
    titulo: 'Caixa',
    icone: '💵', // Cifrão/Cédulas de dinheiro para o caixa físico principal
    saldo_atual: 0,
    ativo: true,
    contabilizar_totais: true,
    id_conta_arredondamento: null,
    id_agregador: null,
    minimo_arredondamento: 1,
    ordem_listagem: 1
  },
  {
    titulo: 'Arredondamento',
    icone: '🔃', // Moeda individual para representação de ajustes de centavos
    saldo_atual: 0,
    ativo: true,
    contabilizar_totais: null,
    id_conta_arredondamento: 1,
    id_agregador: null,
    minimo_arredondamento: 1,
    ordem_listagem: 2
  },
  {
    titulo: 'Décima',
    icone: '🧮', // Edifício religioso/comunitário para contribuições/dízimos
    saldo_atual: 0,
    ativo: true,
    contabilizar_totais: false,
    id_conta_arredondamento: null,
    id_agregador: null,
    minimo_arredondamento: 1,
    ordem_listagem: 3
  },
  {
    titulo: 'Movimentação Membros',
    icone: '👥', // Busto de pessoas representando movimentação de membros
    saldo_atual: 0,
    ativo: true,
    contabilizar_totais: false,
    id_conta_arredondamento: null,
    id_agregador: null,
    minimo_arredondamento: 1,
    ordem_listagem: 4
  },
  {
    titulo: 'Conselhos',
    icone: '🏛️', // Prédio institucional/conselho representativo
    saldo_atual: 0,
    ativo: true,
    contabilizar_totais: false,
    id_conta_arredondamento: null,
    id_agregador: null,
    minimo_arredondamento: 1,
    ordem_listagem: 5
  },
  {
    titulo: 'Extra Caixa',
    icone: '🧾', // Registro representando recursos e movimentações extras
    saldo_atual: 0,
    ativo: true,
    contabilizar_totais: false,
    id_conta_arredondamento: null,
    id_agregador: null,
    minimo_arredondamento: 1,
    ordem_listagem: 6
  }
];

// Contas - Tipo 2 (Completo/Estruturado)
export const DEFAULT_CONTAS_TIPO_2: Omit<Conta, 'id'>[] = [
  {
    titulo: 'Espécie',
    icone: '💵', // Dinheiro voando/cédulas em papel para valores físicos em mãos
    saldo_atual: 0,
    ativo: true,
    contabilizar_totais: true,
    id_conta_arredondamento: null,
    id_agregador: null,
    minimo_arredondamento: 5,
    ordem_listagem: 1
  },
  {
    titulo: 'Banco',
    icone: '🏦', // Instituição bancária para conta corrente digital
    saldo_atual: 0,
    ativo: true,
    contabilizar_totais: true,
    id_conta_arredondamento: null,
    id_agregador: null,
    minimo_arredondamento: 1,
    ordem_listagem: 2
  },
  {
    titulo: 'Arredondamento Espécie',
    icone: '🪙', // Moeda para ajuste de troco/espécie
    saldo_atual: 0,
    ativo: true,
    contabilizar_totais: null,
    id_conta_arredondamento: 1,
    id_agregador: 1,
    minimo_arredondamento: 5,
    ordem_listagem: 3
  },
  {
    titulo: 'Arredondamento Banco',
    icone: '💳', // Cartão/operação bancária para arredondamento digital
    saldo_atual: 0,
    ativo: true,
    contabilizar_totais: null,
    id_conta_arredondamento: 2,
    id_agregador: 1,
    minimo_arredondamento: 1,
    ordem_listagem: 4
  },
  {
    titulo: 'Décima',
    icone: '🧮', // Edifício comunitário/religioso
    saldo_atual: 0,
    ativo: true,
    contabilizar_totais: false,
    id_conta_arredondamento: null,
    id_agregador: null,
    minimo_arredondamento: 1,
    ordem_listagem: 5
  },
  {
    titulo: 'Movimentação Membros',
    icone: '👥', // Pessoas/Membros
    saldo_atual: 0,
    ativo: true,
    contabilizar_totais: false,
    id_conta_arredondamento: null,
    id_agregador: null,
    minimo_arredondamento: 1,
    ordem_listagem: 6
  },
  {
    titulo: 'Conselhos',
    icone: '🏛️', // Prédio institucional/conselho
    saldo_atual: 0,
    ativo: true,
    contabilizar_totais: false,
    id_conta_arredondamento: null,
    id_agregador: null,
    minimo_arredondamento: 1,
    ordem_listagem: 7
  },
  {
    titulo: 'Extra Caixa',
    icone: '🧾', // Registro/Caixa extra
    saldo_atual: 0,
    ativo: true,
    contabilizar_totais: false,
    id_conta_arredondamento: null,
    id_agregador: null,
    minimo_arredondamento: 1,
    ordem_listagem: 8
  }
];
