import {
  AfterViewInit, Component, ElementRef, EventEmitter,
  Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild,
} from '@angular/core';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet-routing-machine';
import { Place } from '../../core/models/place.model';

const ASTANA: [number, number] = [51.1694, 71.4491];

// Category → color
const CAT_COLORS: Record<string, string> = {
  cafe: '#f97316', restaurant: '#ef4444', fast_food: '#f59e0b',
  shop: '#8b5cf6', pharmacy: '#10b981', hospital: '#e11d48',
  bank: '#0ea5e9', atm: '#64748b', fuel: '#f59e0b',
  hotel: '#6366f1', park: '#22c55e', school: '#14b8a6',
  university: '#3b82f6',
};

function placeIcon(place: Place): L.DivIcon {
  const color = CAT_COLORS[place.category?.slug ?? ''] ?? '#1565c0';
  const label = place.name.length > 20 ? place.name.slice(0, 18) + '…' : place.name;
  return L.divIcon({
    className: '',
    html: `<div class="mg-pin" style="--c:${color}">
             <div class="mg-head"></div>
             <div class="mg-tail"></div>
             <div class="mg-name">${label}</div>
           </div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 30],
    popupAnchor: [0, -32],
  });
}

const MARKER_CSS = `
  .mg-pin {
    display:flex; flex-direction:column; align-items:center;
    cursor:pointer; filter:drop-shadow(0 2px 3px rgba(0,0,0,.35));
  }
  .mg-head {
    width:20px; height:20px;
    background:var(--c,#1565c0); border:2.5px solid #fff;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    transition:transform .15s;
  }
  .mg-pin:hover .mg-head { transform:rotate(-45deg) scale(1.2); }
  .mg-tail {
    width:3px; height:7px;
    background:var(--c,#1565c0);
    margin-top:-2px;
    clip-path:polygon(0 0,100% 0,50% 100%);
  }
  .mg-name {
    margin-top:3px;
    background:#fff; color:#111;
    border:1.5px solid var(--c,#1565c0);
    border-radius:5px; padding:1px 6px;
    font-size:10px; font-weight:700;
    white-space:nowrap; line-height:1.4;
    box-shadow:0 1px 4px rgba(0,0,0,.18);
    pointer-events:none;
  }
`;

@Component({
  selector: 'app-map',
  standalone: true,
  template: `
    <style>${MARKER_CSS}</style>
    <div #mapEl style="width:100%;height:100%;position:relative">
      <div class="map-controls">
        <button (click)="goToMyLocation()" title="Менің орным">📍</button>
        @if (tomtomKey) {
          <button class="traffic-btn" [class.active]="trafficVisible" (click)="toggleTraffic()" title="Пробкалар">🚦</button>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display:block; width:100%; height:100%; }
    .map-controls {
      position:absolute; z-index:999; right:12px; bottom:24px;
      display:flex; flex-direction:column; gap:8px; align-items:flex-end;
    }
    .map-controls button {
      background:#fff; border:1px solid #ccc; border-radius:8px;
      padding:8px 10px; cursor:pointer; font-size:18px;
      box-shadow:0 2px 8px rgba(0,0,0,.15); line-height:1;
      width:40px; height:40px; display:flex; align-items:center; justify-content:center;
    }
    .map-controls button:hover { background:#f5f5f5; }
    .traffic-btn.active { background:#fff9c4 !important; border-color:#f59e0b !important; }
  `],
})
export class MapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;
  @Input() places: Place[] = [];
  @Input() selectedPlace: Place | null = null;
  @Input() routeTarget: Place | null = null;
  @Input() tomtomKey = '';
  @Output() bboxChange = new EventEmitter<[number, number, number, number]>();
  @Output() placeClick = new EventEmitter<Place>();
  @Output() routeInfo = new EventEmitter<{ duration: number; distance: number } | null>();

  private map!: L.Map;
  private cluster!: L.MarkerClusterGroup;
  private routingControl: any = null;
  private userMarker: L.CircleMarker | null = null;
  private trafficFlowLayer: L.TileLayer | null = null;
  private trafficIncidentLayer: L.TileLayer | null = null;
  trafficVisible = false;

  ngAfterViewInit() {
    this.map = L.map(this.mapEl.nativeElement, { zoomControl: false })
      .setView(ASTANA, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomleft' }).addTo(this.map);

    this.cluster = (L as any).markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      showCoverageOnHover: false,
    });
    this.map.addLayer(this.cluster);

    const emitBbox = () => {
      const b = this.map.getBounds();
      this.bboxChange.emit([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    };
    this.map.on('moveend', emitBbox);
    emitBbox();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.map) return;
    if (changes['places']) this.refreshMarkers();
    if (changes['selectedPlace'] && this.selectedPlace) {
      this.map.flyTo([this.selectedPlace.lat, this.selectedPlace.lng], 16, { duration: 0.8 });
    }
    if (changes['routeTarget']) {
      this.routeTarget ? this.drawRoute(this.routeTarget) : this.clearRoute();
    }
  }

  private refreshMarkers() {
    this.cluster.clearLayers();
    for (const p of this.places) {
      const m = L.marker([p.lat, p.lng], { icon: placeIcon(p) });
      m.on('click', () => this.placeClick.emit(p));
      this.cluster.addLayer(m);
    }
  }

  drawRoute(target: Place) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const from = L.latLng(pos.coords.latitude, pos.coords.longitude);
        this.drawRouteFromCoords(from, L.latLng(target.lat, target.lng), 'Сіздің орыныңыз');
      },
      () => alert('Геолокация рұқсаты жоқ.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  drawRouteFromCoords(from: L.LatLng, to: L.LatLng, fromLabel = 'Қайдан') {
    this.clearRoute();

    // Traffic tiles алдымен қосамыз (маршрут сызығы үстінде болмасын үшін)
    if (this.tomtomKey && !this.trafficVisible) {
      this.enableTrafficLayer();
    }

    this.userMarker = L.circleMarker(from, {
      radius: 9, color: '#1565c0', fillColor: '#42a5f5',
      fillOpacity: 1, weight: 3,
    }).addTo(this.map).bindTooltip(fromLabel);

    this.routingControl = (L as any).Routing.control({
      waypoints: [from, to],
      router: (L as any).Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        language: 'ru',
      }),
      lineOptions: {
        // Жартылай мөлдір — астындағы трафик түстері көрінеді
        styles: [
          { color: '#000', weight: 9, opacity: 0.12 },   // shadow
          { color: '#1565c0', weight: 6, opacity: 0.45 }, // route (жартылай мөлдір)
          { color: '#fff', weight: 2, opacity: 0.6, dashArray: '8,8' }, // dash
        ],
        extendToWaypoints: true,
        missingRouteTolerance: 0,
      },
      show: false,
      addWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
    }).addTo(this.map);

    this.routingControl.on('routesfound', (e: any) => {
      const r = e.routes[0];
      this.routeInfo.emit({
        duration: r.summary.totalTime,
        distance: r.summary.totalDistance,
      });
    });
  }

  private enableTrafficLayer() {
    this.trafficFlowLayer = L.tileLayer(
      `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${this.tomtomKey}`,
      { maxZoom: 19, opacity: 0.8, attribution: '© TomTom', zIndex: 300 },
    ).addTo(this.map);
    this.trafficIncidentLayer = L.tileLayer(
      `https://api.tomtom.com/traffic/map/4/tile/incidents/s3/{z}/{x}/{y}.png?key=${this.tomtomKey}`,
      { maxZoom: 19, opacity: 1, zIndex: 400 },
    ).addTo(this.map);
    this.trafficVisible = true;
  }

  toggleTraffic() {
    if (!this.tomtomKey) return;
    if (this.trafficVisible) {
      if (this.trafficFlowLayer) this.map.removeLayer(this.trafficFlowLayer);
      if (this.trafficIncidentLayer) this.map.removeLayer(this.trafficIncidentLayer);
      this.trafficFlowLayer = null;
      this.trafficIncidentLayer = null;
      this.trafficVisible = false;
    } else {
      this.enableTrafficLayer();
    }
  }

  goToMyLocation() {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        this.map.flyTo(latlng, 16, { duration: 1 });
        if (this.userMarker) this.map.removeLayer(this.userMarker);
        this.userMarker = L.circleMarker(latlng, {
          radius: 9, color: '#1565c0', fillColor: '#42a5f5',
          fillOpacity: 1, weight: 3,
        }).addTo(this.map).bindTooltip('Сіздің орыныңыз', { permanent: false }).openTooltip();
      },
      () => alert('Геолокация рұқсаты жоқ.'),
      { enableHighAccuracy: true },
    );
  }

  clearRoute() {
    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
      this.routingControl = null;
    }
    if (this.userMarker) {
      this.map.removeLayer(this.userMarker);
      this.userMarker = null;
    }
    this.routeInfo.emit(null);
  }

  ngOnDestroy() { this.map?.remove(); }
}
