import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { InternalLayoutComponent } from '../../components/internal-layout/internal-layout.component';
import { ListaLancamentosComponent, ItemExtrato } from '../../components/lista-lancamentos/lista-lancamentos.component';
import { db } from '../../core/db/app-database';
import { Conta } from '../../models/conta.model';

@Component({
  selector: 'app-conta-extrato',
  standalone: true,
  imports: [
    CommonModule,
    InternalLayoutComponent,
    ListaLancamentosComponent
  ],
  templateUrl: './conta-extrato.component.html',
  styleUrls: ['./conta-extrato.component.scss']
})
export class ContaExtratoComponent implements OnInit {
  conta: Conta | null = null;
  lancamentosExtrato: ItemExtrato[] = [];
  carregando = true;

  constructor(
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    const contaIdParam = this.route.snapshot.paramMap.get('id');
    if (contaIdParam) {
      const contaId = Number(contaIdParam);
      await this.carregarExtratoDaConta(contaId);
    } else {
      this.carregando = false;
    }
  }

  async carregarExtratoDaConta(contaId: number): Promise<void> {
    try {
      this.carregando = true;

      // 1. Busca os dados da conta selecionada
      const contaEncontrada = await db.contas.get(contaId);
      this.conta = contaEncontrada || null;

      // 2. Mapeamentos auxiliares para os nomes
      const todasContas = await db.contas.toArray();
      const mapaContas = new Map<number, string>(todasContas.map(c => [c.id!, c.titulo]));

      const categorias = await db.categorias.toArray();
      const mapaCategorias = new Map<number, string>(categorias.map(c => [c.id!, c.titulo]));

      const favorecidos = await db.favorecidos.toArray();
      const mapaFavorecidos = new Map<number, string>(favorecidos.map(f => [f.id!, f.titulo]));

      // 3. Busca lançamentos onde a conta é a de Origem OU a de Destino
      const lancamentosBrutos = await db.lancamentos
        .filter(l => l.origem_conta_id === contaId || l.destino_conta_id === contaId)
        .toArray();

      // Ordenação decrescente por data/horário
      lancamentosBrutos.sort(
        (a, b) => new Date(b.datahorario).getTime() - new Date(a.datahorario).getTime()
      );

      // 4. Mapeamento para exibição no extrato da conta
      this.lancamentosExtrato = lancamentosBrutos.map((l) => {
        const orig = l.origem_montante || 0;
        const dest = l.destino_montante || 0;

        // É transferência se ambos os campos de montante estiverem preenchidos (diferentes de zero)
        const ehTransferencia = orig !== 0 && dest !== 0;

        let montanteEmCentavos = orig;
        let tipoMov: 'entrada' | 'saida' | 'transferencia' = 'entrada';

        if (ehTransferencia) {
          tipoMov = 'transferencia';

          if (l.origem_conta_id === contaId) {
            // Visão da Conta de Origem (saiu dinheiro -> valor negativo do origem_montante)
            montanteEmCentavos = orig;
          } else if (l.destino_conta_id === contaId) {
            // Visão da Conta de Destino (entrou dinheiro -> valor positivo do destino_montante)
            montanteEmCentavos = dest;
          }
        } else {
          // Lançamento normal (Receita/Despesa)
          montanteEmCentavos = orig || dest;
          tipoMov = montanteEmCentavos < 0 ? 'saida' : 'entrada';
        }

        const nomeOrigem = mapaContas.get(l.origem_conta_id) || 'Conta Removida';

        return {
          id: l.id!,
          datahorario: l.datahorario,
          nomeContaOrigem: nomeOrigem,
          tipoMovimentacao: tipoMov,
          categoriaNome: l.categoria_id ? mapaCategorias.get(l.categoria_id) : undefined,
          favorecidoNome: l.favorecido_id ? mapaFavorecidos.get(l.favorecido_id) : undefined,
          nota: l.nota || undefined,
          // Converte de centavos para reais mantendo o sinal original (+ ou -)
          montante: montanteEmCentavos / 100
        };
      });
    } catch (error) {
      console.error('Erro ao carregar extrato da conta:', error);
    } finally {
      this.carregando = false;
      this.cdr.detectChanges();
    }
  }
}
