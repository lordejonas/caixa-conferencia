import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfigService } from '../../services/config.service';
import { FirebaseDynamicService } from '../../services/firebase-dynamic.service';
import { FirebaseUserConfig, PerfilUsuario } from '../../models/firebase-config.model';

@Component({
  selector: 'app-configuracao-nuvem',
  standalone: true,
  imports: [FormsModule, RouterLink],
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
    perfil: 'membro'
  };

  perfilSelecionado: PerfilUsuario = 'membro';
  senhaDigitada = '';
  senhaExigida = false; // Controls whether the password field should be visible
  estaConectado = false;
  mensagemStatus = '';

  constructor(
    private configService: ConfigService,
    private firebaseDynamicService: FirebaseDynamicService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const configSalva = this.configService.obterConfiguracaoFirebase();
    if (configSalva) {
      this.config = configSalva;
      this.perfilSelecionado = configSalva.perfil || 'membro';
      this.estaConectado = this.firebaseDynamicService.estaConectado;
    }
    // Se a tela carregar já no perfil Tesoureiro e conectado, não exige digitar a senha novamente
    this.senhaExigida = false;
  }

  aoMudarPerfil(): void {
    this.mensagemStatus = '';
    const perfilSalvo = this.config.perfil || 'membro';

    // Exige a senha apenas se o usuário tentar mudar para 'tesoureiro' vindo do perfil 'membro'
    if (this.perfilSelecionado === 'tesoureiro' && perfilSalvo !== 'tesoureiro') {
      this.senhaExigida = true;
    } else {
      this.senhaExigida = false;
    }
  }

  async salvarEConectar(): Promise<void> {
    this.mensagemStatus = 'Verificando dados...';
    this.cdr.detectChanges();

    if (!this.config.apiKey || !this.config.projectId) {
      this.mensagemStatus = 'Preencha a API Key e o Project ID.';
      this.cdr.detectChanges();
      return;
    }

    try {
      // 1. Validação de senha apenas se for exigida nessa alteração
      if (this.perfilSelecionado === 'tesoureiro' && this.senhaExigida) {
        if (!this.senhaDigitada) {
          this.mensagemStatus = 'Por favor, informe a senha da Tesouraria.';
          this.cdr.detectChanges();
          return;
        }

        const senhaValida = await this.firebaseDynamicService.validarSenhaTesoureiro(
          this.config,
          this.senhaDigitada
        );

        if (!senhaValida) {
          this.mensagemStatus = 'Senha da Tesouraria incorreta!';
          this.cdr.detectChanges();
          return;
        }
      }

      // 2. Salva o perfil aprovado
      this.config.perfil = this.perfilSelecionado;
      this.configService.salvarConfiguracaoFirebase(this.config);

      // 3. Inicializa e oculta a senha após a validação
      const conectadoComSucesso = this.firebaseDynamicService.inicializarSeConfigurado();

      if (conectadoComSucesso) {
        this.estaConectado = true;
        this.senhaExigida = false; // Oculta o campo de senha após conectar
        this.senhaDigitada = ''; // Limpa o campo da memória
        this.mensagemStatus = `Conectado com sucesso no perfil ${this.config.perfil.toUpperCase()}!`;
      } else {
        this.estaConectado = false;
        this.mensagemStatus = 'Não foi possível estabelecer a conexão.';
      }
    } catch (error: any) {
      console.error('Erro no clique:', error);
      this.estaConectado = false;
      this.mensagemStatus = error?.message || 'Erro ao comunicar com o servidor.';
    } finally {
      this.cdr.detectChanges();
    }
  }

  desconectar(): void {
    this.firebaseDynamicService.desconectar();
    this.estaConectado = false;
    this.perfilSelecionado = 'membro';
    this.senhaDigitada = '';
    this.senhaExigida = false;
    this.mensagemStatus = 'Desconectado com sucesso.';
    this.cdr.detectChanges();
  }
}
