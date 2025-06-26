import { Injectable } from '@angular/core';
import { SupabaseService } from '@/auth/services/supabase.service';
import { Kardex } from '@/models/Kardex';
import { Movimiento } from '@/models/Movimiento';
import { UsersService } from '@/manage/services/users.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KardexService {

  constructor(
    private supabaseService: SupabaseService,
    private usuariosService: UsersService
  ) { }

  async obtenerKardexPorEmpresa(idEmpresa: number): Promise<Kardex[]> {
    try {
      const { data, error } = await this.supabaseService.client.rpc(
        'mostrarkardexporempresa',
        { _id_empresa: idEmpresa }
      );

      if (error) {
        throw new Error(error.message);
      }

      return data as Kardex[];
    } catch (error) {
      console.error('Error fetching Kardex details:', error);
      throw error;
    }
  }

  async registrarMovimiento(movimientoData: Omit<Movimiento, 'id_usuario'> & { id_usuario: string }): Promise<void> {
    try {
      const userIdInterno = await firstValueFrom(
        this.usuariosService.getUserIdByAuthId(movimientoData.id_usuario)
      );

      if (userIdInterno === null) {
        throw new Error('No se encontró el ID interno del usuario para el movimiento.');
      }

      const movimientoAInsertar: Movimiento = {
        ...movimientoData,
        id_usuario: userIdInterno
      };

      const { error } = await this.supabaseService.client
        .from('kardex')
        .insert(movimientoAInsertar);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('Error al registrar movimiento en el servicio:', error.message || error);
      throw error;
    }
  }
}
