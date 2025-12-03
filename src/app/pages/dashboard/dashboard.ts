import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PlagiarismSessionService, UploadedTextFile } from '../../core/plagiarism-session';

// Helper importieren
import {
  formatSize,
  getTextForComparison,
  toggleCleanMode,
  toggleOpen,
} from '../../__common/helper';

type CheckStatus = 'clean' | 'warning' | 'critical';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  imports: [],
})
export class Dashboard {
  constructor(
    private router: Router,
    public session: PlagiarismSessionService,
  ) {}

  get uploadedFiles(): UploadedTextFile[] {
    return this.session.files;
  }

  goToInput() {
    this.router.navigate(['/input']);
  }

  // --- Helper-Wrapper für das Template ---
  formatSize(bytes: number) {
    return formatSize(bytes);
  }

  toggleCleanMode(item: UploadedTextFile) {
    toggleCleanMode(item);
  }

  toggleOpen(item: UploadedTextFile) {
    toggleOpen(item);
  }

  getText(item: UploadedTextFile): string {
    return getTextForComparison(item);
  }

  statusLabel(status: CheckStatus): string {
    switch (status) {
      case 'clean':
        return 'Unkritisch';
      case 'warning':
        return 'Auffällig';
      case 'critical':
        return 'Kritisch';
    }
  }
}
