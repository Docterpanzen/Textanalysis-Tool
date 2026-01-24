import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminApiService, AdminRunRecord } from '../../api/admin_api.service';

@Component({
  selector: 'app-admin-runs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-runs.html',
  styleUrl: './admin-runs.css',
})
export class AdminRuns implements OnInit {
  runs: AdminRunRecord[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  sortOrder: 'asc' | 'desc' = 'desc';
  tagFilter = '';
  startDate = '';
  endDate = '';

  tagDrafts: Record<number, string> = {};
  private filterTimer: number | null = null;

  constructor(private api: AdminApiService) {}

  ngOnInit(): void {
    this.loadRuns();
  }

  loadRuns() {
    this.isLoading = true;
    this.errorMessage = null;

    const params: {
      sort?: 'asc' | 'desc';
      tag?: string;
      start?: string;
      end?: string;
    } = {
      sort: this.sortOrder,
    };

    const trimmedTag = this.tagFilter.trim();
    if (trimmedTag) {
      params.tag = trimmedTag;
    }

    if (this.startDate && this.endDate) {
      params.start = this.startDate;
      params.end = this.endDate;
    }

    this.api.listRuns(params).subscribe({
      next: (res) => {
        this.runs = res;
        this.seedTagDrafts();
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Runs konnten nicht geladen werden.';
        this.isLoading = false;
      },
    });
  }

  onFilterChange() {
    if (this.filterTimer) {
      window.clearTimeout(this.filterTimer);
    }
    this.filterTimer = window.setTimeout(() => {
      this.loadRuns();
    }, 300);
  }

  clearFilters() {
    this.tagFilter = '';
    this.startDate = '';
    this.endDate = '';
    this.sortOrder = 'desc';
    this.loadRuns();
  }

  toggleSortOrder() {
    this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
    this.loadRuns();
  }

  saveTags(run: AdminRunRecord) {
    const raw = this.tagDrafts[run.id] ?? '';
    const newTags = this.parseInputTags(raw);
    if (newTags.length === 0) return;
    const merged = this.mergeTags(run.tags ?? [], newTags);
    this.updateRunTags(run, merged);
  }

  removeTag(run: AdminRunRecord, tag: string) {
    const tags = (run.tags ?? []).filter((t) => t !== tag);
    this.updateRunTags(run, tags);
  }

  formatTimestamp(value?: string | null): string {
    if (!value) return '-';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  }

  private seedTagDrafts() {
    this.tagDrafts = {};
    for (const run of this.runs) {
      this.tagDrafts[run.id] = '';
    }
  }

  private updateRunTags(run: AdminRunRecord, tags: string[]) {
    this.api.updateRunTags(run.id, tags).subscribe({
      next: (updated) => {
        run.tags = updated.tags;
        this.tagDrafts[run.id] = '';
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Tags konnten nicht gespeichert werden.';
      },
    });
  }

  private parseInputTags(raw: string): string[] {
    const value = raw.trim();
    if (!value) return [];
    if (value.includes(',')) {
      return value
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }
    return [value];
  }

  private mergeTags(existing: string[], incoming: string[]): string[] {
    const seen = new Set(existing.map((t) => t.toLowerCase()));
    const merged = [...existing];
    for (const tag of incoming) {
      const lower = tag.toLowerCase();
      if (seen.has(lower)) continue;
      seen.add(lower);
      merged.push(tag);
    }
    return merged;
  }
}
