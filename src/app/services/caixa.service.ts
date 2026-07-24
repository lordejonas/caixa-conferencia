import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { LivroCaixa, TotaisCaixa, ItemLancamento } from '../models/livro-caixa.model';

const CAIXA_STORAGE_KEY = 'livro_caixa_ssvp';

@Injectable({
  providedIn: 'root'
})
export class CaixaService {

  constructor(private storageService: StorageService) { }

  /**
   * Retorna os dados padrão zerados
   */
  getDadosIniciaisPadrao(): LivroCaixa {
    return {
      dadosIniciais: {
        numeroAta: 0,
        dataReuniao: new Date().toISOString().substring(0, 10),
        saldoAnterior: 0,
        decimasAcumuladas: 0,
        repasseDecimas: 0,
        outrasContribuicoes: 0,
        repasseContribuicoes: 0
      },
      receitas: {},
      despesas: {}
    };
  }

  /**
   * Carrega os dados salvos no localStorage ou retorna os valores padrão
   */
  carregarLivroCaixa(): LivroCaixa {
    const dadosSalvos = this.storageService.get<LivroCaixa>(CAIXA_STORAGE_KEY);
    return dadosSalvos ? dadosSalvos : this.getDadosIniciaisPadrao();
  }

  /**
   * Salva o estado atual do Livro Caixa no localStorage
   */
  salvarLivroCaixa(dados: LivroCaixa): void {
    this.storageService.set(CAIXA_STORAGE_KEY, dados);
  }

  /**
   * Limpa os dados salvos
   */
  limparLivroCaixa(): void {
    this.storageService.remove(CAIXA_STORAGE_KEY);
  }

  /**
   * Executa todos os cálculos matemáticos do Livro Caixa
   */
  calcularTotais(dados: LivroCaixa): TotaisCaixa {
    const rec = dados.receitas;
    const desp = dados.despesas;
    const ini = dados.dadosIniciais;

    // Helper para extrair o valor numérico (trata números simples ou objetos ItemLancamento)
    const val = (item: number | ItemLancamento | undefined): number => {
      if (!item) return 0;
      return typeof item === 'number' ? item : (item.valor || 0);
    };

    // 1. RECEITAS
    // Subtotal Base Décima (Linhas 01 a 05)
    const subtotalBaseDecima = val(rec.vf1) + val(rec.vf2) + val(rec.vf3) + val(rec.vf4) + val(rec.vf5);

    // Soma das Receitas da Semana (Linhas 01 a 12, exceto 06)
    const somaReceitaSemana = subtotalBaseDecima + val(rec.vf7) + val(rec.vf8) +
                              val(rec.vf9) + val(rec.vf10) + val(rec.vf11) + val(rec.vf12);

    // Balanço Total Receita (Linha 13 + Saldo Anterior Linha 14)
    const balancoTotalReceita = somaReceitaSemana + ini.saldoAnterior;

    // 2. DESPESAS AUTOMÁTICAS E REPASSES
    const decimasPagas = subtotalBaseDecima * 0.10; // 10% do subtotal base décima (Linha 24)
    const repasseOzanam = val(rec.vf8);             // Linha 26 (iguala a linha 08)
    const repasseLinha12 = val(rec.vf12);           // Linha 27 (iguala a linha 12)

    // Soma das Despesas da Semana (Linhas 16 a 27)
    const somaDespesaSemana = val(desp.vf16) + val(desp.vf17) + val(desp.vf18) +
                              val(desp.vf19) + val(desp.vf20) + val(desp.vf21) +
                              val(desp.vf22) + val(desp.vf23) + decimasPagas +
                              val(desp.vf25) + repasseOzanam + repasseLinha12;

    // 3. FECHAMENTO
    const saldoFinalSemana = balancoTotalReceita - somaDespesaSemana; // Linha 29
    const balancoFinal = saldoFinalSemana;                            // Linha 30

    // 4. RESUMO SITUAÇÃO CAIXA (CP = Conselho Particular)
    const decimasEnviarCP = (ini.decimasAcumuladas - ini.repasseDecimas) + decimasPagas; // Linha 34
    const outrosRepassesCP = (ini.outrasContribuicoes - ini.repasseContribuicoes) + repasseOzanam; // Linha 35
    const totalRecursosTesouraria = saldoFinalSemana - decimasEnviarCP - outrosRepassesCP; // Linha 36

    return {
      subtotalBaseDecima,
      somaReceitaSemana,
      balancoTotalReceita,
      decimasPagas,
      repasseOzanam,
      repasseLinha12,
      somaDespesaSemana,
      saldoFinalSemana,
      balancoFinal,
      decimasEnviarCP,
      outrosRepassesCP,
      totalRecursosTesouraria
    };
  }
}
