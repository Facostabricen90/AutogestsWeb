export interface Empresa {
  id?: number;
  nombre: string;
  simbolomoneda: string;
}

export interface EmpresaResponse {
  data: Empresa[];
  error: string | null;
}
export interface EmpresaCreateResponse {
  data: Empresa;
  error: string | null;
}
