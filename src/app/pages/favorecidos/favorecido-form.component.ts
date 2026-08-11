import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router'; // 1. Importar ActivatedRoute
import { InternalLayoutComponent } from '../../components/internal-layout/internal-layout.component';
import { FavorecidoService } from '../../services/favorecido.service';

@Component({
  selector: 'app-favorecido-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, InternalLayoutComponent],
  templateUrl: './favorecido-form.component.html',
  styleUrl: './favorecidos-lista.component.scss'
})
export class FavorecidoFormComponent implements OnInit {
  idFavorecido?: number;
  titulo: string = '';
  ativo: boolean = true;
  isEdicao: boolean = false;

  constructor(
    private favorecidoService: FavorecidoService,
    private router: Router,
    private route: ActivatedRoute, // 2. Injetar ActivatedRoute
    private cdr: ChangeDetectorRef // 3. Injetar ChangeDetectorRef para atualizar a view
  ) {}

  async ngOnInit(): Promise<void> {
    // Captura o ID da URL se ele existir (ex: /favorecidos/editar/:id)
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.idFavorecido = Number(idParam);
      this.isEdicao = true;
      await this.carregarFavorecido(this.idFavorecido);
    }
  }

  // Busca o favorecido no Dexie e preenche os campos
  async carregarFavorecido(id: number): Promise<void> {
    try {
      const favorecido = await this.favorecidoService.buscarPorId(id);

      if (favorecido) {
        this.titulo = favorecido.titulo;
        this.ativo = favorecido.ativo;
        this.cdr.detectChanges(); // Garante que a tela reflita os dados carregados do banco
      } else {
        console.warn('Favorecido não encontrado para o ID:', id);
        this.router.navigate(['/favorecidos']);
      }
    } catch (error) {
      console.error('Erro ao carregar favorecido para edição:', error);
    }
  }

  async salvar(): Promise<void> {
    if (!this.titulo.trim()) return;

    try {
      if (this.isEdicao && this.idFavorecido) {
        await this.favorecidoService.atualizar({
          id: this.idFavorecido,
          titulo: this.titulo.trim(),
          ativo: this.ativo // Valor vindo do switch/checkbox [(ngModel)]="ativo"
        });
      } else {
        await this.favorecidoService.adicionar({
          titulo: this.titulo.trim(),
          ativo: true // Sempre ativo ao criar novo
        });
      }

      this.router.navigate(['/favorecidos']);
    } catch (error) {
      console.error('Erro ao salvar favorecido:', error);
    }
  }
}
