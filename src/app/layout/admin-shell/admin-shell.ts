import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminApiService } from '../../api/admin_api.service';
import { AdminSessionService } from '../../core/admin-session';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.css',
})
export class AdminShell {
  constructor(
    private api: AdminApiService,
    private session: AdminSessionService,
    private router: Router,
  ) {}

  get isLoggedIn(): boolean {
    return this.session.isLoggedIn();
  }

  logout() {
    this.api.logout();
    this.router.navigate(['/admin/login']);
  }
}
