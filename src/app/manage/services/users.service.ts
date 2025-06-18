import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@environments/environment';
import { catchError, from, map, Observable, of, switchMap } from 'rxjs';
import { Usuario } from '@/models/Usuario';
import { Modulos } from '@/models/Modulos';
import { SupabaseService } from '@/auth/services/supabase.service';
import { signal, computed } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private supabase: SupabaseClient;
  private usuarioLogueadoSignal = signal<Usuario | null>(null);

  constructor(private supabaseService: SupabaseService) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    this.supabaseService.authChanges((event, session) => {
      if (session?.user) {
        this.getUsuarioLogueado().subscribe(usuario => {
          this.usuarioLogueadoSignal.set(usuario);
        });
      } else {
        this.usuarioLogueadoSignal.set(null);
      }
    });
  }

  cargarUsuarioLogueado(): void {
    this.getUsuarioLogueado().subscribe(usuario => {
      this.usuarioLogueadoSignal.set(usuario);
    });
  }

  logout() {
    return this.supabase.auth.signOut();
  }

  get usuarioActual() {
    return computed(() => this.usuarioLogueadoSignal());
  }

  obtenerTrabajadores(idEmpresa: number): Observable<Usuario[]> {
    return from(
      this.supabase
        .from('usuarios')
        .select('*')
        .eq('id_empresa', idEmpresa)
        .neq('tipouser', 'admin')
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data as Usuario[];
      }),
      catchError(error => {
        console.error('Error al traer trabajadores', error);
        return of([]);
      })
    );
  }

  getUsuarioLogueado(): Observable<Usuario | null> {
    return from(this.supabase.auth.getUser()).pipe(
      switchMap(({ data, error }) => {
        if (error || !data.user) return of(null);
        const email = data.user.email;
        if (!email) return of(null);
        return from(
          this.supabase
            .from('usuarios')
            .select('*')
            .eq('correo', email)
            .eq('tipouser', 'admin')
            .single()
        ).pipe(
          map(response => {
            if (response.error) throw response.error;
            return response.data as Usuario;
          }),
          catchError(error => {
            console.error('Error al obtener usuario logueado:', error);
            return of(null);
          })
        );
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
        console.error('Error al obtener usuario por ID:', error);
        return of(null);
      })
    );
  }
}
