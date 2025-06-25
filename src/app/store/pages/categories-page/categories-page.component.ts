import { Component, OnInit, signal } from '@angular/core';
import { Marca } from '@/models/Marca';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BusinessService } from '@/manage/services/business.service';
import { SupabaseService } from '@/auth/services/supabase.service';
import { catchError, of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Categoria } from '@/models/Categoria';
import { CategoriesService } from '@/manage/services/categories.service';


@Component({
  selector: 'app-categories-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './categories-page.component.html',
})
export class CategoriesPageComponent implements OnInit {
  nuevaDescripcion = '';
  categoriaParaEditar: Categoria | null = null;
  descripcionEditada = '';
  isNuevaCategoriaVisible = false;
  menuOpcionesAbierto = false;
  idEmpresa: number | null = null;
  color = '#000000';

  // Signals
  categorias = signal<Categoria[]>([]);
  error = signal<string | null>(null);
  isLoading = signal(true);

  constructor(
    private categoriaService: CategoriesService,
    private supabase: SupabaseService,
    private empresaService: BusinessService,
    private router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    await this.cargarEmpresaYCategorias();
  }

  private async cargarEmpresaYCategorias(): Promise<void> {
    this.isLoading.set(true);
    try {
      const userId = await this.supabase.getCurrentUserId();
      if (userId) {
        const empresa = await this.empresaService.getEmpresaDelUsuarioActual(userId).toPromise();
        if (empresa && empresa.id) {
          this.idEmpresa = empresa.id;
          await this.cargarCategorias(empresa.id);
        }
      }
    } catch (err) {
      this.error.set('Error al cargar empresa y marcas');
      console.error(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async cargarCategorias(idEmpresa: number): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    this.categoriaService.getCategoriasPorEmpresa(idEmpresa).pipe(
      catchError(error => {
        this.error.set('Error al cargar marcas');
        console.error(error);
        return of([]);
      })
    ).subscribe({
      next: (categorias) => {
        this.categorias.set(categorias);
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
      await this.categoriaService.insertarCategoria(this.nuevaDescripcion, this.idEmpresa, this.color);
      this.nuevaDescripcion = '';
      this.isNuevaCategoriaVisible = false;
      if (this.idEmpresa) {
        await this.cargarEmpresaYCategorias();
      }
    } catch (error) {
      this.error.set('Error al insertar marca');
    } finally {
      this.isLoading.set(false);
    }
  }

  prepararEdicion(categoria: Categoria): void {
    this.categoriaParaEditar = categoria;
    this.descripcionEditada = categoria.descripcion;
  }

  async guardarEdicion(): Promise<void> {
    if (!this.categoriaParaEditar?.id || !this.descripcionEditada) return;

    this.isLoading.set(true);
    try {
      await this.categoriaService.editarCategoria(this.categoriaParaEditar.id, this.descripcionEditada, this.categoriaParaEditar.color);
      this.categoriaParaEditar = null;
      this.descripcionEditada = '';
      if (this.idEmpresa) {
        await this.cargarEmpresaYCategorias();
      }
    } catch (error) {
      this.error.set('Error al editar marca');
    } finally {
      this.isLoading.set(false);
    }
  }

  async eliminarMarca(idCategoria: number): Promise<void> {
    this.isLoading.set(true);
    try {
      await this.categoriaService.eliminarCategoria(idCategoria);
      if (this.idEmpresa) {
        await this.cargarEmpresaYCategorias();
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
