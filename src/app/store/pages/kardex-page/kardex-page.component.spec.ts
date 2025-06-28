import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { KardexPageComponent } from './kardex-page.component';
import { SupabaseService } from '@/auth/services/supabase.service';
import { BusinessService } from '@/manage/services/business.service';
import { KardexService } from '@/manage/services/kardex.service';
import { ProductsService } from '@/manage/services/products.service';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { Producto } from '@/models/Producto';
import { Kardex } from '@/models/Kardex';

describe('KardexPageComponent', () => {
  let component: KardexPageComponent;
  let fixture: ComponentFixture<KardexPageComponent>;
  let mockSupabaseService: jasmine.SpyObj<SupabaseService>;
  let mockBusinessService: jasmine.SpyObj<BusinessService>;
  let mockKardexService: jasmine.SpyObj<KardexService>;
  let mockProductsService: jasmine.SpyObj<ProductsService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockSupabaseService = jasmine.createSpyObj('SupabaseService', [
      'getCurrentUserId',
      'signOut',
      'onTableChanges',
      'getMessages',
      'addMessage'
    ]);
    mockBusinessService = jasmine.createSpyObj('BusinessService', ['getEmpresaDelUsuarioActual']);
    mockKardexService = jasmine.createSpyObj('KardexService', [
      'obtenerKardexPorEmpresa',
      'registrarMovimiento'
    ]);
    mockProductsService = jasmine.createSpyObj('ProductsService', ['getProductosPorEmpresa']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [],
      declarations: [KardexPageComponent],
      providers: [
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: BusinessService, useValue: mockBusinessService },
        { provide: KardexService, useValue: mockKardexService },
        { provide: ProductsService, useValue: mockProductsService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(KardexPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('loadInitialData', () => {
    it('debe cargar datos iniciales correctamente', fakeAsync(async () => {
      mockSupabaseService.getCurrentUserId.and.returnValue(Promise.resolve('user123'));
      mockBusinessService.getEmpresaDelUsuarioActual.and.returnValue(of({ id: 1, nombre: 'Empresa1', simbolomoneda: '$' }));
      mockKardexService.obtenerKardexPorEmpresa.and.returnValue(Promise.resolve([]));
      mockProductsService.getProductosPorEmpresa.and.returnValue(of([]));

      const spyKardex = spyOn<any>(component, 'loadKardexEntries').and.callThrough();
      const spyProducts = spyOn<any>(component, 'loadProductsForDialog').and.callThrough();

      await component['loadInitialData']();
      tick();

      expect(component.userId()).toBe('user123');
      expect(component.idEmpresa()).toBe(1);
      expect(spyKardex).toHaveBeenCalledWith(1);
      expect(spyProducts).toHaveBeenCalledWith(1);
      expect(component.error()).toBeNull();
    }));

    it('debe manejar error si usuario no autenticado', fakeAsync(async () => {
      mockSupabaseService.getCurrentUserId.and.returnValue(Promise.resolve(null));
      const spyNavigate = mockRouter.navigate.and.returnValue(Promise.resolve(true));
      await component['loadInitialData']();
      tick();
      expect(component.error()).toBe('Usuario no autenticado.');
      expect(spyNavigate).toHaveBeenCalledWith(['/login']);
    }));

    it('debe manejar error si empresa no encontrada', fakeAsync(async () => {
      mockSupabaseService.getCurrentUserId.and.returnValue(Promise.resolve('user123'));
      mockBusinessService.getEmpresaDelUsuarioActual.and.returnValue(of(null));
      await component['loadInitialData']();
      tick();
      expect(component.error()).toBe('No se encontró empresa para el usuario.');
    }));

    it('debe manejar error general', fakeAsync(async () => {
      mockSupabaseService.getCurrentUserId.and.returnValue(Promise.reject('fail'));
      await component['loadInitialData']();
      tick();
      expect(component.error()).toContain('Error al cargar datos iniciales');
    }));
  });

  describe('loadKardexEntries', () => {
    it('debe cargar kardex correctamente', fakeAsync(async () => {
      const kardex: Kardex[] = [{ id: 1, descripcion: 'desc', fecha: '2024-01-01', cantidad: 1, tipo: 'entrada', nombres: 'Juan', stock: 10, estado: 1 }];
      mockKardexService.obtenerKardexPorEmpresa.and.returnValue(Promise.resolve(kardex));
      await component['loadKardexEntries'](1);
      tick();
      expect(component.listaKardex()).toEqual(kardex);
      expect(component.error()).toBeNull();
    }));

    it('debe manejar error al cargar kardex', fakeAsync(async () => {
      mockKardexService.obtenerKardexPorEmpresa.and.returnValue(Promise.reject(new Error('fail')));
      await component['loadKardexEntries'](1);
      tick();
      expect(component.error()).toContain('Error al procesar Kardex');
    }));
  });

  describe('loadProductsForDialog', () => {
    it('debe cargar productos correctamente', fakeAsync(async () => {
      const productos: Producto[] = [{ id: 1, descripcion: 'prod', id_marca: 1, stock: 1, stock_minimo: 1, precioventa: 1, preciocompra: 1, id_categoria: 1, id_empresa: 1 }];
      mockProductsService.getProductosPorEmpresa.and.returnValue(of(productos));
      await component['loadProductsForDialog'](1);
      tick();
      expect(component.productos()).toEqual(productos);
    }));

    it('debe manejar error al cargar productos', fakeAsync(async () => {
      mockProductsService.getProductosPorEmpresa.and.returnValue(throwError(() => new Error('fail')));
      await component['loadProductsForDialog'](1);
      tick();
      expect(component.productos()).toEqual([]);
    }));
  });

  describe('openMovementDialog', () => {
    it('debe abrir el diálogo y resetear valores', () => {
      component.tipoMovimiento.set('salida');
      component.searchQuery.set('test');
      component.selectedProducto.set({ id: 1 } as Producto);
      component.cantidad.set(5);
      component.showDialog.set(false);

      component.openMovementDialog('entrada');

      expect(component.tipoMovimiento()).toBe('entrada');
      expect(component.searchQuery()).toBe('');
      expect(component.selectedProducto()).toBeNull();
      expect(component.cantidad()).toBe(0);
      expect(component.showDialog()).toBeTrue();
    });
  });

  describe('saveMovement', () => {
    it('debe registrar movimiento correctamente', fakeAsync(async () => {
      component.selectedProducto.set({ id: 1 } as Producto);
      component.idEmpresa.set(1);
      component.tipoMovimiento.set('entrada');
      component.cantidad.set(2);
      component.userId.set('user123');
      mockKardexService.registrarMovimiento.and.returnValue(Promise.resolve());
      spyOn(component, 'showToastNotification');
      spyOn<any>(component, 'loadKardexEntries').and.returnValue(Promise.resolve());
      spyOn<any>(component, 'loadInitialData').and.returnValue(Promise.resolve());

      await component.saveMovement();
      tick();

      expect(component.showDialog()).toBeFalse();
      expect(component.showToastNotification).toHaveBeenCalledWith('Movimiento registrado con éxito.', 'alert-success');
    }));

    it('debe mostrar error si faltan datos', fakeAsync(async () => {
      component.selectedProducto.set(null);
      component.idEmpresa.set(1);
      component.cantidad.set(0);
      component.userId.set('user123');
      await component.saveMovement();
      tick();
      expect(component.error()).toBe('Por favor, selecciona un producto y especifica una cantidad válida.');
    }));

    it('debe mostrar error si usuario no autenticado', fakeAsync(async () => {
      component.selectedProducto.set({ id: 1 } as Producto);
      component.idEmpresa.set(1);
      component.cantidad.set(2);
      component.userId.set(null);
      await component.saveMovement();
      tick();
      expect(component.error()).toBe('Usuario no autenticado.');
    }));

    it('debe manejar error al registrar movimiento', fakeAsync(async () => {
      component.selectedProducto.set({ id: 1 } as Producto);
      component.idEmpresa.set(1);
      component.tipoMovimiento.set('entrada');
      component.cantidad.set(2);
      component.userId.set('user123');
      mockKardexService.registrarMovimiento.and.returnValue(Promise.reject(new Error('fail')));
      spyOn(component, 'showToastNotification');
      await component.saveMovement();
      tick();
      expect(component.error()).toContain('Error al registrar movimiento');
      expect(component.showToastNotification).toHaveBeenCalledWith('Error: fail', 'alert-error');
    }));
  });

  describe('onDialogDismiss', () => {
    it('debe cerrar el diálogo y resetear valores', () => {
      component.showDialog.set(true);
      component.selectedProducto.set({ id: 1 } as Producto);
      component.cantidad.set(5);

      component.onDialogDismiss();

      expect(component.showDialog()).toBeFalse();
      expect(component.selectedProducto()).toBeNull();
      expect(component.cantidad()).toBe(0);
    });
  });

  describe('filteredProductos', () => {
    it('debe filtrar productos por descripción', () => {
      component.productos.set([
        { id: 1, descripcion: 'Manzana', id_marca: 1, stock: 1, stock_minimo: 1, precioventa: 1, preciocompra: 1, id_categoria: 1, id_empresa: 1 },
        { id: 2, descripcion: 'Banana', id_marca: 1, stock: 1, stock_minimo: 1, precioventa: 1, preciocompra: 1, id_categoria: 1, id_empresa: 1 }
      ]);
      component.searchQuery.set('manz');
      const result = component.filteredProductos;
      expect(result.length).toBe(1);
      expect(result[0].descripcion).toBe('Manzana');
    });
  });

  describe('selectProduct', () => {
    it('debe seleccionar un producto', () => {
      const prod = { id: 1 } as Producto;
      component.selectProduct(prod);
      expect(component.selectedProducto()).toEqual(prod);
    });
  });

  describe('cerrarSesion', () => {
    it('debe cerrar sesión y navegar a login', fakeAsync(async () => {
      mockSupabaseService.signOut.and.returnValue(Promise.resolve());
      mockRouter.navigate.and.returnValue(Promise.resolve(true));
      await component.cerrarSesion();
      tick();
      expect(mockSupabaseService.signOut).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
    }));

    it('debe manejar error al cerrar sesión', fakeAsync(async () => {
      mockSupabaseService.signOut.and.returnValue(Promise.reject(new Error('fail')));
      await component.cerrarSesion();
      tick();
      expect(component.error()).toContain('Error al cerrar sesión');
    }));
  });

  describe('navegarAConfiguracion', () => {
    it('debe navegar a configuración', () => {
      component.navegarAConfiguracion();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/configuracion']);
    });
  });

  describe('showToastNotification', () => {
    it('debe mostrar y ocultar notificación', fakeAsync(() => {
      component.showToastNotification('Mensaje', 'alert-success');
      expect(component.notificationMessage()).toBe('Mensaje');
      expect(component.notificationTypeClass()).toBe('alert-success');
      expect(component.showNotification()).toBeTrue();
      tick(5000);
      expect(component.showNotification()).toBeFalse();
      expect(component.notificationMessage()).toBe('');
      flush();
    }));
  });
});
