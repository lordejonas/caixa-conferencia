import { Component, OnInit, inject } from '@angular/core';
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

  async ngOnInit(): Promise<void> {
    await this.carregarDados();
  }

  private async carregarDados(): Promise<void> {
    this.contas = await db.contas.filter(c => c.ativo !== false).toArray();
    if (this.contas.length > 0) {
      this.contaSelecionadaId = this.contas[0].id ?? null;
    }

    this.favorecidos = await db.favorecidos.filter(f => f.ativo !== false).toArray();
    this.categorias = await db.categorias.filter(c => c.ativo !== false).toArray();
  }

  // Alterna o sinal (+ / -)
  alternarSinal(): void {
    this.isDespesa = !this.isDespesa;
  }

  // Trata tecla digitada nos inteiros (pula para centavos ao apertar ponto ou vírgula)
  onInteirosInput(event: KeyboardEvent, elementCentavos: HTMLInputElement): void {
    if (event.key === '.' || event.key === ',') {
      event.preventDefault();
      elementCentavos.focus();
      elementCentavos.select();
    }
  }

  // Formata os centavos com 2 dígitos ao perder o foco
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
}
