import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment.prod';

const BASE_URL = environment.apiBaseUrl;

export interface CreateTextDto {
  name: string;
  content: string;
}

export interface TextRecord {
  id: number;
  name: string;
  content?: string;
  language?: string | null;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class TextsApiService {
  constructor(private http: HttpClient) {}

  createText(payload: CreateTextDto): Observable<TextRecord> {
    return this.http.post<TextRecord>(`${BASE_URL}/texts`, payload);
  }

  listTexts(): Observable<TextRecord[]> {
    return this.http.get<TextRecord[]>(`${BASE_URL}/texts`);
  }

  getText(id: number): Observable<TextRecord> {
    return this.http.get<TextRecord>(`${BASE_URL}/texts/${id}`);
  }
}
