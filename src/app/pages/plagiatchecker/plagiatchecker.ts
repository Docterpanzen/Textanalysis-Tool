import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  PlagiarismCheckResponse,
  PlagiatcheckerApiService,
} from '../../api/plagiatchecker_api.service';

type PlagDoc = {
  file: File | null;
  name: string;
  raw: string;
  cleaned: string;
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;
};

type ShingleType = 'char' | 'word';
type CleanPreset = 'default' | 'strict';

@Component({
  selector: 'app-plagiatchecker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './plagiatchecker.html',
  styleUrl: './plagiatchecker.css',
})
export class Plagiatchecker {
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // NEW
  isChecking = false;
  result: PlagiarismCheckResponse | null = null;

  docA: PlagDoc = this.createEmptyDoc('Document A');
  docB: PlagDoc = this.createEmptyDoc('Document B');

  isDragOverA = false;
  isDragOverB = false;

  shingleType: ShingleType = 'char';
  shingleSize = 5;
  numHashes = 100;
  numBands = 50;
  numRows = 2;

  useCleaning = true;
  cleanPreset: CleanPreset = 'default';

  toLower = true;
  normalizeWhitespace = true;
  removeUrlsEmails = true;
  stripDiacritics = false;
  removePunctuation = true;

  // optional debug
  debugPayload: any = null;

  constructor(private api: PlagiatcheckerApiService) {}

  // ---------- File handling (unchanged) ----------
  onFilesSelected(event: Event, target: 'A' | 'B') {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.loadFileInto(target === 'A' ? this.docA : this.docB, file);
    input.value = '';
  }

  onDragOver(event: DragEvent, target: 'A' | 'B') {
    event.preventDefault();
    event.stopPropagation();
    if (target === 'A') this.isDragOverA = true;
    else this.isDragOverB = true;
  }

  onDragLeave(event: DragEvent, target: 'A' | 'B') {
    event.preventDefault();
    event.stopPropagation();
    if (target === 'A') this.isDragOverA = false;
    else this.isDragOverB = false;
  }

  onDrop(event: DragEvent, target: 'A' | 'B') {
    event.preventDefault();
    event.stopPropagation();
    if (target === 'A') this.isDragOverA = false;
    else this.isDragOverB = false;

    const dt = event.dataTransfer;
    if (!dt || !dt.files || dt.files.length === 0) return;

    const file = dt.files[0];
    this.loadFileInto(target === 'A' ? this.docA : this.docB, file);
  }

  removeDoc(target: 'A' | 'B') {
    if (target === 'A') this.docA = this.createEmptyDoc('Document A');
    else this.docB = this.createEmptyDoc('Document B');

    this.errorMessage = null;
    this.successMessage = null;
    this.result = null;
    this.debugPayload = null;
  }

  toggleOpen(target: 'A' | 'B') {
    const doc = target === 'A' ? this.docA : this.docB;
    doc.isOpen = !doc.isOpen;
  }

  private loadFileInto(doc: PlagDoc, file: File) {
    this.errorMessage = null;
    this.successMessage = null;
    this.result = null;
    this.debugPayload = null;

    doc.file = file;
    doc.name = file.name;
    doc.raw = '';
    doc.cleaned = '';
    doc.error = null;
    doc.isLoading = true;

    const reader = new FileReader();

    reader.onload = () => {
      doc.raw = (reader.result as string) ?? '';
      doc.cleaned = this.applyCleaning(doc.raw);
      doc.isLoading = false;
    };

    reader.onerror = () => {
      doc.error = 'Fehler beim Lesen der Datei.';
      doc.isLoading = false;
    };

    reader.readAsText(file, 'utf-8');
  }

  // ---------- Cleaning ----------
  onCleaningChanged() {
    if (this.docA.raw) this.docA.cleaned = this.applyCleaning(this.docA.raw);
    if (this.docB.raw) this.docB.cleaned = this.applyCleaning(this.docB.raw);
  }

  private applyCleaning(input: string): string {
    let text = input ?? '';

    if (this.cleanPreset === 'strict') {
      this.toLower = true;
      this.normalizeWhitespace = true;
      this.removeUrlsEmails = true;
      this.removePunctuation = true;
    }

    if (this.toLower) text = text.toLowerCase();
    text = text.replace(/\r\n/g, '\n');

    if (this.removeUrlsEmails) {
      text = text.replace(/https?:\/\/\S+/gi, ' ');
      text = text.replace(/www\.\S+/gi, ' ');
      text = text.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, ' ');
    }

