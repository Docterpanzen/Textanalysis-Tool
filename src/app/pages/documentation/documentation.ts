import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

type DocTopic = 'overview' | 'textanalyse' | 'plagiatchecker';

@Component({
  selector: 'app-documentation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './documentation.html',
  styleUrl: './documentation.css',
})
export class Documentation {
  activeTopic: DocTopic = 'overview';

  setTopic(topic: DocTopic) {
    this.activeTopic = topic;

    // optional: nach Tab-Wechsel zum Anfang springen
    requestAnimationFrame(() => {
      this.scrollTo(this.firstSectionIdFor(topic));
    });
  }

  scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private firstSectionIdFor(topic: DocTopic): string {
    if (topic === 'textanalyse') return 'ta-einleitung';
    if (topic === 'plagiatchecker') return 'pl-einleitung';
    return 'ov-einleitung';
  }
}
