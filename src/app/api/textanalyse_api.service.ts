import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// Diese Interfaces sollten zu deinen Pydantic-Schemas passen
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
}

export interface ClusterInfo {
  id: number;
  documentNames: string[];
  topTerms: string[];
}

export interface TextAnalysisResult {
  clusters: ClusterInfo[];
  vocabularySize: number;
}

export interface AnalyzeRequest {
  documents: TextDocument[];
  options: TextAnalysisOptions;
}

@Injectable({ providedIn: 'root' })
export class TextanalysisApiService {
  private baseUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  analyze(payload: AnalyzeRequest): Observable<TextAnalysisResult> {
    return this.http.post<TextAnalysisResult>(`${this.baseUrl}/analyze`, payload);
  }
}
