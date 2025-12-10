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
  selectionPanelWidth = 400; // default width in px
  isResizing = false;

  // texts loaded from DB
  dbTexts: TextRecord[] = [];
  selectedTextIds = new Set<number>();
  openTextIds = new Set<number>();

  // UI state
  isLoading = false;
  errorMessage: string | null = null;
  result: TextAnalysisResult | null = null;
  lastAnalysisFinishedAt: Date | null = null;

  // analysis options sent to backend
  vectorizer: VectorizerType = 'tfidf';
  maxFeatures: number | null = 5000;
  numClusters = 3;
  useDimReduction = true;
  numComponents: number | null = 100;

  // stopword options
  useStopwords = true;
  stopwordMode: 'de' | 'en' | 'de_en' | 'none' = 'de';

  // UI state for the selection drawer
  showSelectionPanel = false;

  constructor(
    private router: Router,
    private api: TextanalysisApiService,
  ) {}

  ngOnInit(): void {
    this.loadTextsFromDb();
  }

  // ---------- Drawer-Resize ----------
  startResizing(event: MouseEvent) {
    this.isResizing = true;
    document.body.classList.add('resizing');
    event.preventDefault();

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!this.isResizing) return;

      const newWidth = window.innerWidth - moveEvent.clientX;
      const min = 260;
      const max = 1000;

      this.selectionPanelWidth = Math.min(Math.max(newWidth, min), max);
    };

    const onMouseUp = () => {
      this.isResizing = false;
      document.body.classList.remove('resizing');
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  // ---------- Navigation ----------
  goToInput() {
    this.router.navigate(['/input']);
  }

  // ---------- Texte laden ----------
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

  // ---------- Hilfsfunktionen für Dokument-Zugriff ----------
  private findTextByName(name: string): TextRecord | undefined {
    return this.dbTexts.find((t) => t.name === name);
  }

  private openTextRecord(txt: TextRecord) {
    const content = txt.content ?? '';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  private downloadTextRecord(txt: TextRecord) {
    const content = txt.content ?? '';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = txt.name || `text_${txt.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  // Wird aus dem Ergebnisbereich (Cluster-Liste) aufgerufen
  openTextFromResult(name: string, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    const txt = this.findTextByName(name);
    if (!txt) {
      console.warn('Kein Text für Namen gefunden:', name);
      return;
    }
    this.openTextRecord(txt);
  }

  downloadTextFromResult(name: string, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    const txt = this.findTextByName(name);
    if (!txt) {
      console.warn('Kein Text für Namen gefunden:', name);
      return;
    }
    this.downloadTextRecord(txt);
  }

  // ---------- Payload für Analyse ----------
  private buildPayload(): AnalyzeByIdsRequest {
    const options: TextAnalysisOptions = {
      vectorizer: this.vectorizer,
      maxFeatures: this.maxFeatures,
      numClusters: this.numClusters,
      useDimReduction: this.useDimReduction,
      numComponents: this.numComponents,
      useStopwords: this.useStopwords,
      stopwordMode: this.stopwordMode,
    };

    return {
      text_ids: Array.from(this.selectedTextIds),
      options,
    };
  }

  // ---------- Analyse starten ----------
  startAnalysis() {
    if (this.selectedTextIds.size < 2) {
      this.errorMessage = 'Bitte mindestens zwei Texte für die Analyse auswählen.';
      this.result = null;
      return;
    }

    this.errorMessage = null;
    this.result = null;
    this.isLoading = true;
    this.lastAnalysisFinishedAt = null;

    const payload = this.buildPayload();

    this.api.analyzeByIds(payload).subscribe({
      next: (res) => {
        this.result = res;
        this.isLoading = false;
        this.lastAnalysisFinishedAt = new Date();
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
