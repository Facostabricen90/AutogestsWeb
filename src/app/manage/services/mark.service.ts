import { Injectable, signal } from '@angular/core';
import {
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js'
import { environment } from '@environments/environment'
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MarkService {

  constructor() { }

}
