import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { InternalLayoutComponent } from '../../components/internal-layout/internal-layout.component';
import { LongPressDirective } from '../../directives/long-press.directive';
import { FavorecidoService } from '../../services/favorecido.service';
import { Favorecido } from '../../models/favorecido.model';

@Component({
  selector: 'app-favorecidos-lista',
  standalone: true,
  imports: [CommonModule, RouterLink, InternalLayoutComponent, LongPressDirective],
  templateUrl: './favorecidos-lista.component.html',
  styleUrl: './favorecidos-lista.component.scss'
})
export class FavorecidosListaComponent implements OnInit {
  favorecidos: Favorecido[] = [];
  itemSelecionado: Favorecido | null = null;
  exibirModalExclusao = false;

  // Flag para impedir que o soltar do mouse feche a seleção
  private foiCliqueLongo = false;

  constructor(
    private favorecidoService: FavorecidoService,
    private router: Router,
    private cdr: ChangeDetectorRef // 2. Injetar no construtor
  ) {}

  async ngOnInit(): Promise<void> {
    await this.carregarFavorecidos();
  }

  async carregarFavorecidos(): Promise<void> {
    try {
      this.favorecidos = await this.favorecidoService.listarTodos();
      console.log('Favorecidos carregados do Dexie:', this.favorecidos);
      this.itemSelecionado = null;

      // 3. Notificar o Angular para atualizar a View imediatamente
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Erro ao carregar favorecidos:', error);
    }
  }

  @HostListener('document:click', ['$event'])
  onClickFora(event: MouseEvent): void {
    // Se o clique veio de um clique longo que acabou de acontecer, não desmarca
    if (this.foiCliqueLongo) {
      this.foiCliqueLongo = false;
      return;
    }

    // Se existe um item selecionado, desmarca imediatamente ao clicar fora
    if (this.itemSelecionado) {
      this.itemSelecionado = null;
      this.cdr.detectChanges();
    }
  }

  // Toque simples (abre os lançamentos no futuro)
  aoClicarItem(event: MouseEvent | TouchEvent, favorecido: Favorecido): void {
    // Interrompe a propagação para evitar que o @HostListener 'document:click'
    // trate este clique como um "clique fora"
    event.stopPropagation();

    if (this.foiCliqueLongo) {
      return;
    }

    // Se já havia outro selecionado e o usuário clicou em um novo item simples, desmarca
    if (this.itemSelecionado) {
      this.itemSelecionado = null;
      this.cdr.detectChanges();
      return;
    }

    // Ação normal (futuro: abrir lançamentos)
    console.log('Navegar para lançamentos do favorecido:', favorecido.titulo);
  }

  // Toque longo (ativa modo de seleção e exibe os botões de edição/exclusão)
  aoPressionarLongo(favorecido: Favorecido): void {
    this.foiCliqueLongo = true;
    this.itemSelecionado = favorecido;
    this.cdr.detectChanges();
  }

  desmarcarSelecao(): void {
    if (this.itemSelecionado) {
      this.itemSelecionado = null;
      this.cdr.detectChanges();
    }
  }

  irParaEditar(): void {
    if (this.itemSelecionado?.id) {
      this.router.navigate(['/favorecidos/editar', this.itemSelecionado.id]);
    }
  }

  confirmarExclusao(): void {
    this.exibirModalExclusao = true;
  }

  async executarExclusao(): Promise<void> {
    if (this.itemSelecionado?.id) {
      await this.favorecidoService.excluir(this.itemSelecionado.id);
      this.exibirModalExclusao = false;
      await this.carregarFavorecidos();
    }
  }
}
