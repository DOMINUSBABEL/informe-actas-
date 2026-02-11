import React from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

interface ValidationAlertProps {
  unclassifiedCount: number;
  totalCount?: number;
  isVisible: boolean;
  onClose?: () => void;
}

const ValidationAlert: React.FC<ValidationAlertProps> = ({ unclassifiedCount, totalCount, isVisible, onClose }) => {
  if (!isVisible) return null;

  const isSuccess = unclassifiedCount === 0;

  return (
    <div className={`mb-6 rounded-lg border p-4 transition-all relative ${isSuccess ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200 animate-pulse'}`}>
      {onClose && (
        <button 
          onClick={onClose} 
          className={`absolute top-2 right-2 p-1 rounded-full hover:bg-white/50 ${isSuccess ? 'text-emerald-500' : 'text-red-500'}`}
        >
          <X className="h-4 w-4" />
        </button>
      )}
      
      <div className="flex items-start gap-3">
        {isSuccess ? (
          <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
        )}
        
        <div>
          <h3 className={`text-sm font-bold ${isSuccess ? 'text-emerald-800' : 'text-red-800'}`}>
            {isSuccess ? 'Integridad de Datos Verificada' : 'Alerta de Integridad de Datos'}
          </h3>
          <p className={`text-sm mt-1 ${isSuccess ? 'text-emerald-700' : 'text-red-700'}`}>
            {isSuccess ? (
              <>Todos los <strong>{totalCount}</strong> registros han sido procesados y clasificados correctamente según las reglas de negocio.</>
            ) : (
              <>Se encontraron <strong>{unclassifiedCount}</strong> actas sin clasificar que no cumplen ninguna regla de negocio. Por favor revise los datos antes de la reunión.</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ValidationAlert;