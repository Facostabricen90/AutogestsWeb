import { Component, OnInit, signal } from '@angular/core';
import { BusinessService } from '@/manage/services/business.service';
import { SupabaseService } from '@/auth/services/supabase.service';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Empresa } from '@/models/Empresa';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-business-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './business-page.component.html',
})
export class BusinessPageComponent {
  empresa = signal<Empresa | null>(null);
  error = signal<string | null>(null);
  isLoading = signal(true);
  usuariosCount = signal<number>(0);

  isEditing = false;
  empresaEditada: Partial<Empresa> = {};

  constructor(
    private businessService: BusinessService,
    private supabaseService: SupabaseService,
    private router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    await this.cargarEmpresaYUsuarios();
  }

  private async cargarEmpresaYUsuarios(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const userId = await this.supabaseService.getCurrentUserId();
      if (!userId) {
        this.error.set('Usuario no autenticado');
        return;
      }

      this.businessService.getEmpresaDelUsuarioActual(userId)
        .pipe(
          catchError(error => {
            this.error.set('Error al cargar empresa');
            console.error(error);
            return of(null);
          })
        )
        .subscribe({
          next: async (empresa) => {
            if (empresa) {
              this.empresa.set(empresa);
              await this.contarUsuarios(empresa.id!);
            }
            this.isLoading.set(false);
          }
        });
    } catch (err) {
      this.error.set('Error al cargar datos');
      this.isLoading.set(false);
      console.error(err);
    }
  }

  private async contarUsuarios(idEmpresa: number): Promise<void> {
    this.businessService.contarUsuariosPorEmpresa(idEmpresa)
      .pipe(
        catchError(error => {
          console.error('Error al contar usuarios:', error);
          return of(0);
        })
      )
      .subscribe(count => {
        this.usuariosCount.set(count);
      });
  }

  prepararEdicion(): void {
    if (this.empresa()) {
      this.empresaEditada = { ...this.empresa()! };
      this.isEditing = true;
    }
  }

  cancelarEdicion(): void {
    this.isEditing = false;
    this.empresaEditada = {};
  }

  async guardarCambios(): Promise<void> {
    if (!this.empresaEditada.id || !this.empresaEditada.nombre || !this.empresaEditada.simbolomoneda) {
      this.error.set('Todos los campos son requeridos');
      return;
    }
    this.isLoading.set(true);
    this.error.set(null);
    try {
      if (!this.empresaEditada.id) {
        this.error.set('ID de empresa no válido');
        return;
      }
      const empresaActualizada: Empresa = {
        id: this.empresaEditada.id!,
        nombre: this.empresaEditada.nombre!,
        simbolomoneda: this.empresaEditada.simbolomoneda!
      };
      const resultado = await this.businessService.actualizarEmpresa(empresaActualizada).toPromise();
      if (resultado?.success) {
        this.isEditing = false;
        await this.cargarEmpresaYUsuarios();
      } else {
        this.error.set(resultado?.error || 'Error desconocido al actualizar empresa');
      }
    } catch (error) {
      this.error.set('Error al actualizar empresa');
      console.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  navegarAConfiguracion(): void {
    this.router.navigate(['/configuracion']);
    }
}
