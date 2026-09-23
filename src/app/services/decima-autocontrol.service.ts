import { Injectable } from '@angular/core';
import { db } from '../core/db/app-database';
import { Lancamento } from '../models/lancamento.model';

@Injectable({
  providedIn: 'root'
})
export class DecimaAutocontrolService {

  private readonly CATEGORIA_DECIMA_NOME = '24-Décima paga ao Conselho Particular';
  private readonly CONTA_DECIMA_NOME = 'Décima';

  async processarDecimaParaAta(ataId: number | null | undefined): Promise<void> {
    const ataTarget = ataId ?? null;

    // 1. Carregar listas do Dexie
    const contas = await db.contas.toArray();
    const categorias = await db.categorias.toArray();

    // 2. Identificar Conta "Décima"
    const contaDecima = contas.find(c => c.titulo.trim().toLowerCase() === this.CONTA_DECIMA_NOME.toLowerCase());
    if (!contaDecima || contaDecima.id === undefined) {
      console.warn(`Conta "${this.CONTA_DECIMA_NOME}" não encontrada. O lançamento de décima não pôde ser gerado.`);
      return;
    }
    const contaDecimaId = contaDecima.id;

    // 3. Mapear categorias decimáveis (decimavel === true)
    const idsCategoriasDecimaveis = new Set(
      categorias.filter(c => c.decimavel === true).map(c => c.id)
    );

    const categoriaDecima = categorias.find(c => c.titulo === this.CATEGORIA_DECIMA_NOME);
    const categoriaDecimaId = categoriaDecima?.id ?? null;

    // 4. Buscar lançamentos do banco que pertençam à ata desejada
    const todosLancamentosAta = await db.lancamentos
      .filter(l => (l.ata_livro_caixa_id ?? null) === ataTarget)
      .toArray();

    // Filtrar apenas os decimáveis (transações normais ou transferências, ignorando a décima automática)
    const lancamentosDecimaveisAta = todosLancamentosAta.filter(l => {
      const eDecimavel = l.categoria_id != null && idsCategoriasDecimaveis.has(l.categoria_id);
      const naoEDecima = l.categoria_id !== categoriaDecimaId;
      return eDecimavel && naoEDecima;
    });

    const decimaExistente = todosLancamentosAta.find(l => l.categoria_id === categoriaDecimaId);

    // 5. Se NÃO houverem lançamentos decimáveis para essa ata:
    if (lancamentosDecimaveisAta.length === 0) {
      if (decimaExistente && decimaExistente.id !== undefined) {
        await db.transaction('rw', [db.lancamentos, db.contas], async () => {
          const montanteExistente = decimaExistente.origem_montante || 0;
          const conta = await db.contas.get(contaDecimaId);
          if (conta) {
            await db.contas.update(contaDecimaId, {
              saldo_atual: (conta.saldo_atual || 0) - montanteExistente,
              updatedAt: this.obterDataIsoLocal()
            });
          }
          await db.lancamentos.delete(decimaExistente.id!);
        });
      }
      return;
    }

    // 6. Soma o valor absoluto de origem_montante (para pegar 10% tanto de entradas/saídas quanto de transferências)
    const somaTotalCentavos = lancamentosDecimaveisAta.reduce((acc, l) => acc + Math.abs(l.origem_montante || 0), 0);
    const valorDecimaCentavos = -Math.round(somaTotalCentavos * 0.10);

    // 7. Determinar a data do lançamento decimável mais recente
    const ultimaDataIso = this.obterUltimaDataFormatada(lancamentosDecimaveisAta);

    // 8. Executar Transação (Criar ou Atualizar a Décima)
    await db.transaction('rw', [db.lancamentos, db.contas], async () => {
      const conta = await db.contas.get(contaDecimaId);
      if (!conta) return;

      if (decimaExistente && decimaExistente.id !== undefined) {
        const montanteAnterior = decimaExistente.origem_montante || 0;
        const diferencaSaldo = valorDecimaCentavos - montanteAnterior;

        await db.lancamentos.update(decimaExistente.id, {
          origem_montante: valorDecimaCentavos,
          destino_montante: 0,
          datahorario: ultimaDataIso,
          sincronizado: false,
          updatedAt: this.obterDataIsoLocal()
        });

        await db.contas.update(contaDecimaId, {
          saldo_atual: (conta.saldo_atual || 0) + diferencaSaldo,
          updatedAt: this.obterDataIsoLocal()
        });

      } else {
        const novoLancamentoDecima: Lancamento = {
          categoria_id: categoriaDecimaId,
          origem_conta_id: contaDecimaId,
          destino_conta_id: null,
          origem_montante: valorDecimaCentavos,
          destino_montante: 0,
          datahorario: ultimaDataIso,
          ata_livro_caixa_id: ataTarget,
          nota: 'Décima automática (10%)',
          sincronizado: false,
          updatedAt: this.obterDataIsoLocal()
        };

        await db.lancamentos.add(novoLancamentoDecima);

        await db.contas.update(contaDecimaId, {
          saldo_atual: (conta.saldo_atual || 0) + valorDecimaCentavos,
          updatedAt: this.obterDataIsoLocal()
        });
      }
    });
  }

  private obterUltimaDataFormatada(lancamentos: Lancamento[]): string {
    const datas = lancamentos.map(l => new Date(l.datahorario).getTime());
    const maiorTimestamp = Math.max(...datas);

    const d = new Date(maiorTimestamp);
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}T23:55:00`;
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
