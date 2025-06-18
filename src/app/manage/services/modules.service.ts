import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '@environments/environment';
import { from, Observable, catchError, of } from 'rxjs';
import { Modulos, PermisoModulos, UsuarioConModulos } from '@/models/Modulos';

@Injectable({
  providedIn: 'root'
})
export class ModulesService {

  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  obtenerTodosLosModulos(): Observable<Modulos[]> {
    return from(
      this.supabase
        .from('modulos')
        .select('*')
        .then(response => {
          if (response.error) throw response.error;
          return response.data as Modulos[];
        })
    ).pipe(
      catchError(error => {
        console.error('Error al obtener módulos:', error);
        return of([]);
      })
    );
  }

  obtenerModulosAsignados(idAuth: string): Observable<string[]> {
    return from(
      this.supabase
        .from('usuarios')
        .select(`
          id,
          permisos (
            id_modulo,
            modulos (
              nombre
            )
          )
        `)
        .eq('idauth', idAuth)
        .single()
        .then(response => {
          if (response.error) throw response.error;
          const rawUsuario = response.data;
          const permisos = (rawUsuario.permisos || []).map((permiso: any) => ({
            ...permiso,
            modulos: permiso.modulos && Array.isArray(permiso.modulos) ? permiso.modulos[0] : permiso.modulos
          }));
          return permisos
            ?.map((permiso: any) => permiso.modulos?.nombre)
            .filter((nombre: any): nombre is string => !!nombre) || [];
        })
    ).pipe(
      catchError(error => {
        console.error('Error al obtener módulos asignados:', error);
        return of([]);
      })
    );
  }

  asignarModulosAUsuario(idUsuario: number, modulosIds: number[]): Observable<{ success: boolean; error?: string }> {
    const permisos = modulosIds.map(id_modulo => ({
      id_usuario: idUsuario,
      id_modulo
    }));

    return from(
      this.supabase
        .from('permisos')
        .insert(permisos)
        .then(response => {
          if (response.error) throw response.error;
          return { success: true };
        })
    ).pipe(
      catchError(error => {
        console.error('Error al asignar módulos:', error);
        return of({ success: false, error: error.message });
      })
    );
  }

  eliminarModulosDeUsuario(idUsuario: number): Observable<{ success: boolean; error?: string }> {
    return from(
      this.supabase
        .from('permisos')
        .delete()
        .eq('id_usuario', idUsuario)
        .then(response => {
          if (response.error) throw response.error;
          return { success: true };
        })
    ).pipe(
      catchError(error => {
        console.error('Error al eliminar módulos asignados:', error);
        return of({ success: false, error: error.message });
      })
    );
  }

}
