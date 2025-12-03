import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  formatSize,
  getTextForComparison,
  toggleCleanMode,
  toggleOpen,
} from '../../__common/helper';
import { PlagiarismSessionService, UploadedTextFile } from '../../core/plagiarism-session';

type VectorizerType = 'bow' | 'tf' | 'tfidf';

interface ClusterInfo {
  id: number;
  documentNames: string[];
  topTerms: string[];
}

interface TextAnalysisResult {
  clusters: ClusterInfo[];
  vocabularySize: number;
}

@Component({
  selector: 'app-textanalyse',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './textanalyse.html',
  styleUrl: './textanalyse.css',
})
export class Textanalyse {
  // Session-Dateien
  get files(): UploadedTextFile[] {
    return this.session.files;
  }

  get hasFiles(): boolean {
    return this.files.length > 0;
  }

  // UI-State
  isLoading = false;
  errorMessage: string | null = null;
  result: TextAnalysisResult | null = null;

  // Pipeline-Parameter (Frontend)
  vectorizer: VectorizerType = 'tfidf';
  maxFeatures: number | null = 5000;
  numClusters = 3;
  useDimReduction = true;
  numComponents: number | null = 100; // aktuell nur Info

  constructor(
    private router: Router,
    public session: PlagiarismSessionService,
  ) {}

  goToInput() {
    this.router.navigate(['/input']);
  }

  // Helper-Wrapper für Template
  formatSize(bytes: number): string {
    return formatSize(bytes);
  }

  toggleCleanMode(item: UploadedTextFile) {
    toggleCleanMode(item);
  }

  toggleOpen(item: UploadedTextFile) {
    toggleOpen(item);
  }

  getTextForView(item: UploadedTextFile): string {
    return getTextForComparison(item);
  }

  startAnalysis() {
    if (!this.hasFiles) {
      this.errorMessage = 'Bitte zuerst Dateien im Tab „Input“ hochladen.';
      this.result = null;
      return;
    }

    this.errorMessage = null;
    this.isLoading = true;

    this.result = this.runLocalAnalysis();

    this.isLoading = false;
  }

  /** sehr einfache BoW/TF/TF-IDF-Analyse im Browser (Demo) */
  private runLocalAnalysis(): TextAnalysisResult {
    const docs = this.files.map((f) => ({
      name: f.file.name,
      content: getTextForComparison(f),
    }));

    const tokenizedDocs: string[][] = [];
    const docNames: string[] = [];

    for (const doc of docs) {
      const tokens = doc.content
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 0);

      tokenizedDocs.push(tokens);
      docNames.push(doc.name);
    }

    const vocabSet = new Set<string>();
    const docFreq = new Map<string, number>();

    tokenizedDocs.forEach((tokens) => {
      const unique = new Set(tokens);
      unique.forEach((term) => {
        vocabSet.add(term);
        docFreq.set(term, (docFreq.get(term) ?? 0) + 1);
      });
    });

    const vocabularySize = vocabSet.size;
    const numDocs = tokenizedDocs.length;

    const docWeights: Map<string, number>[] = [];

    tokenizedDocs.forEach((tokens) => {
      const counts = new Map<string, number>();
      tokens.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));

      const totalTokens = tokens.length || 1;
      const weights = new Map<string, number>();

      counts.forEach((count, term) => {
        let weight: number;

        if (this.vectorizer === 'bow') {
          weight = count;
        } else if (this.vectorizer === 'tf') {
          weight = count / totalTokens;
        } else {
          const tf = count / totalTokens;
          const df = docFreq.get(term) ?? 1;
          const idf = Math.log((numDocs + 1) / (df + 1)) + 1;
          weight = tf * idf;
        }

        weights.set(term, weight);
      });

      docWeights.push(weights);
    });

    // Mock-Clustering: Round-Robin
    const k = Math.max(1, this.numClusters || 1);
    const clusters: ClusterInfo[] = [];

    for (let clusterIdx = 0; clusterIdx < k; clusterIdx++) {
      const docIndices: number[] = [];
      for (let i = 0; i < docNames.length; i++) {
        if (i % k === clusterIdx) {
          docIndices.push(i);
        }
      }

      const docNamesInCluster = docIndices.map((i) => docNames[i]);

      const agg = new Map<string, number>();
      docIndices.forEach((i) => {
        const weights = docWeights[i];
        weights.forEach((w, term) => {
          agg.set(term, (agg.get(term) ?? 0) + w);
        });
      });

      const sortedTerms = Array.from(agg.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([term]) => term);

      clusters.push({
        id: clusterIdx + 1,
        documentNames: docNamesInCluster,
        topTerms: sortedTerms,
      });
    }

    return { clusters, vocabularySize };
  }
}
