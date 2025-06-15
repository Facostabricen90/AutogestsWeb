import { Injectable, signal } from '@angular/core';
import {
  createClient,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js'
import { environment } from '@environments/environment'
import { catchError, from, Observable, of } from 'rxjs';
import { Producto } from '@/models/Producto';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  insertarProducto(producto: Producto): Observable<{ success: boolean; error?: string }> {
    return from(
      this.supabase.rpc('insertarproductos', {
        _descripcion: producto.descripcion,
        _idmarca: producto.id_marca,
        _stock: producto.stock,
        _stock_minimo: producto.stock_minimo,
        _codigobarras: producto.codigobarras,
        _codigointerno: producto.codigointerno,
        _precioventa: producto.precioventa,
        _preciocompra: producto.preciocompra,
        _id_categoria: producto.id_categoria,
        _id_empresa: producto.id_empresa
      }).then(response => {
        if (response.error) throw response.error;
        return { success: true };
      })
    ).pipe(
      catchError(error => {
        console.error('Error al insertar producto:', error);
        return of({ success: false, error: error.message });
      })
    );
  }

  getProductosPorEmpresa(idEmpresa: number): Observable<Producto[]> {
    return from(
      this.supabase
        .from('productos')
        .select('*')
        .eq('id_empresa', idEmpresa)
        .then(response => {
          if (response.error) throw response.error;
          return response.data as Producto[];
        })
    ).pipe(
      catchError(error => {
        console.error('Error al obtener productos:', error);
        return of([]);
      })
    );
  }

  eliminarProducto(idProducto: number): Observable<{ success: boolean; error?: string }> {
    return from(
      this.supabase
        .from('productos')
        .delete()
        .eq('id', idProducto)
        .then(response => {
          if (response.error) throw response.error;
          return { success: true };
        })
    ).pipe(
      catchError(error => {
        console.error('Error al eliminar producto:', error);
        return of({ success: false, error: error.message });
      })
    );
  }

  editarProducto(id: number, descripcion: string): Observable<{ success: boolean; error?: string }> {
    return from(
      this.supabase.rpc('editarmarca', {
        _id: id,
        _descripcion: descripcion
      }).then(response => {
        if (response.error) throw response.error;
        return { success: true };
      })
    ).pipe(
      catchError(error => {
        console.error('Error al editar producto:', error);
        return of({ success: false, error: error.message });
      })
    );
  }

  actualizarProducto(producto: Producto): Observable<{ success: boolean; error?: string }> {
    if (!producto.id) {
      return of({ success: false, error: 'ID de producto no proporcionado' });
    }

    return from(
      this.supabase
        .from('productos')
        .update({
          descripcion: producto.descripcion,
          id_marca: producto.id_marca,
          stock: producto.stock,
          stock_minimo: producto.stock_minimo,
          codigobarras: producto.codigobarras,
          codigointerno: producto.codigointerno,
          precioventa: producto.precioventa,
          preciocompra: producto.preciocompra,
          id_categoria: producto.id_categoria
        })
        .eq('id', producto.id)
        .then(response => {
          if (response.error) throw response.error;
          return { success: true };
        })
    ).pipe(
      catchError(error => {
        console.error('Error al actualizar producto:', error);
        return of({ success: false, error: error.message });
      })
    );
  }
}
