export interface Audio {
  id: string;
  latitud: number;
  longitud: number;
  decibeles: number;
  categoria: 'Persona' | 'Animal' | 'Auto'  ;
  tipo_ave?: string;
}