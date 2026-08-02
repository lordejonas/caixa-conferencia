import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { LivroCaixaComponent } from './components/livro-caixa/livro-caixa';
import { ConfiguracaoNuvemComponent } from './components/configuracao-nuvem/configuracao-nuvem';
import { ConfiguracoesComponent } from './pages/configuracoes/configuracoes.component';
import { CadastroUnidadeComponent } from './pages/cadastro-unidade/cadastro-unidade.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'caixa', component: LivroCaixaComponent },
  { path: 'configuracao-nuvem', component: ConfiguracaoNuvemComponent },
  { path: 'configuracoes', component: ConfiguracoesComponent },
  { path: 'cadastro-unidade', component: CadastroUnidadeComponent },
  { path: '**', redirectTo: '' }
];
