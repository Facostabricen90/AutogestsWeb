export interface Categoria {
  id: number;
  descripcion: string;
  id_empresa: number;
  color: string;
}

export interface CategoriaResponse {
  data: Categoria[];
  error: string | null;
}
