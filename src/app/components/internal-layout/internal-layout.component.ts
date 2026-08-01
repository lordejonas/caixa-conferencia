import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-internal-layout',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './internal-layout.component.html',
  styleUrl: './internal-layout.component.scss'
})
export class InternalLayoutComponent {
  @Input({ required: true }) titulo: string = '';
}
