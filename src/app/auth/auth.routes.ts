import { Route, Router, Routes } from "@angular/router";
import { AuthLayoutComponent } from "./layout/auth-layout/auth-layout.component";
import { LoginPageComponent } from "./pages/login-page/login-page.component";
import { RegisterPageComponent } from "./pages/register-page/register-page.component";
import { inject } from "@angular/core";
import { SupabaseService } from "./services/supabase.service";



export const authRoutes:Routes = [
    {
        path: '',
        component: AuthLayoutComponent,
        children: [
          {
            path: 'login',
            component: LoginPageComponent,
            canActivate: [() => !inject(SupabaseService).session ? true : inject(Router).createUrlTree(['/'])],
          },
          {
            path: 'register',
            component: RegisterPageComponent,
          },
          {
            path: '**',
            redirectTo: 'login',
          },
        ]
    }
];

export default authRoutes;
