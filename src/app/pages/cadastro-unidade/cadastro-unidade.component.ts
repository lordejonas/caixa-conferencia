import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { InternalLayoutComponent } from '../../components/internal-layout/internal-layout.component';
import { UnidadeService } from '../../services/unidade.service';
import { dataValidaValidator } from '../../utils/validar-data';

@Component({
  selector: 'app-cadastro-unidade',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InternalLayoutComponent],
  templateUrl: './cadastro-unidade.component.html',
  styleUrl: './cadastro-unidade.component.scss'
})
export class CadastroUnidadeComponent implements OnInit, OnDestroy {
  formUnidade!: FormGroup;
  modoEdicao: boolean = false;
  private unidadeSub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private unidadeService: UnidadeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.carregarDadosInscrição();
  }

  ngOnDestroy(): void {
    this.unidadeSub?.unsubscribe();
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

  // Carrega os dados reativamente do IndexedDB / Firebase em tempo real
  private carregarDadosInscrição(): void {
    this.unidadeSub = this.unidadeService.obterUnidadeObservable().subscribe({
      next: (unidadeSalva) => {
        if (unidadeSalva) {
          this.modoEdicao = true;
          this.formUnidade.patchValue(unidadeSalva);
        }
      },
      error: (err) => console.error('Erro ao carregar dados da unidade:', err)
    });
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

    const control = this.formUnidade.get(campo);
    if (control) {
      // Atualiza o valor e força a reavaliação dos validadores
      control.setValue(valor);
      control.markAsTouched();
      control.updateValueAndValidity();
    }
  }

  // Máscara dinâmica para o Código (99.99.99.99)
  aplicarMascaraCodigo(event: Event): void {
    const input = event.target as HTMLInputElement;
    let valor = input.value.replace(/\D/g, '');

    if (valor.length > 8) {
      valor = valor.substring(0, 8);
    }

    if (valor.length > 6) {
      valor = `${valor.substring(0, 2)}.${valor.substring(2, 4)}.${valor.substring(4, 6)}.${valor.substring(6)}`;
    } else if (valor.length > 4) {
      valor = `${valor.substring(0, 2)}.${valor.substring(2, 4)}.${valor.substring(4)}`;
    } else if (valor.length > 2) {
      valor = `${valor.substring(0, 2)}.${valor.substring(2)}`;
    }

    const control = this.formUnidade.get('codigo');
    if (control) {
      // Atualiza o valor e força a reavaliação dos validadores
      control.setValue(valor);
      control.markAsTouched();
      control.updateValueAndValidity();
    }
  }

  async salvar(): Promise<void> {
    if (this.formUnidade.valid) {
      try {
        await this.unidadeService.salvar(this.formUnidade.value);
        const mensagem = this.modoEdicao
          ? 'Unidade atualizada com sucesso!'
          : 'Unidade cadastrada com sucesso!';
        alert(mensagem);
        this.router.navigate(['/configuracoes']);
      } catch (error) {
        console.error('Erro ao salvar no IndexedDB:', error);
        alert('Erro ao salvar os dados localmente.');
      }
    }
  }

  cancelar(): void {
    this.router.navigate(['/configuracoes']);
  }
}
