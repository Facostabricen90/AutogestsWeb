import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '@/auth/services/supabase.service';

@Component({
  selector: 'app-login-page',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {

  fb = inject(FormBuilder);
  supabase = inject(SupabaseService);
  router = inject(Router);
  hasError = signal(false);
  isPosting = signal(false);

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  errorMessage: string | null = null;

  onSubmit(): void {
    const rawForm = this.loginForm.getRawValue();
    this.supabase
      .login(rawForm.email, rawForm.password)
      .subscribe((result) => {
        if ( result.error ) {
          this.errorMessage = result.error.message
        } else {
          this.router.navigateByUrl('/');
        }
      })
  }
}
