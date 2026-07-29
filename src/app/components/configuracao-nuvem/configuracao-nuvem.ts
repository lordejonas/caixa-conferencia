import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfigService } from '../../services/config.service';
import { FirebaseDynamicService } from '../../services/firebase-dynamic.service';
import { FirebaseUserConfig, PerfilUsuario } from '../../models/firebase-config.model';

@Component({
  selector: 'app-configuracao-nuvem',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './configuracao-nuvem.html',
  styleUrl: './configuracao-nuvem.scss'
})
export class ConfiguracaoNuvemComponent implements OnInit {
  config: FirebaseUserConfig = {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    perfil: 'membro' // Padrão é Membro
  };

  perfilSelecionado: PerfilUsuario = 'membro';
  senhaDigitada = '';
  estaConectado = false;
  mensagemStatus = '';

  constructor(
    private configService: ConfigService,
    private firebaseDynamicService: FirebaseDynamicService
  ) {}

  ngOnInit(): void {
    const configSalva = this.configService.obterConfiguracaoFirebase();
    if (configSalva) {
      this.config = configSalva;
      this.perfilSelecionado = configSalva.perfil || 'membro';
      this.estaConectado = this.firebaseDynamicService.estaConectado;
    }
  }

  aoMudarPerfil(): void {
    this.mensagemStatus = '';
  }

  async salvarEConectar(): Promise<void> {
    if (!this.config.apiKey || !this.config.projectId) {
      this.mensagemStatus = 'Preencha a API Key e o Project ID.';
      return;
    }

    // Se escolheu Tesoureiro, valida a senha no Firebase primeiro
    if (this.perfilSelecionado === 'tesoureiro') {
      const senhaValida = await this.firebaseDynamicService.validarSenhaTesoureiro(
        this.config,
        this.senhaDigitada
      );

      if (!senhaValida) {
        this.mensagemStatus = 'Senha da Tesouraria incorreta!';
        return;
      }
    }

    // Atualiza o perfil aprovado na configuração
    this.config.perfil = this.perfilSelecionado;

    // Salva no LocalStorage do aparelho
    this.configService.salvarConfiguracaoFirebase(this.config);
    this.firebaseDynamicService.inicializarSeConfigurado();

    this.estaConectado = true;
    this.mensagemStatus = `Conectado com sucesso no perfil ${this.config.perfil.toUpperCase()}!`;
  }

  desconectar(): void {
    this.firebaseDynamicService.desconectar();
    this.estaConectado = false;
    this.perfilSelecionado = 'membro';
    this.senhaDigitada = '';
    this.mensagemStatus = 'Desconectado.';
  }
}
