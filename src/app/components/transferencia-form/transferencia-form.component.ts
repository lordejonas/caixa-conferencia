import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { db } from '../../core/db/app-database';
import { Conta } from '../../models/conta.model';
import { Categoria } from '../../models/categoria.model';
import { Lancamento } from '../../models/lancamento.model';
import { DecimaAutocontrolService } from '../../services/decima-autocontrol.service'; // <-- Importado

@Component({
  selector: 'app-transferencia-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transferencia-form.component.html',
  styleUrls: ['./transferencia-form.component.scss']
})
export class TransferenciaFormComponent implements OnInit {
  private location = inject(Location);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private decimaService = inject(DecimaAutocontrolService);
  private router = inject(Router);

  // Listas dos Selects
  contas: Conta[] = [];
  categorias: Categoria[] = [];

  // Estado do Formulário
  ataLivroCaixaId: number | null = null;
  dataIso: string = new Date().toISOString().substring(0, 10);
  horaIso: string = new Date().toTimeString().substring(0, 5);

  // Contas selecionadas
  contaOrigemId: number | null = null;
  contaDestinoId: number | null = null;

  private contaOrigemAnterior: number | null = null;
  private contaDestinoAnterior: number | null = null;

  categoriaSelecionadaId: number | null = null;

  inteiros: string = '';
  centavos: string = '00';
  nota: string = '';

  dataExtenso: string = '';

  //ins
  descricaoCustomizada: string = '';
  exibirDescricaoCustomizada: boolean = false;

  async ngOnInit(): Promise<void> {
    this.atualizarDataExtenso();
    await this.carregarDados();
  }

  private async carregarDados(): Promise<void> {
    const queryParams = this.route.snapshot.queryParams;
    const contaIdQuery = queryParams['contaId'] ? Number(queryParams['contaId']) : null;

    const listaContas = await db.contas.filter(c => c.ativo !== false).toArray();
    this.contas = listaContas;

    if (this.contas.length > 0) {
      if (contaIdQuery && this.contas.some(c => c.id === contaIdQuery)) {
        this.contaOrigemId = contaIdQuery;
      } else {
        this.contaOrigemId = this.contas[0].id ?? null;
      }
      this.contaOrigemAnterior = this.contaOrigemId;

      const contaDestinoDiferente = this.contas.find(c => c.id !== this.contaOrigemId);
      this.contaDestinoId = contaDestinoDiferente ? (contaDestinoDiferente.id ?? null) : this.contaOrigemId;
      this.contaDestinoAnterior = this.contaDestinoId;
    }

    this.categorias = await db.categorias
      .filter(c => c.ativo !== false && c.auto === false)
      .toArray();

    this.cdr.detectChanges();
  }

  onContaOrigemChange(): void {
    if (this.contaOrigemId === this.contaDestinoId) {
      this.contaDestinoId = this.contaOrigemAnterior;
    }
    this.contaOrigemAnterior = this.contaOrigemId;
    this.contaDestinoAnterior = this.contaDestinoId;
  }

  onContaDestinoChange(): void {
    if (this.contaDestinoId === this.contaOrigemId) {
      this.contaOrigemId = this.contaDestinoAnterior;
    }
    this.contaDestinoAnterior = this.contaDestinoId;
    this.contaOrigemAnterior = this.contaOrigemId;
  }

  onBeforeInputInteiros(event: InputEvent, elementCentavos: HTMLInputElement): void {
    const charInserido = event.data;
    if (charInserido === '.' || charInserido === ',') {
      event.preventDefault();
      elementCentavos.focus();
      elementCentavos.select();
    }
  }

  onInteirosInput(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const valorLimpo = inputEl.value.replace(/\D/g, '');
    this.inteiros = valorLimpo;
    inputEl.value = valorLimpo;
  }

  onCentavosFocus(event: FocusEvent): void {
    const inputEl = event.target as HTMLInputElement;
    inputEl.select();
  }

  onBeforeInputCentavos(event: InputEvent): void {
    const charInserido = event.data;
    if (charInserido === '.' || charInserido === ',') {
      event.preventDefault();
    }
  }

  onCentavosInput(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const valorLimpo = inputEl.value.replace(/\D/g, '');
    this.centavos = valorLimpo;
    inputEl.value = valorLimpo;
  }

  formatarCentavos(): void {
    if (!this.centavos) {
      this.centavos = '00';
      return;
    }
    this.centavos = this.centavos.padStart(2, '0').slice(0, 2);
  }

  abrirDatePicker(inputData: HTMLInputElement): void {
    if ('showPicker' in HTMLInputElement.prototype) {
      try {
        inputData.showPicker();
      } catch (e) {
        inputData.focus();
      }
    } else {
      inputData.focus();
    }
  }

