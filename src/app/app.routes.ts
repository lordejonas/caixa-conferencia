import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/home/home').then((m) => m.HomeComponent)
  },
  {
    path: 'lancamentos',
    loadComponent: () =>
      import('./pages/lancamentos/lancamentos.component').then((m) => m.LancamentosComponent)
  },
  {
    path: 'lancamentos/novo',
    loadComponent: () =>
      import('./components/transacao-form/transacao-form.component').then((m) => m.TransacaoFormComponent)
  },
  {
    path: 'lancamentos/transferencia',
    loadComponent: () =>
      import('./components/transferencia-form/transferencia-form.component').then((m) => m.TransferenciaFormComponent)
  },
  {
    path: 'caixa',
    loadComponent: () =>
      import('./components/livro-caixa/livro-caixa').then((m) => m.LivroCaixaComponent)
  },
  {
    path: 'configuracao-nuvem',
    loadComponent: () =>
      import('./components/configuracao-nuvem/configuracao-nuvem').then((m) => m.ConfiguracaoNuvemComponent)
  },
  {
    path: 'configuracoes',
    loadComponent: () =>
      import('./pages/configuracoes/configuracoes.component').then((m) => m.ConfiguracoesComponent)
  },
  {
    path: 'cadastro-unidade',
    loadComponent: () =>
      import('./pages/cadastro-unidade/cadastro-unidade.component').then((m) => m.CadastroUnidadeComponent)
  },
  {
    path: 'configuracao-entidades',
    loadComponent: () =>
      import('./pages/configuracao-entidades/configuracao-entidades.component').then((m) => m.ConfiguracaoEntidadesComponent)
  },
  {
    path: 'favorecidos',
    loadComponent: () =>
      import('./pages/favorecidos/favorecidos-lista.component').then((m) => m.FavorecidosListaComponent)
  },
  {
    path: 'favorecidos/novo',
    loadComponent: () =>
      import('./pages/favorecidos/favorecido-form.component').then((m) => m.FavorecidoFormComponent)
  },
  {
    path: 'favorecidos/editar/:id',
    loadComponent: () =>
      import('./pages/favorecidos/favorecido-form.component').then((m) => m.FavorecidoFormComponent)
  },
  {
    path: 'categorias',
    loadComponent: () =>
      import('./pages/categorias/categorias.component').then((m) => m.CategoriasComponent)
  },
  {
    path: 'contas',
    loadComponent: () =>
      import('./pages/contas/contas.component').then((m) => m.ContasComponent)
  },

  // 🆕 Nova funcionalidade: Extrato filtrado de uma conta específica
  {
    path: 'contas/:id/extrato',
    loadComponent: () =>
      import('./pages/conta-extrato/conta-extrato.component').then((m) => m.ContaExtratoComponent)
  },

  // Fallback para rotas desconhecidas
  {
    path: '**',
    redirectTo: ''
  }
];
