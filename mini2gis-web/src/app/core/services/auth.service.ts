import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { tap } from 'rxjs';

const API = 'http://localhost:3000';
const TOKEN_KEY = 'mg_token';
const ROLE_KEY = 'mg_role';
const EMAIL_KEY = 'mg_email';

@Injectable({ providedIn: 'root' })
export class AuthService {
  isAdmin = signal(this.getRole() === 'admin');
  loggedIn = signal(!!localStorage.getItem(TOKEN_KEY));
  email = signal(localStorage.getItem(EMAIL_KEY) ?? '');

  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    return this.http.post<{ access_token: string; role: string }>(`${API}/auth/login`, { email, password }).pipe(
      tap(res => {
        localStorage.setItem(TOKEN_KEY, res.access_token);
        localStorage.setItem(ROLE_KEY, res.role);
        localStorage.setItem(EMAIL_KEY, email);
        this.isAdmin.set(res.role === 'admin');
        this.loggedIn.set(true);
        this.email.set(email);
      }),
    );
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(EMAIL_KEY);
    this.isAdmin.set(false);
    this.loggedIn.set(false);
    this.email.set('');
  }

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  private getRole() {
    return localStorage.getItem(ROLE_KEY);
  }

  isLoggedIn() {
    return !!this.getToken();
  }
}
