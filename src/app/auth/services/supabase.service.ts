import { Injectable, signal } from '@angular/core';
import {
  AuthChangeEvent,
  AuthResponse,
  AuthSession,
  createClient,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js'
import { environment } from '@environments/environment'
import { from, Observable } from 'rxjs';

export interface Profile {
  id?: string
  username: string
  website: string
  avatar_url: string
}


@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  public supabase: SupabaseClient
  _session: AuthSession | null = null
  currentUser = signal<{email: string; username: string} | null>(null);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey)
  }
  get session() {
    this.supabase.auth.getSession().then(({ data }) => {
      this._session = data.session
    })
    return this._session
  }
  profile(user: User) {
    return this.supabase
      .from('profiles')
      .select(`username, website, avatar_url`)
      .eq('id', user.id)
      .single()
  }
  authChanges(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }
  getCurrentUserEmail(){
    return this.supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) return null;
      return data.user.email;
    });
  }
  async getCurrentUserId(): Promise<string | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user?.id || null;
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }
  signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({email, password})
  }
  login(email: string, password: string): Observable<AuthResponse>{
    const promise = this.supabase.auth.signInWithPassword({
      email,
      password
    })
    return from(promise);
  };
  updateProfile(profile: Profile) {
    const update = {
      ...profile,
      updated_at: new Date(),
    }
    return this.supabase.from('profiles').upsert(update)
  }
  register(email: string, username: string, password: string): Observable<AuthResponse> {
    const promise = this.supabase.auth.signUp({
      email,
      password,
      options:{
        data: {
          username,
        }
      }
    });
    return from(promise);
  }
}
