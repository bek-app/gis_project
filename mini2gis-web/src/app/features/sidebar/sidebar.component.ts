import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category, Place } from '../../core/models/place.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sidebar">
      <div class="search-box">
        <input
          type="text"
          placeholder="Іздеу..."
          [(ngModel)]="searchQuery"
          (ngModelChange)="searchChange.emit($event)"
          class="search-input"
        />
      </div>

      <div class="categories">
        <button
          class="cat-chip"
          [class.active]="selectedCategories.includes(cat.slug)"
          *ngFor="let cat of categories"
          (click)="toggleCategory(cat.slug)"
        >
          {{ cat.name }}
        </button>
      </div>

      <div class="results-list">
        <div
          class="result-item"
          *ngFor="let place of places"
          (click)="placeSelect.emit(place)"
          [class.selected]="selectedPlace?.id === place.id"
        >
          <strong>{{ place.name }}</strong>
          <small *ngIf="place.address">{{ place.address }}</small>
          <small *ngIf="place.category" class="cat-label">{{ place.category.name }}</small>
        </div>
        <p *ngIf="places.length === 0" class="empty-msg">Орындар табылмады</p>
      </div>
    </div>
  `,
  styles: [`
    .sidebar {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #fafafa;
      overflow: hidden;
    }
    .search-box { padding: 12px; }
    .search-input {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #ddd;
      border-radius: 10px;
      font-size: 15px;
      box-sizing: border-box;
      outline: none;
    }
    .search-input:focus { border-color: #1565c0; }
    .categories {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 0 12px 12px;
    }
    .cat-chip {
      padding: 5px 12px;
      border: 1px solid #ccc;
      border-radius: 20px;
      background: #fff;
      cursor: pointer;
      font-size: 13px;
      transition: all .15s;
    }
    .cat-chip.active { background: #1565c0; color: #fff; border-color: #1565c0; }
    .results-list { flex: 1; overflow-y: auto; padding: 0 8px 8px; }
    .result-item {
      display: flex;
      flex-direction: column;
      padding: 10px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background .1s;
      margin-bottom: 4px;
    }
    .result-item:hover, .result-item.selected { background: #e8f0fe; }
    .result-item strong { font-size: 14px; }
    .result-item small { font-size: 12px; color: #666; margin-top: 2px; }
    .cat-label { color: #1565c0 !important; }
    .empty-msg { color: #999; text-align: center; padding: 24px; }
  `],
})
export class SidebarComponent {
  @Input() categories: Category[] = [];
  @Input() places: Place[] = [];
  @Input() selectedPlace: Place | null = null;
  @Output() categoriesChange = new EventEmitter<string[]>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() placeSelect = new EventEmitter<Place>();

  selectedCategories: string[] = [];
  searchQuery = '';

  toggleCategory(slug: string) {
    const idx = this.selectedCategories.indexOf(slug);
    if (idx >= 0) {
      this.selectedCategories.splice(idx, 1);
    } else {
      this.selectedCategories.push(slug);
    }
    this.categoriesChange.emit([...this.selectedCategories]);
  }
}
