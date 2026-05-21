import { Injectable } from '@angular/core';
import { Audio } from '../models/audio.model';

@Injectable({
  providedIn: 'root'
})
export class AudioService {

  private audiosFicticios: Audio[] = [
    {
      id: 'audio-001',
      latitud: -39.833383,
      longitud: -73.243881,
      decibeles: 75.2,
      categoria: 'Persona'
    },
    {
      id: 'audio-002',
      latitud: -39.832366,
      longitud: -73.243881,
      decibeles: 35.5,
      categoria: 'Animal',
      tipo_ave: 'Chucao'
    },
    {
      id: 'audio-003',
      latitud: -39.8322212,
      longitud: -73.252375,
      decibeles: 65.8,
      categoria: 'Auto'
    }
  ];

  constructor() { }

  getAudios(): Audio[] {
    return this.audiosFicticios;
  }
}