import { Injectable } from '@angular/core';
import { LivroCaixa, TotaisCaixa, ItemLancamento } from '../models/livro-caixa.model';
import { CaixaService } from './caixa.service';
import { OpcoesExportacao } from '../models/export.model';

@Injectable({
  providedIn: 'root'
})
export class ExportWhatsappService {

  constructor(private caixaService: CaixaService) { }

  /**
   * Converte um valor numérico para o formato de moeda brasileira (R$ 0,00)
   */
  private formatarMoeda(valor: number): string {
    return (valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  /**
   * Trata datas do formato YYYY-MM-DD para DD/MM/YYYY
   */
  private formatarData(dataISO: string): string {
    if (!dataISO) return '';
    const partes = dataISO.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataISO;
  }

  /**
   * Gera o texto formatado para o WhatsApp com base nos dados do Livro Caixa
   */
  gerarTextoRelatorio(dados: LivroCaixa): string {
    const totais = this.caixaService.calcularTotais(dados);
    const ini = dados.dadosIniciais;
    const rec = dados.receitas;
    const desp = dados.despesas;

    const val = (item: number | ItemLancamento | undefined): number => {
      if (!item) return 0;
      return typeof item === 'number' ? item : (item.valor || 0);
    };

    const desc = (item: ItemLancamento | undefined, padrao: string): string => {
      return (item && item.descricaoCustomizada && item.descricaoCustomizada.trim() !== '')
        ? item.descricaoCustomizada.trim()
        : padrao;
    };

    let msg = `*LIVRO CAIXA - SSVP*\n`;
    msg += `*Ata nº:* ${ini.numeroAta || '---'} | *Data:* ${this.formatarData(ini.dataReuniao)}\n`;
    msg += `----------------------------------------\n\n`;

    // 1. SALDO ANTERIOR
    msg += `*SALDO ANTERIOR (Linha 14):* ${this.formatarMoeda(ini.saldoAnterior)}\n\n`;

    // 2. RECEITAS
    msg += `*--- RECEITAS ---*\n`;
    if (val(rec.vf1) > 0) msg += `01 - Coleta reunião: ${this.formatarMoeda(rec.vf1!)}\n`;
    if (val(rec.vf2) > 0) msg += `02 - Subscritores/Benfeitores: ${this.formatarMoeda(rec.vf2!)}\n`;
    if (val(rec.vf3) > 0) msg += `03 - Doações: ${this.formatarMoeda(rec.vf3!)}\n`;
    if (val(rec.vf4) > 0) msg += `04 - Resultado Eventos/Bazar: ${this.formatarMoeda(rec.vf4!)}\n`;
    if (val(rec.vf5) > 0) msg += `05 - Outras Rec. (1/10): ${this.formatarMoeda(rec.vf5!)}\n`;

    msg += `*06 - Subtotal Base Décima:* ${this.formatarMoeda(totais.subtotalBaseDecima)}\n`;

    if (val(rec.vf7) > 0) msg += `07 - Subvenção oficial: ${this.formatarMoeda(rec.vf7!)}\n`;
    if (val(rec.vf8) > 0) msg += `08 - Coleta Ozanam: ${this.formatarMoeda(rec.vf8!)}\n`;
    if (val(rec.vf9) > 0) msg += `09 - União Fraternal: ${this.formatarMoeda(rec.vf9!)}\n`;
    if (val(rec.vf10) > 0) msg += `10 - ${desc(rec.vf10, 'Outros 1')}: ${this.formatarMoeda(val(rec.vf10))}\n`;
    if (val(rec.vf11) > 0) msg += `11 - ${desc(rec.vf11, 'Outros 2')}: ${this.formatarMoeda(val(rec.vf11))}\n`;
    if (val(rec.vf12) > 0) msg += `12 - Rec. p/ Repasses: ${this.formatarMoeda(rec.vf12!)}\n`;

    msg += `*13 - Total Receita Semana:* ${this.formatarMoeda(totais.somaReceitaSemana)}\n`;
    msg += `*15 - Balanço Total Receita:* ${this.formatarMoeda(totais.balancoTotalReceita)}\n\n`;

    // 3. DESPESAS
    msg += `*--- DESPESAS ---*\n`;
    if (val(desp.vf16) > 0) msg += `16 - Cestas/Higiene: ${this.formatarMoeda(desp.vf16!)}\n`;
    if (val(desp.vf17) > 0) msg += `17 - Moradia assistidos: ${this.formatarMoeda(desp.vf17!)}\n`;
    if (val(desp.vf18) > 0) msg += `18 - Contas (Água/Luz): ${this.formatarMoeda(desp.vf18!)}\n`;
    if (val(desp.vf19) > 0) msg += `19 - Obras especiais: ${this.formatarMoeda(desp.vf19!)}\n`;
    if (val(desp.vf20) > 0) msg += `20 - União Fraternal (Saída): ${this.formatarMoeda(desp.vf20!)}\n`;
    if (val(desp.vf21) > 0) msg += `21 - ${desc(desp.vf21, 'Outras Desp. 1')}: ${this.formatarMoeda(val(desp.vf21))}\n`;
    if (val(desp.vf22) > 0) msg += `22 - ${desc(desp.vf22, 'Outras Desp. 2')}: ${this.formatarMoeda(val(desp.vf22))}\n`;
    if (val(desp.vf23) > 0) msg += `23 - Despesas administrativas: ${this.formatarMoeda(desp.vf23!)}\n`;

    if (totais.decimasPagas > 0) msg += `24 - Décimas P.C. (10%): ${this.formatarMoeda(totais.decimasPagas)}\n`;
    if (val(desp.vf25) > 0) msg += `25 - ${desc(desp.vf25, 'Outras Desp. 3')}: ${this.formatarMoeda(val(desp.vf25))}\n`;
    if (totais.repasseOzanam > 0) msg += `26 - Repasse Ozanam: ${this.formatarMoeda(totais.repasseOzanam)}\n`;
    if (totais.repasseLinha12 > 0) msg += `27 - Repasse Linha 12: ${this.formatarMoeda(totais.repasseLinha12)}\n`;

    msg += `*28 - Total Despesas Semana:* ${this.formatarMoeda(totais.somaDespesaSemana)}\n\n`;

    // 4. RESUMO / FECHAMENTO
    msg += `*--- FECHAMENTO ---*\n`;
    msg += `*29 - SALDO FINAL SEMANA:* ${this.formatarMoeda(totais.saldoFinalSemana)}\n`;
    msg += `34 - Décimas a enviar C.P.: ${this.formatarMoeda(totais.decimasEnviarCP)}\n`;
    msg += `35 - Outros repasses C.P.: ${this.formatarMoeda(totais.outrosRepassesCP)}\n`;
    msg += `*36 - Rec. Tesouraria:* ${this.formatarMoeda(totais.totalRecursosTesouraria)}\n`;

    return msg;
  }

  /**
   * Abre o WhatsApp Web / App com a mensagem pré-formatada
   */
  exportarParaWhatsapp(dados: LivroCaixa, opcoes?: OpcoesExportacao): void {
    const textoFormatado = this.gerarTextoRelatorio(dados);
    const textoCodificado = encodeURIComponent(textoFormatado);

    let url = `https://wa.me/`;
    if (opcoes?.telefoneDestino) {
      url += `${opcoes.telefoneDestino}`;
    }
    url += `?text=${textoCodificado}`;

    window.open(url, '_blank');
  }
}
