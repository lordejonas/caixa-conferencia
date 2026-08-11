import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InternalLayoutComponent } from '../../components/internal-layout/internal-layout.component';
import { EntidadeItem } from '../../models/entidade.model';

@Component({
  selector: 'app-configuracao-entidades',
  standalone: true,
  imports: [CommonModule, RouterLink, InternalLayoutComponent],
  templateUrl: './configuracao-entidades.component.html',
  styleUrl: './configuracao-entidades.component.scss'
})
export class ConfiguracaoEntidadesComponent {
  // Lista central de entidades disponíveis no sistema
  entidades: EntidadeItem[] = [
    {
      id: 'favorecidos',
      nome: 'Favorecidos',
      descricao: 'Cadastro de pessoas, fornecedores, membros e beneficiários envolvidos nos lançamentos.',
      icone: 'bi-person-badge',
      rota: '/configuracoes/entidades/favorecidos',
      ativo: true
    }
  ];
}
