import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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

  constructor(private session: PlagiarismSessionService) {
    // hier holen wir uns NUR die Referenz auf das Service-Array
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
      item.cleanedContent = this.cleanText(item.content);
      item.isLoading = false;
    };

    reader.onerror = () => {
      item.error = 'Fehler beim Lesen der Datei.';
      item.isLoading = false;
    };

    reader.readAsText(file, 'utf-8');
  }

  /** Entfernt Sonderzeichen aus dem Text.
   *  – lässt nur Buchstaben, Zahlen und Whitespace durch
   *  – reduziert Mehrfach-Leerzeichen
   */
  private cleanText(text: string): string {
    return (
      text
        // alles entfernen, was kein Buchstabe, keine Zahl, kein Whitespace ist
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        // Mehrfach-Leerzeichen reduzieren
        .replace(/\s+/g, ' ')
        .trim()
    );
    // falls du alles klein willst:
    // .toLowerCase();
  }

  /** Umschalten zwischen bereinigt / original für eine Datei */
  toggleCleanMode(item: UploadedTextFile) {
    item.useCleaned = !item.useCleaned;
  }

  /** Text, der tatsächlich für Vergleich etc. verwendet werden soll */
  getTextForComparison(item: UploadedTextFile): string {
    if (item.useCleaned && item.cleanedContent) {
      return item.cleanedContent;
    }
    return item.content ?? '';
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
      this.files.splice(index, 1); // ✅ Array IN-PLACE ändern
    }
  }

  clearAll() {
    this.files.length = 0; // ✅ Array leeren, Referenz bleibt
    this.session.clear();
  }

  startComparison() {
    if (this.files.length < 2) {
      this.errorMessage = 'Bitte lade mindestens zwei Dateien hoch, um einen Vergleich zu starten.';
      this.successMessage = null;
      return;
    }

    this.errorMessage = null;
    this.successMessage = 'Vergleich erfolgreich gestartet (Mock).';

    // hier nimmst du bereits "bereinigt oder nicht" pro Datei
    const textsForComparison = this.files.map((f) => this.getTextForComparison(f));

    console.log('Texte für Vergleich (bereinigt/roh):', textsForComparison);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  }

  toggleOpen(item: UploadedTextFile) {
    item.isOpen = !item.isOpen;
    this.debugMessage = `Datei "${item.file.name}" ist vom Typ "${item.file.type}" und hat die Endung "${item.file.name
      .split('.')
      .pop()}"`;
  }
}
