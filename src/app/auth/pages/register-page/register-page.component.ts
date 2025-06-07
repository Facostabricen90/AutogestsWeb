import { SupabaseService } from '@/auth/services/supabase.service';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule],
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
          this.router.navigateByUrl('/');
        }
      })
  }

}
