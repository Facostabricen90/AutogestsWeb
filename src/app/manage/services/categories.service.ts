import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '@environments/environment';
import { from, Observable, catchError, of } from 'rxjs';
import { Categoria } from '@/models/Categoria';

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {

  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  insertarCategoria(descripcion: string, idEmpresa: number, color: string): Observable<{ success: boolean; error?: string }> {
    return from(
      this.supabase
        .rpc('insertarcategorias', {
          _descripcion: descripcion,
          _idempresa: idEmpresa,
          _color: color
        })
        .then(response => {
          if (response.error) throw response.error;
          return { success: true };
        })
    ).pipe(
      catchError(error => {
        console.error('Error al insertar categoría:', error);
        return of({ success: false, error: error.message });
      })
    );
  }

  getCategoriasPorEmpresa(idEmpresa: number): Observable<Categoria[]> {
    return from(
      this.supabase
        .from('categorias')
        .select('*')
        .eq('id_empresa', idEmpresa)
        .then(response => {
          if (response.error) throw response.error;
          return response.data as Categoria[];
        })
    ).pipe(
      catchError(error => {
        console.error('Error al obtener categorías:', error);
        return of([]);
      })
    );
  }

  eliminarCategoria(idCategoria: number): Observable<{ success: boolean; error?: string }> {
    return from(
      this.supabase
        .from('categorias')
        .delete()
        .eq('id', idCategoria)
        .then(response => {
          if (response.error) throw response.error;
          return { success: true };
        })
    ).pipe(
      catchError(error => {
        console.error('Error al eliminar categoría:', error);
        return of({ success: false, error: error.message });
      })
    );
  }

  editarCategoria(id: number, descripcion: string, color: string): Observable<{ success: boolean; error?: string }> {
    return from(
      this.supabase
        .rpc('editarcategoria', {
          _id: id,
          _descripcion: descripcion,
          _color: color
        })
        .then(response => {
          if (response.error) throw response.error;
          return { success: true };
        })
    ).pipe(
      catchError(error => {
        console.error('Error al editar categoría:', error);
        return of({ success: false, error: error.message });
      })
    );
  }

  actualizarCategoria(categoria: Categoria): Observable<{ success: boolean; error?: string }> {
    if (!categoria.id) {
      return of({ success: false, error: 'ID de categoría no proporcionado' });
    }

    return from(
      this.supabase
        .from('categorias')
        .update({
          descripcion: categoria.descripcion,
          color: categoria.color
        })
        .eq('id', categoria.id)
        .then(response => {
          if (response.error) throw response.error;
          return { success: true };
        })
    ).pipe(
      catchError(error => {
        console.error('Error al actualizar categoría:', error);
        return of({ success: false, error: error.message });
      })
    );
  }

}
