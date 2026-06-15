import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-wrap">
      <div class="login-card">
        <h1>Mini-2GIS</h1>
        <h2>Админ кіру</h2>

        @if (error()) {
          <div class="error-msg">{{ error() }}</div>
        }

        <form (ngSubmit)="submit()">
          <input type="email" [(ngModel)]="email" name="email" placeholder="Email" required />
          <input type="password" [(ngModel)]="password" name="password" placeholder="Пароль" required />
          <button type="submit" [disabled]="loading()">
            {{ loading() ? 'Кіруде...' : 'Кіру' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-wrap { display:flex; align-items:center; justify-content:center; height:100vh; background:#f0f4f8; }
    .login-card { background:#fff; border-radius:16px; padding:40px; width:100%; max-width:380px; box-shadow:0 8px 32px rgba(0,0,0,.1); }
    h1 { margin:0 0 4px; font-size:24px; color:#1565c0; }
    h2 { margin:0 0 24px; font-size:16px; color:#666; font-weight:400; }
    input { display:block; width:100%; padding:12px 14px; margin-bottom:14px; border:1px solid #ddd; border-radius:10px; font-size:15px; box-sizing:border-box; outline:none; }
    input:focus { border-color:#1565c0; }
    button { width:100%; padding:12px; background:#1565c0; color:#fff; border:none; border-radius:10px; font-size:16px; font-weight:600; cursor:pointer; }
    button:disabled { opacity:.6; }
    .error-msg { background:#fce4e4; color:#c62828; border-radius:8px; padding:10px 14px; margin-bottom:14px; font-size:14px; }
  `],
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/admin']),
      error: (e) => {
        this.error.set(e.error?.message || 'Email немесе пароль қате');
        this.loading.set(false);
      },
    });
  }
}
