import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Place } from '../../core/models/place.model';

@Component({
  selector: 'app-place-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="card-header">
        <span class="category-badge" *ngIf="place.category">{{ place.category.name }}</span>
        <button class="close-btn" (click)="close.emit()">✕</button>
      </div>
      <h2>{{ place.name }}</h2>
      <p *ngIf="place.address" class="info-row">📍 {{ place.address }}</p>
      <p *ngIf="place.phone" class="info-row">📞 <a [href]="'tel:' + place.phone">{{ place.phone }}</a></p>
      <p *ngIf="place.opening_hours" class="info-row">🕐 {{ place.opening_hours }}</p>
      <div class="card-actions">
        <a class="btn-route btn-2gis"
           [href]="'https://2gis.kz/astana/search/' + encodeURIComponent(place.name)"
           target="_blank">2GIS-те ашу</a>
        <a class="btn-route btn-gmaps"
           [href]="'https://maps.google.com/?q=' + place.lat + ',' + place.lng"
           target="_blank">Google Maps</a>
      </div>
    </div>
  `,
  styles: [`
    .card {
      background: #fff;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,.15);
    }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .category-badge { background: #e3f0ff; color: #1565c0; border-radius: 8px; padding: 2px 8px; font-size: 12px; }
    .close-btn { background: none; border: none; font-size: 18px; cursor: pointer; color: #666; }
    h2 { margin: 0 0 12px; font-size: 18px; }
    .info-row { margin: 6px 0; font-size: 14px; color: #444; }
    .info-row a { color: #1565c0; text-decoration: none; }
    .card-actions { display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap; }
    .btn-route { padding: 8px 14px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; }
    .btn-2gis { background: #00c455; color: #fff; }
    .btn-gmaps { background: #4285f4; color: #fff; }
  `],
})
export class PlaceCardComponent {
  @Input() place!: Place;
  @Output() close = new EventEmitter<void>();

  encodeURIComponent = encodeURIComponent;
}
