import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { db } from '../../core/db/app-database';
import { Conta } from '../../models/conta.model';
import { Favorecido } from '../../models/favorecido.model';
import { Categoria } from '../../models/categoria.model';
import { Lancamento } from '../../models/lancamento.model';
import { DecimaAutocontrolService } from '../../services/decima-autocontrol.service';
import { ArredondamentoAutocontrolService } from '../../services/arredondamento-autocontrol.service';
import { CategoriaEspelhadaAutocontrolService } from '../../services/categoria-automatica-autocontrol.service';

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
  private route = inject(ActivatedRoute);
  private decimaService = inject(DecimaAutocontrolService);
  private arredondamentoService = inject(ArredondamentoAutocontrolService);
  private categoriaEspelhadaService = inject(CategoriaEspelhadaAutocontrolService);
  private router = inject(Router);

  // Controle de Edição
  idEdicao: number | null = null;
  private montanteOriginal: number = 0;
  private ataAntigaId: number | null = null; // Armazena a ata anterior na edição

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

  descricaoCustomizada: string = '';
  exibirDescricaoCustomizada: boolean = false;

  async ngOnInit(): Promise<void> {
    this.atualizarDataExtenso();
    await this.carregarDados();
  }

  private async carregarDados(): Promise<void> {
    const idRoute = this.route.snapshot.paramMap.get('id');
    if (idRoute) {
      this.idEdicao = Number(idRoute);
    }

    const queryParams = this.route.snapshot.queryParams;
    const contaIdQuery = queryParams['contaId'] ? Number(queryParams['contaId']) : null;
    const categoriaNomeQuery = queryParams['categoriaNome'] as string | undefined;

    this.contas = await db.contas.filter(c => c.ativo !== false).toArray();
    this.favorecidos = await db.favorecidos.filter(f => f.ativo !== false).toArray();
    this.categorias = await db.categorias
      .filter(c => {
        if (c.ativo === false) return false;
        if (categoriaNomeQuery && c.titulo === categoriaNomeQuery) return true;
        return c.auto === false;
      })
      .toArray();

    if (this.idEdicao) {
      const lancamento = await db.lancamentos.get(this.idEdicao);
      if (lancamento) {
        if (lancamento.datahorario) {
          const [dataPart, horaPart] = lancamento.datahorario.split('T');
          this.dataIso = dataPart;
          this.horaIso = horaPart ? horaPart.substring(0, 5) : '00:00';
          this.atualizarDataExtenso();
        }

        this.contaSelecionadaId = lancamento.origem_conta_id;
        this.favorecidoSelecionadoId = lancamento.favorecido_id ?? null;
        this.categoriaSelecionadaId = lancamento.categoria_id ?? null;
        //ins
        this.descricaoCustomizada = lancamento.descricao_customizada || '';
        this.verificarPermissaoDescricaoCustomizada();

        this.nota = lancamento.nota || '';
        this.ataLivroCaixaId = lancamento.ata_livro_caixa_id ?? null;
        this.ataAntigaId = lancamento.ata_livro_caixa_id ?? null;

        const valCentavosAbs = Math.abs(lancamento.origem_montante);
        this.montanteOriginal = lancamento.origem_montante;
        this.isDespesa = lancamento.origem_montante < 0;

        const valorInteiro = Math.floor(valCentavosAbs / 100);
        const valorCentavos = valCentavosAbs % 100;

        this.inteiros = valorInteiro > 0 ? String(valorInteiro) : '';
        this.centavos = String(valorCentavos).padStart(2, '0');
      }
    } else {
      if (contaIdQuery && this.contas.some(c => c.id === contaIdQuery)) {
        this.contaSelecionadaId = contaIdQuery;
      } else if (this.contas.length > 0 && this.contas[0].id !== undefined) {
        this.contaSelecionadaId = this.contas[0].id;
      }

      if (categoriaNomeQuery) {
        const catEncontrada = this.categorias.find(c => c.titulo === categoriaNomeQuery);
        if (catEncontrada && catEncontrada.id) {
          this.categoriaSelecionadaId = catEncontrada.id;
          this.onCategoriaChange();
        }
      }
    }

    this.cdr.detectChanges();
  }

  alternarSinal(): void {
    this.isDespesa = !this.isDespesa;
  }

  onCategoriaChange(): void {
    //ins
    this.verificarPermissaoDescricaoCustomizada();

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

  //ins
  verificarPermissaoDescricaoCustomizada(): void {
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
    let idLancamentoSalvo: number | null = null;

    const descCustomizadaValor = this.exibirDescricaoCustomizada && this.descricaoCustomizada.trim()
      ? this.descricaoCustomizada.trim()
      : null;

    try {
      await db.transaction('rw', [db.lancamentos, db.contas], async () => {
        const conta = await db.contas.get(contaId);

        if (!conta) {
          throw new Error('Conta selecionada não foi encontrada no banco de dados.');
        }

        if (this.idEdicao) {
          // --- MODO EDIÇÃO ---
          const lancamentoExistente = await db.lancamentos.get(this.idEdicao);
          const contaAntigaId = lancamentoExistente?.origem_conta_id;

          await db.lancamentos.update(this.idEdicao, {
            datahorario: dataHorarioIso,
            origem_conta_id: contaId,
            favorecido_id: this.favorecidoSelecionadoId ? Number(this.favorecidoSelecionadoId) : null,
            categoria_id: this.categoriaSelecionadaId ? Number(this.categoriaSelecionadaId) : null,
            descricao_customizada: descCustomizadaValor,
            origem_montante: totalCentavos,
            nota: this.nota.trim() || null,
            sincronizado: false,
            updatedAt: this.obterDataIsoLocal()
          });

          idLancamentoSalvo = this.idEdicao;

          if (contaAntigaId === contaId) {
            const diferencaMontante = totalCentavos - this.montanteOriginal;
            await db.contas.update(contaId, {
              saldo_atual: (conta.saldo_atual || 0) + diferencaMontante,
              updatedAt: this.obterDataIsoLocal()
            });
          } else {
            if (contaAntigaId) {
              const contaAntiga = await db.contas.get(contaAntigaId);
              if (contaAntiga) {
                await db.contas.update(contaAntigaId, {
                  saldo_atual: (contaAntiga.saldo_atual || 0) - this.montanteOriginal,
                  updatedAt: this.obterDataIsoLocal()
                });
              }
            }
            await db.contas.update(contaId, {
              saldo_atual: (conta.saldo_atual || 0) + totalCentavos,
              updatedAt: this.obterDataIsoLocal()
            });
          }
        } else {
          // --- MODO INSERÇÃO ---
          const novoLancamento: Lancamento = {
            datahorario: dataHorarioIso,
            origem_conta_id: contaId,
            destino_conta_id: null,
            favorecido_id: this.favorecidoSelecionadoId ? Number(this.favorecidoSelecionadoId) : null,
            categoria_id: this.categoriaSelecionadaId ? Number(this.categoriaSelecionadaId) : null,
            descricao_customizada: descCustomizadaValor,
            origem_montante: totalCentavos,
            destino_montante: 0,
            nota: this.nota.trim() || null,
            ata_livro_caixa_id: this.ataLivroCaixaId,
            arredondamento_id: null,
            sincronizado: false,
            updatedAt: this.obterDataIsoLocal()
          };

          idLancamentoSalvo = await db.lancamentos.add(novoLancamento);

          const saldoAtualizado = (conta.saldo_atual || 0) + totalCentavos;

          await db.contas.update(contaId, {
            saldo_atual: saldoAtualizado,
            updatedAt: this.obterDataIsoLocal()
          });
        }
      });

      if (idLancamentoSalvo) {
        // --- 1. RECALCULAR O ARREDONDAMENTO ---
        await this.arredondamentoService.processarArredondamento(idLancamentoSalvo);

        // --- 2. RECALCULAR O LANÇAMENTO ESPELHADO DE CATEGORIA ---
        await this.categoriaEspelhadaService.processarCategoriaEspelhada(idLancamentoSalvo);
      }

      // --- 3. RECALCULAR A DÉCIMA (10%) ---
      await this.decimaService.processarDecimaParaAta(this.ataLivroCaixaId);

      if (this.idEdicao && (this.ataAntigaId ?? null) !== (this.ataLivroCaixaId ?? null)) {
        await this.decimaService.processarDecimaParaAta(this.ataAntigaId);
      }

      this.cancelar();
    } catch (error) {
      console.error('Erro ao salvar lançamento:', error);
      alert('Ocorreu um erro ao salvar o lançamento.');
    }
  }

  cancelar(): void {
    // 1. Tenta pegar a URL de retorno exata enviada quem abriu o formulário
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];

    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
    } else {
      // 2. Fallback usando o Location.back() padrão do navegador
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
