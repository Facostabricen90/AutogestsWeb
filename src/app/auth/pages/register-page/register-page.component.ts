import { SupabaseService } from '@/auth/services/supabase.service';
import { Usuario } from '@/models/Usuario';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.component.html',
})
export class RegisterPageComponent {
  fb = inject(FormBuilder);
  router = inject(Router);
  supabase = inject(SupabaseService);

  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    email: ['', Validators.required],
    password: ['', Validators.required],
    nombreCompleto: ['', Validators.required],
    telefono: ['', Validators.required],
    direccion: ['', Validators.required],
    numeroDocumento: ['', Validators.required],
    tipoUsuario: ['', Validators.required],
    tipoDocumento: ['', Validators.required]
  });

  errorMessage: string | null = null;

  onSubmit(): void {
    const rawForm = this.form.getRawValue();
    this.supabase
      .register(rawForm.email, rawForm.username, rawForm.password)
      .subscribe((result) => {
        if(result.error){
          this.errorMessage = result.error.message;
        } else {
          this.insertUserRegistered({
            nombres: rawForm.nombreCompleto,
            nro_doc: rawForm.numeroDocumento,
            telefono: rawForm.telefono,
            direccion: rawForm.direccion,
            fecharegistro: new Date().toISOString(),
            estado: 'activo',
            tipouser: rawForm.tipoUsuario,
            idauth: result.data.user?.id,
            tipodoc: rawForm.tipoDocumento,
            correo: rawForm.email
          });
          this.router.navigateByUrl('/');
        }
      })
  }

  insertUserRegistered(user: Usuario): void {
    this.supabase.supabase.from('usuarios').insert({
      nombres: user.nombres,
      nro_doc: user.nro_doc,
      telefono: user.telefono,
      direccion: user.direccion,
      fecharegistro: new Date().toISOString(),
      estado: 'activo',
      tipouser: user.tipouser,
      idauth: user.idauth,
      tipodoc: user.tipodoc,
      correo: user.correo
    }).then((result) => {
      if (result.error) {
        console.error('Error inserting user:', result.error);
      } else {
        console.log('User inserted successfully:', result.data);
      }
    }
    )
  }
}
