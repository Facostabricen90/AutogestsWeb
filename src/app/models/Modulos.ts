export interface Modulos {
  id?: number;
  nombre: string;
  check: boolean;
}

export interface PermisoModulos {
  id_modulo?: number;
  modulos?: Modulos[];
}

export interface UsuarioConModulos {
  permisos: PermisoModulos[];
}
