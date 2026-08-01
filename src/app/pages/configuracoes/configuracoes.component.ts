import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InternalLayoutComponent } from '../../components/internal-layout/internal-layout.component';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, RouterLink, InternalLayoutComponent],
  templateUrl: './configuracoes.component.html',
  styleUrl: './configuracoes.component.scss'
})
export class ConfiguracoesComponent {}
