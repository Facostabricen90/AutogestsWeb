export interface Producto {
  id: number;
  descripcion: string;
  id_marca: number;
  stock: number;
  stock_minimo: number;
  codigobarras?: string;
  codigointerno?: string;
  precioventa: number;
  preciocompra: number;
  id_categoria: number;
  id_empresa: number;
}
