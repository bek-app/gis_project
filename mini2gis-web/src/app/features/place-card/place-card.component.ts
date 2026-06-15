import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Place } from '../../core/models/place.model';

export interface RouteInfo {
  duration: number;
  distance: number;
}

@Component({
  selector: 'app-place-card',
  standalone: true,
  template: `
    <div class="card">
      <div class="card-header">
        @if (place.category) {
          <span class="category-badge">{{ place.category.name }}</span>
        }
        <button class="close-btn" (click)="close.emit()">✕</button>
      </div>
      <h2>{{ place.name }}</h2>
      @if (place.address) { <p class="info-row">📍 {{ place.address }}</p> }
      @if (place.phone) { <p class="info-row">📞 <a [href]="'tel:' + place.phone">{{ place.phone }}</a></p> }
      @if (place.opening_hours) { <p class="info-row">🕐 {{ place.opening_hours }}</p> }

      @if (routeInfo) {
        <div class="route-result">
          <span>🕐 {{ formatDuration(routeInfo.duration) }}</span>
          <span>📏 {{ formatDistance(routeInfo.distance) }}</span>
          <button class="clear-route" (click)="clearRoute.emit()">✕</button>
        </div>
      }

      <div class="card-actions">
        @if (routeInfo) {
          <button class="btn-cancel" (click)="clearRoute.emit()">✕ Отмена</button>
        } @else {
          <button class="btn-route" (click)="openRoute.emit(place)">🗺️ Маршрут сызу</button>
        }
      </div>
    </div>
  `,
  styles: [`
    .card { background:#fff; border-radius:14px; padding:16px; box-shadow:0 4px 24px rgba(0,0,0,.18); }
    .card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
    .category-badge { background:#e3f0ff; color:#1565c0; border-radius:8px; padding:3px 10px; font-size:12px; font-weight:600; }
    .close-btn { background:none; border:none; font-size:20px; cursor:pointer; color:#999; line-height:1; }
    h2 { margin:0 0 10px; font-size:17px; font-weight:700; }
    .info-row { margin:5px 0; font-size:14px; color:#444; }
    .info-row a { color:#1565c0; text-decoration:none; }
    .route-result {
      display:flex; align-items:center; gap:12px;
      background:#e8f0fe; border-radius:8px; padding:10px 12px; margin-top:10px;
    }
    .route-result span { font-size:14px; font-weight:700; color:#1565c0; flex:1; }
    .clear-route { background:none; border:none; cursor:pointer; color:#999; font-size:14px; padding:0; }
    .card-actions { margin-top:10px; }
    .btn-route { width:100%; padding:10px; background:#1565c0; color:#fff; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; }
    .btn-cancel { width:100%; padding:10px; background:#fce4e4; color:#c62828; border:1px solid #f5c2c2; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; }
  `],
})
export class PlaceCardComponent {
  @Input() place!: Place;
  @Input() routeInfo: RouteInfo | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() openRoute = new EventEmitter<Place>();
  @Output() clearRoute = new EventEmitter<void>();

  formatDuration(s: number) {
    const h = Math.floor(s / 3600);
    const m = Math.ceil((s % 3600) / 60);
    return h > 0 ? `${h} сағ ${m} мин` : `${m} мин`;
  }

  formatDistance(m: number) {
    return m >= 1000 ? `${(m / 1000).toFixed(1)} км` : `${Math.round(m)} м`;
  }
}
