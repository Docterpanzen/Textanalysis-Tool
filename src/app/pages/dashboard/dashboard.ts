import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AnalysisRunDetail,
  AnalysisRunSummary,
  HistoryApiService,
  HistoryOverview,
} from '../../api/history_api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  imports: [CommonModule, FormsModule],
})
export class Dashboard implements OnInit {
  historyOverview: HistoryOverview | null = null;
  historyRuns: AnalysisRunSummary[] = [];
  selectedRun: AnalysisRunDetail | null = null;
  selectedRunId: number | null = null;
  historyLoading = false;
  detailLoading = false;
  historyError: string | null = null;

  textIdFilter = '';
  sortOrder: 'asc' | 'desc' = 'desc';
  openHistoryTextId: number | null = null;
  activeWordcloud: string | null = null;
  pendingRunId: number | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private historyApi: HistoryApiService,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const raw = params.get('runId');
      const parsed = raw ? Number(raw) : NaN;
      if (!Number.isNaN(parsed)) {
        this.pendingRunId = parsed;
      }
    });
    this.loadHistory();
  }

  goToInput() {
    this.router.navigate(['/input']);
  }

  updateHistoryView() {
    this.loadHistory();
  }

  toggleSortOrder() {
    this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
    this.loadHistory();
  }

  selectRun(run: AnalysisRunSummary) {
    if (this.selectedRunId === run.id) return;
    this.selectedRunId = run.id;
    this.loadRunDetail(run.id);
  }

  toggleHistoryText(textId: number) {
    this.openHistoryTextId = this.openHistoryTextId === textId ? null : textId;
  }

  openWordcloud(base64Png: string) {
    this.activeWordcloud = base64Png;
  }

  closeWordcloud() {
    this.activeWordcloud = null;
  }

  get openHistoryText() {
    if (!this.selectedRun || this.openHistoryTextId === null) return null;
    return this.selectedRun.texts.find((text) => text.id === this.openHistoryTextId) ?? null;
  }

  get latestRunLabel(): string {
    if (this.historyRuns.length === 0) return '-';
    let latest = this.historyRuns[0];
    let latestDate = new Date(latest.created_at);
    for (const run of this.historyRuns) {
      const dt = new Date(run.created_at);
      if (Number.isNaN(dt.valueOf())) continue;
      if (Number.isNaN(latestDate.valueOf()) || dt > latestDate) {
        latest = run;
        latestDate = dt;
      }
    }
    return this.formatTimestamp(latest.created_at);
  }

  get averageTextsPerRun(): string {
    if (this.historyRuns.length === 0) return '-';
    const total = this.historyRuns.reduce((sum, run) => sum + (run.textCount ?? 0), 0);
    const avg = total / this.historyRuns.length;
    const rounded = Math.round(avg * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  }

  formatTimestamp(value?: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.valueOf())) return value;
    return date.toLocaleString();
  }

  formatOption(value: string | number | boolean | null | undefined): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Ja' : 'Nein';
    return String(value);
  }

  private loadHistory() {
    this.historyLoading = true;
    this.historyError = null;

    const params: {
      textIds?: string;
      sort?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    } = {
      limit: 50,
      offset: 0,
      sort: this.sortOrder,
    };

    if (this.textIdFilter.trim()) {
      params.textIds = this.textIdFilter.trim();
    }

    this.historyApi.listHistory(params).subscribe({
      next: (res) => {
        this.historyOverview = res;
        this.historyRuns = res.runs ?? [];
        this.historyLoading = false;

        if (this.pendingRunId) {
          const runId = this.pendingRunId;
          this.pendingRunId = null;
          this.selectedRunId = runId;
          this.loadRunDetail(runId);
        }

        const hasSelection =
          this.selectedRunId !== null &&
          this.historyRuns.some((run) => run.id === this.selectedRunId);

        if (!hasSelection) {
          this.selectedRunId = null;
          this.selectedRun = null;
          this.openHistoryTextId = null;
        }
      },
      error: () => {
        this.historyError = 'Fehler beim Laden der Historie.';
        this.historyLoading = false;
      },
    });
  }

  private loadRunDetail(runId: number) {
    this.detailLoading = true;
    this.historyApi.getHistoryDetail(runId).subscribe({
      next: (detail) => {
        this.selectedRun = detail;
        this.detailLoading = false;
        this.openHistoryTextId = detail.texts.length > 0 ? detail.texts[0].id : null;
      },
      error: () => {
        this.detailLoading = false;
      },
    });
  }
}
