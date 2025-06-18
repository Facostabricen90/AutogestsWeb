import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '@environments/environment';
import { from, Observable, catchError, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { Marca } from '@/models/Marca';

@Injectable({
  providedIn: 'root'
})
export class MarkService {

  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  insertarMarca(descripcion: string, idEmpresa: number): Observable<{ success: boolean; error?: string }> {
    return from(
      this.supabase
        .rpc('insertarmarca', {
          _descripcion: descripcion,
          _idempresa: idEmpresa
        })
        .then(response => {
          if (response.error) throw response.error;
          return { success: true };
        })
    ).pipe(
      catchError(error => {
        console.error('Error al insertar marca:', error);
        return of({ success: false, error: error.message });
      })
    );
  }

  getMarcasPorEmpresa(idEmpresa: number): Observable<Marca[]> {
    return from(
      this.supabase
        .from('marca')
        .select('*')
        .eq('id_empresa', idEmpresa)
        .then(response => {
          if (response.error) throw response.error;
          return response.data as Marca[];
        })
    ).pipe(
      catchError(error => {
        console.error('Error al obtener marcas:', error);
        return of([]);
      })
    );
  }

  eliminarMarca(idMarca: number): Observable<{ success: boolean; error?: string }> {
    return from(
      this.supabase
        .from('marca')
        .delete()
        .eq('id', idMarca)
        .then(response => {
          if (response.error) throw response.error;
          return { success: true };
        })
    ).pipe(
      catchError(error => {
        console.error('Error al eliminar marca:', error);
        return of({ success: false, error: error.message });
      })
    );
  }

  editarMarca(id: number, descripcion: string): Observable<{ success: boolean; error?: string }> {
    return from(
      this.supabase
        .rpc('editarmarca', {
          _id: id,
          _descripcion: descripcion
        })
        .then(response => {
          if (response.error) throw response.error;
          return { success: true };
        })
    ).pipe(
      catchError(error => {
        console.error('Error al editar marca:', error);
        return of({ success: false, error: error.message });
      })
    );
  }

  actualizarMarca(marca: Marca): Observable<{ success: boolean; error?: string }> {
    if (!marca.id) {
      return of({ success: false, error: 'ID de marca no proporcionado' });
    }

    return from(
      this.supabase
        .from('marca')
        .update({
          descripcion: marca.descripcion
        })
        .eq('id', marca.id)
        .then(response => {
          if (response.error) throw response.error;
          return { success: true };
        })
    ).pipe(
      catchError(error => {
        console.error('Error al actualizar marca:', error);
        return of({ success: false, error: error.message });
      })
    );
  }

}
