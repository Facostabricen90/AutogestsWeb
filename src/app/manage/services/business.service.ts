import { Injectable } from '@angular/core';
import { PostgrestError, SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '@environments/environment';
import { from, Observable, catchError, of } from 'rxjs';
import { Empresa } from '@/models/Empresa';
import { Usuario } from '@/models/Usuario';
import { AsignarEmpresa } from '@/models/AsignarEmpresa';

@Injectable({
  providedIn: 'root'
})
export class BusinessService {

  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  obtenerTodasLasEmpresas(): Observable<Empresa[]> {
    return from(
      this.supabase
        .from('empresa')
        .select('*')
        .then(response => {
          if (response.error) throw response.error;
          return response.data as Empresa[];
        })
    ).pipe(
      catchError(error => {
        console.error('Error al obtener empresas:', error);
        return of([]);
      })
    );
  }

  getEmpresaDelUsuarioActual(userIdAuth: string): Observable<Empresa | null> {
    return from(
      this.supabase
        .from('usuarios')
        .select('*')
        .eq('idauth', userIdAuth)
        .single()
        .then(async (usuarioResponse: { data: Usuario | null; error: PostgrestError | null }) => {
          if (usuarioResponse.error) throw usuarioResponse.error;
          if (!usuarioResponse.data) throw new Error('Usuario no encontrado');

          const usuario = usuarioResponse.data;
          if (!usuario.id) throw new Error('ID del usuario es nulo');

          const asignacionResponse = await this.supabase
            .from('asignar_empresa')
            .select('*')
            .eq('id_usuario', usuario.id)
            .single();

          if (asignacionResponse.error) throw asignacionResponse.error;
          if (!asignacionResponse.data) throw new Error('Asignación no encontrada');

          const asignacion = asignacionResponse.data;
          if (!asignacion.id_empresa) throw new Error('ID de empresa es nulo');

          const empresaResponse = await this.supabase
            .from('empresa')
            .select('*')
            .eq('id', asignacion.id_empresa)
            .single() as { data: Empresa | null; error: PostgrestError | null };

          if (empresaResponse.error) throw empresaResponse.error;
          return empresaResponse.data;
        })
    ).pipe(
      catchError(error => {
        console.error('Error al obtener empresa del usuario:', error);
        return of(null);
      })
    );
  }

  contarUsuariosPorEmpresa(idEmpresa: number): Observable<number> {
    return from(
      this.supabase
        .rpc('contarusuariosporempresas', { id_empresa_param: idEmpresa })
        .then(response => {
          if (response.error) throw response.error;
          return response.data as number;
        })
    ).pipe(
      catchError(error => {
        console.error('Error al contar usuarios por empresa:', error);
        return of(0);
      })
    );
  }

  crearEmpresa(empresa: Empresa): Observable<{ success: boolean; empresa?: Empresa; error?: string }> {
    return from(
      this.supabase
        .from('empresa')
        .insert(empresa)
        .select()
        .single()
        .then(response => {
          if (response.error) throw response.error;
          return { success: true, empresa: response.data as Empresa };
        })
    ).pipe(
      catchError(error => {
        console.error('Error al crear empresa:', error);
        return of({ success: false, error: error.message });
      })
    );
  }

  asignarUsuarioAEmpresa(idUsuario: number, idEmpresa: number): Observable<{ success: boolean; error?: string }> {
    return from(
      this.supabase
        .from('asignar_empresa')
        .insert({ id_usuario: idUsuario, id_empresa: idEmpresa })
        .then(response => {
          if (response.error) throw response.error;
          return { success: true };
        })
    ).pipe(
      catchError(error => {
        console.error('Error al asignar usuario a empresa:', error);
        return of({ success: false, error: error.message });
      })
    );
  }

}
