import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let Icon = Info;
        let borderClass = 'border-blue-500/40 bg-slate-900/95 text-blue-200';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          borderClass = 'border-emerald-500/40 bg-slate-900/95 text-emerald-200';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          borderClass = 'border-amber-500/40 bg-slate-900/95 text-amber-200';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          borderClass = 'border-rose-500/40 bg-slate-900/95 text-rose-200';
        }

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-3.5 rounded-lg border shadow-xl backdrop-blur-md pointer-events-auto transition-all ${borderClass}`}
          >
            <Icon className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-slate-200 leading-relaxed">{toast.message}</p>
          </div>
        );
      })}
    </div>
  );
};
