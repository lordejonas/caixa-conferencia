import { Directive, Output, EventEmitter, HostListener } from '@angular/core';

@Directive({
  selector: '[appLongPress]',
  standalone: true
})
export class LongPressDirective {
  @Output() appLongPress = new EventEmitter<void>();

  private timeout: any;
  private delay = 500;
  private isLongPress = false;

  // --- TOUCH (Mobile) ---
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    this.iniciarTimer();
  }

  @HostListener('touchmove')
  @HostListener('touchcancel')
  limparTouch(): void {
    clearTimeout(this.timeout);
  }

  @HostListener('touchend')
  onTouchEnd(): void {
    clearTimeout(this.timeout);
  }

  // --- MOUSE (Desktop) ---
  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    if (event.button === 0) { // Apenas botão esquerdo
      this.isLongPress = false;
      this.iniciarTimer();
    }
  }

  @HostListener('mousemove')
  @HostListener('mouseleave')
  limparMouse(): void {
    clearTimeout(this.timeout);
  }

  @HostListener('mouseup')
  onMouseUp(): void {
    clearTimeout(this.timeout);
  }

  // Previne o clique simples caso tenha sido um clique longo
  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (this.isLongPress) {
      event.preventDefault();
      event.stopPropagation();
      this.isLongPress = false;
    }
  }

  private iniciarTimer(): void {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.isLongPress = true;
      if ('vibrate' in navigator) navigator.vibrate(40);
      this.appLongPress.emit();
    }, this.delay);
  }
}
