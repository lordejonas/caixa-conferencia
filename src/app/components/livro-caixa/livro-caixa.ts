import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms'; // Importe ReactiveFormsModule e FormsModule
import { CommonModule } from '@angular/common'; // Importe CommonModule para pipes como | currency e diretivas como *ngIf
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CaixaService } from '../../services/caixa.service';
import { ExportWhatsappService } from '../../services/export-whatsapp.service';
import { LivroCaixa, TotaisCaixa } from '../../models/livro-caixa.model';

@Component({
  selector: 'app-livro-caixa',
  standalone: true, // Indica que é um componente Standalone
  imports: [
    CommonModule,          // Para *ngIf e | currency
    ReactiveFormsModule,   // Para formGroup e formControlName
    FormsModule            // Para [(ngModel)] no seletor de campos
  ],
  templateUrl: './livro-caixa.html',
  styleUrls: ['./livro-caixa.scss']
})
export class LivroCaixaComponent implements OnInit, OnDestroy {
  caixaForm!: FormGroup;
  totais!: TotaisCaixa;

  // Controle do seletor visual de campos (Dropdown "Selecione o lançamento...")
  campoSelecionado: string = 'field-0';
  camposVisiveis: { [key: string]: boolean } = {};

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private caixaService: CaixaService,
    private exportWhatsappService: ExportWhatsappService
  ) {}

  ngOnInit(): void {
    const dadosIniciais = this.caixaService.carregarLivroCaixa();
    this.inicializarFormulario(dadosIniciais);
    this.atualizarCalculos();

    // Reage instantaneamente a qualquer alteração digitada nos campos
    this.caixaForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.atualizarCalculos();
        this.caixaService.salvarLivroCaixa(this.caixaForm.value);
      });
  }

  private inicializarFormulario(dados: LivroCaixa): void {
    this.caixaForm = this.fb.group({
      dadosIniciais: this.fb.group({
        numeroAta: [dados.dadosIniciais.numeroAta],
        dataReuniao: [dados.dadosIniciais.dataReuniao],
        saldoAnterior: [dados.dadosIniciais.saldoAnterior],
        decimasAcumuladas: [dados.dadosIniciais.decimasAcumuladas],
        repasseDecimas: [dados.dadosIniciais.repasseDecimas],
        outrasContribuicoes: [dados.dadosIniciais.outrasContribuicoes],
        repasseContribuicoes: [dados.dadosIniciais.repasseContribuicoes]
      }),
      receitas: this.fb.group({
        vf1: [dados.receitas.vf1 || 0],
        vf2: [dados.receitas.vf2 || 0],
        vf3: [dados.receitas.vf3 || 0],
        vf4: [dados.receitas.vf4 || 0],
        vf5: [dados.receitas.vf5 || 0],
        vf7: [dados.receitas.vf7 || 0],
        vf8: [dados.receitas.vf8 || 0],
        vf9: [dados.receitas.vf9 || 0],
        vf10: this.fb.group({
          valor: [dados.receitas.vf10?.valor || 0],
          descricaoCustomizada: [dados.receitas.vf10?.descricaoCustomizada || '']
        }),
        vf11: this.fb.group({
          valor: [dados.receitas.vf11?.valor || 0],
          descricaoCustomizada: [dados.receitas.vf11?.descricaoCustomizada || '']
        }),
        vf12: [dados.receitas.vf12 || 0]
      }),
      despesas: this.fb.group({
        vf16: [dados.despesas.vf16 || 0],
        vf17: [dados.despesas.vf17 || 0],
        vf18: [dados.despesas.vf18 || 0],
        vf19: [dados.despesas.vf19 || 0],
        vf20: [dados.despesas.vf20 || 0],
        vf21: this.fb.group({
          valor: [dados.despesas.vf21?.valor || 0],
          descricaoCustomizada: [dados.despesas.vf21?.descricaoCustomizada || '']
        }),
        vf22: this.fb.group({
          valor: [dados.despesas.vf22?.valor || 0],
          descricaoCustomizada: [dados.despesas.vf22?.descricaoCustomizada || '']
        }),
        vf23: [dados.despesas.vf23 || 0],
        vf25: this.fb.group({
          valor: [dados.despesas.vf25?.valor || 0],
          descricaoCustomizada: [dados.despesas.vf25?.descricaoCustomizada || '']
        })
      })
    });

    // Torna visíveis os campos que já possuem valores gravados
    this.verificarCamposPreenchidos();
  }

  private atualizarCalculos(): void {
    const valoresForm = this.caixaForm.getRawValue();
    this.totais = this.caixaService.calcularTotais(valoresForm);
  }

  // Ativa a exibição da linha do campo quando o usuário escolhe no Select
  exibirCampo(): void {
    if (this.campoSelecionado && this.campoSelecionado !== 'field-0') {
      this.camposVisiveis[this.campoSelecionado] = true;
      this.campoSelecionado = 'field-0';
    }
  }

  private verificarCamposPreenchidos(): void {
    const rec = this.caixaForm.get('receitas')?.value;
    const desp = this.caixaForm.get('despesas')?.value;

    if (rec) {
      Object.keys(rec).forEach(key => {
        const val = typeof rec[key] === 'object' ? rec[key].valor : rec[key];
        if (val > 0) this.camposVisiveis[key] = true;
      });
    }

    if (desp) {
      Object.keys(desp).forEach(key => {
        const val = typeof desp[key] === 'object' ? desp[key].valor : desp[key];
        if (val > 0) this.camposVisiveis[key] = true;
      });
    }
  }

  exportarWhatsapp(): void {
    const dadosAtuais = this.caixaForm.getRawValue();
    this.exportWhatsappService.exportarParaWhatsapp(dadosAtuais);
  }

  limparTudo(): void {
    if (confirm('Deseja realmente encerrar e limpar os dados atuais?')) {
      this.caixaService.limparLivroCaixa();
      this.ngOnInit();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
