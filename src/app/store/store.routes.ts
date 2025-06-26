import { Routes } from "@angular/router";
import { StoreLayoutComponent } from "./layouts/store-layout/store-layout.component";
import { HomePageComponent } from "./pages/home-page/home-page.component";
import { NotFoundPageComponent } from "./pages/not-found-page/not-found-page.component";
import { authGuard } from "@/auth/guards/auth.guard";
import { BusinessPageComponent } from "./pages/business-page/business-page.component";
import { CategoriesPageComponent } from "./pages/categories-page/categories-page.component";
import { EmployeesPageComponent } from "./pages/employees-page/employees-page.component";
import { MarksPageComponent } from "./pages/marks-page/marks-page.component";
import { ProductsPageComponent } from "./pages/products-page/products-page.component";
import { KardexPageComponent } from "./pages/kardex-page/kardex-page.component";


export const storeRoutes: Routes = [
  {
    path: '',
    component: StoreLayoutComponent,
    children: [
      {
        path: '',
        component: HomePageComponent,
        canActivate: [authGuard]
      },
      {
        path: 'business',
        component: BusinessPageComponent,
      },
      {
        path: 'employees',
        component: EmployeesPageComponent,
      },
      {
        path: 'marks',
        component: MarksPageComponent,
      },
      {
        path: 'products',
        component: ProductsPageComponent,
      },
      {
        path: 'categories',
        component: CategoriesPageComponent,
      },
      {
        path: 'kardex',
        component: KardexPageComponent,
      },
      {
        path: '**',
        component: NotFoundPageComponent,
      }
    ]
  },

  {
    path: '**',
    redirectTo: ''
  }
];

export default storeRoutes;
