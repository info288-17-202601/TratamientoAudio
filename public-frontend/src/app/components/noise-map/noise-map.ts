import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeafletModule } from '@bluehalo/ngx-leaflet';
import * as L from 'leaflet';
import 'leaflet.heat';
import { AudioService } from '../../services/audio.service';
import { Audio } from '../../models/audio.model';

@Component({
  selector: 'app-noise-map',
  standalone: true,
  imports: [CommonModule, LeafletModule],
  templateUrl: './noise-map.html',
  styleUrls: []
})

export class NoiseMapComponent implements OnInit {
  mapOptions!: L.MapOptions;
  private map!: L.Map;

  private capaPines = L.layerGroup();
  private capaCalor: any;
  private audioService = inject(AudioService);
  private pinesPrueba: Audio[] = [];

  @Input() set capaActiva(valor: boolean) {
    this._capaActiva = valor;
    this.aplicarFiltroRuido();
  }
  get capaActiva(): boolean {
    return this._capaActiva;
  }
  private _capaActiva: boolean = true;

  ngOnInit() {
    this.mapOptions = {
      layers: [
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19,
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri'
        })
      ],
      zoom: 17,
      center: L.latLng(-39.832122, -73.252371)
    };
  }

  //inicializar el mapa
  onMapReady(map: L.Map) {
    this.map = map;
    this.capaPines.addTo(this.map);

    this.pinesPrueba = this.audioService.getAudios();
    this.inicializarMapaDeCalor();    

    this.map.invalidateSize();
    this.dibujarPines();
    this.aplicarFiltroRuido();

    setTimeout(() => this.map.invalidateSize(), 150);
  }

  private inicializarMapaDeCalor() {
    const puntosDeCalor = this.pinesPrueba.map(audio => {
      const intensidad = audio.decibeles / 100; 
      return [audio.latitud, audio.longitud, intensidad] as [number, number, number];
    });

    this.capaCalor = L.heatLayer(puntosDeCalor, {
      radius: 40,
      blur: 25,
      maxZoom: 17,
      gradient: {
        0.2: '#10b981',
        0.5: '#f59e0b',
        0.8: '#ef4444'
      }
    });
  }
  //función que dibuja los pines
  private dibujarPines() {
    this.capaPines.clearLayers();

    this.pinesPrueba.forEach(audio => {
      
      let colorBg = 'bg-red-400'; 
      let borderColors = 'border-t-red-400';
      let rutaImagen = 'persona.png';
      
      if (audio.categoria === 'Auto') {
        rutaImagen = 'auto.png';
      } else if (audio.categoria === 'Animal') {
        rutaImagen = 'pajaro.png';
      }

      const iconoBurbuja = L.divIcon({
        html: `
          <div class="flex flex-col items-center justify-center animate-fade-in" style="width: 40px; height: 50px;">
            
            <div class="${colorBg} w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-md z-10">
              <img src="${rutaImagen}" 
                   alt="${audio.categoria}" 
                   class="w-5 h-5 object-contain">
            </div>
            
            <div class="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[12px] ${borderColors} -mt-[2px] shadow-sm"></div>
            
          </div>
        `,
        className: '', 
        iconSize: [40, 40],
        iconAnchor: [20, 36]
      });

      const marcador = L.marker([audio.latitud, audio.longitud], {
        icon: iconoBurbuja
      });

      // Popup
      let badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
      if (audio.categoria === 'Auto') badgeColor = 'bg-red-100 text-red-800 border-red-200';
      if (audio.categoria === 'Animal') badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';

      const popupContenido = `
        <div class="p-4 bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200/80 font-sans min-w-[190px]">
          
          <div class="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
            <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Muestra Registrada</span>
            <span class="text-xs bg-slate-100 px-2 py-0.5 rounded-md font-mono text-slate-600 font-semibold">#${audio.id}</span>
          </div>

          <div class="mb-3">
            <span class="text-xs text-slate-400 block mb-0.5">Intensidad Acústica</span>
            <div class="flex items-baseline space-x-1">
              <span class="text-2xl font-black tracking-tight text-slate-900">${audio.decibeles}</span>
              <span class="text-xs font-bold text-slate-400">dB</span>
            </div>
          </div>

          <div class="space-y-2 pt-1">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-500 font-medium">Origen:</span>
              <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeColor}">
                ${audio.categoria}
              </span>
            </div>
            
            ${audio.tipo_ave ? `
              <div class="flex items-center justify-between text-xs bg-emerald-50 border border-emerald-200 p-2 rounded-xl mt-1">
                <span class="text-emerald-700 font-semibold">🐦 Especie:</span>
                <span class="text-emerald-800 font-extrabold italic">${audio.tipo_ave}</span>
              </div>
            ` : ''}
          </div>

        </div>
      `;
      marcador.bindPopup(popupContenido);
      this.capaPines.addLayer(marcador);
    });

  }

private aplicarFiltroRuido() {
  if (!this.map || !this.capaCalor) return;

  if (this.capaActiva) {
    // Activado: mostrar calor Y pines
    if (!this.map.hasLayer(this.capaCalor)) this.map.addLayer(this.capaCalor);
    if (!this.map.hasLayer(this.capaPines)) this.map.addLayer(this.capaPines);
  } else {
    if (this.map.hasLayer(this.capaCalor)) this.map.removeLayer(this.capaCalor);
    if (!this.map.hasLayer(this.capaPines)) this.map.addLayer(this.capaPines);
  }
}
}