import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AdminApiService } from '../../api/admin_api.service';
import { TextRecord } from '../../api/texts_api.service';

@Component({
  selector: 'app-admin-texts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-texts.html',
  styleUrl: './admin-texts.css',
})
export class AdminTexts implements OnInit {
  texts: TextRecord[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  constructor(private api: AdminApiService) {}

  ngOnInit(): void {
    this.loadTexts();
  }

  loadTexts() {
    this.isLoading = true;
    this.errorMessage = null;

    this.api.listTexts().subscribe({
      next: (res) => {
        this.texts = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Texte konnten nicht geladen werden.';
        this.isLoading = false;
      },
    });
  }

  deleteText(text: TextRecord) {
    if (!confirm(`Text "${text.name}" wirklich löschen?`)) {
      return;
    }

    this.api.deleteText(text.id).subscribe({
      next: () => {
        this.texts = this.texts.filter((t) => t.id !== text.id);
      },
      error: (err) => {
        console.error(err);
        if (err?.status === 409) {
          this.errorMessage =
            'Text ist in der Analyse-Historie referenziert und kann nicht gelöscht werden.';
        } else {
          this.errorMessage = 'Text konnte nicht gelöscht werden.';
        }
      },
    });
  }

  formatTimestamp(value?: string | null): string {
    if (!value) return '-';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  }

  previewContent(content?: string): string {
    if (!content) return '';
    return content.length > 160 ? `${content.slice(0, 160)}…` : content;
  }
}
