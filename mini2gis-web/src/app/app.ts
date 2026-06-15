import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { debounceTime, Subject, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { provideHttpClient } from '@angular/common/http';
import { ApiService } from './core/services/api.service';
import { Category, Place } from './core/models/place.model';
import { MapComponent } from './features/map/map.component';
import { SidebarComponent } from './features/sidebar/sidebar.component';
import { PlaceCardComponent } from './features/place-card/place-card.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, MapComponent, SidebarComponent, PlaceCardComponent],
  template: `
    <div class="layout">
      <div class="sidebar-panel" [class.hidden]="sidebarHidden()">
        <app-sidebar
          [categories]="categories()"
          [places]="filteredPlaces()"
          [selectedPlace]="selectedPlace()"
          (categoriesChange)="selectedCats.set($event)"
          (searchChange)="searchQuery.set($event)"
          (placeSelect)="selectedPlace.set($event)"
        />
      </div>
      <div class="map-panel">
        <button class="toggle-btn" (click)="sidebarHidden.set(!sidebarHidden())">
          {{ sidebarHidden() ? '☰' : '✕' }}
        </button>
        <app-map
          [places]="filteredPlaces()"
          [selectedPlace]="selectedPlace()"
          (bboxChange)="onBboxChange($event)"
          (placeClick)="selectedPlace.set($event)"
        />
      </div>
      @if (selectedPlace()) {
        <div class="place-card-overlay">
          <app-place-card
            [place]="selectedPlace()!"
            (close)="selectedPlace.set(null)"
          />
        </div>
      }
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      position: relative;
    }
    .sidebar-panel {
      width: 320px;
      min-width: 320px;
      height: 100%;
      border-right: 1px solid #e0e0e0;
      z-index: 10;
      transition: margin-left .25s;
    }
    .sidebar-panel.hidden { margin-left: -320px; }
    .map-panel { flex: 1; position: relative; }
    .toggle-btn {
      position: absolute;
      top: 12px;
      left: 12px;
      z-index: 999;
      background: #fff;
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 18px;
      box-shadow: 0 2px 8px rgba(0,0,0,.15);
    }
    .place-card-overlay {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 90%;
      max-width: 440px;
      z-index: 1000;
    }
    @media (max-width: 600px) {
      .sidebar-panel { position: absolute; height: 100%; background: #fafafa; }
      .place-card-overlay { bottom: 10px; }
    }
  `],
})
export class App implements OnInit {
  categories = signal<Category[]>([]);
  allPlaces = signal<Place[]>([]);
  selectedPlace = signal<Place | null>(null);
  selectedCats = signal<string[]>([]);
  searchQuery = signal('');
  sidebarHidden = signal(false);

  private bbox$ = new Subject<[number, number, number, number]>();

  filteredPlaces = computed(() => {
    const cats = this.selectedCats();
    const q = this.searchQuery().toLowerCase();
    let list = this.allPlaces();
    if (cats.length > 0) {
      list = list.filter(p => p.category && cats.includes(p.category.slug));
    }
    if (q) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.address && p.address.toLowerCase().includes(q))
      );
    }
    return list;
  });

  constructor(private api: ApiService) {
    this.bbox$.pipe(
      debounceTime(400),
      switchMap(bbox => this.api.getPlaces(bbox)),
      takeUntilDestroyed(),
    ).subscribe(places => this.allPlaces.set(places));
  }

  ngOnInit() {
    this.api.getCategories().subscribe(cats => this.categories.set(cats));
  }

  onBboxChange(bbox: [number, number, number, number]) {
    this.bbox$.next(bbox);
  }
}
