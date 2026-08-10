import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

import { ConfigService } from '../../services/config.service';
import { FirebaseDynamicService } from '../../services/firebase-dynamic.service';
import { FirebaseUserConfig, PerfilUsuario } from '../../models/firebase-config.model';
import { InternalLayoutComponent } from '../../components/internal-layout/internal-layout.component';
import { gerarHashSenha } from '../../utils/crypto.utils';

@Component({
  selector: 'app-configuracao-nuvem',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, InternalLayoutComponent],
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
  confirmacaoSenha = ''; // NOVO: Campo de confirmação de senha
  senhaExigida = false;
  estaConectado = false;
  mensagemStatus = '';

  // Controla o modo de edição dos campos sensíveis
  modoEdicao = false;

  // Guarda uma cópia original das chaves salvas para poder restaurar no "Cancelar"
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
    this.senhaExigida = this.perfilSelecionado === 'tesoureiro';
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
    this.senhaDigitada = '';
    this.confirmacaoSenha = '';

    // Sempre exige os campos de senha quando selecionar perfil 'tesoureiro'
    if (this.perfilSelecionado === 'tesoureiro') {
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
        return;
      }

      // PASSAGEM 2: Lógica de criação ou validação da Tesouraria
      if (this.perfilSelecionado === 'tesoureiro') {
        if (!this.senhaDigitada.trim()) {
          this.mensagemStatus = 'Por favor, informe a senha da Tesouraria.';
          this.cdr.detectChanges();
          return;
        }

        // Conecta temporariamente para checar se a coleção "configuracoes" existe
        const tempAppName = 'temp-setup-check';
        const appsExistentes = getApps();
        const appAntigo = appsExistentes.find(a => a.name === tempAppName);
        if (appAntigo) await deleteApp(appAntigo);

        const tempApp = initializeApp(this.config, tempAppName);
        const dbTemp = getFirestore(tempApp);
        const docRef = doc(dbTemp, 'configuracoes', 'geral');
        const docSnap = await getDoc(docRef);

        const hashSenhaDigitada = await gerarHashSenha(this.senhaDigitada);

        if (!docSnap.exists()) {
          // --- PRIMEIRO ACESSO / BASE NOVA: CRIA A COLEÇÃO "configuracoes" ---
          this.mensagemStatus = 'Inicializando nova base do Firebase...';
          this.cdr.detectChanges();

          // Valida a confirmação de senha
          if (this.senhaDigitada !== this.confirmacaoSenha) {
            this.mensagemStatus = 'A confirmação de senha não confere com a senha informada.';
            this.estaConectado = false;
            await deleteApp(tempApp);
            this.cdr.detectChanges();
            return;
          }

          // Grava a senha criptografada (hash) no Firestore
          await setDoc(docRef, {
            hashSenhaTesouraria: hashSenhaDigitada,
            createdAt: new Date().toISOString(),
            criadoPorPerfil: 'tesoureiro'
          });

          console.log('[Setup] Documento "configuracoes/geral" criado com sucesso!');

        } else {
          // --- BASE JÁ EXISTE: VALIDA A SENHA ---
          this.mensagemStatus = 'Validando senha da Tesouraria...';
          this.cdr.detectChanges();

          const dadosRemotos = docSnap.data();
          const hashSalvo = dadosRemotos['hashSenhaTesouraria'] || dadosRemotos['senhaTesouraria'];

          // Compara o Hash da senha digitada com o Hash salvo na base
          if (hashSalvo !== hashSenhaDigitada && dadosRemotos['senhaTesouraria'] !== this.senhaDigitada) {
            this.estaConectado = false;
            this.mensagemStatus = 'Senha da Tesouraria incorreta!';
            await deleteApp(tempApp);
            this.cdr.detectChanges();
            return;
          }
        }

        await deleteApp(tempApp);
      }

      // PASSAGEM 3: Salva os dados localmente e ativa o serviço
      this.config.perfil = this.perfilSelecionado;
      this.configService.salvarConfiguracaoFirebase(this.config);

      this.firebaseDynamicService.inicializarSeConfigurado();

      this.estaConectado = true;
      this.senhaExigida = false;
      this.senhaDigitada = '';
      this.confirmacaoSenha = '';
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
    this.confirmacaoSenha = '';
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
