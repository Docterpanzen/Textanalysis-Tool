import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

const BASE_URL = 'http://127.0.0.1:8000';

export type ShingleType = 'char' | 'word';

export interface PlagiarismOptions {
  shingleType: ShingleType;
  shingleSize: number;
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

export interface PlagiarismCheckResponse {
  similarityPercent: number;
  shingleType: ShingleType;
  shingleSize: number;
  numHashes: number;
  numBands: number;
  numRows: number;
  jaccardPercent?: number;
  candidatePairsFound?: number;
  notes?: string[];
}

@Injectable({ providedIn: 'root' })
export class PlagiatcheckerApiService {
  constructor(private http: HttpClient) {}

  checkFiles(
    fileA: File,
    fileB: File,
    options: PlagiarismOptions,
  ): Observable<PlagiarismCheckResponse> {
    const fd = new FormData();
    fd.append('fileA', fileA, fileA.name);
    fd.append('fileB', fileB, fileB.name);
    fd.append('options', JSON.stringify(options));
    return this.http.post<PlagiarismCheckResponse>(`${BASE_URL}/plagiarism/checkFiles`, fd);
  }
}
