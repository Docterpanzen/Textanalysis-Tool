import { DecimalPipe } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PlagiarismSessionService, UploadedTextFile } from '../../core/plagiarism-session';

type CheckStatus = 'clean' | 'warning' | 'critical';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  imports: [DecimalPipe],
})
export class Dashboard {
  constructor(
    private router: Router,
    public session: PlagiarismSessionService, // <-- Service injizieren
  ) {}

  // live-View auf die Dateien im Service
  get uploadedFiles(): UploadedTextFile[] {
    return this.session.files;
  }

  goToInput() {
    this.router.navigate(['/input']);
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
