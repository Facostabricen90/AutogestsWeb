export interface Marca {
  id: number;
  descripcion: string;
  id_empresa: number;
}

export interface MarcaResponse {
  data: Marca[];
  error: string | null;
}
export interface MarcaCreateResponse {
  data: Marca;
  error: string | null;
}
export interface MarcaUpdateResponse {
  data: Marca;
  error: string | null;
}
