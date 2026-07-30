import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
    perfil: 'membro'
  };

  perfilSelecionado: PerfilUsuario = 'membro';
  senhaDigitada = '';
  senhaExigida = false;
  estaConectado = false;
  mensagemStatus = '';

  // Controla o modo de edição dos campos sensíveis
  modoEdicao = false;

  // Guarda uma cópia original das chaves salvas para poder restaurar no "Cancelar"
  // (deve ser pública para o template HTML conseguir acessar)
  configOriginal: FirebaseUserConfig | null = null;

  constructor(
    private configService: ConfigService,
    private firebaseDynamicService: FirebaseDynamicService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const configSalva = this.configService.obterConfiguracaoFirebase();
    if (configSalva) {
      this.config = { ...configSalva };
      this.configOriginal = { ...configSalva };
      this.perfilSelecionado = configSalva.perfil || 'membro';
      this.estaConectado = this.firebaseDynamicService.estaConectado;
      this.modoEdicao = false; // Por padrão entra bloqueado se já existirem dados
    } else {
      // Se é o primeiro acesso (sem nada salvo), libera os campos para digitação
      this.modoEdicao = true;
    }
    this.senhaExigida = false;
  }

  habilitarEdicaoChaves(): void {
    this.modoEdicao = true;
    // Limpa os campos para receber os novos valores
    this.config.apiKey = '';
    this.config.projectId = '';
    this.config.appId = '';
  }

  cancelarEdicaoChaves(): void {
    this.modoEdicao = false;
    // Restaura os valores originais que estavam salvos
    if (this.configOriginal) {
      this.config.apiKey = this.configOriginal.apiKey;
      this.config.projectId = this.configOriginal.projectId;
      this.config.appId = this.configOriginal.appId;
    }
  }

  aoMudarPerfil(): void {
    this.mensagemStatus = '';
    const perfilSalvo = this.config.perfil || 'membro';

    if (this.perfilSelecionado === 'tesoureiro' && perfilSalvo !== 'tesoureiro') {
      this.senhaExigida = true;
    } else {
      this.senhaExigida = false;
    }
  }

  async salvarEConectar(): Promise<void> {
    this.mensagemStatus = 'Verificando conexão com o Firebase...';
    this.cdr.detectChanges();

    if (!this.config.apiKey || !this.config.projectId) {
      this.mensagemStatus = 'Preencha a API Key e o Project ID.';
      this.cdr.detectChanges();
      return;
    }

    try {
      // PASSAGEM 1: Testar se as chaves do Firebase são válidas na nuvem
      const conexaoValida = await this.firebaseDynamicService.inicializarETestarConexao(this.config);

      if (!conexaoValida) {
        this.estaConectado = false;
        this.mensagemStatus = 'Chaves do Firebase inválidas ou projeto não encontrado.';
        this.cdr.detectChanges();
        return; // Interrompe imediatamente se as chaves estiverem erradas
      }

      // PASSAGEM 2: Se mudou para Tesoureiro, validar a senha
      if (this.perfilSelecionado === 'tesoureiro' && this.senhaExigida) {
        if (!this.senhaDigitada.trim()) {
          this.mensagemStatus = 'Por favor, informe a senha da Tesouraria.';
          this.cdr.detectChanges();
          return;
        }

        this.mensagemStatus = 'Validando senha da Tesouraria...';
        this.cdr.detectChanges();

        // Passa a configuração testada para tentar ler a senha no Firebase
        const senhaValida = await this.firebaseDynamicService.validarSenhaTesoureiro(
          this.config,
          this.senhaDigitada
        );

        if (!senhaValida) {
          this.estaConectado = false;
          this.mensagemStatus = 'Senha da Tesouraria incorreta!';
          this.cdr.detectChanges();
          return; // Interrompe imediatamente se a senha estiver errada
        }
      }

      // PASSAGEM 3: Tudo certo! Salva os dados e confirma a conexão
      this.config.perfil = this.perfilSelecionado;
      this.configService.salvarConfiguracaoFirebase(this.config);

      this.firebaseDynamicService.inicializarSeConfigurado();

      this.estaConectado = true;
      this.senhaExigida = false;
      this.senhaDigitada = '';
      this.modoEdicao = false;
      this.configOriginal = { ...this.config };
      this.mensagemStatus = `Conectado com sucesso no perfil ${this.config.perfil.toUpperCase()}!`;

    } catch (error: any) {
      console.error('Erro na conexão/validação:', error);
      this.estaConectado = false;
      this.mensagemStatus = error?.message || 'Erro ao validar dados com o servidor.';
    } finally {
      this.cdr.detectChanges();
    }
  }

  desconectar(): void {
  // Desconecta o serviço do Firebase
  this.firebaseDynamicService.desconectar();

  this.estaConectado = false;
  this.perfilSelecionado = 'membro';
  this.senhaDigitada = '';
  this.senhaExigida = false;

  // Mantém os campos bloqueados/mascarados se já existiam chaves gravadas
  this.modoEdicao = false;

  // Se houver dados originais salvos, restaura o estado do formulário mascarado
  if (this.configOriginal) {
    this.config = { ...this.configOriginal };
  } else {
    // Caso não houvesse nada salvo anteriormente, libera os campos para digitação
    this.modoEdicao = true;
  }

  this.mensagemStatus = 'Desconectado com sucesso.';
  this.cdr.detectChanges();
}
}
