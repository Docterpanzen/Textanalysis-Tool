import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AdminApiService,
  AdminCleanupSuggestions,
  AdminSearchScope,
  AdminTextRecord,
} from '../../api/admin_api.service';

@Component({
  selector: 'app-admin-texts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-texts.html',
  styleUrl: './admin-texts.css',
})
export class AdminTexts implements OnInit {
  texts: AdminTextRecord[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  infoMessage: string | null = null;

  searchTerm = '';
  searchScope: AdminSearchScope = 'both';
  tagFilter = '';

  selectedIds = new Set<number>();
  tagDrafts: Record<number, string> = {};
  cleanup: AdminCleanupSuggestions | null = null;
  cleanupLoading = false;
  exportLoading = false;
  private filterTimer: number | null = null;

  constructor(private api: AdminApiService) {}

  ngOnInit(): void {
    this.loadTexts();
  }

  loadTexts() {
    this.isLoading = true;
    this.errorMessage = null;
    this.infoMessage = null;

    this.api
      .listTexts({
        search: this.searchTerm.trim() || undefined,
        scope: this.searchScope,
        tag: this.tagFilter.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.texts = res;
          this.syncSelections();
          this.seedTagDrafts();
          this.isLoading = false;
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Texte konnten nicht geladen werden.';
          this.isLoading = false;
        },
      });
  }

  deleteText(text: AdminTextRecord) {
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

  onFilterChange() {
    if (this.filterTimer) {
      window.clearTimeout(this.filterTimer);
    }
    this.filterTimer = window.setTimeout(() => {
      this.loadTexts();
    }, 300);
  }

  clearFilters() {
    this.searchTerm = '';
    this.searchScope = 'both';
    this.tagFilter = '';
    this.loadTexts();
  }

  toggleSelectAll() {
    if (this.selectedIds.size === this.texts.length) {
      this.selectedIds.clear();
      return;
    }
    this.selectedIds = new Set(this.texts.map((t) => t.id));
  }

  toggleSelect(textId: number) {
    if (this.selectedIds.has(textId)) {
      this.selectedIds.delete(textId);
    } else {
      this.selectedIds.add(textId);
    }
  }

  isSelected(textId: number): boolean {
    return this.selectedIds.has(textId);
  }

  bulkDeleteSelected() {
    const ids = Array.from(this.selectedIds);
    if (ids.length === 0) return;

    if (!confirm(`${ids.length} Texte wirklich löschen?`)) {
      return;
    }

    this.api.bulkDelete(ids).subscribe({
      next: (res) => {
        this.texts = this.texts.filter((t) => !res.deletedIds.includes(t.id));
        this.selectedIds = new Set(
          Array.from(this.selectedIds).filter((id) => !res.deletedIds.includes(id)),
        );

        if (res.inUseIds.length > 0) {
          this.errorMessage =
            'Einige Texte konnten nicht gelöscht werden (in Analyse-Historie referenziert).';
        } else {
          this.errorMessage = null;
        }

        const removed = res.deletedIds.length;
        if (removed > 0) {
          this.infoMessage = `${removed} Texte gelöscht.`;
        }
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Massenlöschung fehlgeschlagen.';
      },
    });
  }

  saveTags(text: AdminTextRecord) {
    const raw = this.tagDrafts[text.id] ?? '';
    const tags = raw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    this.api.updateTags(text.id, tags).subscribe({
      next: (updated) => {
        text.tags = updated.tags;
        this.tagDrafts[text.id] = updated.tags.join(', ');
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Tags konnten nicht gespeichert werden.';
      },
    });
  }

  loadCleanupSuggestions() {
    if (this.cleanup) {
      this.cleanup = null;
      return;
    }
    this.cleanupLoading = true;
    this.api.getCleanupSuggestions().subscribe({
      next: (res) => {
        this.cleanup = res;
        this.cleanupLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.cleanupLoading = false;
        this.errorMessage = 'Cleanup-Vorschläge konnten nicht geladen werden.';
      },
    });
  }

  selectUnused() {
    if (!this.cleanup) return;
    this.addToSelection(this.cleanup.unusedIds);
  }

  selectEmpty() {
    if (!this.cleanup) return;
    this.addToSelection(this.cleanup.emptyIds);
  }

  selectDuplicates() {
    if (!this.cleanup) return;
    const ids: number[] = [];
    for (const group of this.cleanup.duplicateGroups) {
      if (group.length > 1) {
        ids.push(...group.slice(1));
      }
    }
    this.addToSelection(ids);
  }

  exportCsv() {
    this.exportLoading = true;
    this.api.exportCsv().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'admin_texts.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.exportLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.exportLoading = false;
        this.errorMessage = 'CSV-Export fehlgeschlagen.';
      },
    });
  }

  private addToSelection(ids: number[]) {
    for (const id of ids) {
      this.selectedIds.add(id);
    }
  }

  private syncSelections() {
    const allowed = new Set(this.texts.map((t) => t.id));
    for (const id of Array.from(this.selectedIds)) {
      if (!allowed.has(id)) {
        this.selectedIds.delete(id);
      }
    }
  }

  private seedTagDrafts() {
    this.tagDrafts = {};
    for (const text of this.texts) {
      this.tagDrafts[text.id] = (text.tags ?? []).join(', ');
    }
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
