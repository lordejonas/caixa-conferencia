/*
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('caixa-conferencia');
}*/


import { Component } from '@angular/core';
import { LivroCaixaComponent } from './components/livro-caixa/livro-caixa'; // <-- 1. IMPORTAR AQUI (ajuste o caminho se necessário)

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    LivroCaixaComponent // <-- 2. ADICIONAR NOS IMPORTS
  ],
  templateUrl: './app.html', // ou ./app.component.html
  styleUrls: ['./app.scss']  // ou ./app.component.scss
})
export class App {
  title = 'livro-caixa';
}
