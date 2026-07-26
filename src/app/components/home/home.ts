import { Component } from '@angular/core';
import { RouterLink } from '@angular/router'; // <-- IMPORTANTE PARA O NAVEGADOR FUNCIONAR

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink // <-- ADICIONADO NOS IMPORTS
  ],
  templateUrl: './home.html', // ou ./home.component.html
  styleUrl: './home.scss'     // ou ./home.component.scss
})
export class HomeComponent {}
