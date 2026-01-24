import { Injectable, signal } from '@angular/core';

const TOKEN_KEY = 'adminToken';

@Injectable({ providedIn: 'root' })
export class AdminSessionService {
  private readonly tokenSignal = signal<string | null>(this.loadToken());

  get token(): string | null {
    return this.tokenSignal();
  }

  isLoggedIn(): boolean {
    return !!this.tokenSignal();
  }

  setToken(token: string) {
    this.tokenSignal.set(token);
    localStorage.setItem(TOKEN_KEY, token);
  }

  clear() {
    this.tokenSignal.set(null);
    localStorage.removeItem(TOKEN_KEY);
  }

  private loadToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }
}
