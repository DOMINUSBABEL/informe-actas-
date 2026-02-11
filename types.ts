export enum EstadoActa {
  PUBLICADA = 'Publicada',
  IMPRESA = 'Impresa',
  EN_REVISION = 'En revisión',
  BORRADOR = 'Borrador',
  ARCHIVADA = 'Archivada'
}

export enum Responsable {
  SECRETARIA = 'Secretaría',
  CONCEJAL = 'Concejal',
  MESA_DIRECTIVA = 'Mesa Directiva',
  SISTEMA = 'Sistema'
}

export enum Ubicación {
  OFICINA = 'Oficina Central',
  SISTEMA_SIMI = 'Sistema SIMI',
  DESPACHO = 'Despacho'
}

export interface Acta {
  id: string;
  numero: number;
  fechaSesion: string;
  periodo: number; // Año
  estado: EstadoActa | string;
  ubicacion: Ubicación | string;
  firmaPresidente: 'Pendiente' | 'Firmada' | null;
  responsableActual: Responsable | string;
  tieneObservaciones: boolean;
  observacionesTexto: string | null;
}

export interface DashboardStats {
  total: number;
  publicadas: number;
  pendientesFirma: number;
  pendientesObservaciones: number;
  sinClasificar: number;
}

export interface FilterState {
  periodo: number;
}