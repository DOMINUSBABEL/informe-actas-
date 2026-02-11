import { Acta, EstadoActa, Responsable, Ubicación, DashboardStats } from '../types';
import * as XLSX from 'xlsx';

// --- MOCK DATA GENERATION ---
const generateMockData = (): Acta[] => {
  const data: Acta[] = [];
  const currentYear = new Date().getFullYear();

  const createActa = (id: number, periodo: number, overrides: Partial<Acta>): Acta => ({
    id: `ACT-${periodo}-${id.toString().padStart(3, '0')}`,
    numero: id,
    fechaSesion: `${periodo}-0${Math.floor(Math.random() * 9) + 1}-${Math.floor(Math.random() * 28) + 1}`,
    periodo,
    estado: EstadoActa.BORRADOR,
    ubicacion: Ubicación.OFICINA,
    firmaPresidente: null,
    responsableActual: Responsable.SECRETARIA,
    tieneObservaciones: false,
    observacionesTexto: null,
    ...overrides
  });

  // Mock data logic remains the same for testing without files
  for (let i = 1; i <= 15; i++) {
    data.push(createActa(i, currentYear, { estado: EstadoActa.PUBLICADA, ubicacion: Ubicación.SISTEMA_SIMI, firmaPresidente: 'Firmada' }));
  }
  for (let i = 16; i <= 23; i++) {
    data.push(createActa(i, currentYear, { estado: EstadoActa.IMPRESA, firmaPresidente: 'Pendiente', observacionesTexto: null, tieneObservaciones: false, ubicacion: Ubicación.DESPACHO }));
  }
  for (let i = 24; i <= 30; i++) {
    const subtype = i % 3;
    if (subtype === 0) data.push(createActa(i, currentYear, { estado: EstadoActa.EN_REVISION, responsableActual: Responsable.CONCEJAL }));
    else if (subtype === 1) data.push(createActa(i, currentYear, { responsableActual: Responsable.CONCEJAL, tieneObservaciones: true }));
    else data.push(createActa(i, currentYear, { tieneObservaciones: true, observacionesTexto: "Corregir asistencia" }));
  }
  data.push(createActa(99, currentYear, { estado: EstadoActa.BORRADOR, firmaPresidente: null, tieneObservaciones: false, responsableActual: Responsable.SECRETARIA }));
  for (let i = 1; i <= 50; i++) {
    data.push(createActa(i, currentYear - 1, { estado: EstadoActa.PUBLICADA, ubicacion: Ubicación.SISTEMA_SIMI }));
  }
  return data;
};

const allActas = generateMockData();

// --- PUBLIC API ---

export const getActasByPeriod = (periodo: number): Acta[] => {
  return allActas.filter(a => a.periodo === periodo);
};

// --- PARSING UTILITIES ---

// Helper to normalize keys to lowercase and remove accents/spaces for flexible matching
const normalizeKey = (key: string) => key.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Helper to find value using synonyms
const findValue = (row: any, keys: string[]): any => {
  const rowKeys = Object.keys(row);
  for (const k of keys) {
    const foundKey = rowKeys.find(rk => normalizeKey(rk) === k);
    if (foundKey) return row[foundKey];
  }
  return undefined;
};

