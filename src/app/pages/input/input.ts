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
import { TextsApiService } from '../../api/texts_api.service';
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
    private router: Router,
    private textsApi: TextsApiService,
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

    // Which extensions do we treat as plain text?
    const textExtensions = ['.txt', '.md', '.rtf', '.odt'];
    const lowerName = file.name.toLowerCase();

    const isTextLike =
      file.type.startsWith('text/') || textExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isTextLike) {
      // For PDFs, DOCX etc. we currently do not show a real text preview
      item.content = 'Preview for this file type is currently not available.';
      item.cleanedContent = item.content;
      item.isLoading = false;
      return;
    }

    reader.onload = () => {
      item.content = (reader.result as string) ?? '';
      // create cleaned version directly
      item.cleanedContent = cleanText(item.content);
      item.isLoading = false;
      // IMPORTANT: no automatic backend upload here
    };

    reader.onerror = () => {
      item.error = 'Error while reading the file.';
      item.isLoading = false;
    };

    reader.readAsText(file, 'utf-8');
  }

  /** Upload all text-like files to the backend on explicit user action */
  uploadAllTexts() {
    this.errorMessage = null;
    this.successMessage = null;

    // Select only files that have readable text content
    const textExtensions = ['.txt', '.md', '.rtf', '.odt'];
    const candidates = this.files.filter((item) => {
      if (!item.content) return false;
      const lowerName = item.file.name.toLowerCase();
      const isTextLike =
        item.file.type.startsWith('text/') || textExtensions.some((ext) => lowerName.endsWith(ext));
      // Do not send placeholder preview texts for non-text files
      return isTextLike;
    });

    if (candidates.length === 0) {
      this.errorMessage = 'No new text files to upload.';
      return;
    }

    let successCount = 0;
    let failCount = 0;

    candidates.forEach((item) => {
      this.textsApi
        .createText({
          name: item.file.name,
          content: item.content ?? '',
        })
        .subscribe({
          next: () => {
            successCount++;
            if (successCount + failCount === candidates.length && successCount > 0) {
              this.successMessage = `${successCount} text file(s) successfully saved in the database.`;
            }
          },
          error: (err) => {
            console.error('Error while saving text to backend', err);
            failCount++;
            this.errorMessage = `${failCount} text file(s) could not be saved.`;
          },
        });
    });
  }

  /** Toggle between cleaned / original text for a file */
  toggleCleanMode(item: UploadedTextFile) {
    toggleCleanModeHelper(item);
  }

  /** Text that should actually be used for comparison etc. */
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
    // navigate directly to the text analysis page
    this.router.navigate(['/textanalyse']);
  }

  formatSize(bytes: number): string {
    return formatSizeHelper(bytes);
  }

  toggleOpen(item: UploadedTextFile) {
    toggleOpenHelper(item);
    this.debugMessage = `File "${item.file.name}" is of type "${item.file.type}" and has extension "${item.file.name
      .split('.')
      .pop()}"`;
  }
}
