import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AdminSessionService } from '../core/admin-session';

const BASE_URL = 'http://localhost:8000';

export interface AdminLoginResponse {
  token: string;
}

export type AdminSearchScope = 'name' | 'content' | 'both';

export interface AdminTextRecord {
  id: number;
  name: string;
  content: string;
  tags: string[];
  created_at: string;
  usedInHistory: boolean;
  historyRunIds: number[];
}

export interface AdminBulkDeleteResponse {
  deletedIds: number[];
  inUseIds: number[];
  notFoundIds: number[];
}

export interface AdminCleanupSuggestions {
  unusedIds: number[];
  emptyIds: number[];
  duplicateGroups: number[][];
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  constructor(
    private http: HttpClient,
    private session: AdminSessionService,
  ) {}

  login(username: string, password: string): Observable<AdminLoginResponse> {
    return this.http
      .post<AdminLoginResponse>(`${BASE_URL}/admin/login`, { username, password })
      .pipe(tap((res) => this.session.setToken(res.token)));
  }

  listTexts(params?: {
    search?: string;
    scope?: AdminSearchScope;
    tag?: string;
  }): Observable<AdminTextRecord[]> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.scope) httpParams = httpParams.set('scope', params.scope);
    if (params?.tag) httpParams = httpParams.set('tag', params.tag);

    return this.http.get<AdminTextRecord[]>(`${BASE_URL}/admin/texts`, {
      headers: this.authHeaders(),
      params: httpParams,
    });
  }

  deleteText(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE_URL}/admin/texts/${id}`, {
      headers: this.authHeaders(),
    });
  }

  updateTags(id: number, tags: string[]): Observable<AdminTextRecord> {
    return this.http.patch<AdminTextRecord>(
      `${BASE_URL}/admin/texts/${id}/tags`,
      { tags },
      {
        headers: this.authHeaders(),
      },
    );
  }

  bulkDelete(ids: number[]): Observable<AdminBulkDeleteResponse> {
    return this.http.post<AdminBulkDeleteResponse>(
      `${BASE_URL}/admin/texts/bulk-delete`,
      { ids },
      {
        headers: this.authHeaders(),
      },
    );
  }

  getCleanupSuggestions(): Observable<AdminCleanupSuggestions> {
    return this.http.get<AdminCleanupSuggestions>(`${BASE_URL}/admin/texts/cleanup`, {
      headers: this.authHeaders(),
    });
  }

  exportCsv(): Observable<Blob> {
    return this.http.get(`${BASE_URL}/admin/texts/export.csv`, {
      headers: this.authHeaders(),
      responseType: 'blob',
    });
  }

  logout() {
    this.session.clear();
  }

  private authHeaders(): HttpHeaders {
    const token = this.session.token;
    return new HttpHeaders({ Authorization: `Bearer ${token ?? ''}` });
  }
}
