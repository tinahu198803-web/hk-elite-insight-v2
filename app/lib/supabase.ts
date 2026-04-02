/**
 * Supabase 客户端兼容层
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://atwlxpljfidlaaufeach.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

export interface QueryResult {
  data: any;
  error: { message: string; code?: number } | null;
}

class TableQuery {
  private baseUrl: string;
  private headers: Record<string, string>;
  private table: string;
  private queryParams: string[] = [];
  private body: any = null;
  private method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'GET';

  constructor(baseUrl: string, headers: Record<string, string>, table: string) {
    this.baseUrl = baseUrl;
    this.headers = headers;
    this.table = table;
  }

  select(constraints?: string | Record<string, string>) {
    if (typeof constraints === 'string') {
      this.queryParams.push(`select=${encodeURIComponent(constraints)}`);
    } else if (constraints) {
      Object.entries(constraints).forEach(([key, value]) => {
        this.queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      });
    } else {
      this.queryParams.push('select=*');
    }
    return this;
  }

  insert(data: any) { this.method = 'POST'; this.body = data; return this; }
  update(data: any, match?: Record<string, any>) {
    this.method = 'PATCH'; this.body = data;
    if (match) Object.entries(match).forEach(([k, v]) => this.queryParams.push(`${encodeURIComponent(k)}=eq.${encodeURIComponent(String(v))}`));
    return this;
  }
  upsert(data: any, match: Record<string, string>) { this.method = 'POST'; this.body = data; this.queryParams.push('on_conflict=' + Object.keys(match).join(',')); return this; }
  delete(match?: Record<string, any>) {
    this.method = 'DELETE';
    if (match) Object.entries(match).forEach(([k, v]) => this.queryParams.push(`${encodeURIComponent(k)}=eq.${encodeURIComponent(String(v))}`));
    return this;
  }
  eq(column: string, value: any) { this.queryParams.push(`${encodeURIComponent(column)}=eq.${encodeURIComponent(String(value))}`); return this; }
  neq(column: string, value: any) { this.queryParams.push(`${encodeURIComponent(column)}=neq.${encodeURIComponent(String(value))}`); return this; }
  gt(column: string, value: any) { this.queryParams.push(`${encodeURIComponent(column)}=gt.${encodeURIComponent(String(value))}`); return this; }
  gte(column: string, value: any) { this.queryParams.push(`${encodeURIComponent(column)}=gte.${encodeURIComponent(String(value))}`); return this; }
  lt(column: string, value: any) { this.queryParams.push(`${encodeURIComponent(column)}=lt.${encodeURIComponent(String(value))}`); return this; }
  lte(column: string, value: any) { this.queryParams.push(`${encodeURIComponent(column)}=lte.${encodeURIComponent(String(value))}`); return this; }
  like(column: string, value: string) { this.queryParams.push(`${encodeURIComponent(column)}=like.${encodeURIComponent(value)}`); return this; }
  ilike(column: string, value: string) { this.queryParams.push(`${encodeURIComponent(column)}=ilike.${encodeURIComponent(value)}`); return this; }
  in(column: string, values: any[]) { this.queryParams.push(`${encodeURIComponent(column)}=in.(${values.map(v => encodeURIComponent(String(v))).join(',')})`); return this; }
  contains(column: string, values: any[]) { this.queryParams.push(`${encodeURIComponent(column)}=cs.${encodeURIComponent(JSON.stringify(values))}`); return this; }
  order(column: string, options?: { ascending?: boolean }) { this.queryParams.push(`order=${encodeURIComponent(column)}.${options?.ascending ? 'asc' : 'desc'}`); return this; }
  limit(count: number) { this.queryParams.push(`limit=${count}`); return this; }
  range(start: number, end: number) { this.queryParams.push(`offset=${start}`); this.queryParams.push(`limit=${end - start + 1}`); return this; }
  single() { this.queryParams.push('limit=1'); return this; }

  async execute(): Promise<QueryResult> {
    const url = `${this.baseUrl}/rest/v1/${this.table}${this.queryParams.length > 0 ? '?' + this.queryParams.join('&') : ''}`;
    try {
      const response = await fetch(url, {
        method: this.method,
        headers: this.headers,
        body: this.method !== 'GET' && this.body ? JSON.stringify(this.body) : undefined
      });
      if (!response.ok) {
        const error = await response.text();
        return { data: null, error: { message: error, code: response.status } };
      }
      let data = await response.json();
      if (!Array.isArray(data) && this.queryParams.some(p => p.includes('limit=1'))) data = data ? [data] : [];
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  // Thenable接口支持
  then<TResult1 = QueryResult, TResult2 = never>(onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

class SupabaseClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  constructor() {
    this.baseUrl = SUPABASE_URL;
    this.headers = { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };
  }
  from(table: string): TableQuery { return new TableQuery(this.baseUrl, this.headers, table); }
}

export const supabaseAdmin = new SupabaseClient();
