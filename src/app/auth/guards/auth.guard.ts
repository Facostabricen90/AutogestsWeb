import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { map } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  return supabase.session$.pipe(
    map(session => {
      if (session) return true;
      router.navigate(['/auth/login']);
      return false;
    })
  );
};
