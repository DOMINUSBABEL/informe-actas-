import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ValidationAlertProps {
  unclassifiedCount: number;
}

const ValidationAlert: React.FC<ValidationAlertProps> = ({ unclassifiedCount }) => {
  if (unclassifiedCount <= 0) return null;

  return (
    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <div>
          <h3 className="text-sm font-semibold text-red-800">
            Alerta de Integridad de Datos
          </h3>
          <p className="text-sm text-red-700">
            Se encontraron <strong>{unclassifiedCount}</strong> actas sin clasificar que no cumplen ninguna regla de negocio. Por favor revise los datos antes de la reunión.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ValidationAlert;