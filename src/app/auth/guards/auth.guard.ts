import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = () => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  if (supabaseService.session !== null) {
    return true;
  } else {
    router.navigate(['/auth/login']);
    return false;
  }
};
