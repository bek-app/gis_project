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

      <div class="card-actions">
        <button class="btn-route" (click)="openRoute.emit(place)">🗺️ Маршрут сызу</button>
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
    .card-actions { margin-top:14px; }
    .btn-route { width:100%; padding:10px; background:#1565c0; color:#fff; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; }
  `],
})
export class PlaceCardComponent {
  @Input() place!: Place;
  @Output() close = new EventEmitter<void>();
  @Output() openRoute = new EventEmitter<Place>();
}
