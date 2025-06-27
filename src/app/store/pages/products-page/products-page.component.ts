import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, of, Subscription } from 'rxjs';

import { Producto } from '@/models/Producto';
import { Marca } from '@/models/Marca';
import { Categoria } from '@/models/Categoria';

import { BusinessService } from '@/manage/services/business.service';
import { SupabaseService } from '@/auth/services/supabase.service';
import { ProductsService } from '@/manage/services/products.service';
import { MarkService } from '@/manage/services/mark.service';
import { CategoriesService } from '@/manage/services/categories.service';
import { RealtimePayload } from '@/manage/interfaces/RealtimePayload';
import { Message } from '@/manage/interfaces/Message';

@Component({
  selector: 'app-products-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './products-page.component.html',
})
export class ProductsPageComponent implements OnInit {
  idEmpresa: number | null = null;
  uniqueMarcas = signal<Marca[]>([]);
  uniqueCategorias = signal<Categoria[]>([]);

   messages: Message[] = [];
    newMessageContent: string = '';
    currentUserId: string = 'user_' + Math.random().toString(36).substring(7);

    showNotification = signal(false);
    notificationMessage = signal('');
    notificationTypeClass = signal('alert-info');
    private notificationTimeout: any;

    private realtimeSubscription: Subscription | undefined;
    private chatMessagesSubscription: Subscription | undefined;


    lastRealtimeNotification: RealtimePayload<Message> | null = null;

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
    await this.loadMessages();

        this.realtimeSubscription = this.supabase.onTableChanges<Message>('messages').subscribe(
          (payload) => {
            this.lastRealtimeNotification = payload;

            if (payload.eventType === 'INSERT' && payload.new) {
              this.messages.push(payload.new);
              this.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              const index = this.messages.findIndex(msg => msg.id === payload.old?.id);
              if (index !== -1) {
                this.messages[index] = payload.new;
              }
            } else if (payload.eventType === 'DELETE' && payload.old) {
              this.messages = this.messages.filter(msg => msg.id !== payload.old?.id);
            }
          },
          (error) => {
            console.error('Error en la suscripción de Realtime:', error);
          }
        );
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
      this.showToastNotification('Producto registrado con éxito.', 'alert-success');
    } catch (err) {
      console.error(err);
      this.error.set('Error al insertar producto');
      this.showToastNotification('Error al insertar producto', 'alert-error');
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

  async loadMessages(): Promise<void> {
    const { data, error } = await this.supabase.getMessages();
    if (error) {
      console.error('Error al cargar mensajes:', error);
    } else {
      this.messages = data || [];
    }
  }

  async sendMessage(): Promise<void> {
    if (this.newMessageContent.trim()) {
      const { data, error } = await this.supabase.addMessage(this.newMessageContent, this.currentUserId);
      if (error) {
        console.error('Error al enviar mensaje:', error);
      } else {
        console.log('Mensaje enviado:', data);
        this.newMessageContent = '';
      }
    }
  }

  showToastNotification(message: string, typeClass: string = 'alert-info'): void {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }

    this.notificationMessage.set(message);
    this.notificationTypeClass.set(typeClass);
    this.showNotification.set(true);

    this.notificationTimeout = setTimeout(() => {
      this.showNotification.set(false);
      this.notificationMessage.set('');
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
    }
    if (this.chatMessagesSubscription) {
      this.chatMessagesSubscription.unsubscribe();
    }
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
  }
}
