import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  cleanText,
  formatSize as formatSizeHelper,
  getTextForComparison as getTextForComparisonHelper,
  toggleCleanMode as toggleCleanModeHelper,
  toggleOpen as toggleOpenHelper,
} from '../../__common/helper';
import { PlagiarismSessionService, UploadedTextFile } from '../../core/plagiarism-session';

@Component({
  selector: 'app-input',
  standalone: true,
  templateUrl: './input.html',
  styleUrl: './input.css',
  imports: [CommonModule],
})
export class Input {
  errorMessage: string | null = null;
  successMessage: string | null = null;

  debugMessage: string | null = null;

  files: UploadedTextFile[] = [];

  isDragOver = false;

  constructor(
    private session: PlagiarismSessionService,
    private router: Router, // <-- HIER hinzufügen
  ) {
    this.files = this.session.files;
  }

  get hasFiles(): boolean {
    return this.files.length > 0;
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    this.processFiles(Array.from(input.files));

    input.value = '';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const dt = event.dataTransfer;
    if (!dt || !dt.files || dt.files.length === 0) return;

    this.processFiles(Array.from(dt.files));
  }

  private loadFileContent(item: UploadedTextFile) {
    const file = item.file;
    const reader = new FileReader();

    // Welche Endungen behandeln wir als „Text“?
    const textExtensions = ['.txt', '.md', '.rtf', '.odt'];
    const lowerName = file.name.toLowerCase();

    const isTextLike =
      file.type.startsWith('text/') || textExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isTextLike) {
      // Für PDFs, DOCX usw. keine echte Textvorschau
      item.content = 'Vorschau für diesen Dateityp ist aktuell nicht verfügbar.';
      item.cleanedContent = item.content;
      item.isLoading = false;
      return;
    }

    reader.onload = () => {
      item.content = (reader.result as string) ?? '';
      // direkt bereinigte Version erzeugen
      item.cleanedContent = cleanText(item.content);
      item.isLoading = false;
    };

    reader.onerror = () => {
      item.error = 'Fehler beim Lesen der Datei.';
      item.isLoading = false;
    };

    reader.readAsText(file, 'utf-8');
  }

  /** Umschalten zwischen bereinigt / original für eine Datei */
  toggleCleanMode(item: UploadedTextFile) {
    toggleCleanModeHelper(item);
  }

  /** Text, der tatsächlich für Vergleich etc. verwendet werden soll */
  getTextForComparison(item: UploadedTextFile): string {
    return getTextForComparisonHelper(item);
  }

  private processFiles(files: File[]) {
    const allowedExtensions = ['.txt', '.md', '.rtf', '.odt', '.pdf', '.doc', '.docx'];

    const selectedFiles = files.filter((file) => {
      const lower = file.name.toLowerCase();
      return allowedExtensions.some((ext) => lower.endsWith(ext));
    });

    selectedFiles.forEach((file) => {
      const alreadyExists = this.files.some(
        (f) =>
          f.file.name === file.name &&
          f.file.size === file.size &&
          f.file.lastModified === file.lastModified,
      );
      if (alreadyExists) return;

      const wrapper: UploadedTextFile = {
        file,
        content: '',
        cleanedContent: '',
        isLoading: true,
        isOpen: false,
        useCleaned: false,
      };
      this.files.push(wrapper);
      this.loadFileContent(wrapper);
    });
  }

  removeFile(file: UploadedTextFile) {
    const index = this.files.indexOf(file);
    if (index !== -1) {
      this.files.splice(index, 1);
    }
  }

  clearAll() {
    this.files.length = 0;
    this.session.clear();
  }

  goToTextanalyse() {
    // direkt zur Textanalyse-Seite navigieren
    this.router.navigate(['/textanalyse']);
  }

  formatSize(bytes: number): string {
    return formatSizeHelper(bytes);
  }

  toggleOpen(item: UploadedTextFile) {
    toggleOpenHelper(item);
    this.debugMessage = `Datei "${item.file.name}" ist vom Typ "${item.file.type}" und hat die Endung "${item.file.name
      .split('.')
      .pop()}"`;
  }
}
