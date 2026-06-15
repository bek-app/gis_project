import {
  Component, EventEmitter, Input, OnChanges, Output, signal, SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { debounceTime, firstValueFrom, Subject, switchMap, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as L from 'leaflet';
import { ApiService } from '../../core/services/api.service';
import { Place } from '../../core/models/place.model';
import { RouteInfo } from '../place-card/place-card.component';

interface GeoSuggestion {
  label: string;
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-route-panel',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">🗺️ Маршрут</span>
        <button class="close-btn" (click)="close.emit()">✕</button>
      </div>

      @if (routeDrawn() && routeInfo) {
        <!-- Нәтиже көрінісі -->
        <div class="result-summary">
          <div class="result-row">
            <div class="result-from">{{ fromText || 'Бастапқы нүкте' }}</div>
            <div class="result-arrow">→</div>
            <div class="result-to">{{ toText }}</div>
          </div>
          <div class="route-result">
            <span>🕐 {{ formatDuration(routeInfo.duration) }}</span>
            <span>📏 {{ formatDistance(routeInfo.distance) }}</span>
          </div>
        </div>
        <button class="btn-edit" (click)="routeDrawn.set(false)">✏️ Өзгерту</button>
      } @else {
        <!-- Енгізу формасы -->
        <div class="field">
          <label>Қайдан</label>
          <div class="input-row">
            <div class="suggest-wrap">
              <input
                type="text"
                [(ngModel)]="fromText"
                (ngModelChange)="onFromChange($event)"
                placeholder="Мекенжай немесе орын атауы"
                (focus)="showFromSug.set(true)"
                (blur)="hideDropdown('from')"
              />
              @if (showFromSug() && fromSuggestions().length) {
                <ul class="suggestions">
                  @for (s of fromSuggestions(); track s.label) {
                    <li (mousedown)="selectFrom(s)">{{ s.label }}</li>
                  }
                </ul>
              }
            </div>
            <button class="gps-btn" (click)="useGps()" title="GPS орнымды қолдану">📍</button>
          </div>
        </div>

        <div class="field">
          <label>Қайда</label>
          <div class="suggest-wrap">
            <input
              type="text"
              [(ngModel)]="toText"
              (ngModelChange)="onToChange($event)"
              placeholder="Баратын жер"
              (focus)="showToSug.set(true)"
              (blur)="hideDropdown('to')"
            />
            @if (showToSug() && toSuggestions().length) {
              <ul class="suggestions">
                @for (s of toSuggestions(); track s.label) {
                  <li (mousedown)="selectTo(s)">{{ s.label }}</li>
                }
              </ul>
            }
          </div>
        </div>

        @if (error()) {
          <div class="error-msg">{{ error() }}</div>
        }

        <button class="btn-go" [disabled]="loading()" (click)="go()">
          {{ loading() ? 'Іздеуде...' : 'Маршрутты сыз' }}
        </button>
      }
    </div>
  `,
  styles: [`
    .panel {
      background:#fff; border-radius:14px; padding:16px;
      box-shadow:0 4px 24px rgba(0,0,0,.18); display:flex; flex-direction:column; gap:10px;
    }
    .panel-header { display:flex; justify-content:space-between; align-items:center; }
    .panel-title { font-size:15px; font-weight:700; color:#1565c0; }
    .close-btn { background:none; border:none; font-size:18px; cursor:pointer; color:#999; }
    label { font-size:12px; font-weight:600; color:#555; display:block; margin-bottom:4px; }
    .input-row { display:flex; gap:6px; }
    .suggest-wrap { position:relative; flex:1; }
    input {
      width:100%; padding:9px 12px; border:1px solid #ddd; border-radius:8px;
      font-size:14px; box-sizing:border-box; outline:none;
    }
    input:focus { border-color:#1565c0; }
    .gps-btn {
      padding:9px 10px; background:#e8f0fe; border:1px solid #c5d7f7;
      border-radius:8px; cursor:pointer; font-size:16px; flex-shrink:0;
    }
    .gps-btn:hover { background:#c5d7f7; }
    .suggestions {
      position:absolute; top:100%; left:0; right:0; z-index:2000;
      background:#fff; border:1px solid #ddd; border-radius:8px;
      box-shadow:0 4px 12px rgba(0,0,0,.12); list-style:none;
      margin:2px 0 0; padding:4px 0; max-height:180px; overflow-y:auto;
    }
    .suggestions li {
      padding:8px 12px; cursor:pointer; font-size:13px; color:#333;
      border-bottom:1px solid #f0f0f0;
    }
    .suggestions li:last-child { border-bottom:none; }
    .suggestions li:hover { background:#e8f0fe; }
    .result-summary { display:flex; flex-direction:column; gap:8px; }
    .result-row {
      display:flex; align-items:center; gap:6px;
      background:#f5f5f5; border-radius:8px; padding:8px 10px;
      font-size:13px; color:#333;
    }
    .result-from, .result-to { font-weight:600; flex:1; }
    .result-to { text-align:right; }
    .result-arrow { color:#999; flex-shrink:0; }
    .route-result {
      display:flex; gap:16px; background:#e8f0fe;
      border-radius:8px; padding:10px 12px;
    }
    .route-result span { font-size:15px; font-weight:700; color:#1565c0; }
    .btn-edit {
      padding:8px; background:#f5f5f5; color:#333; border:1px solid #ddd;
      border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; text-align:center;
    }
    .btn-edit:hover { background:#e8e8e8; }
    .error-msg { background:#fce4e4; color:#c62828; border-radius:8px; padding:8px 12px; font-size:13px; }
    .btn-go {
      padding:10px; background:#1565c0; color:#fff; border:none;
      border-radius:8px; font-size:14px; font-weight:600; cursor:pointer;
    }
    .btn-go:disabled { opacity:.6; cursor:default; }
  `],
})
export class RoutePanelComponent implements OnChanges {
  @Input() targetPlace: Place | null = null;
  @Input() routeInfo: RouteInfo | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() routeRequested = new EventEmitter<{ from: L.LatLng; to: L.LatLng; fromLabel: string }>();

  routeDrawn = signal(false);

  fromText = '';
  toText = '';
  fromCoords: L.LatLng | null = null;
  toCoords: L.LatLng | null = null;

  fromSuggestions = signal<GeoSuggestion[]>([]);
  toSuggestions = signal<GeoSuggestion[]>([]);
  showFromSug = signal(false);
  showToSug = signal(false);
  loading = signal(false);
  error = signal('');

  private from$ = new Subject<string>();
  private to$ = new Subject<string>();

  constructor(private api: ApiService) {
    this.from$.pipe(
      debounceTime(350),
      switchMap(q => q.length > 2 ? this.api.geocode(q) : of([])),
      takeUntilDestroyed(),
    ).subscribe(results => {
      this.fromSuggestions.set(results.map(r => ({
        label: r.display_name,
        lat: +r.lat, lng: +r.lon,
      })));
    });

    this.to$.pipe(
      debounceTime(350),
      switchMap(q => q.length > 2 ? this.api.geocode(q) : of([])),
      takeUntilDestroyed(),
    ).subscribe(results => {
      this.toSuggestions.set(results.map(r => ({
        label: r.display_name,
        lat: +r.lat, lng: +r.lon,
      })));
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['targetPlace'] && this.targetPlace) {
      this.toText = this.targetPlace.name;
      this.toCoords = L.latLng(this.targetPlace.lat, this.targetPlace.lng);
    }
    if (changes['routeInfo']) {
      if (this.routeInfo) {
        this.routeDrawn.set(true);
      } else {
        this.routeDrawn.set(false);
      }
    }
  }

  onFromChange(v: string) {
    this.fromCoords = null;
    this.from$.next(v);
  }

  onToChange(v: string) {
    this.toCoords = null;
    this.to$.next(v);
  }

  selectFrom(s: GeoSuggestion) {
    this.fromText = s.label.split(',')[0];
    this.fromCoords = L.latLng(s.lat, s.lng);
    this.fromSuggestions.set([]);
    this.showFromSug.set(false);
  }

  selectTo(s: GeoSuggestion) {
    this.toText = s.label.split(',')[0];
    this.toCoords = L.latLng(s.lat, s.lng);
    this.toSuggestions.set([]);
    this.showToSug.set(false);
  }

  useGps() {
    this.loading.set(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.fromCoords = L.latLng(pos.coords.latitude, pos.coords.longitude);
        this.fromText = 'Менің орным 📍';
        this.loading.set(false);
      },
      () => {
        this.error.set('Геолокация рұқсаты жоқ');
        this.loading.set(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  hideDropdown(field: 'from' | 'to') {
    setTimeout(() => {
      if (field === 'from') this.showFromSug.set(false);
      else this.showToSug.set(false);
    }, 150);
  }

  async go() {
    this.error.set('');
    this.loading.set(true);

    let from = this.fromCoords;
    let fromLabel = this.fromText || 'Менің орным';

    // FROM бос болса — GPS автоматты
    if (!from && this.fromText.trim()) {
      const results = await firstValueFrom(this.api.geocode(this.fromText));
      if (results.length) {
        from = L.latLng(+results[0].lat, +results[0].lon);
        fromLabel = results[0].display_name.split(',')[0];
      }
    }

    if (!from) {
      try {
        from = await new Promise<L.LatLng>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            pos => resolve(L.latLng(pos.coords.latitude, pos.coords.longitude)),
            reject,
            { enableHighAccuracy: true, timeout: 8000 },
          );
        });
        fromLabel = 'Менің орным 📍';
        this.fromText = fromLabel;
      } catch {
        this.error.set('Геолокация рұқсаты жоқ. Қайдан орнын қолмен енгізіңіз.');
        this.loading.set(false);
        return;
      }
    }

    let to = this.toCoords;
    if (!to && this.toText.trim()) {
      const results = await firstValueFrom(this.api.geocode(this.toText));
      if (results.length) {
        to = L.latLng(+results[0].lat, +results[0].lon);
      }
    }

    this.loading.set(false);
    if (!to) { this.error.set('"Қайда" орнын таңдаңыз'); return; }

    this.routeRequested.emit({ from, to, fromLabel });
  }

  formatDuration(s: number) {
    const h = Math.floor(s / 3600);
    const m = Math.ceil((s % 3600) / 60);
    return h > 0 ? `${h} сағ ${m} мин` : `${m} мин`;
  }

  formatDistance(m: number) {
    return m >= 1000 ? `${(m / 1000).toFixed(1)} км` : `${Math.round(m)} м`;
  }
}
