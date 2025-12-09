import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type VectorizerType = 'bow' | 'tf' | 'tfidf';

export interface TextDocument {
  name: string;
  content: string;
}

export interface TextAnalysisOptions {
  vectorizer: VectorizerType;
  maxFeatures: number | null;
  numClusters: number;
  useDimReduction: boolean;
  numComponents: number | null;
  useStopwords: boolean;
  stopwordMode: string;
}

export interface ClusterInfo {
  id: number;
  documentNames: string[];
  topTerms: string[];
  wordCloudPng?: string; // base64-encoded PNG image
}

export interface TextAnalysisResult {
  clusters: ClusterInfo[];
  vocabularySize: number;
}

export interface AnalyzeRequest {
  documents: TextDocument[];
  options: TextAnalysisOptions;
}

export interface AnalyzeByIdsRequest {
  text_ids: number[];
  options: TextAnalysisOptions;
}

export interface CreateTextDto {
  name: string;
  content: string;
}

export interface TextRecord {
  id: number;
  name: string;
  content?: string;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class TextanalysisApiService {
  private baseUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  analyze(payload: AnalyzeRequest): Observable<TextAnalysisResult> {
    return this.http.post<TextAnalysisResult>(`${this.baseUrl}/analyze`, payload);
  }

  analyzeByIds(payload: AnalyzeByIdsRequest): Observable<TextAnalysisResult> {
    return this.http.post<TextAnalysisResult>(`${this.baseUrl}/analyze/byIds`, payload);
  }

  createText(dto: CreateTextDto): Observable<TextRecord> {
    return this.http.post<TextRecord>(`${this.baseUrl}/texts`, dto);
  }

  listTexts(): Observable<TextRecord[]> {
    return this.http.get<TextRecord[]>(`${this.baseUrl}/texts`);
  }

  deleteText(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/texts/${id}`);
  }
}
