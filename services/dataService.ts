import { Acta, EstadoActa, Responsable, Ubicación, DashboardStats } from '../types';
import * as XLSX from 'xlsx';

// --- MOCK DATA GENERATION (BASED ON PDF OCR) ---
const generateMockData = (): Acta[] => {
  // Datos extraídos del PDF proporcionado (Año 2025)
  const rawData = [
    { id: 193, fecha: '2025-02-11', estado: EstadoActa.IMPRESA, firma: 'Pendiente', obs: 'Impresa sin firma. Hoja de control no coincide y sin firma. Cuando esté firmada, reemplazar la que está en SIMI.' },
    { id: 194, fecha: '2025-02-12', estado: EstadoActa.IMPRESA, firma: 'Pendiente', obs: 'Impresa sin firma. Hoja de control sin firma y no coincide orden.' },
    { id: 195, fecha: '2025-02-13', estado: EstadoActa.IMPRESA, firma: 'Pendiente', obs: 'Impresa sin firma. Hoja de control sin firma.' },
    { id: 196, fecha: '2025-02-14', estado: EstadoActa.IMPRESA, firma: 'Pendiente', obs: 'Impresa sin firma. Hoja de control no coincide y sin firma.' },
    { id: 197, fecha: '2025-02-17', estado: EstadoActa.IMPRESA, firma: 'Pendiente', obs: 'Impresa sin firma. Hoja de control sin firma.' },
    { id: 198, fecha: '2025-02-18', estado: EstadoActa.IMPRESA, firma: 'Pendiente', obs: 'Impresa sin firma. Hoja de control sin firma.' },
    { id: 199, fecha: '2025-02-19', estado: EstadoActa.IMPRESA, firma: 'Pendiente', obs: 'Impresa sin firma. Hoja de control sin firma.' },
    { id: 200, fecha: '2025-02-20', estado: EstadoActa.EN_REVISION, firma: 'Pendiente', obs: 'Falta en los anexos memorando de convocatoria. Repetir foliación porque tiene tachones.' },
    { id: 201, fecha: '2025-02-21', estado: EstadoActa.IMPRESA, firma: 'Pendiente', obs: 'Impresa sin firma. Cambiar a carpeta blanca. Repetir foliación.' },
    { id: 202, fecha: '2025-02-24', estado: EstadoActa.IMPRESA, firma: 'Pendiente', obs: 'Impresa sin firma. Hoja de Control sin firma.' },
    { id: 203, fecha: '2025-02-25', estado: EstadoActa.EN_REVISION, firma: 'Pendiente', obs: 'Falta anexo de memorando convocatoria. Hoja de Control sin firma.' },
    { id: 204, fecha: '2025-02-26', estado: EstadoActa.IMPRESA, firma: 'Pendiente', obs: 'Impresa sin firma. Hoja de Control sin firma.' },
    { id: 205, fecha: '2025-02-27', estado: EstadoActa.IMPRESA, firma: 'Pendiente', obs: 'Impresa sin firma. Guardar en carpeta blanca.' },
    { id: 206, fecha: '2025-03-01', estado: EstadoActa.PUBLICADA, firma: 'Firmada', obs: 'Hoja de control sin firma.' }, // Adoptada acta 206
    { id: 207, fecha: '2025-03-03', estado: EstadoActa.PUBLICADA, firma: 'Firmada', obs: 'Hoja de control sin firma. Guardar en carpeta blanca.' },
    { id: 208, fecha: '2025-03-04', estado: EstadoActa.EN_REVISION, firma: 'Pendiente', obs: 'En los anexos falta memorando de convocatoria. Corregir acta.' },
    { id: 211, fecha: '2025-03-07', estado: EstadoActa.EN_REVISION, firma: 'Pendiente', obs: 'Repetir foliación pasa de 47 a 38. Repetir y firmar hoja de control.' },
    { id: 213, fecha: '2025-03-10', estado: EstadoActa.EN_REVISION, firma: 'Pendiente', obs: 'PERDIDA. Está correctamente subida a SIMI sin firma.' },
    { id: 214, fecha: '2025-03-11', estado: EstadoActa.IMPRESA, firma: 'Pendiente', obs: 'Hoja de control sin firmar. Cambiar a carpeta blanca.' },
    { id: 232, fecha: '2025-04-07', estado: EstadoActa.EN_REVISION, firma: 'Pendiente', obs: 'Sin subir en SIMI. Hoja de control sin firmar.' },
    { id: 239, fecha: '2025-04-23', estado: EstadoActa.EN_REVISION, firma: 'Pendiente', obs: 'Está subida en SIMI el acta 233, el cambio hay que hacerlo. Mal impreso.' },
    { id: 252, fecha: '2025-05-08', estado: EstadoActa.EN_REVISION, firma: 'Pendiente', obs: 'Archivo en SIMI tiene las firmas erradas, volver a subir. Hoja de control sin firmar.' },
    { id: 269, fecha: '2025-06-24', estado: EstadoActa.EN_REVISION, firma: 'Pendiente', obs: 'Se devuelve para revisión. Imprimir hoja de control.' },
    { id: 270, 'fecha': '2025-06-25', estado: EstadoActa.IMPRESA, firma: 'Pendiente', obs: 'Impresa sin firma. Cambiar a carpeta blanca.' },
    { id: 272, fecha: '2025-06-27', estado: EstadoActa.IMPRESA, firma: 'Pendiente', obs: 'Revisar índice antes de imprimir. Cambiar a carpeta blanca.' },
    { id: 281, fecha: '2025-07-14', estado: EstadoActa.BORRADOR, firma: 'Pendiente', obs: 'No está en F. Sin información.' },
    { id: 282, fecha: '2025-07-15', estado: EstadoActa.EN_REVISION, firma: 'Pendiente', obs: 'PERDIDA, Mariam la encontró después de la 249.' },
    { id: 323, fecha: '2025-10-07', estado: EstadoActa.PUBLICADA, firma: 'Firmada', obs: null },
    { id: 334, fecha: '2025-10-22', estado: EstadoActa.PUBLICADA, firma: 'Firmada', obs: 'Falta firma original en acta 328.' },
    { id: 350, fecha: '2025-11-11', estado: EstadoActa.IMPRESA, firma: 'Pendiente', obs: 'Imprimir hoja de control. Carpeta blanca.' },
    { id: 370, fecha: '2025-12-02', estado: EstadoActa.PUBLICADA, firma: 'Firmada', obs: 'Verificar índice antes de imprimir.' },
    { id: 382, fecha: '2025-12-17', estado: EstadoActa.PUBLICADA, firma: 'Firmada', obs: null },
  ];

  return rawData.map(d => ({
    id: `ACT-2025-${d.id}`,
    numero: d.id,
    fechaSesion: d.fecha,
    periodo: 2025,
    estado: d.estado,
    ubicacion: d.estado === EstadoActa.PUBLICADA ? Ubicación.SISTEMA_SIMI : Ubicación.OFICINA,
    firmaPresidente: d.firma as 'Pendiente' | 'Firmada' | null,
    responsableActual: Responsable.SECRETARIA,
    tieneObservaciones: !!d.obs,
    observacionesTexto: d.obs || null
  }));
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