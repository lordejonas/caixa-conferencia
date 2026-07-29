import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { LivroCaixaComponent } from './components/livro-caixa/livro-caixa';
import { ConfiguracaoNuvemComponent } from './components/configuracao-nuvem/configuracao-nuvem';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'caixa', component: LivroCaixaComponent },
  { path: 'configuracao-nuvem', component: ConfiguracaoNuvemComponent }, // <-- NOVA ROTA
  { path: '**', redirectTo: '' }
];
