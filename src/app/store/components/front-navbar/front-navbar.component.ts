import { SupabaseService } from '@/auth/services/supabase.service';
import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'front-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './front-navbar.component.html',
})
export class FrontNavbarComponent {
  error = signal<string | null>(null);

  constructor(
      private supabase: SupabaseService,
      private router: Router
    ) { }

  get userEmail(): string {
    return this.supabase.currentUser()?.email ?? '';
    }

  async cerrarSesion(): Promise<void> {
    try {
      await this.supabase.signOut();
      this.router.navigate(['/auth/login'], { replaceUrl: true });
    } catch (error) {
      this.error.set('Error al cerrar sesión');
    }
  }
}
