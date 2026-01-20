import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

const BASE_URL = 'http://localhost:8000';

export interface AnalysisRunSummary {
  id: number;
  created_at: string;
  vectorizer: string;
  numClusters: number;
  useDimReduction: boolean;
  numComponents?: number | null;
  textCount: number;
  clusterCount: number;
}

export interface HistoryOverview {
  totalRuns: number;
  todayRuns: number;
  filteredRuns: number;
  runs: AnalysisRunSummary[];
}

export interface AnalysisRunOptions {
  vectorizer: string;
  maxFeatures?: number | null;
  numClusters: number;
  useDimReduction: boolean;
  numComponents?: number | null;
  useStopwords?: boolean | null;
  stopwordMode?: string | null;
}

export interface AnalysisRunText {
  id: number;
  name: string;
  content: string;
  created_at: string;
}

export interface ClusterSummary {
  id: number;
  clusterIndex: number;
  topTerms: string[];
  wordCloudPng?: string | null;
  size: number;
  textIds: number[];
  textNames: string[];
}

export interface AnalysisRunDetail {
  id: number;
  created_at: string;
  options: AnalysisRunOptions;
  texts: AnalysisRunText[];
  clusters: ClusterSummary[];
}

export interface HistoryQueryParams {
  start?: string;
  end?: string;
  textIds?: string;
  sort?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

@Injectable({ providedIn: 'root' })
export class HistoryApiService {
  constructor(private http: HttpClient) {}

  listHistory(params: HistoryQueryParams): Observable<HistoryOverview> {
    let httpParams = new HttpParams();
    if (params.start) httpParams = httpParams.set('start', params.start);
    if (params.end) httpParams = httpParams.set('end', params.end);
    if (params.textIds) httpParams = httpParams.set('text_ids', params.textIds);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);
    if (params.limit !== undefined)
      httpParams = httpParams.set('limit', String(params.limit));
    if (params.offset !== undefined)
      httpParams = httpParams.set('offset', String(params.offset));

    return this.http.get<HistoryOverview>(`${BASE_URL}/history`, { params: httpParams });
  }

  getHistoryDetail(runId: number): Observable<AnalysisRunDetail> {
    return this.http.get<AnalysisRunDetail>(`${BASE_URL}/history/${runId}`);
  }
}
