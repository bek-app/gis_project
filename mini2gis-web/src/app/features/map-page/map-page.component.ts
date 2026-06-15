import { Component, OnInit, signal, computed, ViewChild } from '@angular/core';
import { debounceTime, Subject, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as L from 'leaflet';
import { ApiService } from '../../core/services/api.service';
import { Category, Place } from '../../core/models/place.model';
import { MapComponent } from '../map/map.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { PlaceCardComponent, RouteInfo } from '../place-card/place-card.component';
import { RoutePanelComponent } from '../route-panel/route-panel.component';
import { ProfilePanelComponent } from '../profile-panel/profile-panel.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-map-page',
  standalone: true,
  imports: [MapComponent, SidebarComponent, PlaceCardComponent, RoutePanelComponent, ProfilePanelComponent],
  template: `
    <div class="layout">
      <!-- СОЛ САЙДБАР -->
      <div class="sidebar-panel" [class.hidden]="sidebarHidden()">
        <app-sidebar
          [categories]="categories()"
          [places]="filteredPlaces()"
          [selectedPlace]="selectedPlace()"
          (categoriesChange)="selectedCats.set($event)"
          (searchChange)="searchQuery.set($event)"
          (placeSelect)="onPlaceSelect($event)"
          (routeRequest)="onSidebarRoute($event)"
        />
      </div>

      <!-- КАРТА -->
      <div class="map-panel">
        <button class="toggle-btn left-toggle" (click)="sidebarHidden.set(!sidebarHidden())">
          {{ sidebarHidden() ? '☰' : '✕' }}
        </button>
        <button class="toggle-btn right-toggle" (click)="profileOpen.set(!profileOpen())">
          👤
        </button>
        <app-map
          #mapRef
          [places]="filteredPlaces()"
          [selectedPlace]="selectedPlace()"
          [routeTarget]="routeTarget()"
          [tomtomKey]="tomtomKey"
          (bboxChange)="onBboxChange($event)"
          (placeClick)="onPlaceSelect($event)"
          (routeInfo)="routeInfo.set($event)"
        />
      </div>

      <!-- ОҢ САЙДБАР — профиль -->
      <div class="profile-sidebar" [class.open]="profileOpen()">
        <app-profile-panel />
      </div>

      <!-- Орын карточкасы -->
      @if (selectedPlace() && !showRoutePanel()) {
        <div class="overlay-card">
          <app-place-card
            [place]="selectedPlace()!"
            (close)="closeCard()"
            (openRoute)="openRoutePanel($event)"
          />
        </div>
      }

      <!-- Маршрут панелі -->
      @if (showRoutePanel()) {
        <div class="overlay-card">
          <app-route-panel
            [targetPlace]="selectedPlace()"
            [routeInfo]="routeInfo()"
            (close)="closeRoutePanel()"
            (routeRequested)="onRouteRequested($event)"
          />
        </div>
      }
    </div>
  `,
  styles: [`
    .layout { display:flex; height:100vh; width:100vw; overflow:hidden; position:relative; }

    .sidebar-panel {
      width:320px; min-width:320px; height:100%;
      border-right:1px solid #e0e0e0; z-index:10; transition:margin-left .25s;
    }
    .sidebar-panel.hidden { margin-left:-320px; }

    .map-panel { flex:1; position:relative; }

    .toggle-btn {
      position:absolute; z-index:999;
      background:#fff; border:1px solid #ccc; border-radius:8px;
      padding:8px 12px; cursor:pointer; font-size:18px;
      box-shadow:0 2px 8px rgba(0,0,0,.15);
    }
    .left-toggle { top:12px; left:12px; }
    .right-toggle { top:12px; right:12px; }

    .profile-sidebar {
      width:0; height:100%; overflow:hidden;
      border-left:1px solid #e0e0e0; background:#fafafa;
      transition:width .25s; z-index:10; flex-shrink:0;
    }
    .profile-sidebar.open { width:280px; min-width:280px; }

    .overlay-card {
      position:absolute; bottom:20px; left:50%; transform:translateX(-50%);
      width:90%; max-width:460px; z-index:1000;
    }
    @media (max-width:600px) {
      .sidebar-panel { position:absolute; height:100%; background:#fafafa; }
      .profile-sidebar.open { position:absolute; right:0; height:100%; width:260px; min-width:260px; }
      .overlay-card { bottom:10px; }
    }
  `],
})
export class MapPageComponent implements OnInit {
  @ViewChild('mapRef') mapRef!: MapComponent;

  readonly tomtomKey = environment.tomtomKey;

  categories = signal<Category[]>([]);
  allPlaces = signal<Place[]>([]);
  selectedPlace = signal<Place | null>(null);
  routeTarget = signal<Place | null>(null);
  routeInfo = signal<RouteInfo | null>(null);
  showRoutePanel = signal(false);
  selectedCats = signal<string[]>([]);
  searchQuery = signal('');
  sidebarHidden = signal(false);
  profileOpen = signal(false);

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

  onPlaceSelect(place: Place) {
    this.selectedPlace.set(place);
    this.showRoutePanel.set(false);
    this.routeInfo.set(null);
    this.mapRef?.clearRoute();
  }

  openRoutePanel(place: Place) {
    this.selectedPlace.set(place);
    this.routeInfo.set(null);
    this.mapRef?.clearRoute();
    this.showRoutePanel.set(true);
  }

  closeRoutePanel() {
    this.showRoutePanel.set(false);
    this.routeInfo.set(null);
    this.mapRef?.clearRoute();
  }

  onRouteRequested(event: { from: L.LatLng; to: L.LatLng; fromLabel: string }) {
    this.mapRef?.drawRouteFromCoords(event.from, event.to, event.fromLabel);
  }

  onSidebarRoute(event: { from: Place | 'gps'; to: Place }) {
    this.selectedPlace.set(null);
    this.showRoutePanel.set(false);
    this.routeInfo.set(null);
    if (event.from === 'gps') {
      this.mapRef?.drawRoute(event.to);
    } else {
      const from = L.latLng(event.from.lat, event.from.lng);
      const to = L.latLng(event.to.lat, event.to.lng);
      this.mapRef?.drawRouteFromCoords(from, to, event.from.name);
    }
  }

  closeCard() {
    this.selectedPlace.set(null);
    this.showRoutePanel.set(false);
    this.routeInfo.set(null);
    this.mapRef?.clearRoute();
  }
}
