import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router'; // Injetado
import { db } from '../../core/db/app-database';
import { Conta } from '../../models/conta.model';
import { Favorecido } from '../../models/favorecido.model';
import { Categoria } from '../../models/categoria.model';
import { Lancamento } from '../../models/lancamento.model';

@Component({
  selector: 'app-transacao-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transacao-form.component.html',
  styleUrls: ['./transacao-form.component.scss']
})
export class TransacaoFormComponent implements OnInit {
  private location = inject(Location);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute); // Injeção do ActivatedRoute

  // Listas dos Selects
  contas: Conta[] = [];
  favorecidos: Favorecido[] = [];
  categorias: Categoria[] = [];

  // Estado do Formulário
  ataLivroCaixaId: number | null = null;
  dataIso: string = new Date().toISOString().substring(0, 10);
  horaIso: string = new Date().toTimeString().substring(0, 5);

  contaSelecionadaId: number | null = null;
  favorecidoSelecionadoId: number | null = null;
  categoriaSelecionadaId: number | null = null;

  isDespesa: boolean = true;
  inteiros: string = '';
  centavos: string = '00';
  nota: string = '';

  // Controle do Modal de Favorecido
  exibirModalFavorecido: boolean = false;
  novoFavorecidoNome: string = '';
  dataExtenso: string = '';

  async ngOnInit(): Promise<void> {
    this.atualizarDataExtenso();
    await this.carregarDados();
  }

  private async carregarDados(): Promise<void> {
    // 1. Ler parâmetros passados pela URL (queryParams)
    const queryParams = this.route.snapshot.queryParams;
    const contaIdQuery = queryParams['contaId'] ? Number(queryParams['contaId']) : null;
    const categoriaNomeQuery = queryParams['categoriaNome'] as string | undefined;

    // 2. Carregar Contas
    const listaContas = await db.contas.filter(c => c.ativo !== false).toArray();
    this.contas = listaContas;

    // Define a conta selecionada: se veio parâmetro na URL, usa ele; senão, pega a primeira
    if (contaIdQuery && this.contas.some(c => c.id === contaIdQuery)) {
      this.contaSelecionadaId = contaIdQuery;
    } else if (this.contas.length > 0 && this.contas[0].id !== undefined) {
      this.contaSelecionadaId = this.contas[0].id;
    }

    // 3. Carregar Favorecidos
    this.favorecidos = await db.favorecidos.filter(f => f.ativo !== false).toArray();

    // 4. Carregar Categorias
    // Permite buscar categorias ativas e não automáticas (auto === false),
    // OU explicitamente a categoria informada na URL (mesmo que auto === true)
    this.categorias = await db.categorias
      .filter(c => {
        if (c.ativo === false) return false;
        if (categoriaNomeQuery && c.titulo === categoriaNomeQuery) return true;
        return c.auto === false;
      })
      .toArray();

    // 5. Pre-selecionar a Categoria se enviada via URL
    if (categoriaNomeQuery) {
      const catEncontrada = this.categorias.find(c => c.titulo === categoriaNomeQuery);
      if (catEncontrada && catEncontrada.id) {
        this.categoriaSelecionadaId = catEncontrada.id;
        this.onCategoriaChange(); // Ajusta o sinal (+/-) automaticamente
      }
    }

    this.cdr.detectChanges();
  }

  alternarSinal(): void {
    this.isDespesa = !this.isDespesa;
  }

  onCategoriaChange(): void {
    if (!this.categoriaSelecionadaId) return;

    const categoria = this.categorias.find(
      c => c.id === Number(this.categoriaSelecionadaId)
    );

    if (categoria && categoria.positivo !== undefined) {
      this.isDespesa = !categoria.positivo;
    }
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

  abrirModalFavorecido(): void {
    this.novoFavorecidoNome = '';
    this.exibirModalFavorecido = true;
  }

  fecharModalFavorecido(): void {
    this.exibirModalFavorecido = false;
    this.novoFavorecidoNome = '';
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

  async salvarNovoFavorecido(): Promise<void> {
    const nomeTratado = this.novoFavorecidoNome.trim();
    if (!nomeTratado) {
      this.fecharModalFavorecido();
      return;
    }

    const existente = await db.favorecidos
      .filter(f => f.titulo.toLowerCase() === nomeTratado.toLowerCase())
      .first();

    if (existente && existente.id) {
      this.favorecidoSelecionadoId = existente.id;
    } else {
      const novoFav: Favorecido = {
        titulo: nomeTratado,
        ativo: true,
        sincronizado: false,
        atualizadoEm: this.obterDataIsoLocal()
      };
      const idInserido = await db.favorecidos.add(novoFav);
      this.favorecidos.push({ ...novoFav, id: idInserido });
      this.favorecidoSelecionadoId = idInserido;
    }

    this.fecharModalFavorecido();
  }

  async salvar(): Promise<void> {
    if (!this.contaSelecionadaId) {
      alert('Por favor, selecione uma conta.');
      return;
    }

    const valInteiros = parseInt(this.inteiros || '0', 10);
    const valCentavos = parseInt(this.centavos || '0', 10);
    let totalCentavos = (valInteiros * 100) + valCentavos;

    if (this.isDespesa) {
      totalCentavos = -Math.abs(totalCentavos);
    } else {
      totalCentavos = Math.abs(totalCentavos);
    }

    const dataHorarioIso = `${this.dataIso}T${this.horaIso}:00`;
    const contaId = Number(this.contaSelecionadaId);

    try {
      await db.transaction('rw', [db.lancamentos, db.contas], async () => {
        const conta = await db.contas.get(contaId);

        if (!conta) {
          throw new Error('Conta selecionada não foi encontrada no banco de dados.');
        }

        const novoLancamento: Lancamento = {
          datahorario: dataHorarioIso,
          origem_conta_id: contaId,
          destino_conta_id: null,
          favorecido_id: this.favorecidoSelecionadoId ? Number(this.favorecidoSelecionadoId) : null,
          categoria_id: this.categoriaSelecionadaId ? Number(this.categoriaSelecionadaId) : null,
          origem_montante: totalCentavos,
          destino_montante: 0,
          nota: this.nota.trim() || null,
          ata_livro_caixa_id: this.ataLivroCaixaId,
          arredondamento_id: null,
          sincronizado: false,
          updatedAt: this.obterDataIsoLocal()
        };

        await db.lancamentos.add(novoLancamento);

        const saldoAtualizado = (conta.saldo_atual || 0) + totalCentavos;

        await db.contas.update(contaId, {
          saldo_atual: saldoAtualizado,
          updatedAt: this.obterDataIsoLocal()
        });
      });

      this.cancelar();
    } catch (error) {
      console.error('Erro ao salvar lançamento:', error);
      alert('Ocorreu um erro ao salvar o lançamento.');
    }
  }

  cancelar(): void {
    this.location.back();
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
