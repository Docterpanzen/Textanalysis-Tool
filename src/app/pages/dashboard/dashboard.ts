import { DecimalPipe } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PlagiarismSessionService, UploadedTextFile } from '../../core/plagiarism-session';

type CheckStatus = 'clean' | 'warning' | 'critical';

interface PlagiarismCheck {
  id: number;
  title: string;
  date: string;
  similarity: number; // 0–100
  status: CheckStatus;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  imports: [DecimalPipe],
})
export class Dashboard {
  ngOnInit() {
    let x = 0,
      y = 0;
    let targetX = 0,
      targetY = 0;

    document.addEventListener('mousemove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
    });

    const animate = () => {
      x += (targetX - x) * 0.1;
      y += (targetY - y) * 0.1;

      const cat = document.getElementById('cat');
      if (cat) {
        cat.style.left = x + 'px';
        cat.style.top = y + 'px';
      }

      requestAnimationFrame(animate);
    };
    animate();
  }

  recentChecks: PlagiarismCheck[] = [
    {
      id: 1,
      title: 'Aufsatz - Die magische Flora des Verbotenen Waldes',
      date: '24.11.2025 · 10:32',
      similarity: 12,
      status: 'clean',
    },
    {
      id: 2,
      title: 'Facharbeit - Die politische Struktur des Zaubereiministeriums',
      date: '23.11.2025 · 17:58',
      similarity: 41,
      status: 'warning',
    },
    {
      id: 3,
      title: 'Studienprojekt - Das Verschwinden des Sprechenden Hutes',
      date: '22.11.2025 · 21:47',
      similarity: 76,
      status: 'critical',
    },
    {
      id: 4,
      title: 'Essay - Der Einfluss von Zauberstabkernen auf die Zauberstärke',
      date: '21.11.2025 · 08:12',
      similarity: 22,
      status: 'clean',
    },
    {
      id: 5,
      title: 'Analyse - Die gesellschaftliche Rolle der Hauselfen',
      date: '20.11.2025 · 14:20',
      similarity: 34,
      status: 'warning',
    },
    {
      id: 6,
      title: 'Seminararbeit - Die Gefahren illegaler Zeitumkehrer',
      date: '19.11.2025 · 11:04',
      similarity: 89,
      status: 'critical',
    },
  ];

  totalChecks = this.recentChecks.length;
  suspiciousCount = 4;

  constructor(
    private router: Router,
    public session: PlagiarismSessionService, // <-- Service injizieren
  ) {}

  // live-View auf die Dateien im Service
  get uploadedFiles(): UploadedTextFile[] {
    return this.session.files;
  }

  get avgSimilarity(): number {
    if (this.recentChecks.length === 0) {
      return 0;
    }

    const sum = this.recentChecks.reduce((acc, c) => acc + c.similarity, 0);

    return Math.round(sum / this.recentChecks.length);
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
