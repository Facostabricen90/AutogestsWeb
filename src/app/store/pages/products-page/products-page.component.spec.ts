import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { ProductsPageComponent } from './products-page.component';
import { ProductsService } from '@/manage/services/products.service';
import { MarkService } from '@/manage/services/mark.service';
import { CategoriesService } from '@/manage/services/categories.service';
import { SupabaseService } from '@/auth/services/supabase.service';
import { BusinessService } from '@/manage/services/business.service';
import { of, throwError } from 'rxjs';
import { Producto } from '@/models/Producto';
import { Marca } from '@/models/Marca';
import { Categoria } from '@/models/Categoria';

describe('ProductsPageComponent', () => {
  let component: ProductsPageComponent;
  let fixture: ComponentFixture<ProductsPageComponent>;
  let mockProductsService: jasmine.SpyObj<ProductsService>;
  let mockMarkService: jasmine.SpyObj<MarkService>;
  let mockCategoriesService: jasmine.SpyObj<CategoriesService>;
  let mockSupabaseService: jasmine.SpyObj<SupabaseService>;
  let mockBusinessService: jasmine.SpyObj<BusinessService>;

  beforeEach(async () => {
    mockProductsService = jasmine.createSpyObj('ProductsService', [
      'getProductosPorEmpresa',
      'insertarProducto',
      'eliminarProducto',
      'actualizarProducto'
    ]);
    mockMarkService = jasmine.createSpyObj('MarkService', ['getMarcasPorEmpresa']);
    mockCategoriesService = jasmine.createSpyObj('CategoriesService', ['getCategoriasPorEmpresa']);
    mockSupabaseService = jasmine.createSpyObj('SupabaseService', [
      'getCurrentUserId',
      'onTableChanges',
      'getMessages',
      'addMessage'
    ]);
    mockBusinessService = jasmine.createSpyObj('BusinessService', ['getEmpresaDelUsuarioActual']);

    await TestBed.configureTestingModule({
      imports: [],
      declarations: [ProductsPageComponent],
      providers: [
        { provide: ProductsService, useValue: mockProductsService },
        { provide: MarkService, useValue: mockMarkService },
        { provide: CategoriesService, useValue: mockCategoriesService },
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: BusinessService, useValue: mockBusinessService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductsPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('cargarProductosDetallados', () => {
    it('debe cargar productos detallados correctamente', fakeAsync(async () => {
      const userId = 'user123';
      const empresa = { id: 1, nombre: 'Empresa1', simbolomoneda: '$' };
      const productos: Producto[] = [
        { id: 1, descripcion: 'Prod1', id_marca: 1, stock: 10, stock_minimo: 2, precioventa: 100, preciocompra: 80, id_categoria: 1, id_empresa: 1 }
      ];
      const marcas: Marca[] = [{ id: 1, descripcion: 'Marca1', id_empresa: 1 }];
      const categorias: Categoria[] = [{ id: 1, descripcion: 'descripcion', id_empresa: 1, color : 'rojo' }];

      mockSupabaseService.getCurrentUserId.and.returnValue(Promise.resolve(userId));
      mockBusinessService.getEmpresaDelUsuarioActual.and.returnValue(of(empresa));
      mockProductsService.getProductosPorEmpresa.and.returnValue(of(productos));
      mockMarkService.getMarcasPorEmpresa.and.returnValue(of(marcas));
      mockCategoriesService.getCategoriasPorEmpresa.and.returnValue(of(categorias));

      await component.cargarProductosDetallados();
      tick();

      expect(component.productosDetallados().length).toBe(1);
      expect(component.productosDetallados()[0].producto?.descripcion).toBe('Prod1');
      expect(component.productosDetallados()[0].marca?.descripcion).toBe('Marca1');
      expect(component.productosDetallados()[0].categoria?.descripcion).toBe('Cat1');
    }));

    it('debe manejar error si usuario no autenticado', fakeAsync(async () => {
      mockSupabaseService.getCurrentUserId.and.returnValue(Promise.resolve(null));
      await component.cargarProductosDetallados();
      tick();
      expect(component.error()).toBe('Error al cargar productos');
    }));

    it('debe manejar error si empresa no encontrada', fakeAsync(async () => {
      mockSupabaseService.getCurrentUserId.and.returnValue(Promise.resolve('user123'));
      mockBusinessService.getEmpresaDelUsuarioActual.and.returnValue(of(null));
      await component.cargarProductosDetallados();
      tick();
      expect(component.error()).toBe('Error al cargar productos');
    }));
  });

  describe('loadUniqueMarcas', () => {
    it('debe cargar marcas únicas', fakeAsync(async () => {
      mockSupabaseService.getCurrentUserId.and.returnValue(Promise.resolve('user123'));
      mockBusinessService.getEmpresaDelUsuarioActual.and.returnValue(of({ id: 1, nombre: 'Empresa1', simbolomoneda: '$' }));
      mockMarkService.getMarcasPorEmpresa.and.returnValue(of([
        { id: 1, descripcion: 'Marca1', id_empresa: 1 },
        { id: 2, descripcion: 'Marca2', id_empresa: 1 },
        { id: 1, descripcion: 'Marca1', id_empresa: 1 }
      ]));

      await component.loadUniqueMarcas();
      tick();

      expect(component.uniqueMarcas().length).toBe(2);
      expect(component.uniqueMarcas()[0].descripcion).toBe('Marca1');
      expect(component.uniqueMarcas()[1].descripcion).toBe('Marca2');
    }));

    it('debe manejar error al cargar marcas', fakeAsync(async () => {
      mockSupabaseService.getCurrentUserId.and.returnValue(Promise.resolve('user123'));
      mockBusinessService.getEmpresaDelUsuarioActual.and.returnValue(of({ id: 1, nombre: 'Empresa1', simbolomoneda: '$' }));
      mockMarkService.getMarcasPorEmpresa.and.returnValue(throwError(() => new Error('fail')));
      await component.loadUniqueMarcas();
      tick();
      expect(component.error()).toBe('Error al cargar marcas');
    }));
  });

  describe('loadUniqueCategorias', () => {
    it('debe cargar categorías únicas', fakeAsync(async () => {
      mockSupabaseService.getCurrentUserId.and.returnValue(Promise.resolve('user123'));
      mockBusinessService.getEmpresaDelUsuarioActual.and.returnValue(of({ id: 1, nombre: 'Empresa1', simbolomoneda: '$' }));
      mockCategoriesService.getCategoriasPorEmpresa.and.returnValue(of([
        { id: 1, descripcion: 'descripcion', id_empresa: 1, color: 'rojo' },
        { id: 1, descripcion: 'descripcion', id_empresa: 1, color: 'rojo' },
        { id: 1, descripcion: 'descripcion', id_empresa: 1, color: 'rojo' }
      ]));

      await component.loadUniqueCategorias();
      tick();

      expect(component.uniqueCategorias().length).toBe(2);
      expect(component.uniqueCategorias()[0].descripcion).toBe('Cat1');
      expect(component.uniqueCategorias()[1].descripcion).toBe('Cat2');
    }));

    it('debe manejar error al cargar categorías', fakeAsync(async () => {
      mockSupabaseService.getCurrentUserId.and.returnValue(Promise.resolve('user123'));
      mockBusinessService.getEmpresaDelUsuarioActual.and.returnValue(of({ id: 1, nombre: 'Empresa1', simbolomoneda: '$' }));
      mockCategoriesService.getCategoriasPorEmpresa.and.returnValue(throwError(() => new Error('fail')));
      await component.loadUniqueCategorias();
      tick();
      expect(component.error()).toBe('Error al cargar categorias');
    }));
  });

  describe('insertarProducto', () => {
    it('debe insertar un producto correctamente', fakeAsync(async () => {
      component.idEmpresa = 1;
      component.nuevoProducto = {
        descripcion: 'Nuevo',
        id_marca: 1,
        id_categoria: 1,
        stock: 10,
        stock_minimo: 2,
        precioventa: 100,
        preciocompra: 80
      };
      mockProductsService.insertarProducto.and.returnValue(of({ success: true }));
      spyOn(component, 'cargarProductosDetallados').and.returnValue(Promise.resolve());
      spyOn(component, 'showToastNotification');

      await component.insertarProducto();
      tick();

      expect(component.isNuevoProductoVisible).toBeFalse();
      expect(component.nuevoProducto.descripcion).toBe('');
      expect(component.cargarProductosDetallados).toHaveBeenCalled();
      expect(component.showToastNotification).toHaveBeenCalledWith('Producto registrado con éxito.', 'alert-success');
    }));

    it('debe mostrar error si faltan campos obligatorios', fakeAsync(async () => {
      component.idEmpresa = 1;
      component.nuevoProducto = { descripcion: '', id_marca: 0, id_categoria: 0 };
      await component.insertarProducto();
      tick();
      expect(component.error()).toBe('Todos los campos obligatorios deben estar llenos');
    }));

    it('debe manejar error al insertar producto', fakeAsync(async () => {
      component.idEmpresa = 1;
      component.nuevoProducto = {
        descripcion: 'Nuevo',
        id_marca: 1,
        id_categoria: 1,
        stock: 10,
        stock_minimo: 2,
        precioventa: 100,
        preciocompra: 80
      };
      mockProductsService.insertarProducto.and.returnValue(throwError(() => new Error('fail')));
      spyOn(component, 'showToastNotification');
      await component.insertarProducto();
      tick();
      expect(component.error()).toBe('Error al insertar producto');
      expect(component.showToastNotification).toHaveBeenCalledWith('Error al insertar producto', 'alert-error');
    }));
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
})
