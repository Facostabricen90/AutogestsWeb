import { Component, OnInit, signal } from '@angular/core';
import { MarkService } from '@/manage/services/mark.service';
import { Marca } from '@/models/Marca';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { BusinessService } from '@/manage/services/business.service';
import { SupabaseService } from '@/auth/services/supabase.service';
import { catchError, of } from 'rxjs';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-marks-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './marks-page.component.html',
  styleUrls: ['./marks-page.component.css']
})
export class MarksPageComponent implements OnInit {
  nuevaDescripcion = '';
  marcaAEditar: Marca | null = null;
  descripcionEditada = '';
  isNuevaMarcaVisible = false;
  menuOpcionesAbierto = false;
  idEmpresa: number | null = null;

  // Signals
  marcas = signal<Marca[]>([]);
  error = signal<string | null>(null);
  isLoading = signal(true);

  constructor(
    private marcaService: MarkService,
    private supabase: SupabaseService,
    private empresaService: BusinessService,
    private router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    await this.cargarEmpresaYMarcas();
  }

  private async cargarEmpresaYMarcas(): Promise<void> {
    this.isLoading.set(true);
    try {
      const userId = await this.supabase.getCurrentUserId();
      if (userId) {
        const empresa = await this.empresaService.getEmpresaDelUsuarioActual(userId).toPromise();
        if (empresa && empresa.id) {
          this.idEmpresa = empresa.id;
          await this.cargarMarcas(empresa.id);
        }
      }
    } catch (err) {
      this.error.set('Error al cargar empresa y marcas');
      console.error(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async cargarMarcas(idEmpresa: number): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    this.marcaService.getMarcasPorEmpresa(idEmpresa).pipe(
      catchError(error => {
        this.error.set('Error al cargar marcas');
        console.error(error);
        return of([]);
      })
    ).subscribe({
      next: (marcas) => {
        this.marcas.set(marcas);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar marcas');
        this.isLoading.set(false);
      }
    });
  }

  async insertarMarca(): Promise<void> {
    if (!this.nuevaDescripcion || !this.idEmpresa) return;

    this.isLoading.set(true);
    try {
      await this.marcaService.insertarMarca(this.nuevaDescripcion, this.idEmpresa);
      this.nuevaDescripcion = '';
      this.isNuevaMarcaVisible = false;
      if (this.idEmpresa) {
        await this.cargarEmpresaYMarcas();
      }
    } catch (error) {
      this.error.set('Error al insertar marca');
    } finally {
      this.isLoading.set(false);
    }
  }

  prepararEdicion(marca: Marca): void {
    this.marcaAEditar = marca;
    this.descripcionEditada = marca.descripcion;
  }

  async guardarEdicion(): Promise<void> {
    if (!this.marcaAEditar?.id || !this.descripcionEditada) return;

    this.isLoading.set(true);
    try {
      await this.marcaService.editarMarca(this.marcaAEditar.id, this.descripcionEditada);
      this.marcaAEditar = null;
      this.descripcionEditada = '';
      if (this.idEmpresa) {
        await this.cargarMarcas(this.idEmpresa);
      }
    } catch (error) {
      this.error.set('Error al editar marca');
    } finally {
      this.isLoading.set(false);
    }
  }

  async eliminarMarca(idMarca: number): Promise<void> {
    this.isLoading.set(true);
    try {
      await this.marcaService.eliminarMarca(idMarca);
      if (this.idEmpresa) {
        await this.cargarEmpresaYMarcas();
      }
    } catch (error) {
      this.error.set('Error al eliminar marca');
    } finally {
      this.isLoading.set(false);
    }
  }

  async cerrarSesion(): Promise<void> {
    try {
      await this.supabase.signOut();
      this.router.navigate(['/login'], { replaceUrl: true });
    } catch (error) {
      this.error.set('Error al cerrar sesión');
    }
  }

  navegarAConfiguracion(): void {
    this.router.navigate(['/configuracion']);
  }
}
