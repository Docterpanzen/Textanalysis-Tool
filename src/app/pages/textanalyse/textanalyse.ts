// src/app/pages/textanalyse/textanalyse.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// API types + service
import {
  AnalyzeByIdsRequest,
  TextanalysisApiService,
  TextAnalysisOptions,
  TextAnalysisResult,
  TextRecord,
  VectorizerType,
} from '../../api/textanalyse_api.service';

@Component({
  selector: 'app-textanalyse',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './textanalyse.html',
  styleUrl: './textanalyse.css',
})
export class Textanalyse implements OnInit {
  // Drawer width
  selectionPanelWidth = 380; // default width in px
  isResizing = false;

  startResizing(event: MouseEvent) {
    this.isResizing = true;

    // add css class to body so blue bar stays active
    document.body.classList.add('resizing');

    event.preventDefault();

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!this.isResizing) return;

      const newWidth = window.innerWidth - moveEvent.clientX;

      const min = 260;
      const max = 900;

      this.selectionPanelWidth = Math.min(Math.max(newWidth, min), max);
    };

    const onMouseUp = () => {
      this.isResizing = false;

      // remove resizing class
      document.body.classList.remove('resizing');

      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  // texts loaded from DB
  dbTexts: TextRecord[] = [];
  selectedTextIds = new Set<number>();
  openTextIds = new Set<number>();

  // UI state
  isLoading = false;
  errorMessage: string | null = null;
  result: TextAnalysisResult | null = null;

  // analysis options sent to backend
  vectorizer: VectorizerType = 'tfidf';
  maxFeatures: number | null = 5000;
  numClusters = 3;
  useDimReduction = true;
  numComponents: number | null = 100;

  // NEW: stopword options
  useStopwords = true;
  stopwordMode: 'de' | 'en' | 'de_en' | 'none' = 'de';

  // NEW: UI state for the selection drawer
  showSelectionPanel = false;

  constructor(
    private router: Router,
    private api: TextanalysisApiService,
  ) {}

  ngOnInit(): void {
    this.loadTextsFromDb();
  }

  /** Navigate back to Input page to add more texts */
  goToInput() {
    this.router.navigate(['/input']);
  }

  /** Load stored texts from backend DB */
  loadTextsFromDb() {
    this.errorMessage = null;
    this.api.listTexts().subscribe({
      next: (texts) => {
        this.dbTexts = texts;
        this.selectedTextIds.clear();
        this.openTextIds.clear();
      },
      error: () => {
        this.errorMessage = 'Fehler beim Laden der Texte aus dem Backend.';
      },
    });
  }

  get hasDbTexts(): boolean {
    return this.dbTexts.length > 0;
  }

  get selectedCount(): number {
    return this.selectedTextIds.size;
  }

  toggleTextSelection(id: number) {
    if (this.selectedTextIds.has(id)) {
      this.selectedTextIds.delete(id);
    } else {
      this.selectedTextIds.add(id);
    }
  }

  toggleOpen(id: number) {
    if (this.openTextIds.has(id)) {
      this.openTextIds.delete(id);
    } else {
      this.openTextIds.add(id);
    }
  }

  isOpen(id: number): boolean {
    return this.openTextIds.has(id);
  }

  /** Build payload for backend analysis by DB text IDs */
  private buildPayload(): AnalyzeByIdsRequest {
    const options: TextAnalysisOptions = {
      vectorizer: this.vectorizer,
      maxFeatures: this.maxFeatures,
      numClusters: this.numClusters,
      useDimReduction: this.useDimReduction,
      numComponents: this.numComponents,

      // NEW: pass stopword configuration to backend
      useStopwords: this.useStopwords,
      stopwordMode: this.stopwordMode,
    };

    return {
      text_ids: Array.from(this.selectedTextIds),
      options,
    };
  }

  /** Start analysis based on selected DB texts */
  startAnalysis() {
    if (this.selectedTextIds.size < 2) {
      this.errorMessage = 'Bitte mindestens zwei Texte für die Analyse auswählen.';
      this.result = null;
      return;
    }

    this.errorMessage = null;
    this.result = null;
    this.isLoading = true;

    const payload = this.buildPayload();

    this.api.analyzeByIds(payload).subscribe({
      next: (res) => {
        this.result = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage =
          'Fehler bei der Analyse. Prüfe, ob das Backend läuft und den text_ids-Request unterstützt.';
        this.isLoading = false;
      },
    });
  }
}
