export interface AsignarEmpresa {
  id: number;
  id_empresa: number;
  id_usuario: number;
}

export interface AsignarEmpresaResponse {
  data: AsignarEmpresa[];
  error: string | null;
}