const mapRowToActa = (row: any, index: number): Acta => {
  // 1. Extract raw values using Excel headers found in the images
  const rawActa = findValue(row, ['acta', 'numero', 'no', 'n', 'id']);
  const rawFecha = findValue(row, ['fecha', 'fechasesion', 'fecha_sesion', 'dia']);
  const rawTema = findValue(row, ['tema', 'asunto']);
  const rawResp = findValue(row, ['responsable', 'responsableactual', 'encargado']);
  
  // Status Columns logic
  const colFirma = findValue(row, ['firma', 'firmado', 'firmapresidente']);
  const colImpresa = findValue(row, ['impresa', 'impreso']);
  const colSimi = findValue(row, ['simi', 'sistemasiim', 'sistema']);
  
  // Observations
  const colCorrecciones = findValue(row, ['correcciones', 'observaciones', 'observacionestexto', 'tieneobservaciones']);

  // 2. Normalize Year/Periodo and Date
  let periodo: number = new Date().getFullYear();
  let fechaSesion = '';
  
  if (rawFecha) {
    // Handle Excel Date Serial Number
    if (typeof rawFecha === 'number' && rawFecha > 20000) {
      const dateObj = new Date(Math.round((rawFecha - 25569) * 86400 * 1000));
      if (!isNaN(dateObj.getTime())) {
        periodo = dateObj.getFullYear();
        fechaSesion = dateObj.toISOString().split('T')[0];
      }
    } else if (typeof rawFecha === 'string') {
      // Try parsing "11/02/2025" or "2025-02-11"
      const parts = rawFecha.split(/[\/\-]/);
      if (parts.length === 3) {
        // Assume DD/MM/YYYY if first part > 1900 is last
        if (parts[2].length === 4) {
          periodo = parseInt(parts[2]);
          fechaSesion = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
        } else if (parts[0].length === 4) {
           // YYYY-MM-DD
           periodo = parseInt(parts[0]);
           fechaSesion = rawFecha;
        }
      }
    }
  }

  // Fallback to current year if parsing failed but we have numeric Periodo column
  if (!periodo) {
     const rawPeriodoCol = findValue(row, ['periodo', 'vigencia', 'ano']);
     if (rawPeriodoCol) periodo = parseInt(rawPeriodoCol) || new Date().getFullYear();
  }

  // 3. Normalize Status Logic based on columns Simi/Impresa/Firma
  const isSimiOk = String(colSimi || '').toLowerCase().includes('ok') || String(colSimi || '').toLowerCase().includes('si');
  const isImpresaOk = String(colImpresa || '').toLowerCase().includes('ok') || String(colImpresa || '').toLowerCase().includes('si');
  const isFirmaOk = String(colFirma || '').toLowerCase().includes('ok') || String(colFirma || '').toLowerCase().includes('si');
  
  const rawCorrecciones = colCorrecciones ? String(colCorrecciones).trim() : '';
  const tieneCorrecciones = rawCorrecciones.length > 0 && rawCorrecciones.toLowerCase() !== 'ok' && rawCorrecciones.toLowerCase() !== 'no';

  let estado = EstadoActa.BORRADOR;
  let ubicacion = Ubicación.OFICINA;
  
  if (isSimiOk) {
    estado = EstadoActa.PUBLICADA;
    ubicacion = Ubicación.SISTEMA_SIMI;
  } else if (isImpresaOk) {
    estado = EstadoActa.IMPRESA;
    ubicacion = Ubicación.DESPACHO;
  } else if (tieneCorrecciones) {
    estado = EstadoActa.EN_REVISION;
  }

  // 4. Construct Acta
  const numero = parseInt(rawActa) || 0;
  
  // Custom logic: if corrections say "Impresa sin firma", force Impresa state even if colImpresa is empty
  if (rawCorrecciones.toLowerCase().includes('impresa') && estado !== EstadoActa.PUBLICADA) {
      estado = EstadoActa.IMPRESA;
  }

  return {
    id: rawActa ? `ACT-${periodo}-${rawActa}` : `ROW-${index}`,
    numero: numero,
    fechaSesion: fechaSesion || 'Fecha desconocida',
    periodo,
    estado: estado,
    ubicacion: ubicacion,
    firmaPresidente: isFirmaOk ? 'Firmada' : 'Pendiente',
    responsableActual: rawResp ? String(rawResp) : Responsable.SECRETARIA,
    tieneObservaciones: tieneCorrecciones,
    observacionesTexto: rawCorrecciones || null
  };
};

export const parseActasCSV = (csvContent: string): Acta[] => {
  // Robust CSV splitting using regex to handle quoted fields containing commas
  // e.g. "Doe, John",2024
  const lines = csvContent.split(/\r\n|\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  
  // Helper to split a CSV line respecting quotes
  const splitCSVLine = (line: string): string[] => {
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    if (!matches) return line.split(',');
    return matches.map(m => m.replace(/^"|"$/g, '').trim()); // Remove quotes
  };

  return lines.slice(1).map((line, idx) => {
    const values = splitCSVLine(line);
    const row: any = {};
    headers.forEach((h, i) => {
      row[h] = values[i];
    });
    return mapRowToActa(row, idx);
  });
};

export const parseActasXLSX = (arrayBuffer: ArrayBuffer): Acta[] => {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const jsonData = XLSX.utils.sheet_to_json(sheet);
  
  return jsonData.map((row: any, idx: number) => mapRowToActa(row, idx));
};

export const calculateStats = (actas: Acta[]): DashboardStats => {
  let publicadas = 0;
  let pendientesFirma = 0;
  let pendientesObservaciones = 0;
  const classifiedIds = new Set<string>();

  actas.forEach(acta => {
    let isClassified = false;
    const estadoNorm = acta.estado.toLowerCase();
    const ubicacionNorm = acta.ubicacion.toLowerCase();

    // 1. Finalizadas (SIMI)
    if (estadoNorm === 'publicada' || ubicacionNorm.includes('simi')) {
      publicadas++;
      isClassified = true;
    } 
    // 2. Pendientes Firma (Impresa, Firma Pendiente, SIN observaciones criticas)
    else if (
      estadoNorm === 'impresa' &&
      acta.firmaPresidente === 'Pendiente' &&
      !acta.tieneObservaciones
    ) {
      pendientesFirma++;
      isClassified = true;
    }
    // 3. En Trámite (Cualquier cosa con observaciones o en revision)
    else if (
      estadoNorm.includes('revis') ||
      acta.tieneObservaciones
    ) {
      pendientesObservaciones++;
      isClassified = true;
    }

    if (isClassified) classifiedIds.add(acta.id);
  });

  const total = actas.length;
  const sumBuckets = publicadas + pendientesFirma + pendientesObservaciones;
  return {
    total,
    publicadas,
    pendientesFirma,
    pendientesObservaciones,
    sinClasificar: total - sumBuckets
  };
};