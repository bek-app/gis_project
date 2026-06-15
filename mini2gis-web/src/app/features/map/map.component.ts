import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { Place } from '../../core/models/place.model';

const ASTANA: [number, number] = [51.1694, 71.4491];

@Component({
  selector: 'app-map',
  standalone: true,
  template: `<div #mapEl style="width:100%;height:100%"></div>`,
  styles: [`:host { display:block; width:100%; height:100%; }`],
})
export class MapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;
  @Input() places: Place[] = [];
  @Input() selectedPlace: Place | null = null;
  @Output() bboxChange = new EventEmitter<[number, number, number, number]>();
  @Output() placeClick = new EventEmitter<Place>();

  private map!: L.Map;
  private cluster!: L.MarkerClusterGroup;
  private markers = new Map<number, L.Marker>();

  ngAfterViewInit() {
    this.map = L.map(this.mapEl.nativeElement).setView(ASTANA, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.cluster = (L as any).markerClusterGroup({ chunkedLoading: true });
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

    if (changes['places']) {
      this.refreshMarkers();
    }

    if (changes['selectedPlace'] && this.selectedPlace) {
      this.map.flyTo([this.selectedPlace.lat, this.selectedPlace.lng], 16);
    }
  }

  private refreshMarkers() {
    this.cluster.clearLayers();
    this.markers.clear();

    for (const p of this.places) {
      const m = L.marker([p.lat, p.lng]).bindTooltip(p.name);
      m.on('click', () => this.placeClick.emit(p));
      this.markers.set(p.id, m);
      this.cluster.addLayer(m);
    }
  }

  ngOnDestroy() {
    this.map?.remove();
  }
}
