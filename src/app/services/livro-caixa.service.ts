import { Injectable } from '@angular/core';
import { db } from '../core/db/app-database';
import { Categoria } from '../models/categoria.model';
import { Lancamento } from '../models/lancamento.model';

export interface OpcoesConsolidacaoAta {
  categorias: Categoria[];
  lancamentos: Lancamento[];
  valoresBase: { [id: number]: number };
  saldoFinalAtaAnterior: number | null;
  versaoLivro: string;
  /**
   * Quando true (usado na tela de detalhes), zera as categorias pai antes de somar
   * os lançamentos remanescentes para não duplicar valores.
   * Quando false (usado ao arquivar/deletar novos lançamentos no formulário),
   * soma os novos lançamentos sobre os valores já arquivados e reconsolida os pais.
   */
  zerarPaisAntesDeSomar?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LivroCaixaService {

  /**
   * Consolida lançamentos, agrupa subcategorias nas categorias Pai e
   * calcula todos os totalizadores oficiais (V1 e V2).
   */
  consolidarValoresAta(opcoes: OpcoesConsolidacaoAta): { [id: number]: number } {
    const {
      categorias,
      lancamentos,
      valoresBase,
      saldoFinalAtaAnterior,
      versaoLivro,
      zerarPaisAntesDeSomar = true
    } = opcoes;

    const versao = (versaoLivro || 'v1').toLowerCase();
    const mapa: { [id: number]: number } = { ...valoresBase };

    // Sempre zera os pais quando houver lançamentos a processar ou quando solicitado,
    // para que o somatório das filhas não seja acumulado duas vezes
    if (lancamentos.length > 0 || !zerarPaisAntesDeSomar) {
      for (const cat of categorias) {
        if (cat.pai) {
          mapa[Number(cat.pai)] = 0;
        }
      }
    }

    // Soma absoluta dos lançamentos (ignorando transferências entre contas)
    if (lancamentos.length > 0) {
      for (const lanc of lancamentos) {
        if (lanc.destino_conta_id !== null && lanc.destino_conta_id !== undefined) {
          continue;
        }
        if (!lanc.categoria_id) continue;

        const catId = Number(lanc.categoria_id);
        mapa[catId] = (mapa[catId] || 0) + Math.abs(lanc.origem_montante || 0);
      }

      // Consolida subcategorias nas categorias Pai (ex: 03.1 + 03.2 + 03.3 -> 03)
      for (const cat of categorias) {
        if (cat.id && cat.pai) {
          const paiId = Number(cat.pai);
          mapa[paiId] = (mapa[paiId] || 0) + (mapa[cat.id] || 0);
        }
      }
    }

    return this.aplicarTotalizadores(mapa, saldoFinalAtaAnterior, versao);
  }

  /**
   * Calcula todos os totalizadores (Linhas 06, 13, 14, 15, 28, 29, 30 e 34-36)
   * a partir do mapa de categorias já populado.
   */
  aplicarTotalizadores(
    mapaOrigem: { [id: number]: number },
    saldoFinalAtaAnterior: number | null,
    versaoLivro: string
  ): { [id: number]: number } {
    const mapa: { [id: number]: number } = { ...mapaOrigem };
    const versao = (versaoLivro || 'v1').toLowerCase();

    // 06-Subtotal (id: 10) = soma das linhas 01 a 05 (ids: 2, 3, 4, 8, 9)
    const subtotal06 = (mapa[2] || 0) + (mapa[3] || 0) + (mapa[4] || 0) + (mapa[8] || 0) + (mapa[9] || 0);
    mapa[10] = subtotal06;

    // 13-Soma da Receita da semana (id: 19) = linha 06 (10) + linhas 07 a 12 (ids: 11, 12, 15, 16, 17, 18)
    const somaReceita13 =
      subtotal06 +
      (mapa[11] || 0) +
      (mapa[12] || 0) +
      (mapa[15] || 0) +
      (mapa[16] || 0) +
      (mapa[17] || 0) +
      (mapa[18] || 0);
    mapa[19] = somaReceita13;

    // 14-Saldo anterior (id: 20)
    if (saldoFinalAtaAnterior !== null) {
      mapa[20] = saldoFinalAtaAnterior;
    } else if ((mapa[1] || 0) > 0 && !(mapa[20] > 0)) {
      mapa[20] = mapa[1];
    }
    const saldoAnterior14 = mapa[20] || 0;

    // 15-Total da Receita (V2 id: 21 | V1 id: 72) = linha 13 + linha 14
    const totalReceita15 = somaReceita13 + saldoAnterior14;
    mapa[21] = totalReceita15;
    mapa[72] = totalReceita15;

    // 28-Soma das despesas da semana (id: 47) = linhas 16 a 27 (ids: 22, 24, 27, 29, 30, 31, 39, 40, 41, 42, 43, 46)
    const somaDespesas28 =
      (mapa[22] || 0) +
      (mapa[24] || 0) +
      (mapa[27] || 0) +
      (mapa[29] || 0) +
      (mapa[30] || 0) +
      (mapa[31] || 0) +
      (mapa[39] || 0) +
      (mapa[40] || 0) +
      (mapa[41] || 0) +
      (mapa[42] || 0) +
      (mapa[43] || 0) +
      (mapa[46] || 0);
    mapa[47] = somaDespesas28;

    // 29-Saldo final (V1 id: 48 | V2 id: 73) = linha 15 - linha 28
    const saldoFinal29 = totalReceita15 - somaDespesas28;
    mapa[48] = saldoFinal29;
    mapa[73] = saldoFinal29;

    // 30-Balanço / Total Despesas + Saldo Final (V1 id: 49 | V2 id: 74) = linha 28 + linha 29
    const balanco30 = somaDespesas28 + saldoFinal29;
    mapa[49] = balanco30;
    mapa[74] = balanco30;

    // Linhas 34, 35 e 36 específicas por versão
    /*
    if (versao === 'v1') {
      // 34-Décimas a enviar (id: 75) = 10% do Subtotal 06 menos Décima já paga (id: 41)
      const decimaDevida = Math.round(subtotal06 * 0.10) - (mapa[41] || 0);
      mapa[75] = decimaDevida > 0 ? decimaDevida : 0;

      // 35-Outras contribuições a enviar (id: 77) = Linha 08 (id: 12) - Repasses efetuados (id: 43)
      const outrasContribuicoes = (mapa[12] || 0) - (mapa[43] || 0);
      mapa[77] = outrasContribuicoes > 0 ? outrasContribuicoes : 0;

      // 36-Total de recursos com a Tesouraria (id: 79) = linhas 29 + 34 + 35
      mapa[79] = saldoFinal29 + (mapa[75] || 0) + (mapa[77] || 0);
    } else {
      // V2: 34-Total das Receitas (=Nº 15) (id: 76)
      mapa[76] = totalReceita15;
      // V2: 35-Total das Despesas (=Nº 30) (id: 78)
      mapa[78] = balanco30;
      // V2: 36-Saldo disponível ou déficit acumulado (id: 80) = Nº 15 - Nº 30
      mapa[80] = totalReceita15 - balanco30;
    }
    */

    // Linhas 34, 35 e 36 específicas por versão
    if (versao === 'v1') {
      // 34 (id: 75) = Saldo da conta 'Décima' capturado ao salvar a Ata
      mapa[75] = mapa[75] || 0;

      // 35 (id: 77) = Saldo da conta 'Conselhos' capturado ao salvar a Ata
      mapa[77] = mapa[77] || 0;

      // 36 (id: 79) = Linha 29 (Saldo final) + Linha 34 + Linha 35
      mapa[79] = saldoFinal29 + mapa[75] + mapa[77];
    } else {
      // V2: 34-Total das Receitas (=Nº 15) (id: 76)
      mapa[76] = totalReceita15;
      // V2: 35-Total das Despesas (=Nº 30) (id: 78)
      mapa[78] = balanco30;
      // V2: 36-Saldo disponível ou déficit acumulado (id: 80) = Nº 15 - Nº 30
      mapa[80] = totalReceita15 - balanco30;
    }

    return mapa;
  }

  /**
   * Extrai o Saldo Final (Linha 29) de um mapa de valores já calculado.
   */
  extrairSaldoFinal(valoresCategorias: { [id: number]: number }, versaoLivro: string): number {
    const versao = (versaoLivro || 'v1').toLowerCase();
    return versao === 'v2'
      ? (valoresCategorias[73] ?? valoresCategorias[48] ?? 0)
      : (valoresCategorias[48] ?? valoresCategorias[73] ?? 0);
  }

  /**
   * Propaga em cascata o Saldo Final (Linha 29) de uma Ata alterada
   * para o Saldo Anterior (Linha 14) de todas as Atas posteriores (id > ataBaseId),
   * recalculando os totalizadores de cada uma em ordem crescente.
   */
  async recalcularAtasPosteriores(
    ataBaseId: number,
    saldoFinalBaseCentavos: number
  ): Promise<void> {
    const atasPosteriores = await db.livros_caixas
      .where('id')
      .above(ataBaseId)
      .sortBy('id');

    if (atasPosteriores.length === 0) return;

    let saldoAnteriorAtual = saldoFinalBaseCentavos;
    const agoraIso = new Date().toISOString();

    for (const ata of atasPosteriores) {
      if (!ata.id) continue;

      const versao = (ata.versaoLivro || 'v1').toLowerCase();
      const mapaAtualizado = this.aplicarTotalizadores(
        ata.valoresCategorias || {},
        saldoAnteriorAtual,
        versao
      );

      await db.livros_caixas.update(ata.id, {
        valoresCategorias: mapaAtualizado,
        sincronizado: false,
        updatedAt: agoraIso
      });

      saldoAnteriorAtual = this.extrairSaldoFinal(mapaAtualizado, versao);
    }
  }
}
