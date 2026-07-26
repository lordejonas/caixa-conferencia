import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home'; // Ajuste o caminho se necessário
import { LivroCaixaComponent } from './components/livro-caixa/livro-caixa';

export const routes: Routes = [
  { path: '', component: HomeComponent },               // Página Inicial
  { path: 'caixa', component: LivroCaixaComponent },     // Livro Caixa
  { path: '**', redirectTo: '' }                        // Rota padrão se digitar algo errado
];
