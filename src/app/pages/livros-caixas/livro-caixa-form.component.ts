import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { db } from '../../core/db/app-database';
import { LivroCaixa } from '../../models/livro-caixa.model';
import { ConfigService } from '../../services/config.service';
import { InternalLayoutComponent } from '../../components/internal-layout/internal-layout.component';

@Component({
  selector: 'app-livro-caixa-form',
  standalone: true,
  imports: [CommonModule, FormsModule, InternalLayoutComponent],
  templateUrl: './livro-caixa-form.component.html',
  styleUrl: './livro-caixa-form.component.scss'
})
export class LivroCaixaFormComponent implements OnInit {
  private location = inject(Location);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private configService = inject(ConfigService);
  private cdr = inject(ChangeDetectorRef);

  isSalvando: boolean = false;
  idEdicao: number | null = null;

  // Campos do Formulário
  numeroAta: number | null = null;
  dataIso: string = new Date().toISOString().substring(0, 10);
  horaIso: string = new Date().toTimeString().substring(0, 5);

  // Saldo Anterior (Linha 14 - ID 20)
  saldoAnteriorReais: string = '';
  possuiAtaAnterior: boolean = false;

  // Assistência (inicializados como null para carregar em branco)
  familiasAjudaMaterial: number | null = null;
  familiasAjudaEspiritual: number | null = null;
  totalPessoasAssistidas: number | null = null;

  // Presença (inicializados como null para carregar em branco)
  confrades: number | null = null;
  consorcias: number | null = null;
  aspirantes: number | null = null;
  visitantes: number | null = null;

  // Bens Materiais Distribuídos (Linhas 31, 32 e 33 -> IDs 50, 51 e 52)
  cestasBasicasKg: number | null = null;
  roupasCalcadosUnid: number | null = null;
  outrosBensMateriais: number | null = null;

  // Mantém os valores das categorias caso esteja em modo de edição
  private valoresCategoriasExistentes: { [categoriaId: number]: number } = {};

  async ngOnInit(): Promise<void> {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.idEdicao = Number(idParam);
      await this.carregarDadosEdicao(this.idEdicao);
    } else {
      await this.sugerirProximoNumeroAta();
    }

    if (this.numeroAta) {
      await this.atualizarSaldoAnteriorAutomatico(this.numeroAta);
    }

