import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  AfterViewInit,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { Audio } from '../../models/audio.model';

type LeafletWithHeat = typeof L & {
  heatLayer?: (pts: [number, number, number][], opts: object) => L.Layer;
};

@Component({
  selector: 'app-audio-map-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audio-map-modal.html',
  styleUrl: './audio-map-modal.css',
})
export class AudioMapModalComponent implements AfterViewInit, OnDestroy {
  @Input() audio!: Audio;
  @Output() closed = new EventEmitter<void>();
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private map?: L.Map;

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 80);
  }

  private initMap(): void {
    const el = this.mapContainer?.nativeElement;
    if (!el) return;

    this.map = L.map(el, {
      zoom: 18,
      center: L.latLng(this.audio.latitud, this.audio.longitud),
      zoomControl: true,
      minZoom: 13,
      maxZoom: 19,
      maxBounds: L.latLngBounds(L.latLng(-85, -180), L.latLng(85, 180)),
      maxBoundsViscosity: 1.0,
    });

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, noWrap: true, attribution: 'Tiles &copy; Esri' }
    ).addTo(this.map);

    const intensity = Math.max(0.3, Math.min((this.audio.decibels || 0) / 100, 1));
    const gL = (globalThis as unknown as { L?: LeafletWithHeat }).L;
    const heatFn = gL?.heatLayer ?? (L as LeafletWithHeat).heatLayer;
    if (heatFn) {
      heatFn(
        [[this.audio.latitud, this.audio.longitud, intensity]],
        { radius: 40, blur: 30, maxZoom: 18, gradient: { 0.2: '#10b981', 0.5: '#f59e0b', 0.8: '#ef4444' } }
      ).addTo(this.map);
    }

    const icon = L.divIcon({
      className: '',
      html: `<div style="width:14px;height:14px;border-radius:50%;background:#8d61bd;border:2.5px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.45)"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
      popupAnchor: [0, -10],
    });

    L.marker([this.audio.latitud, this.audio.longitud], { icon })
      .addTo(this.map);

    this.map.invalidateSize();
  }

  close(): void {
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.close();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
