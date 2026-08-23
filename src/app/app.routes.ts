import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { LancamentosComponent } from './pages/lancamentos/lancamentos.component';
import { TransacaoFormComponent } from './components/transacao-form/transacao-form.component';
import { TransferenciaFormComponent } from './components/transferencia-form/transferencia-form.component';
import { LivroCaixaComponent } from './components/livro-caixa/livro-caixa';
import { ConfiguracaoNuvemComponent } from './components/configuracao-nuvem/configuracao-nuvem';
import { ConfiguracoesComponent } from './pages/configuracoes/configuracoes.component';
import { CadastroUnidadeComponent } from './pages/cadastro-unidade/cadastro-unidade.component';
import { ConfiguracaoEntidadesComponent } from './pages/configuracao-entidades/configuracao-entidades.component';

import { FavorecidosListaComponent } from './pages/favorecidos/favorecidos-lista.component';
import { FavorecidoFormComponent } from './pages/favorecidos/favorecido-form.component';

import { CategoriasComponent } from './pages/categorias/categorias.component';
import { ContasComponent } from './pages/contas/contas.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'lancamentos', component: LancamentosComponent },
  { path: 'caixa', component: LivroCaixaComponent },
  { path: 'configuracao-nuvem', component: ConfiguracaoNuvemComponent },
  { path: 'configuracoes', component: ConfiguracoesComponent },
  { path: 'cadastro-unidade', component: CadastroUnidadeComponent },
  { path: 'configuracao-entidades', component: ConfiguracaoEntidadesComponent},

  { path: 'favorecidos', component: FavorecidosListaComponent },
  { path: 'favorecidos/novo', component: FavorecidoFormComponent },
  { path: 'favorecidos/editar/:id', component: FavorecidoFormComponent },
  { path: 'categorias', component: CategoriasComponent},
  { path: 'contas', component: ContasComponent},
  { path: 'lancamentos/novo',component: TransacaoFormComponent},
  { path: 'lancamentos/transferencia',component: TransferenciaFormComponent},

  /*
  {
    path: 'favorecidos',
    loadComponent: () => import('./pages/favorecidos/favorecidos-lista.component')
      .then(m => m.FavorecidosListaComponent)
  },
  {
    path: 'favorecidos/novo',
    loadComponent: () => import('./pages/favorecidos/favorecido-form.component')
      .then(m => m.FavorecidoFormComponent)
  },
  {
    path: 'favorecidos/editar/:id',
    loadComponent: () => import('./pages/favorecidos/favorecido-form.component')
      .then(m => m.FavorecidoFormComponent)
  },*/

  { path: '**', redirectTo: '' }
];