    if (this.stripDiacritics) {
      text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    if (this.shingleType === 'word' && this.removePunctuation) {
      text = text.replace(/[^\p{L}\p{N}\s]+/gu, ' ');
    }

    if (this.normalizeWhitespace) {
      text = text.replace(/[ \t]+/g, ' ');
      text = text.replace(/\n{3,}/g, '\n\n');
      text = text.trim();
    }

    return text;
  }

  // ---------- Options helpers ----------
  get canRun(): boolean {
    return (
      !!this.effectiveTextA && !!this.effectiveTextB && !this.docA.isLoading && !this.docB.isLoading
    );
  }

  get effectiveTextA(): string {
    return this.useCleaning ? this.docA.cleaned : this.docA.raw;
  }

  get effectiveTextB(): string {
    return this.useCleaning ? this.docB.cleaned : this.docB.raw;
  }

  // ---------- helpers ----------
  private clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, n));
  }

  /** 0..100 for progress width */
  get similarityValue(): number {
    const v = this.result?.similarityPercent ?? 0;
    return this.clamp(v, 0, 100);
  }

  /** Tailwind classes for text color based on score */
  get scoreTextClass(): string {
    const v = this.result?.similarityPercent ?? 0;
    if (v < 20) return 'text-emerald-400';
    if (v < 50) return 'text-amber-400';
    return 'text-rose-400';
  }

  /** Tailwind classes for bar fill based on score */
  get scoreBarClass(): string {
    const v = this.result?.similarityPercent ?? 0;
    if (v < 20) return 'bg-emerald-500';
    if (v < 50) return 'bg-amber-500';
    return 'bg-rose-500';
  }

  /** Small label to explain score */
  get scoreLabel(): string {
    const v = this.result?.similarityPercent ?? 0;
    if (v < 20) return 'Niedrige Übereinstimmung';
    if (v < 50) return 'Mittlere Übereinstimmung';
    return 'Hohe Übereinstimmung';
  }

  /** Background accent for the result card */
  get scoreCardAccentClass(): string {
    const v = this.result?.similarityPercent ?? 0;
    if (v < 20) return 'bg-emerald-500/10 border-emerald-500/20';
    if (v < 50) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-rose-500/10 border-rose-500/20';
  }

  get similarity(): number {
    return this.result?.similarityPercent ?? 0;
  }

  get similarityLabel(): string {
    const s = this.similarity;
    if (s >= 80) return 'Hohe Übereinstimmung';
    if (s >= 50) return 'Mittlere Übereinstimmung';
    if (s >= 20) return 'Niedrige Übereinstimmung';
    return 'Sehr geringe Übereinstimmung';
  }

  get similarityTone(): 'low' | 'mid' | 'high' {
    const s = this.similarity;
    if (s >= 80) return 'high';
    if (s >= 50) return 'mid';
    return 'low';
  }

  // ---------- API call ----------
  startCheck() {
    this.errorMessage = null;
    this.successMessage = null;
    this.result = null;

    if (!this.canRun) {
      this.errorMessage = 'Bitte lade zwei Texte hoch (Dokument A und B), bevor du startest.';
      return;
    }

    const bandsRows = this.numBands * this.numRows;
    if (bandsRows !== this.numHashes) {
      this.errorMessage = `Ungültige LSH-Parameter: numBands * numRows muss numHashes ergeben. (${this.numBands} * ${this.numRows} = ${bandsRows}, numHashes=${this.numHashes})`;
      return;
    }

    // ... inside startCheck()

    if (!this.docA.file || !this.docB.file) {
      this.errorMessage = 'Bitte lade zwei Dateien hoch.';
      return;
    }

    const options = {
      shingleType: this.shingleType,
      shingleSize: this.shingleSize,
      numHashes: this.numHashes,
      numBands: this.numBands,
      numRows: this.numRows,
      cleaning: {
        enabled: this.useCleaning,
        preset: this.cleanPreset,
        toLower: this.toLower,
        normalizeWhitespace: this.normalizeWhitespace,
        removeUrlsEmails: this.removeUrlsEmails,
        stripDiacritics: this.stripDiacritics,
        removePunctuation: this.removePunctuation,
      },
    };

    this.isChecking = true;

    this.api.checkFiles(this.docA.file, this.docB.file, options).subscribe({
      next: (res) => {
        this.result = res;
        this.isChecking = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage =
          'Fehler beim Plagiatcheck (File-Upload). Prüfe Backend-Route /plagiarism/checkFiles.';
        this.isChecking = false;
      },
    });
  }

  private createEmptyDoc(name: string): PlagDoc {
    return {
      file: null,
      name,
      raw: '',
      cleaned: '',
      isLoading: false,
      error: null,
      isOpen: false,
    };
  }
}
