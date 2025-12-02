import { Component } from '@angular/core';

@Component({
  selector: 'app-documentation',
  standalone: true,
  templateUrl: './documentation.html',
  styleUrl: './documentation.css',
})
export class Documentation {
  scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
