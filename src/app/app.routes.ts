import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { LivroCaixaComponent } from './components/livro-caixa/livro-caixa';
import { ConfiguracaoNuvemComponent } from './components/configuracao-nuvem/configuracao-nuvem';
import { ConfiguracoesComponent } from './pages/configuracoes/configuracoes.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'caixa', component: LivroCaixaComponent },
  { path: 'configuracao-nuvem', component: ConfiguracaoNuvemComponent },
  { path: 'configuracoes', component: ConfiguracoesComponent },
  { path: '**', redirectTo: '' }
];
