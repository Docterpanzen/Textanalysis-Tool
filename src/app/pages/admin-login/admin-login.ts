import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminApiService } from '../../api/admin_api.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css',
})
export class AdminLogin {
  username = '';
  password = '';

  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private api: AdminApiService,
    private router: Router,
  ) {}

  login() {
    this.errorMessage = null;
    this.isLoading = true;

    this.api.login(this.username, this.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/admin/texts']);
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Ungültige Zugangsdaten.';
      },
    });
  }
}
