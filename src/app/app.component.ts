import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { SupabaseService } from './auth/services/supabase.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  authService = inject(SupabaseService)

  ngOnInit(): void {
    this.authService.supabase.auth.onAuthStateChange((event, session) => {
      if(event === 'SIGNED_IN') {
        this.authService.currentUser.set({
          email: session?.user.email!,
          username: session?.user.identities?.at(0)?.identity_data?.['username'],
        });
      } else if(event === 'SIGNED_OUT'){
        this.authService.currentUser.set(null);
      }
      console.log('!!', event, session);
    });
  }
  title = 'Autogest';
}
