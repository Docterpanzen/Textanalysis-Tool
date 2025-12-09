// src/app/pages/textanalyse/textanalyse.ts
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

// API-Typen + Service importieren
import {
  AnalyzeRequest,
  TextanalysisApiService,
  TextAnalysisOptions,
  TextAnalysisResult,
  VectorizerType,
} from '../../api/textanalyse_api.service';

@Component({
  selector: 'app-textanalyse',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './textanalyse.html',
  styleUrl: './textanalyse.css',
})
export class Textanalyse {
  // Dateien aus der Session
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

  // Pipeline-Parameter (werden ans Backend geschickt)
  vectorizer: VectorizerType = 'tfidf';
  maxFeatures: number | null = 5000;
  numClusters = 3;
  useDimReduction = true;
  numComponents: number | null = 100;

  constructor(
    private router: Router,
    public session: PlagiarismSessionService,
    private api: TextanalysisApiService,
  ) {}

  // Navigation
  goToInput() {
    this.router.navigate(['/input']);
  }

  // Helper-Wrapper fürs Template
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

  // Payload für Backend bauen
  private buildPayload(): AnalyzeRequest {
    const documents = this.files.map((f) => ({
      name: f.file.name,
      content: getTextForComparison(f),
    }));

    const options: TextAnalysisOptions = {
      vectorizer: this.vectorizer,
      maxFeatures: this.maxFeatures,
      numClusters: this.numClusters,
      useDimReduction: this.useDimReduction,
      numComponents: this.numComponents,
    };

    return { documents, options };
  }

  // Analyse starten (jetzt über Backend)
  startAnalysis() {
    if (!this.hasFiles) {
      this.errorMessage = 'Bitte zuerst Dateien im Tab „Input“ hochladen.';
      this.result = null;
      return;
    }

    this.errorMessage = null;
    this.result = null;
    this.isLoading = true;

    const payload = this.buildPayload();

    this.api.analyze(payload).subscribe({
      next: (res) => {
        this.result = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Fehler bei der Analyse. Läuft das Backend auf http://localhost:8000?';
        this.isLoading = false;
      },
    });
  }
}
