import { Injectable } from '@angular/core';

export type UploadedTextFile = {
  file: File;
  content?: string;
  cleanedContent?: string;
  useCleaned?: boolean;
  isLoading: boolean;
  error?: string;
  isOpen?: boolean;
  dbId?: number; // Primärschlüssel in der SQLite-DB
  backendStatus?: 'pending' | 'saved' | 'error';
};

@Injectable({
  providedIn: 'root',
})
export class PlagiarismSessionService {
  readonly files: UploadedTextFile[] = [];

  clear() {
    this.files.length = 0; // Array leeren, aber Referenz behalten
  }
}
