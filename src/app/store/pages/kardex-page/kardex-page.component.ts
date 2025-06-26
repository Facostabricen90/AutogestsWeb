import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '@/auth/services/supabase.service';
import { BusinessService } from '@/manage/services/business.service';
import { KardexService } from '@/manage/services/kardex.service';
import { ProductsService } from '@/manage/services/products.service';
import { Kardex } from '@/models/Kardex';
import { Producto } from '@/models/Producto';
import { Movimiento } from '@/models/Movimiento';
import { catchError, of, firstValueFrom } from 'rxjs';
import { UsersService } from '@/manage/services/users.service';

@Component({
  selector: 'app-kardex-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './kardex-page.component.html',
})
export class KardexPageComponent {
  idEmpresa = signal<number | null>(null);
  listaKardex = signal<Kardex[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  showDialog = signal(false);
  tipoMovimiento = signal<"entrada" | "salida">("entrada");
  searchQuery = signal('');
  productos = signal<Producto[]>([]);
  selectedProducto = signal<Producto | null>(null);
  cantidad = signal<number>(0);
  userId = signal<string | null>(null);
  menuOpcionesAbierto = false;

  constructor(
    private kardexService: KardexService,
    private supabaseService: SupabaseService,
    private businessService: BusinessService,
    private productosService: ProductsService,
    private UsuariosService: UsersService,
    private router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    await this.loadInitialData();
  }

  private async loadInitialData(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const currentUserId = await this.supabaseService.getCurrentUserId();
      this.userId.set(currentUserId);

      if (!currentUserId) {
        this.error.set('Usuario no autenticado.');
        this.router.navigate(['/login']);
        return;
      }

      const empresa = await firstValueFrom(this.businessService.getEmpresaDelUsuarioActual(currentUserId));
      if (empresa?.id) {
        this.idEmpresa.set(empresa.id);
        await this.loadKardexEntries(empresa.id);
        await this.loadProductsForDialog(empresa.id);
      } else {
        this.error.set('No se encontró empresa para el usuario.');
      }
    } catch (err: any) {
      this.error.set(`Error al cargar datos iniciales: ${err.message || err}`);
      console.error('Error loading initial data:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadKardexEntries(companyId: number): Promise<void> {
    this.error.set(null);
    try {
      const kardex = await this.kardexService.obtenerKardexPorEmpresa(companyId);
      this.listaKardex.set(kardex);
    } catch (err: any) {
      this.error.set(`Error al procesar Kardex: ${err.message || err}`);
      console.error('Error processing Kardex:', err);
    }
  }

  private async loadProductsForDialog(companyId: number): Promise<void> {
    try {
      const prods = await firstValueFrom(
        this.productosService.getProductosPorEmpresa(companyId).pipe(
          catchError(err => {
            console.error("Error fetching products:", err);
            return of([]);
          })
        )
      );
      this.productos.set(prods);
    } catch (err: any) {
      console.error('Error loading products for dialog:', err);
    }
  }

  openMovementDialog(type: "entrada" | "salida"): void {
    this.tipoMovimiento.set(type);
    this.searchQuery.set('');
    this.selectedProducto.set(null);
    this.cantidad.set(0);
    this.showDialog.set(true);
  }

  async saveMovement(): Promise<void> {
    const selectedProd = this.selectedProducto();
    const currentCompanyId = this.idEmpresa();
    const moveType = this.tipoMovimiento();
    const moveQuantity = this.cantidad();
    const currentUserId = this.userId();

    if (!selectedProd || !currentCompanyId || isNaN(moveQuantity) || moveQuantity <= 0) {
      this.error.set('Por favor, selecciona un producto y especifica una cantidad válida.');
      return;
    }

    if (!currentUserId) {
      this.error.set('Usuario no autenticado.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const newMovement = {
        fecha: new Date().toISOString().split('T')[0],
        tipo: moveType,
        cantidad: moveQuantity,
        id_producto: selectedProd.id,
        id_empresa: currentCompanyId,
        detalle: `Movimiento de ${moveType}`,
        id_usuario: currentUserId,
      };

      await this.kardexService.registrarMovimiento(newMovement);
      this.showDialog.set(false);
      await this.loadKardexEntries(currentCompanyId);
      console.log('Movimiento registrado con éxito!');
      window.location.reload();
    } catch (err: any) {
      this.error.set(`Error al registrar movimiento: ${err.message || err}`);
      console.error('Error registering movement:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  onDialogDismiss(): void {
    this.showDialog.set(false);
    this.selectedProducto.set(null);
    this.cantidad.set(0);
  }

  get filteredProductos(): Producto[] {
    const query = this.searchQuery().toLowerCase();
    return this.productos().filter(p => p.descripcion.toLowerCase().includes(query));
  }

  selectProduct(product: Producto): void {
    this.selectedProducto.set(product);
  }

  async cerrarSesion(): Promise<void> {
    try {
      await this.supabaseService.signOut();
      this.router.navigate(['/login'], { replaceUrl: true });
    } catch (err: any) {
      this.error.set(`Error al cerrar sesión: ${err.message || err}`);
      console.error('Error signing out:', err);
    }
  }

  navegarAConfiguracion(): void {
    this.router.navigate(['/configuracion']);
   }
}
