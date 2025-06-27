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
import { BehaviorSubject, from, Observable, Observer } from 'rxjs';
import { RealtimePayload } from '@/manage/interfaces/RealtimePayload';
import { Message } from '@/manage/interfaces/Message';

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

  public supabase: SupabaseClient;
  private _session = new BehaviorSubject<AuthSession | null>(null);
  public session$ = this._session.asObservable();
  currentUser = signal<{ email: string; username: string } | null>(null);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        persistSession: true,
        storage: localStorage
      }
    });

    this.initAuthListener();
    this.loadInitialSession();
  }

  private initAuthListener(): void {
    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      this._session.next(session);
      if (session?.user) {
        this.updateCurrentUser(session.user);
      } else {
        this.currentUser.set(null);
      }
    });
  }

  private async loadInitialSession(): Promise<void> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      this._session.next(session);
      if (session?.user) {
        await this.updateCurrentUser(session.user);
      }
    } catch (error) {
      console.error('Error loading initial session:', error);
      this._session.next(null);
    }
  }

  private async updateCurrentUser(user: User): Promise<void> {
    try {
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      this.currentUser.set({
        email: user.email ?? '',
        username: profile?.username ?? ''
      });
    } catch (error) {
      console.error('Error updating current user:', error);
      this.currentUser.set({
        email: user.email ?? '',
        username: ''
      });
    }
  }

  get session(): AuthSession | null {
    return this._session.value;
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

  get client(): SupabaseClient {
    return this.supabase;
  }

  // Obtener todos los mensajes
  async getMessages(): Promise<{ data: Message[] | null; error: any }> {
    return await this.supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });
  }

  async addMessage(content: string, userId: string): Promise<{ data: Message[] | null; error: any }> {
    return await this.supabase
      .from('messages')
      .insert({ content, user_id: userId });
  }

  onTableChanges<T extends { [key: string]: any }>(tableName: string): Observable<RealtimePayload<T>> {
    return new Observable((observer: Observer<RealtimePayload<T>>) => {
      const channel = (this.supabase
        .channel(`public:${tableName}`) as any)
        .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload: RealtimePayload<T>) => {
          console.log('Realtime change received:', payload);
          observer.next(payload as RealtimePayload<T>);
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Suscrito a ${tableName} en tiempo real.`);
          } else if (status === 'CLOSED') {
            console.warn(`Suscripción a ${tableName} cerrada.`);
            observer.complete();
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Error en el canal de ${tableName}.`);
          }
        });

      return () => {
        console.log(`Desuscribiendo del canal de ${tableName}.`);
        this.supabase.removeChannel(channel);
      };
    });
  }
}
