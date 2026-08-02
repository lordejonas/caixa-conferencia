import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InternalLayoutComponent } from '../../components/internal-layout/internal-layout.component';
import { UnidadeService, UnidadeVicentina } from '../../services/unidade.service';
import { dataValidaValidator } from '../../utils/validar-data';

@Component({
  selector: 'app-cadastro-unidade',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InternalLayoutComponent],
  templateUrl: './cadastro-unidade.component.html',
  styleUrl: './cadastro-unidade.component.scss'
})
export class CadastroUnidadeComponent implements OnInit {
  formUnidade!: FormGroup;
  modoEdicao: boolean = false;

  constructor(
    private fb: FormBuilder,
    private unidadeService: UnidadeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.carregarDadosSeExistir();
  }

  private inicializarFormulario(): void {
    this.formUnidade = this.fb.group({
      tipoUnidade: ['', Validators.required],
      nomeUnidade: ['', Validators.required],
      local: [''],
      dataFundacao: ['', [dataValidaValidator()]],
      dataAgregacao: ['', [dataValidaValidator()]],
      codigo: [''],
      conselhoParticular: [''],
      conselhoCentral: [''],
      conselhoMetropolitano: ['']
    });
  }

  private carregarDadosSeExistir(): void {
    const unidadeSalva = this.unidadeService.obterUnidade();
    if (unidadeSalva) {
      this.modoEdicao = true;
      this.formUnidade.patchValue(unidadeSalva); // Preenche automaticamente o formulário com a unidade em memória
    }
  }

  get tipoUnidadeValue(): string {
    return this.formUnidade.get('tipoUnidade')?.value || '';
  }

  // Máscara dinâmica de data (DD/MM/AAAA)
  aplicarMascaraData(event: Event, campo: string): void {
    const input = event.target as HTMLInputElement;
    let valor = input.value.replace(/\D/g, '');

    if (valor.length > 8) {
      valor = valor.substring(0, 8);
    }

    if (valor.length > 4) {
      valor = `${valor.substring(0, 2)}/${valor.substring(2, 4)}/${valor.substring(4)}`;
    } else if (valor.length > 2) {
      valor = `${valor.substring(0, 2)}/${valor.substring(2)}`;
    }

    this.formUnidade.get(campo)?.setValue(valor, { emitEvent: false });
  }

  // Máscara dinâmica para o Código (99.99.99.99)
  aplicarMascaraCodigo(event: Event): void {
    const input = event.target as HTMLInputElement;
    let valor = input.value.replace(/\D/g, ''); // Remove tudo que não é número

    // Limita ao tamanho máximo de 8 dígitos
    if (valor.length > 8) {
      valor = valor.substring(0, 8);
    }

    // Aplica a formatação dos pontos
    if (valor.length > 6) {
      valor = `${valor.substring(0, 2)}.${valor.substring(2, 4)}.${valor.substring(4, 6)}.${valor.substring(6)}`;
    } else if (valor.length > 4) {
      valor = `${valor.substring(0, 2)}.${valor.substring(2, 4)}.${valor.substring(4)}`;
    } else if (valor.length > 2) {
      valor = `${valor.substring(0, 2)}.${valor.substring(2)}`;
    }

    // Atualiza o valor do controle no formulário
    this.formUnidade.get('codigo')?.setValue(valor, { emitEvent: false });
  }

  salvar(): void {
    if (this.formUnidade.valid) {
      this.unidadeService.salvar(this.formUnidade.value);
      const mensagem = this.modoEdicao
        ? 'Unidade atualizada com sucesso!'
        : 'Unidade cadastrada com sucesso!';
      alert(mensagem);
      this.router.navigate(['/configuracoes']);
    }
  }

  cancelar(): void {
    this.router.navigate(['/configuracoes']);
  }
}
