import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfigService } from '../../services/config.service';
import { FirebaseDynamicService } from '../../services/firebase-dynamic.service';
import { FirebaseUserConfig } from '../../models/firebase-config.model';

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
    appId: ''
  };

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
      this.estaConectado = this.firebaseDynamicService.estaConectado;
    }
  }

  salvarEConectar(): void {
    if (!this.config.apiKey || !this.config.projectId) {
      this.mensagemStatus = 'Por favor, preencha pelo menos a API Key e o Project ID.';
      return;
    }

    this.configService.salvarConfiguracaoFirebase(this.config);
    const sucesso = this.firebaseDynamicService.inicializarSeConfigurado();

    if (sucesso) {
      this.estaConectado = true;
      this.mensagemStatus = 'Conexão realizada e salva com sucesso!';
    } else {
      this.mensagemStatus = 'Falha ao conectar. Verifique as credenciais digitadas.';
    }
  }

  desconectar(): void {
    this.firebaseDynamicService.desconectar();
    this.config = {
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: ''
    };
    this.estaConectado = false;
    this.mensagemStatus = 'Conexão removida. O aplicativo voltou a operar no modo 100% local.';
  }
}
