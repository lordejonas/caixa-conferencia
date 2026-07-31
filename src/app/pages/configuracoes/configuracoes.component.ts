import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './configuracoes.component.html'
})
export class ConfiguracoesComponent {

  constructor(private router: Router) {}

  navegarPara(rota: string): void {
    this.router.navigate([`/${rota}`]);
  }

  voltar(): void {
    this.router.navigate(['/home']); // Ajuste para a rota da sua tela inicial
  }
}