    this.cdr.detectChanges();
  }

  private async sugerirProximoNumeroAta(): Promise<void> {
    const ultimoLivro = await db.livros_caixas.orderBy('id').last();
    this.numeroAta = ultimoLivro && ultimoLivro.id ? ultimoLivro.id + 1 : 1;
  }

  private async carregarDadosEdicao(id: number): Promise<void> {
    const livro = await db.livros_caixas.get(id);
    if (livro) {
      this.numeroAta = livro.id ?? id;
      if (livro.dataReuniao) {
        const [dataPart, horaPart] = livro.dataReuniao.split('T');
        this.dataIso = dataPart;
        this.horaIso = horaPart ? horaPart.substring(0, 5) : '00:00';
      }
      this.familiasAjudaMaterial = livro.familiasAjudaMaterial || null;
      this.familiasAjudaEspiritual = livro.familiasAjudaEspiritual || null;
      this.totalPessoasAssistidas = livro.totalPessoasAssistidas || null;

      this.confrades = livro.confrades || null;
      this.consorcias = livro.consorcias || null;
      this.aspirantes = livro.aspirantes || null;
      this.visitantes = livro.visitantes || null;

      this.valoresCategoriasExistentes = livro.valoresCategorias || {};
      this.cestasBasicasKg = this.valoresCategoriasExistentes[50] || null;
      this.roupasCalcadosUnid = this.valoresCategoriasExistentes[51] || null;
      this.outrosBensMateriais = this.valoresCategoriasExistentes[52] || null;
    }
  }

  async aoAlterarNumeroAta(): Promise<void> {
    if (this.numeroAta && this.numeroAta > 0) {
      await this.atualizarSaldoAnteriorAutomatico(Number(this.numeroAta));
      this.cdr.detectChanges();
    }
  }

  private async atualizarSaldoAnteriorAutomatico(numeroAtaAtual: number): Promise<void> {
    const atasAnteriores = await db.livros_caixas
      .where('id')
      .below(numeroAtaAtual)
      .sortBy('id');

    if (atasAnteriores.length > 0) {
      this.possuiAtaAnterior = true;
      const ataAnterior = atasAnteriores[atasAnteriores.length - 1];
      const versaoAnterior = (ataAnterior.versaoLivro || 'v1').toLowerCase();
      const saldoCentavos = versaoAnterior === 'v2'
        ? (ataAnterior.valoresCategorias?.[73] ?? ataAnterior.valoresCategorias?.[48] ?? 0)
        : (ataAnterior.valoresCategorias?.[48] ?? ataAnterior.valoresCategorias?.[73] ?? 0);

      this.saldoAnteriorReais = (saldoCentavos / 100).toFixed(2).replace('.', ',');
    } else {
      this.possuiAtaAnterior = false;
      const saldoSalvo = this.valoresCategoriasExistentes[20] || 0;
      this.saldoAnteriorReais = saldoSalvo > 0
        ? (saldoSalvo / 100).toFixed(2).replace('.', ',')
        : '';
    }
  }

  private converterReaisParaCentavos(valorTexto: string): number {
    if (!valorTexto) return 0;
    const limpo = valorTexto.toString().replace(/\./g, '').replace(',', '.').trim();
    const numero = parseFloat(limpo);
    return isNaN(numero) ? 0 : Math.round(numero * 100);
  }

  // Getters calculados dinamicamente
  get totalFamiliasAssistidas(): number {
    return (Number(this.familiasAjudaMaterial) || 0) + (Number(this.familiasAjudaEspiritual) || 0);
  }

  get totalPresentesReuniao(): number {
    return (
      (Number(this.confrades) || 0) +
      (Number(this.consorcias) || 0) +
      (Number(this.aspirantes) || 0) +
      (Number(this.visitantes) || 0)
    );
  }

  async salvar(): Promise<void> {
    if (this.isSalvando) return;

    if (!this.numeroAta || this.numeroAta <= 0) {
      alert('Por favor, informe um Número de Ata válido.');
      return;
    }

    if (!this.dataIso || !this.horaIso) {
      alert('Por favor, informe a data e hora da reunião.');
      return;
    }

    this.isSalvando = true;

    try {
      const numeroAtaNumerico = Number(this.numeroAta);

      if (!this.idEdicao) {
        const ataExistente = await db.livros_caixas.get(numeroAtaNumerico);
        if (ataExistente) {
          alert(`Já existe um registro cadastrado para a Ata nº ${numeroAtaNumerico}.`);
          this.isSalvando = false;
          return;
        }
      }

      // Se existir Ata anterior, garante a leitura dela; se não existir, respeita o valor digitado no campo!
      if (this.possuiAtaAnterior) {
        await this.atualizarSaldoAnteriorAutomatico(numeroAtaNumerico);
      }
      const saldoAnteriorCentavos = this.converterReaisParaCentavos(this.saldoAnteriorReais);

      // Tipagem explícita { [categoriaId: number]: number } resolve o erro TS7053
      const valoresAtualizados: { [categoriaId: number]: number } = {
        ...this.valoresCategoriasExistentes,
        20: saldoAnteriorCentavos, // 14-Saldo anterior
        50: Number(this.cestasBasicasKg) || 0,
        51: Number(this.roupasCalcadosUnid) || 0,
        52: Number(this.outrosBensMateriais) || 0
      };

      if (!this.idEdicao) {
        valoresAtualizados[21] = saldoAnteriorCentavos; // 15-Total Receita (V2)
        valoresAtualizados[72] = saldoAnteriorCentavos; // 15-Balanço (V1)
        valoresAtualizados[48] = saldoAnteriorCentavos; // 29-Saldo Final (V1)
        valoresAtualizados[73] = saldoAnteriorCentavos; // 29-Saldo Final (V2)
      }

      const versaoAtual = this.configService.obterVersaoLivro().toLowerCase();
      const dataReuniaoIso = `${this.dataIso}T${this.horaIso}:00`;

      const registro: LivroCaixa = {
        id: numeroAtaNumerico,
        dataReuniao: dataReuniaoIso,
        familiasAjudaMaterial: Number(this.familiasAjudaMaterial) || 0,
        familiasAjudaEspiritual: Number(this.familiasAjudaEspiritual) || 0,
        totalPessoasAssistidas: Number(this.totalPessoasAssistidas) || 0,
        confrades: Number(this.confrades) || 0,
        consorcias: Number(this.consorcias) || 0,
        aspirantes: Number(this.aspirantes) || 0,
        visitantes: Number(this.visitantes) || 0,
        valoresCategorias: valoresAtualizados,
        versaoLivro: versaoAtual,
        sincronizado: false,
        updatedAt: new Date().toISOString()
      };

      await db.livros_caixas.put(registro);

      this.router.navigate(['/caixa']);
    } catch (error) {
      console.error('Erro ao salvar Ata do Livro Caixa:', error);
      alert('Ocorreu um erro ao salvar a Ata.');
    } finally {
      this.isSalvando = false;
    }
  }

  cancelar(): void {
    this.location.back();
  }
}
