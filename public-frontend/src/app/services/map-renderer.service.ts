import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { Audio } from '../models/audio.model';
import { buildMarkerIcon } from '../components/noise-map/utils/marker-icons';
import { buildPopupTemplate } from '../components/noise-map/utils/popup-template';

type LeafletWithHeat = typeof L & {
  heatLayer?: (latlngs: [number, number, number][], options: HeatLayerOptions) => L.Layer;
};

interface HeatLayerOptions {
  minOpacity?: number;
  maxZoom?: number;
  max?: number;
  radius?: number;
  blur?: number;
  gradient?: Record<number, string>;
}

@Injectable({
  providedIn: 'root'
})
export class MapRendererService {

  buildHeatLayer(audios: Audio[]): L.Layer {
    const puntos = audios.map(a => [
      a.latitud,
      a.longitud,
      a.decibels / 100
    ] as [number, number, number]);

    const leafletWithHeat = (globalThis as typeof globalThis & { L?: LeafletWithHeat }).L;
    const importedLeafletWithHeat = L as LeafletWithHeat;
    const heatLayer = leafletWithHeat?.heatLayer ?? importedLeafletWithHeat.heatLayer;

    if (!heatLayer) {
      return this.buildHeatFallbackLayer(audios);
    }

    return heatLayer(puntos, {
      radius: 30,
      blur: 30,
      maxZoom: 17,
      gradient: {
        0.2: '#10b981',
        0.5: '#f59e0b',
        0.8: '#ef4444'
      }
    });
  }

  private buildHeatFallbackLayer(audios: Audio[]): L.LayerGroup {
    const grupo = L.layerGroup();

    audios.forEach(audio => {
      const intensidad = Math.max(0.2, Math.min(audio.decibels / 100, 1));
      const color = this.getHeatColor(intensidad);

      L.circleMarker([audio.latitud, audio.longitud], {
        radius: 18 + intensidad * 18,
        stroke: false,
        fill: true,
        fillColor: color,
        fillOpacity: 0.28
      }).addTo(grupo);
    });

    return grupo;
  }

  private getHeatColor(intensidad: number): string {
    if (intensidad >= 0.8) return '#ef4444';
    if (intensidad >= 0.5) return '#f59e0b';
    return '#10b981';
  }

  buildPinesLayer(audios: Audio[]): L.LayerGroup {
    const grupo = L.layerGroup();

    audios.forEach(audio => {
      const icono = buildMarkerIcon();
      const popup = buildPopupTemplate(audio);

      L.marker([audio.latitud, audio.longitud], { icon: icono })
        .bindPopup(popup)
        .addTo(grupo);
    });

    return grupo;
  }
}
