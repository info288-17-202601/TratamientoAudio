export interface Audio {
  id: string;
  latitud: number;
  longitud: number;
  decibels: number;
  categoria: string;
  tipo_ave?: string;
  audioStreamUrl: string;
  duration?: number;
  weather?: string;
  createdAt?: string;
}
