import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { InternalLayoutComponent } from '../../components/internal-layout/internal-layout.component';
import { ContaService } from '../../services/conta.service';
import { SyncService } from '../../core/service/sync.service';
import { Conta } from '../../models/conta.model';

@Component({
  selector: 'app-contas',
  standalone: true,
  imports: [InternalLayoutComponent],
  templateUrl: './contas.component.html',
  styleUrl: './contas.component.scss'
})
export class ContasComponent implements OnInit {
  contas: Conta[] = [];
  loading = true;
  erroMsg: string | null = null;

  private contaService = inject(ContaService);
  private syncService = inject(SyncService);
  private cdr = inject(ChangeDetectorRef);

  async ngOnInit() {
    await this.carregarContas();
  }

  async carregarContas() {
    this.loading = true;
    this.erroMsg = null;
    this.cdr.detectChanges();

    try {
      this.contas = await this.contaService.getContas();
    } catch (err: any) {
      console.error('Erro ao carregar contas:', err);
      this.erroMsg = 'Não foi possível carregar as contas do banco local.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async onCriarContasTipo1() {
    this.loading = true;
    this.erroMsg = null;
    this.cdr.detectChanges();

    try {
      await this.contaService.gerarContasTipo1();
      await this.carregarContas();
      this.syncService.sincronizar();
    } catch (err: any) {
      console.error('Erro ao gerar contas tipo 1:', err);
      this.erroMsg = 'Falha ao criar contas tipo 1.';
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async onCriarContasTipo2() {
    this.loading = true;
    this.erroMsg = null;
    this.cdr.detectChanges();

    try {
      await this.contaService.gerarContasTipo2();
      await this.carregarContas();
      this.syncService.sincronizar();
    } catch (err: any) {
      console.error('Erro ao gerar contas tipo 2:', err);
      this.erroMsg = 'Falha ao criar contas tipo 2.';
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
