import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';

import { Producto } from '@/models/Producto';
import { Marca } from '@/models/Marca';
import { Categoria } from '@/models/Categoria';

import { BusinessService } from '@/manage/services/business.service';
import { SupabaseService } from '@/auth/services/supabase.service';
import { ProductsService } from '@/manage/services/products.service';
import { MarkService } from '@/manage/services/mark.service';
import { CategoriesService } from '@/manage/services/categories.service';

@Component({
  selector: 'app-products-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './products-page.component.html',
})
export class ProductsPageComponent implements OnInit {
  idEmpresa: number | null = null;
  uniqueMarcas = signal<Marca[]>([]);
  uniqueCategorias = signal<Categoria[]>([]);

  productosDetallados = signal<{
    producto?: Producto;
    marca?: Marca;
    categoria?: Categoria;
  }[]>([]);

  isLoading = signal(true);
  error = signal<string | null>(null);

  nuevoProducto: Partial<Producto> = {
    descripcion: '',
    stock: 0,
    stock_minimo: 0,
    codigobarras: '',
    codigointerno: '',
    precioventa: 0,
    preciocompra: 0,
    id_marca: 0,
    id_categoria: 0
  };
  isNuevoProductoVisible = false;

  constructor(
    private productoService: ProductsService,
    private marcaService: MarkService,
    private categoriaService: CategoriesService,
    private supabase: SupabaseService,
    private empresaService: BusinessService,
    private router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    await this.cargarProductosDetallados();
    await this.loadUniqueMarcas();
    await this.loadUniqueCategorias();
  }

  async insertarProducto(): Promise<void> {
    if (!this.idEmpresa) return;
    if (!this.nuevoProducto.descripcion || !this.nuevoProducto.id_marca || !this.nuevoProducto.id_categoria) {
      this.error.set('Todos los campos obligatorios deben estar llenos');
      return;
    }

    const producto: Producto = {
      ...this.nuevoProducto,
      id: 0,
      id_empresa: this.idEmpresa,
    } as Producto;

    this.isLoading.set(true);
    try {
      await this.productoService.insertarProducto(producto).toPromise();
      this.isNuevoProductoVisible = false;
      this.nuevoProducto = {
        descripcion: '',
        stock: 0,
        stock_minimo: 0,
        codigobarras: '',
        codigointerno: '',
        precioventa: 0,
        preciocompra: 0,
        id_marca: 0,
        id_categoria: 0
      };
      await this.cargarProductosDetallados();
    } catch (err) {
      console.error(err);
      this.error.set('Error al insertar producto');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadUniqueMarcas(): Promise<void> {
    try {
      const userId = await this.supabase.getCurrentUserId();
      if (!userId) throw new Error('Usuario no autenticado');

      const empresa = await this.empresaService.getEmpresaDelUsuarioActual(userId).toPromise();
      if (!empresa || !empresa.id) throw new Error('Empresa no encontrada');

      const marcas = await this.marcaService.getMarcasPorEmpresa(empresa.id).toPromise();

      const marcasUnicas = marcas?.filter((v, i, a) =>
        a.findIndex(m => m?.id === v?.id) === i
      );

      this.uniqueMarcas.set(marcasUnicas ?? []);
    } catch (err) {
      console.error('Error al cargar marcas únicas:', err);
      this.error.set('Error al cargar marcas');
    }
  }

  async loadUniqueCategorias(): Promise<void> {
    try {
      const userId = await this.supabase.getCurrentUserId();
      if (!userId) throw new Error('Usuario no autenticado');

      const empresa = await this.empresaService.getEmpresaDelUsuarioActual(userId).toPromise();
      if (!empresa || !empresa.id) throw new Error('Empresa no encontrada');

      const categorias = await this.categoriaService.getCategoriasPorEmpresa(empresa.id).toPromise();

      const categoriasUnicas = categorias?.filter((v, i, a) =>
        a.findIndex(c => c?.id === v?.id) === i
      );

      this.uniqueCategorias.set(categoriasUnicas ?? []);
    } catch (err) {
      console.error('Error al cargar categorias únicas:', err);
      this.error.set('Error al cargar categorias');
    }
  }

  private async cargarProductosDetallados(): Promise<void> {
    this.isLoading.set(true);
    try {
      const userId = await this.supabase.getCurrentUserId();
      if (!userId) throw new Error('Usuario no autenticado');

      const empresa = await this.empresaService.getEmpresaDelUsuarioActual(userId).toPromise();
      if (!empresa || !empresa.id) throw new Error('Empresa no encontrada');

      this.idEmpresa = empresa.id;

      const [productos, marcas, categorias] = await Promise.all([
        this.productoService.getProductosPorEmpresa(empresa.id).toPromise(),
        this.marcaService.getMarcasPorEmpresa(empresa.id).toPromise(),
        this.categoriaService.getCategoriasPorEmpresa(empresa.id).toPromise(),
      ]);

      const combinados = (productos ?? []).map(prod => ({
        producto: prod,
        marca: marcas?.find(m => m.id === prod.id_marca)!,
        categoria: categorias?.find(c => c.id === prod.id_categoria)!,
      }));

      this.productosDetallados.set(combinados);
    } catch (err) {
      this.error.set('Error al cargar productos');
      console.error(err);
    } finally {
      this.isLoading.set(false);
    }
  }
}
