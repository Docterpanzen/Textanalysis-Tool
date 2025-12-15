import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

const BASE_URL = 'http://127.0.0.1:8000';

export type ShingleType = 'char' | 'word';
export type StopwordMode = 'none' | 'de' | 'en' | 'de_en';

export interface PlagiarismDocument {
  name: string;
  content: string;
}

export interface PlagiarismOptions {
  shingleType: ShingleType;
  shingleSize: number; // k
  numHashes: number;
  numBands: number;
  numRows: number;

  cleaning?: {
    enabled: boolean;
    preset?: 'default' | 'strict';
    toLower?: boolean;
    normalizeWhitespace?: boolean;
    removeUrlsEmails?: boolean;
    stripDiacritics?: boolean;
    removePunctuation?: boolean;
  };
}

export interface PlagiarismCheckRequest {
  documents: [PlagiarismDocument, PlagiarismDocument];
  options: PlagiarismOptions;
}

export interface PlagiarismCheckResponse {
  // core result
  similarityPercent: number;

  // useful debug/telemetry
  shingleType: ShingleType;
  shingleSize: number;
  numHashes: number;
  numBands: number;
  numRows: number;

  // optional details (backend can omit these initially)
  jaccardPercent?: number;
  candidatePairsFound?: number;
  notes?: string[];
}

@Injectable({ providedIn: 'root' })
export class PlagiatcheckerApiService {
  constructor(private http: HttpClient) {}

  check(payload: PlagiarismCheckRequest): Observable<PlagiarismCheckResponse> {
    // Proposed backend route (we’ll implement next):
    // POST /plagiarism/check
    return this.http.post<PlagiarismCheckResponse>(`${BASE_URL}/plagiarism/check`, payload);
  }
}
