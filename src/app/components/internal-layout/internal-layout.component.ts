import { Component, Input, inject } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-internal-layout',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './internal-layout.component.html',
  styleUrl: './internal-layout.component.scss'
})
export class InternalLayoutComponent {
  @Input({ required: true }) titulo!: string;
  @Input() subTitulo: string = '';
  @Input() exibirFooterPadrao: boolean = true;

  private location = inject(Location);
  readonly appVersion = environment.version;

  /**
   * Navega para a página anterior no histórico do navegador
   */
  voltarPagina(): void {
    this.location.back();
  }
}
