// src/app/core/texts-api.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

const BASE_URL = 'http://127.0.0.1:8000'; // später gern in environment auslagern

/** DTO für das Anlegen eines Textes im Backend */
export interface CreateTextDto {
  name: string;
  content: string;
}

/** So ungefähr sieht ein Text-Datensatz von der API aus */
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

  /** Neuen Text in der DB anlegen */
  createText(payload: CreateTextDto): Observable<TextRecord> {
    return this.http.post<TextRecord>(`${BASE_URL}/texts`, payload);
  }

  /** Alle Texte holen (brauchen wir später für die Textanalyse-Seite) */
  listTexts(): Observable<TextRecord[]> {
    return this.http.get<TextRecord[]>(`${BASE_URL}/texts`);
  }

  /** Einzelnen Text holen (z.B. für Detailansicht / Dashboard) */
  getText(id: number): Observable<TextRecord> {
    return this.http.get<TextRecord>(`${BASE_URL}/texts/${id}`);
  }
}
