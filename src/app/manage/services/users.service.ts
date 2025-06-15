import { Injectable, signal } from '@angular/core';
import {
  createClient,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js'
import { environment } from '@environments/environment'
import { catchError, from, map, Observable, of } from 'rxjs';
import { Usuario } from '@/models/Usuario';
import { Modulos } from '@/models/Modulos';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  obtenerPersonalTodos(idEmpresa: number): Observable<Usuario[]> {
    return from(
      this.supabase.rpc('mostrarpersonal', { _id_empresa: idEmpresa })
        .then(response => {
          if (response.error) throw response.error;
          return response.data as Usuario[];
        })
    ).pipe(
      catchError(error => {
        console.error('Error al traer Personal', error);
        return of([]);
      })
    );
  }

  createUser(
    email: string,
    password: string,
    nombres: string,
    nroDoc: string,
    telefono: string,
    direccion: string,
    tipodoc: string,
    tipouser: string,
    idEmpresa: number,
    modulosSeleccionados: Modulos[]
  ): Observable<{ success: boolean; message: string }> {
    return from(
      this.supabase.auth.signUp({ email, password })
        .then(async ({ data, error }) => {
          if (error) throw error;

          const userIdAuth = data.user?.id;
          if (!userIdAuth) throw new Error('Error al obtener UID');

          const { error: userError } = await this.supabase
            .from('usuarios')
            .insert({
              nombres,
              nro_doc: nroDoc,
              telefono,
              direccion,
              fecharegistro: new Date().toISOString(),
              estado: 'activo',
              tipouser,
              idauth: userIdAuth,
              tipodoc,
              correo: email
            });

          if (userError) throw userError;

          const { data: userData, error: userSelectError } = await this.supabase
            .from('usuarios')
            .select('id')
            .eq('idauth', userIdAuth)
            .single();

          if (userSelectError || !userData) throw userSelectError || new Error('No se pudo obtener el ID del usuario');

          const idUsuario = userData.id;

          const { error: empresaError } = await this.supabase
            .from('asignar_empresa')
            .insert({
              id_usuario: idUsuario,
              id_empresa: idEmpresa
            });

          if (empresaError) throw empresaError;

          if (modulosSeleccionados.length > 0) {
            const permisos = modulosSeleccionados.map(modulo => ({
              id_usuario: idUsuario,
              id_modulo: modulo.id
            }));

            const { error: modulosError } = await this.supabase
              .from('permisos')
              .insert(permisos);

            if (modulosError) throw modulosError;
          }

          return { success: true, message: 'Usuario, empresa y módulos asignados correctamente.' };
        })
    ).pipe(
      catchError(error => {
        console.error('Error al crear usuario:', error);
        return of({ success: false, message: error.message });
      })
    );
  }

  getUsuarioById(id: string): Observable<Usuario | null> {
    return from(
      this.supabase
        .from('usuarios')
        .select('*')
        .eq('idauth', id)
        .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data as Usuario;
      }),
      catchError(error => {
        console.error('Error al obtener usuario:', error);
        return of(null);
      })
    );
  }

  eliminarUsuario(idUsuario: number): Observable<boolean> {
    return from(
      this.supabase
        .from('usuarios')
        .delete()
        .eq('id', idUsuario)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return true;
      }),
      catchError(error => {
        console.error('Error al borrar usuario:', error);
        return of(false);
      })
    );
  }

}
