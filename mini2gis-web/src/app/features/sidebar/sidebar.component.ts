import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Category, Place } from '../../core/models/place.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="sidebar">

      <!-- Вкладкалар -->
      <div class="tabs">
        <button class="tab" [class.active]="activeTab() === 'places'" (click)="activeTab.set('places')">
          🏙️ Орындар
        </button>
        <button class="tab" [class.active]="activeTab() === 'route'" (click)="activeTab.set('route')">
          🗺️ Маршрут
        </button>
      </div>

      <!-- ОРЫНДАР ВКЛАДКАСЫ -->
      @if (activeTab() === 'places') {
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
          @for (cat of categories; track cat.id) {
            <button
              class="cat-chip"
              [class.active]="selectedCategories.includes(cat.slug)"
              (click)="toggleCategory(cat.slug)"
            >{{ cat.name }}</button>
          }
        </div>

        <div class="results-list">
          @for (place of places; track place.id) {
            <div
              class="result-item"
              (click)="placeSelect.emit(place)"
              [class.selected]="selectedPlace?.id === place.id"
            >
              <strong>{{ place.name }}</strong>
              @if (place.address) { <small>{{ place.address }}</small> }
              @if (place.category) { <small class="cat-label">{{ place.category.name }}</small> }
            </div>
          }
          @if (places.length === 0) {
            <p class="empty-msg">Орындар табылмады</p>
          }
        </div>
      }

      <!-- МАРШРУТ ВКЛАДКАСЫ -->
      @if (activeTab() === 'route') {
        <div class="route-tab">

          <!-- FROM нүктесі -->
          <div class="point-section">
            <div class="point-label from-label">🔵 Қайдан</div>
            @if (fromPlace()) {
              <div class="selected-point from-point">
                <span>{{ fromPlace()!.name }}</span>
                <button class="clear-point" (click)="fromPlace.set(null)">✕</button>
              </div>
            } @else {
              <div class="gps-point active-gps">
                📍 Менің орным (GPS) — авто
              </div>
              <div class="divider-or">немесе төменде А басыңыз</div>
            }
          </div>

          <!-- TO нүктесі -->
          <div class="point-section">
            <div class="point-label to-label">🔴 Қайда</div>
            @if (toPlace()) {
              <div class="selected-point to-point">
                <span>{{ toPlace()!.name }}</span>
                <button class="clear-point" (click)="toPlace.set(null)">✕</button>
              </div>
            } @else {
              <p class="pick-hint">Төменде орын таңдаңыз</p>
            }
          </div>

          <!-- Маршрут батырмасы -->
          <button
            class="btn-draw-route"
            [disabled]="!toPlace()"
            (click)="emitRoute()"
          >
            🗺️ Маршрут сыз
          </button>

          <!-- Іздеу -->
          <div class="search-box">
            <input
              type="text"
              placeholder="Орын іздеу..."
              [(ngModel)]="routeSearch"
              class="search-input"
            />
          </div>

          <!-- Тізім -->
          <div class="results-list">
            @for (place of filteredByRoute(); track place.id) {
              <div class="result-item route-item">
                <div class="route-item-info" (click)="selectTo(place)">
                  <strong [class.active-to]="toPlace()?.id === place.id">{{ place.name }}</strong>
                  @if (place.address) { <small>{{ place.address }}</small> }
                </div>
                <div class="route-item-btns">
                  <button
                    class="pick-btn from-btn"
                    [class.picked]="fromPlace()?.id === place.id"
                    (click)="selectFrom(place)"
                    title="Қайдан"
                  >А</button>
                  <button
                    class="pick-btn to-btn"
                    [class.picked]="toPlace()?.id === place.id"
                    (click)="selectTo(place)"
                    title="Қайда"
                  >Б</button>
                </div>
              </div>
            }
            @if (filteredByRoute().length === 0) {
              <p class="empty-msg">Орындар табылмады</p>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sidebar { display:flex; flex-direction:column; height:100%; background:#fafafa; overflow:hidden; }

    /* Tabs */
    .tabs { display:flex; border-bottom:1px solid #e0e0e0; }
    .tab {
      flex:1; padding:11px 0; background:none; border:none; cursor:pointer;
      font-size:13px; font-weight:600; color:#666; transition:all .15s;
      border-bottom:2px solid transparent;
    }
    .tab.active { color:#1565c0; border-bottom-color:#1565c0; background:#fff; }
    .tab:hover:not(.active) { background:#f0f0f0; }

    /* Search */
    .search-box { padding:12px; }
    .search-input { width:100%; padding:10px 14px; border:1px solid #ddd; border-radius:10px; font-size:15px; box-sizing:border-box; outline:none; }
    .search-input:focus { border-color:#1565c0; }

    /* Categories */
    .categories { display:flex; flex-wrap:wrap; gap:6px; padding:0 12px 12px; }
    .cat-chip { padding:5px 12px; border:1px solid #ccc; border-radius:20px; background:#fff; cursor:pointer; font-size:13px; transition:all .15s; }
    .cat-chip.active { background:#1565c0; color:#fff; border-color:#1565c0; }

    /* Results */
    .results-list { flex:1; overflow-y:auto; padding:0 8px 8px; }
    .result-item { display:flex; flex-direction:column; padding:10px 12px; border-radius:8px; cursor:pointer; transition:background .1s; margin-bottom:4px; }
    .result-item:hover, .result-item.selected { background:#e8f0fe; }
    .result-item strong { font-size:14px; }
    .result-item small { font-size:12px; color:#666; margin-top:2px; }
    .cat-label { color:#1565c0 !important; }
    .empty-msg { color:#999; text-align:center; padding:24px; }

    /* Route tab */
    .route-tab { display:flex; flex-direction:column; flex:1; overflow:hidden; }
    .point-section { padding:10px 12px 6px; }
    .point-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; margin-bottom:6px; }
    .from-label { color:#1565c0; }
    .to-label { color:#e11d48; }

    .selected-point {
      display:flex; align-items:center; justify-content:space-between;
      background:#fff; border:1.5px solid #1565c0; border-radius:8px;
      padding:8px 10px; font-size:13px; font-weight:600; color:#1565c0;
    }
    .to-point { border-color:#e11d48; color:#e11d48; }
    .clear-point { background:none; border:none; cursor:pointer; color:#999; font-size:14px; padding:0 2px; }

    .gps-point {
      width:100%; padding:9px; background:#e8f0fe; border:1px dashed #1565c0;
      border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; color:#1565c0;
      text-align:left;
    }
    .gps-point:hover { background:#c5d7f7; }
    .divider-or { font-size:11px; color:#aaa; text-align:center; margin-top:6px; }
    .pick-hint { font-size:12px; color:#aaa; margin:4px 0 0; font-style:italic; }

    .btn-draw-route {
      margin:8px 12px; padding:11px; background:#1565c0; color:#fff;
      border:none; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer;
    }
    .btn-draw-route:disabled { opacity:.45; cursor:default; }
    .btn-draw-route:not(:disabled):hover { background:#1040a0; }

    /* Route list items */
    .route-item { flex-direction:row !important; align-items:center; padding:8px 10px !important; }
    .route-item-info { flex:1; display:flex; flex-direction:column; cursor:pointer; }
    .route-item-info strong { font-size:13px; }
    .route-item-info strong.active-to { color:#e11d48; }
    .route-item-btns { display:flex; gap:4px; flex-shrink:0; margin-left:8px; }
    .pick-btn {
      width:26px; height:26px; border-radius:6px; border:1.5px solid #ccc;
      background:#f5f5f5; font-size:11px; font-weight:700; cursor:pointer;
    }
    .from-btn.picked { background:#1565c0; color:#fff; border-color:#1565c0; }
    .to-btn.picked { background:#e11d48; color:#fff; border-color:#e11d48; }
  `],
})
export class SidebarComponent {
  @Input() categories: Category[] = [];
  @Input() places: Place[] = [];
  @Input() selectedPlace: Place | null = null;
  @Output() categoriesChange = new EventEmitter<string[]>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() placeSelect = new EventEmitter<Place>();
  @Output() routeRequest = new EventEmitter<{ from: Place | 'gps'; to: Place }>();

  activeTab = signal<'places' | 'route'>('places');
  fromPlace = signal<Place | null>(null);
  toPlace = signal<Place | null>(null);
  useGps = signal(false);
  routeSearch = '';

  selectedCategories: string[] = [];
  searchQuery = '';

  toggleCategory(slug: string) {
    const idx = this.selectedCategories.indexOf(slug);
    if (idx >= 0) this.selectedCategories.splice(idx, 1);
    else this.selectedCategories.push(slug);
    this.categoriesChange.emit([...this.selectedCategories]);
  }

  filteredByRoute(): Place[] {
    const q = this.routeSearch.toLowerCase();
    if (!q) return this.places;
    return this.places.filter(p => p.name.toLowerCase().includes(q) || (p.address ?? '').toLowerCase().includes(q));
  }

  selectFrom(place: Place) {
    this.fromPlace.set(place);
    this.useGps.set(false);
  }

  selectTo(place: Place) {
    this.toPlace.set(place);
  }

  useGpsFrom() {
    this.fromPlace.set(null);
    this.useGps.set(true);
  }

  emitRoute() {
    const to = this.toPlace();
    if (!to) return;
    const from: Place | 'gps' = this.fromPlace() ?? 'gps';
    this.routeRequest.emit({ from, to });
  }
}
