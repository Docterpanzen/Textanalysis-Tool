import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AdminSessionService } from '../core/admin-session';
import { TextRecord } from './texts_api.service';

const BASE_URL = 'http://localhost:8000';

export interface AdminLoginResponse {
  token: string;
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

  listTexts(): Observable<TextRecord[]> {
    return this.http.get<TextRecord[]>(`${BASE_URL}/admin/texts`, {
      headers: this.authHeaders(),
    });
  }

  deleteText(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE_URL}/admin/texts/${id}`, {
      headers: this.authHeaders(),
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
