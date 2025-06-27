export interface RealtimePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE' | '*';
  schema: string;
  table: string;
  commit_timestamp: string;
  errors: any[];
  old: T | null;
  new: T | null;
}
