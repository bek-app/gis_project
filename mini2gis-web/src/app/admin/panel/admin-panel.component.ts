import {
  AfterViewInit, Component, ElementRef, OnDestroy,
  OnInit, signal, ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { ApiService, PlacePayload } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Category, Place } from '../../core/models/place.model';

const ASTANA: [number, number] = [51.1694, 71.4491];

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="admin-layout">
      <div class="admin-header">
        <h1>🗺️ Mini-2GIS — Админ панель</h1>
        <div class="header-actions">
          <button class="btn-secondary" (click)="goToMap()">Картаға оралу</button>
          <button class="btn-danger" (click)="logout()">Шығу</button>
        </div>
      </div>

      <div class="admin-body">
        <div class="map-section">
          <p class="map-hint">Картаға нүкте қосу үшін шертіңіз ↓</p>
          <div #mapEl class="admin-map"></div>
        </div>

        <div class="form-section">
          <h2>{{ editingId() ? 'Орынды өзгерту' : 'Жаңа орын қосу' }}</h2>

          @if (successMsg()) {
            <div class="success-msg">{{ successMsg() }}</div>
          }
          @if (errorMsg()) {
            <div class="error-msg">{{ errorMsg() }}</div>
          }

          <form (ngSubmit)="save()">
            <label>Атауы *</label>
            <input [(ngModel)]="form.name" name="name" placeholder="Мысалы: Coffeeroom" required />

            <label>Координаттар *</label>
            <div class="coords-row">
              <input [(ngModel)]="form.lat" name="lat" type="number" step="any" placeholder="Lat" required />
              <input [(ngModel)]="form.lng" name="lng" type="number" step="any" placeholder="Lng" required />
            </div>

            <label>Мекенжай</label>
            <input [(ngModel)]="form.address" name="address" placeholder="Көше, үй нөмірі" />

            <label>Телефон</label>
            <input [(ngModel)]="form.phone" name="phone" placeholder="+7 (xxx) xxx-xx-xx" />

            <label>Жұмыс уақыты</label>
            <input [(ngModel)]="form.opening_hours" name="opening_hours" placeholder="09:00-22:00" />

            <label>Категория</label>
            <select [(ngModel)]="form.categoryId" name="categoryId">
              <option [ngValue]="undefined">— Таңдаңыз —</option>
              @for (cat of categories(); track cat.id) {
                <option [ngValue]="cat.id">{{ cat.name }}</option>
              }
            </select>

            <div class="form-actions">
              <button type="submit" class="btn-primary" [disabled]="saving()">
                {{ saving() ? 'Сақталуда...' : (editingId() ? 'Жаңарту' : 'Қосу') }}
              </button>
              @if (editingId()) {
                <button type="button" class="btn-danger" (click)="deletePlace()">Жою</button>
                <button type="button" class="btn-secondary" (click)="resetForm()">Болдырмау</button>
              }
            </div>
          </form>

          <hr />
          <h3>Қосылған орындар (admin)</h3>
          <div class="places-list">
            @for (p of adminPlaces(); track p.id) {
              <div class="place-row" (click)="editPlace(p)">
                <strong>{{ p.name }}</strong>
                <small>{{ p.address || '—' }}</small>
              </div>
            } @empty {
              <p class="empty">Орындар жоқ</p>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-layout { display:flex; flex-direction:column; height:100vh; font-family:-apple-system,sans-serif; }
    .admin-header { display:flex; align-items:center; justify-content:space-between; padding:12px 20px; background:#1565c0; color:#fff; }
    .admin-header h1 { margin:0; font-size:18px; }
    .header-actions { display:flex; gap:8px; }
    .admin-body { display:flex; flex:1; overflow:hidden; }
    .map-section { flex:1; display:flex; flex-direction:column; }
    .map-hint { margin:8px 12px; font-size:13px; color:#666; }
    .admin-map { flex:1; }
    .form-section { width:360px; overflow-y:auto; padding:16px; border-left:1px solid #e0e0e0; background:#fafafa; }
    .form-section h2 { margin:0 0 16px; font-size:16px; }
    label { display:block; font-size:13px; font-weight:600; color:#444; margin:10px 0 4px; }
    input, select { width:100%; padding:9px 12px; border:1px solid #ddd; border-radius:8px; font-size:14px; box-sizing:border-box; outline:none; }
    input:focus, select:focus { border-color:#1565c0; }
    .coords-row { display:flex; gap:8px; }
    .coords-row input { width:50%; }
    .form-actions { display:flex; gap:8px; margin-top:16px; }
    .btn-primary { flex:1; padding:10px; background:#1565c0; color:#fff; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; }
    .btn-danger { padding:10px 14px; background:#c62828; color:#fff; border:none; border-radius:8px; font-size:14px; cursor:pointer; }
    .btn-secondary { padding:10px 14px; background:#e0e0e0; color:#333; border:none; border-radius:8px; font-size:14px; cursor:pointer; }
    .success-msg { background:#e8f5e9; color:#2e7d32; border-radius:8px; padding:10px; margin-bottom:12px; font-size:13px; }
    .error-msg { background:#fce4e4; color:#c62828; border-radius:8px; padding:10px; margin-bottom:12px; font-size:13px; }
    hr { margin:20px 0; border:none; border-top:1px solid #e0e0e0; }
    h3 { margin:0 0 12px; font-size:14px; }
    .places-list { display:flex; flex-direction:column; gap:4px; }
    .place-row { padding:8px 10px; border-radius:8px; cursor:pointer; background:#fff; border:1px solid #e0e0e0; display:flex; flex-direction:column; }
    .place-row:hover { background:#e8f0fe; }
    .place-row strong { font-size:13px; }
    .place-row small { font-size:12px; color:#888; }
    .empty { color:#999; font-size:13px; }
    @media (max-width:700px) {
      .admin-body { flex-direction:column; }
      .form-section { width:100%; border-left:none; border-top:1px solid #e0e0e0; }
    }
  `],
})
export class AdminPanelComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  categories = signal<Category[]>([]);
  adminPlaces = signal<Place[]>([]);
  saving = signal(false);
  successMsg = signal('');
  errorMsg = signal('');
  editingId = signal<number | null>(null);

  form: PlacePayload & { categoryId?: number } = {
    name: '', lat: 0, lng: 0, address: '', phone: '', opening_hours: '', categoryId: undefined,
  };

  private map!: L.Map;
  private pinMarker: L.Marker | null = null;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.api.getCategories().subscribe(cats => this.categories.set(cats));
    this.loadAdminPlaces();
  }

  ngAfterViewInit() {
    this.map = L.map(this.mapEl.nativeElement).setView(ASTANA, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this.form.lat = +lat.toFixed(6);
      this.form.lng = +lng.toFixed(6);
      if (this.pinMarker) this.map.removeLayer(this.pinMarker);
      this.pinMarker = L.marker([lat, lng], { draggable: true }).addTo(this.map)
        .bindPopup('Жаңа орын').openPopup();
      this.pinMarker.on('dragend', (ev: any) => {
        const pos = ev.target.getLatLng();
        this.form.lat = +pos.lat.toFixed(6);
        this.form.lng = +pos.lng.toFixed(6);
      });
    });
  }

  private loadAdminPlaces() {
    this.api.getPlaces([71.0, 51.0, 72.0, 51.5]).subscribe(places => {
      this.adminPlaces.set(places.filter(p => p.source === 'admin'));
    });
  }

  save() {
    if (!this.form.name || !this.form.lat || !this.form.lng) {
      this.errorMsg.set('Атауы және координаттар міндетті');
      return;
    }
    this.saving.set(true);
    this.errorMsg.set('');
    const payload: PlacePayload = {
      name: this.form.name,
      lat: this.form.lat,
      lng: this.form.lng,
      address: this.form.address,
      phone: this.form.phone,
      opening_hours: this.form.opening_hours,
      categoryId: this.form.categoryId,
    };

    const req = this.editingId()
      ? this.api.updatePlace(this.editingId()!, payload)
      : this.api.createPlace(payload);

    req.subscribe({
      next: () => {
        this.successMsg.set(this.editingId() ? 'Орын жаңартылды!' : 'Орын қосылды!');
        this.saving.set(false);
        this.resetForm();
        this.loadAdminPlaces();
        setTimeout(() => this.successMsg.set(''), 3000);
      },
      error: (e) => {
        this.errorMsg.set(e.error?.message || 'Қате орын алды');
        this.saving.set(false);
      },
    });
  }

  editPlace(place: Place) {
    this.editingId.set(place.id);
    this.form = {
      name: place.name,
      lat: place.lat,
      lng: place.lng,
      address: place.address || '',
      phone: place.phone || '',
      opening_hours: place.opening_hours || '',
      categoryId: place.category?.id,
    };
    if (this.pinMarker) this.map.removeLayer(this.pinMarker);
    this.pinMarker = L.marker([place.lat, place.lng], { draggable: true }).addTo(this.map);
    this.map.flyTo([place.lat, place.lng], 15);
  }

  deletePlace() {
    if (!this.editingId() || !confirm('Жоямыз ба?')) return;
    this.api.deletePlace(this.editingId()!).subscribe({
      next: () => {
        this.successMsg.set('Орын жойылды');
        this.resetForm();
        this.loadAdminPlaces();
        setTimeout(() => this.successMsg.set(''), 3000);
      },
    });
  }

  resetForm() {
    this.editingId.set(null);
    this.form = { name: '', lat: 0, lng: 0, address: '', phone: '', opening_hours: '', categoryId: undefined };
    if (this.pinMarker) { this.map.removeLayer(this.pinMarker); this.pinMarker = null; }
  }

  goToMap() { this.router.navigate(['/']); }
  logout() { this.auth.logout(); this.router.navigate(['/admin/login']); }

  ngOnDestroy() { this.map?.remove(); }
}
