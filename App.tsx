import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CheckCircle2, 
  FileSignature, 
  Search, 
  BarChart3, 
  CalendarDays,
  RefreshCcw,
  LayoutDashboard,
  Upload,
  XCircle,
  FileSpreadsheet,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

import { getActasByPeriod, calculateStats, parseActasCSV, parseActasXLSX } from './services/dataService';
import { DashboardStats, Acta } from './types';
import StatCard from './components/StatCard';
import ValidationAlert from './components/ValidationAlert';

const currentYear = new Date().getFullYear();
const ITEMS_PER_PAGE = 10;

const App: React.FC = () => {
  // Global Data State
  const [periodo, setPeriodo] = useState<number>(currentYear);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadedData, setUploadedData] = useState<Acta[] | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear, currentYear - 1]);

  // UI/Navigation State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<string>('ALL'); // ALL, ERROR, PENDING

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Base Data Source (Filtered by Year)
  const actasBase = useMemo(() => {
    let sourceData: Acta[];
    if (uploadedData) {
      sourceData = uploadedData;
    } else {
      sourceData = getActasByPeriod(periodo);
    }
    return sourceData.filter(a => a.periodo === periodo);
  }, [periodo, uploadedData]);

  // 2. Filtered Data (Search & Status)
  const filteredActas = useMemo(() => {
    return actasBase.filter(acta => {
      // Text Search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        acta.numero.toString().includes(searchLower) ||
        acta.estado.toLowerCase().includes(searchLower) ||
        acta.responsableActual.toLowerCase().includes(searchLower) ||
        (acta.observacionesTexto && acta.observacionesTexto.toLowerCase().includes(searchLower));

      // Status Filter
      let matchesStatus = true;
      if (statusFilter === 'OBSERVATION') {
        matchesStatus = acta.tieneObservaciones;
      } else if (statusFilter === 'PENDING_SIGN') {
        matchesStatus = acta.firmaPresidente === 'Pendiente' && acta.estado === 'Impresa';
      }

      return matchesSearch && matchesStatus;
    });
  }, [actasBase, searchTerm, statusFilter]);

  // 3. Paginated Data
  const paginatedActas = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredActas.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredActas, currentPage]);

  const totalPages = Math.ceil(filteredActas.length / ITEMS_PER_PAGE);

  // Update Stats & Reset Page on Data Change
  const refreshData = () => {
    setLoading(true);
    const delay = uploadedData ? 150 : 600;
    
    setTimeout(() => {
      const computedStats = calculateStats(actasBase);
      setStats(computedStats);
      setLastUpdated(new Date());
      setLoading(false);
    }, delay);
  };

  useEffect(() => {
    refreshData();
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actasBase]);

  useEffect(() => {
    setCurrentPage(1); // Reset page when filters change
  }, [searchTerm, statusFilter]);

  // Logic to update available years
  useEffect(() => {
    if (uploadedData && uploadedData.length > 0) {
      const years = Array.from(new Set(uploadedData.map(a => a.periodo))).sort((a, b) => (b as number) - (a as number));
      setAvailableYears(years);
      if (years.length > 0) setPeriodo(years[0]);
    } else if (uploadedData === null) {
      setAvailableYears([currentYear, currentYear - 1]);
      setPeriodo(currentYear);
    }
  }, [uploadedData]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const fileName = file.name.toLowerCase();
    
    try {
      const reader = new FileReader();
      const onLoad = (parsed: Acta[]) => {
        setUploadedData(parsed);
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };

      if (fileName.endsWith('.csv')) {
        reader.onload = (e) => onLoad(parseActasCSV(e.target?.result as string));
        reader.readAsText(file);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        reader.onload = (e) => onLoad(parseActasXLSX(e.target?.result as ArrayBuffer));
        reader.readAsArrayBuffer(file);
      } else {
        alert("Formato no soportado.");
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      alert("Error al procesar el archivo.");
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    // Generate CSV content from filteredActas
    const headers = ['Acta', 'Fecha', 'Estado', 'Ubicacion', 'Responsable', 'Firma', 'Tiene_Observaciones', 'Detalle_Observaciones'];
    const rows = filteredActas.map(a => [
      a.numero,
      a.fechaSesion,
      a.estado,
      a.ubicacion,
      a.responsableActual,
      a.firmaPresidente || 'N/A',
      a.tieneObservaciones ? 'SI' : 'NO',
      `"${(a.observacionesTexto || '').replace(/"/g, '""')}"` // Escape quotes
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_actas_${periodo}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!stats) return null;

  const chartData = [
    { name: 'Publicadas', value: stats.publicadas, color: '#10b981' }, 
    { name: 'Firma Pendiente', value: stats.pendientesFirma, color: '#f59e0b' },
    { name: 'En Observación', value: stats.pendientesObservaciones, color: '#6366f1' },
    { name: 'Sin Clasificar', value: stats.sinClasificar, color: '#ef4444' },
  ].filter(item => item.value > 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12">
      <input type="file" accept=".csv, .xlsx, .xls" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <LayoutDashboard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 leading-tight">Tablero de Actas</h1>
                <p className="text-xs text-slate-500 font-medium">Gestión Documental • Sesión 1:30 PM</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md text-sm text-slate-600">
                <CalendarDays className="h-4 w-4" />
                <select 
                  value={periodo}
                  onChange={(e) => setPeriodo(Number(e.target.value))}
                  className="bg-transparent border-none focus:ring-0 text-slate-800 font-semibold cursor-pointer outline-none"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

              {uploadedData ? (
                 <button onClick={() => setUploadedData(null)} className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition-colors">
                   <XCircle className="h-4 w-4" /> Restaurar
                 </button>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md text-sm font-medium hover:bg-indigo-100 transition-colors">
                  <Upload className="h-4 w-4" /> <span className="hidden sm:inline">Importar</span>
                </button>
              )}
              
              <button onClick={refreshData} disabled={loading} className={`p-2 rounded-full hover:bg-slate-100 transition-colors ${loading ? 'animate-spin' : ''}`}>
                <RefreshCcw className="h-5 w-5 text-slate-500" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <ValidationAlert unclassifiedCount={stats.sinClasificar} />

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
           {/* Summary Card */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-1">Total Periodo</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900">{stats.total}</span>
                <span className="text-sm text-slate-500 font-medium">Actas</span>
              </div>
              {uploadedData && (
                <div className="mt-3 inline-flex self-start items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded">
                  <FileSpreadsheet className="h-3 w-3" /> Externo
                </div>
              )}
           </div>

           <StatCard title="Publicadas" count={stats.publicadas} total={stats.total} icon={CheckCircle2} colorClass="text-emerald-600" bgClass="bg-emerald-50" description="En sistema SIMI" onClick={() => setStatusFilter('ALL')} />
           <StatCard title="Firma Pendiente" count={stats.pendientesFirma} total={stats.total} icon={FileSignature} colorClass="text-amber-600" bgClass="bg-amber-50" description="Impresas físicas" onClick={() => setStatusFilter('PENDING_SIGN')} />
           <StatCard title="Observaciones" count={stats.pendientesObservaciones} total={stats.total} icon={Search} colorClass="text-indigo-600" bgClass="bg-indigo-50" description="Requieren revisión" onClick={() => setStatusFilter('OBSERVATION')} />
        </div>

        {/* Chart + Table Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-1 h-fit">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
              <BarChart3 className="h-5 w-5 text-slate-400" /> Distribución
            </h3>
            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip itemStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <span className="block text-3xl font-bold text-slate-800">{stats.total}</span>
                  <span className="block text-xs text-slate-400 uppercase">Total</span>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Data Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 lg:col-span-2 flex flex-col">
            
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar acta, responsable o estado..." 
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {/* Quick Filters */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${statusFilter === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Todos
                  </button>
                  <button 
                    onClick={() => setStatusFilter('OBSERVATION')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${statusFilter === 'OBSERVATION' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Obs
                  </button>
                  <button 
                    onClick={() => setStatusFilter('PENDING_SIGN')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${statusFilter === 'PENDING_SIGN' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Firma
                  </button>
                </div>
              </div>

              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
              >
                <Download className="h-4 w-4" /> Exportar
              </button>
            </div>
            
            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 w-20">Acta</th>
                    <th className="px-4 py-3 w-32">Fecha</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Responsable</th>
                    <th className="px-4 py-3">Firma</th>
                    <th className="px-4 py-3 text-right">Observación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedActas.map((acta, idx) => (
                    <tr key={acta.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-3 font-bold text-slate-800">#{acta.numero > 0 ? acta.numero : '-'}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{acta.fechaSesion}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border
                          ${acta.estado.toLowerCase() === 'publicada' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                            acta.estado.toLowerCase() === 'impresa' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                            'bg-slate-50 text-slate-600 border-slate-200'}`}>
                          {acta.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs max-w-[150px] truncate" title={acta.responsableActual}>
                        {acta.responsableActual}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                         {acta.firmaPresidente === 'Firmada' ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                         ) : (
                            <span className="text-slate-300">-</span>
                         )}
                      </td>
                      <td className="px-4 py-3 text-right">
                         {acta.tieneObservaciones ? (
                           <div className="flex justify-end relative group/tooltip">
                             <span className="text-red-600 font-medium text-xs flex items-center gap-1 cursor-help px-2 py-1 bg-red-50 rounded border border-red-100">
                               <AlertCircle className="h-3 w-3" /> Ver
                             </span>
                             {acta.observacionesTexto && (
                               <div className="absolute right-0 top-8 w-72 p-3 bg-white border border-slate-200 shadow-xl rounded-lg z-50 hidden group-hover/tooltip:block text-xs text-slate-700 text-left">
                                 <p className="font-bold text-slate-900 mb-1">Detalle Corrección:</p>
                                 {acta.observacionesTexto}
                               </div>
                             )}
                           </div>
                         ) : (
                           <span className="text-slate-300 text-xs">OK</span>
                         )}
                      </td>
                    </tr>
                  ))}
                  {paginatedActas.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                        <Filter className="h-8 w-8 text-slate-200" />
                        <p>No se encontraron registros con los filtros actuales.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 rounded-b-xl">
              <span className="text-xs text-slate-500">
                Mostrando {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredActas.length)} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredActas.length)} de {filteredActas.length}
              </span>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-md hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                {/* Simple page numbers logic */}
                <div className="flex items-center gap-1">
                   {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Logic to show generic window of pages centered on current
                      let pNum = i + 1;
                      if (totalPages > 5 && currentPage > 3) {
                         pNum = currentPage - 3 + i;
                         if (pNum > totalPages) pNum = totalPages - (4 - i);
                      }
                      
                      return (
                        <button
                          key={pNum}
                          onClick={() => setCurrentPage(pNum)}
                          className={`w-7 h-7 flex items-center justify-center text-xs font-medium rounded-md transition-colors
                            ${currentPage === pNum ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}
                        >
                          {pNum}
                        </button>
                      );
                   })}
                </div>

                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-1.5 rounded-md hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;