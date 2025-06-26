export interface Movimiento {
  fecha: string;
  tipo: string;
  cantidad: number;
  id_producto: number;
  id_empresa: number;
  id_usuario?: number;
  estado?: number;
  detalle: string;
}
