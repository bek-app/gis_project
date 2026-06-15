import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile-panel',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="profile-panel">
      <div class="panel-header">
        <span class="panel-title">👤 Профиль</span>
      </div>

      @if (auth.loggedIn()) {
        <!-- Кірген пайдаланушы -->
        <div class="user-card">
          <div class="avatar">{{ initial() }}</div>
          <div class="user-info">
            <div class="user-email">{{ auth.email() }}</div>
            <div class="user-role">{{ auth.isAdmin() ? '🔑 Администратор' : '👤 Пайдаланушы' }}</div>
          </div>
        </div>

        @if (auth.isAdmin()) {
          <a class="menu-item" (click)="goAdmin()">
            <span class="menu-icon">⚙️</span> Админ панель
          </a>
        }

        <button class="btn-logout" (click)="logout()">🚪 Шығу</button>
      } @else {
        <!-- Кіру формасы -->
        <p class="login-hint">Жүйеге кіріңіз</p>

        @if (error()) {
          <div class="error-msg">{{ error() }}</div>
        }

        <div class="field">
          <label>Email</label>
          <input type="email" [(ngModel)]="email" placeholder="email@example.com" (keydown.enter)="login()" />
        </div>

        <div class="field">
          <label>Құпия сөз</label>
          <input type="password" [(ngModel)]="password" placeholder="••••••••" (keydown.enter)="login()" />
        </div>

        <button class="btn-login" [disabled]="loading()" (click)="login()">
          {{ loading() ? 'Кіруде...' : 'Кіру' }}
        </button>
      }
    </div>
  `,
  styles: [`
    .profile-panel {
      display:flex; flex-direction:column; gap:12px;
      padding:16px; height:100%; background:#fafafa;
    }
    .panel-header { padding-bottom:8px; border-bottom:1px solid #e0e0e0; }
    .panel-title { font-size:16px; font-weight:700; color:#333; }

    .user-card {
      display:flex; align-items:center; gap:12px;
      background:#fff; border-radius:12px; padding:14px;
      box-shadow:0 1px 6px rgba(0,0,0,.08);
    }
    .avatar {
      width:44px; height:44px; border-radius:50%;
      background:#1565c0; color:#fff; font-size:20px; font-weight:700;
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    .user-email { font-size:14px; font-weight:600; color:#222; word-break:break-all; }
    .user-role { font-size:12px; color:#666; margin-top:2px; }

    .menu-item {
      display:flex; align-items:center; gap:10px;
      background:#fff; border-radius:10px; padding:12px 14px;
      font-size:14px; font-weight:600; color:#1565c0;
      box-shadow:0 1px 4px rgba(0,0,0,.07); cursor:pointer;
    }
    .menu-item:hover { background:#e8f0fe; }
    .menu-icon { font-size:16px; }

    .btn-logout {
      padding:10px; background:#fce4e4; color:#c62828;
      border:1px solid #f5c2c2; border-radius:10px;
      font-size:14px; font-weight:600; cursor:pointer;
    }
    .btn-logout:hover { background:#f5c2c2; }

    .login-hint { font-size:13px; color:#888; margin:0; }
    .field { display:flex; flex-direction:column; gap:4px; }
    label { font-size:12px; font-weight:600; color:#555; }
    input {
      padding:10px 12px; border:1px solid #ddd; border-radius:8px;
      font-size:14px; outline:none;
    }
    input:focus { border-color:#1565c0; }

    .error-msg { background:#fce4e4; color:#c62828; border-radius:8px; padding:8px 12px; font-size:13px; }

    .btn-login {
      padding:11px; background:#1565c0; color:#fff;
      border:none; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer;
    }
    .btn-login:disabled { opacity:.5; cursor:default; }
  `],
})
export class ProfilePanelComponent {
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  constructor(public auth: AuthService, private router: Router) {}

  initial() {
    return (this.auth.email() || '?')[0].toUpperCase();
  }

  login() {
    this.error.set('');
    if (!this.email.trim() || !this.password) {
      this.error.set('Email мен құпия сөзді енгізіңіз');
      return;
    }
    this.loading.set(true);
    this.auth.login(this.email.trim(), this.password).subscribe({
      next: () => { this.loading.set(false); this.password = ''; },
      error: () => { this.error.set('Email немесе құпия сөз қате'); this.loading.set(false); },
    });
  }

  logout() {
    this.auth.logout();
  }

  goAdmin() {
    this.router.navigate(['/admin']);
  }
}