  onDataChange(): void {
    if (!this.dataIso) {
      this.dataIso = new Date().toISOString().substring(0, 10);
    }
    this.atualizarDataExtenso();
  }

  abrirTimePicker(inputTime: HTMLInputElement): void {
    if ('showPicker' in HTMLInputElement.prototype) {
      try {
        inputTime.showPicker();
      } catch (e) {
        inputTime.focus();
      }
    } else {
      inputTime.focus();
    }
  }

  onHoraChange(): void {
    if (!this.horaIso) {
      this.horaIso = new Date().toTimeString().substring(0, 5);
    }
  }

  //ins
  onCategoriaChange(): void {
    if (!this.categoriaSelecionadaId) {
      this.exibirDescricaoCustomizada = false;
      this.descricaoCustomizada = '';
      return;
    }

    const categoria = this.categorias.find(
      c => c.id === Number(this.categoriaSelecionadaId)
    );

    this.exibirDescricaoCustomizada = !!categoria?.permite_descricao_livre;
    if (!this.exibirDescricaoCustomizada) {
      this.descricaoCustomizada = '';
    }
  }

  async salvar(): Promise<void> {
    if (!this.contaOrigemId || !this.contaDestinoId) {
      alert('Por favor, selecione as contas de origem e destino.');
      return;
    }

    if (this.contaOrigemId === this.contaDestinoId) {
      alert('A conta de origem e destino não podem ser iguais.');
      return;
    }

    const valInteiros = parseInt(this.inteiros || '0', 10);
    const valCentavos = parseInt(this.centavos || '0', 10);
    const valorTransferencia = (valInteiros * 100) + valCentavos;

    if (valorTransferencia <= 0) {
      alert('Por favor, informe um valor maior que zero.');
      return;
    }

    const dataHorarioIso = `${this.dataIso}T${this.horaIso}:00`;
    const origemId = Number(this.contaOrigemId);
    const destinoId = Number(this.contaDestinoId);

    const descCustomizadaValor = this.exibirDescricaoCustomizada && this.descricaoCustomizada.trim()
      ? this.descricaoCustomizada.trim()
      : null;

    try {
      await db.transaction('rw', [db.lancamentos, db.contas], async () => {
        const contaOrigem = await db.contas.get(origemId);
        const contaDestino = await db.contas.get(destinoId);

        if (!contaOrigem || !contaDestino) {
          throw new Error('Uma das contas selecionadas não foi encontrada.');
        }

        const novoLancamento: Lancamento = {
          datahorario: dataHorarioIso,
          origem_conta_id: origemId,
          destino_conta_id: destinoId,
          favorecido_id: null,
          categoria_id: this.categoriaSelecionadaId ? Number(this.categoriaSelecionadaId) : null,
          descricao_customizada: descCustomizadaValor,
          origem_montante: -valorTransferencia,
          destino_montante: valorTransferencia,
          nota: this.nota.trim() || null,
          ata_livro_caixa_id: this.ataLivroCaixaId,
          arredondamento_id: null,
          sincronizado: false,
          updatedAt: this.obterDataIsoLocal()
        };

        await db.lancamentos.add(novoLancamento);

        await db.contas.update(origemId, {
          saldo_atual: (contaOrigem.saldo_atual || 0) - valorTransferencia,
          updatedAt: this.obterDataIsoLocal()
        });

        await db.contas.update(destinoId, {
          saldo_atual: (contaDestino.saldo_atual || 0) + valorTransferencia,
          updatedAt: this.obterDataIsoLocal()
        });
      });

      // <-- PROCESSA A DÉCIMA AUTOMATICAMENTE APÓS CRIAR A TRANSFERÊNCIA -->
      await this.decimaService.processarDecimaParaAta(this.ataLivroCaixaId);

      this.cancelar();
    } catch (error) {
      console.error('Erro ao salvar transferência:', error);
      alert('Ocorreu um erro ao salvar a transferência.');
    }
  }

  cancelar(): void {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];

    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
    } else {
      this.location.back();
    }
  }

  private atualizarDataExtenso(): void {
    if (!this.dataIso) return;

    const [ano, mes, dia] = this.dataIso.split('-').map(Number);
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const nomeMes = meses[mes - 1] || '';
    this.dataExtenso = `${dia} de ${nomeMes} de ${ano}`;
  }

  private obterDataIsoLocal(): string {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    const segundos = String(agora.getSeconds()).padStart(2, '0');

    return `${ano}-${mes}-${dia}T${horas}:${minutos}:${segundos}`;
  }
}
