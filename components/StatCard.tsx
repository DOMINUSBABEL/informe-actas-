import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  count: number;
  total: number;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  description: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  count, 
  total, 
  icon: Icon, 
  colorClass, 
  bgClass,
  description,
  onClick 
}) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md cursor-pointer group`}
    >
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
        <Icon size={64} className={colorClass} />
      </div>

      <div className="flex items-start justify-between mb-4">
        <div className={`rounded-lg p-3 ${bgClass}`}>
          <Icon className={`h-6 w-6 ${colorClass}`} />
        </div>
        <span className={`text-sm font-bold px-2 py-1 rounded-full ${bgClass} ${colorClass}`}>
          {percentage}%
        </span>
      </div>

      <div className="relative z-10">
        <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">
          {title}
        </h3>
        <p className="text-3xl font-bold text-slate-800 tracking-tight">
          {count}
        </p>
        <p className="text-xs text-slate-400 mt-2 font-light">
          {description}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${colorClass.replace('text-', 'bg-')}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default StatCard;