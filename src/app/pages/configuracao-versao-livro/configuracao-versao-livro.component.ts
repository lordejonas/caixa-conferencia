import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InternalLayoutComponent } from '../../components/internal-layout/internal-layout.component';
import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'app-configuracao-versao-livro',
  standalone: true,
  imports: [CommonModule, FormsModule, InternalLayoutComponent],
  templateUrl: './configuracao-versao-livro.component.html'
})
export class ConfiguracaoVersaoLivroComponent implements OnInit {
  private configService = inject(ConfigService);

  versaoSelecionada: string = 'V1';
  mensagemSucesso: string = '';

  ngOnInit(): void {
    this.versaoSelecionada = this.configService.obterVersaoLivro() || 'V1';
  }

  salvarVersao(): void {
    this.configService.salvarVersaoLivro(this.versaoSelecionada);
    this.mensagemSucesso = 'Versão salva com sucesso!';
    setTimeout(() => {
      this.mensagemSucesso = '';
    }, 2500);
  }
}
