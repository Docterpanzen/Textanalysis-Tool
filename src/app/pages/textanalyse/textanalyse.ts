import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PlagiarismSessionService } from '../../core/plagiarism-session';

@Component({
  selector: 'app-textanalyse',
  imports: [],
  templateUrl: './textanalyse.html',
  styleUrl: './textanalyse.css',
})
export class Textanalyse {
  constructor(
    private router: Router,
    public session: PlagiarismSessionService, // <-- Service injizieren
  ) {}
}
