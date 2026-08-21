import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  // Listas dos Selects
  contas: Conta[] = [];
  favorecidos: Favorecido[] = [];
  categorias: Categoria[] = [];

  // Estado do Formulário
  ataLivroCaixaId: number | null = null;
  dataIso: string = new Date().toISOString().substring(0, 10); // YYYY-MM-DD
  horaIso: string = new Date().toTimeString().substring(0, 5);  // HH:mm

  contaSelecionadaId: number | null = null;
  favorecidoSelecionadoId: number | null = null;
  categoriaSelecionadaId: number | null = null;

  isDespesa: boolean = true; // true = "-", false = "+"
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
    const listaContas = await db.contas.filter(c => c.ativo !== false).toArray();
    this.contas = listaContas;

    // Garante a atribuição do id da primeira conta se houver registros
    if (this.contas.length > 0 && this.contas[0].id !== undefined) {
      this.contaSelecionadaId = this.contas[0].id;
    }

    this.favorecidos = await db.favorecidos.filter(f => f.ativo !== false).toArray();

    //Filtra apenas categorias ativas e com auto === false
    this.categorias = await db.categorias
      .filter(c => c.ativo !== false && c.auto === false)
      .toArray();

    //Força a atualização do template após a Promise resolver do banco
    this.cdr.detectChanges();
  }

  // Alterna o sinal (+ / -)
  alternarSinal(): void {
    this.isDespesa = !this.isDespesa;
  }

  // Chamado quando o usuário escolhe uma categoria no select
  onCategoriaChange(): void {
    if (!this.categoriaSelecionadaId) return;

    // Encontra a categoria selecionada na lista carregada
    const categoria = this.categorias.find(
      c => c.id === Number(this.categoriaSelecionadaId)
    );

    if (categoria && categoria.positivo !== undefined) {
      // Se positivo === true -> isDespesa = false (sinal '+')
      // Se positivo === false -> isDespesa = true (sinal '-')
      this.isDespesa = !categoria.positivo;
    }
  }

  // Intercepta a tentativa de digitar ponto ou vírgula ANTES do valor entrar no campo
  onBeforeInputInteiros(event: InputEvent, elementCentavos: HTMLInputElement): void {
    const charInserido = event.data;

    // Se o usuário digitou ponto ou vírgula no teclado virtual/físico
    if (charInserido === '.' || charInserido === ',') {
      event.preventDefault(); // Impede totalmente o caractere de entrar no campo
      elementCentavos.focus();
      elementCentavos.select(); // Pula direto para o campo de centavos
    }
  }

  // Sanitização estrita em tempo real contra colar valores ou caracteres não numéricos
  onInteirosInput(event: Event): void {
    const inputEl = event.target as HTMLInputElement;

    // Remove imediatamente qualquer caractere que NÃO seja número
    const valorLimpo = inputEl.value.replace(/\D/g, '');

    // Sincroniza a propriedade da classe e força o elemento HTML a refletir apenas números
    this.inteiros = valorLimpo;
    inputEl.value = valorLimpo;
  }

  // Seleciona todo o texto automaticamente ao focar (sobrescreve '00' ao digitar)
  onCentavosFocus(event: FocusEvent): void {
    const inputEl = event.target as HTMLInputElement;
    inputEl.select();
  }

  // Cancela e ignora a tecla de ponto, vírgula ou sinais no campo de centavos
  onBeforeInputCentavos(event: InputEvent): void {
    const charInserido = event.data;

    if (charInserido === '.' || charInserido === ',') {
      event.preventDefault(); // Impede totalmente a inserção do caractere
    }
  }

  // Sanitiza em tempo real para permitir APENAS números
  onCentavosInput(event: Event): void {
    const inputEl = event.target as HTMLInputElement;

    // Mantém apenas os dígitos numéricos
    const valorLimpo = inputEl.value.replace(/\D/g, '');

    this.centavos = valorLimpo;
    inputEl.value = valorLimpo;
  }

  // Garante o formato de 2 dígitos ao sair do campo
  formatarCentavos(): void {
    if (!this.centavos) {
      this.centavos = '00';
      return;
    }
    this.centavos = this.centavos.padStart(2, '0').slice(0, 2);
  }

  // Abertura / Fechamento do Modal
  abrirModalFavorecido(): void {
    this.novoFavorecidoNome = '';
    this.exibirModalFavorecido = true;
  }

  fecharModalFavorecido(): void {
    this.exibirModalFavorecido = false;
    this.novoFavorecidoNome = '';
  }

  // Adicione o método para abrir o picker ao clicar na div
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

  // Método chamado sempre que o valor do input tipo date mudar
  onDataChange(): void {
    // Se o usuário clicar em "Limpar" ou a data vier vazia, restaura para a data atual
    if (!this.dataIso) {
      this.dataIso = new Date().toISOString().substring(0, 10);
    }
    this.atualizarDataExtenso();
  }

  // Dispara o Time Picker ao clicar na div
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

  // Garante que o campo de horário nunca fique vazio ao clicar em 'Limpar'
  onHoraChange(): void {
    if (!this.horaIso) {
      this.horaIso = new Date().toTimeString().substring(0, 5); // Fallback para horário atual (HH:mm)
    }
  }

  // Salvar novo Favorecido (verifica duplicidade pelo nome)
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
        atualizadoEm: new Date().toISOString()
      };
      const idInserido = await db.favorecidos.add(novoFav);
      this.favorecidos.push({ ...novoFav, id: idInserido });
      this.favorecidoSelecionadoId = idInserido;
    }

    this.fecharModalFavorecido();
  }

  // Salvar a Transação
  async salvar(): Promise<void> {
    if (!this.contaSelecionadaId) {
      alert('Por favor, selecione uma conta.');
      return;
    }

    const valInteiros = parseInt(this.inteiros || '0', 10);
    const valCentavos = parseInt(this.centavos || '0', 10);
    let totalCentavos = (valInteiros * 100) + valCentavos;

    // Se for despesa (-), o valor entra negativo
    if (this.isDespesa) {
      totalCentavos = -Math.abs(totalCentavos);
    } else {
      totalCentavos = Math.abs(totalCentavos);
    }

    const dataHorarioIso = new Date(`${this.dataIso}T${this.horaIso}:00`).toISOString();

    const novoLancamento: Lancamento = {
      datahorario: dataHorarioIso,
      origem_conta_id: this.contaSelecionadaId,
      destino_conta_id: null,
      favorecido_id: this.favorecidoSelecionadoId ? Number(this.favorecidoSelecionadoId) : null,
      categoria_id: this.categoriaSelecionadaId ? Number(this.categoriaSelecionadaId) : null,
      origem_montante: totalCentavos,
      destino_montante: 0,
      nota: this.nota.trim() || null,
      ata_livro_caixa_id: this.ataLivroCaixaId,
      arredondamento_id: null,
      sincronizado: false,
      updatedAt: new Date().toISOString()
    };

    await db.lancamentos.add(novoLancamento);
    this.cancelar();
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
}
