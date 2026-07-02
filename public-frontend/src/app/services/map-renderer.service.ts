import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { Audio } from '../models/audio.model';
import { buildMarkerIcon } from '../components/noise-map/utils/marker-icons';
import { buildPopupTemplate, wirePopupPlayer } from '../components/noise-map/utils/popup-template';

@Injectable({
  providedIn: 'root'
})
export class MapRendererService {

  // Mancha de calor geográfica: L.circle usa metros reales, por lo que
  // queda anclada al territorio en todos los niveles de zoom.
  // Cada muestra pinta anillos concéntricos: el centro lleva el color del
  // dB medido con más opacidad, y la intensidad decae hacia el borde.
  buildHeatLayer(audios: Audio[]): L.Layer {
    const grupo = L.layerGroup();

    audios.forEach(audio => {
      const intensidad = Math.max(0, Math.min((audio.decibels ?? 0) / 100, 1));
      const color = this.getHeatColor(intensidad);
      // Radio en metros según lo fuerte del sonido: 18 m (silencio) a 48 m (muy fuerte)
      const radioMetros = 18 + intensidad * 30;

      const anillos = [
        { radio: radioMetros,        opacidad: 0.15 },
        { radio: radioMetros * 0.66, opacidad: 0.28 },
        { radio: radioMetros * 0.38, opacidad: 0.45 },
      ];

      anillos.forEach(({ radio, opacidad }) => {
        L.circle([audio.latitud, audio.longitud], {
          radius: radio,
          stroke: false,
          fill: true,
          fillColor: color,
          fillOpacity: opacidad,
          interactive: false,
        }).addTo(grupo);
      });
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

      const marker = L.marker([audio.latitud, audio.longitud], { icon: icono })
        .bindPopup(popup);

      // El popup es HTML plano (fuera de Angular): cablear el player al abrir
      // y pausar/liberar el audio al cerrar.
      let limpiarPlayer: (() => void) | null = null;
      marker.on('popupopen', (e: L.PopupEvent) => {
        limpiarPlayer = wirePopupPlayer(e.popup.getElement() ?? null);
      });
      marker.on('popupclose', () => {
        limpiarPlayer?.();
        limpiarPlayer = null;
      });

      marker.addTo(grupo);
    });

    return grupo;
  }
}
