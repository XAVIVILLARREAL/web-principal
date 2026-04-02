import React from 'react';
import { Loader2, CheckCircle, XCircle, Download } from 'lucide-react';

interface SendingOverlayProps {
  step: number;
  error: string | null;
  onClose: () => void;
  onDownloadManual?: () => void;
  hasPdfs?: boolean;
}

export const SendingOverlay: React.FC<SendingOverlayProps> = ({ step, error, onClose, onDownloadManual, hasPdfs }) => {
  const steps = [
    { id: 1, label: 'Generando PDFs...' },
    { id: 2, label: 'Subiendo a la nube...' },
    { id: 3, label: 'Guardando en Base de Datos...' },
    { id: 4, label: 'Enviando al chat...' },
    { id: 5, label: '¡Completado!' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-lg font-bold text-[var(--text-main)] mb-6 text-center">
          {error ? 'Error en el proceso' : 'Procesando Cotización'}
        </h3>
        
        <div className="space-y-4">
          {steps.map((s) => {
            const isCurrent = step === s.id && !error && s.id !== 5;
            const isDone = step > s.id || (step === 5 && s.id === 5);
            const isError = step === s.id && error;
            const isPending = step < s.id;

            return (
              <div key={s.id} className={`flex items-center gap-3 ${isPending ? 'opacity-40' : 'opacity-100'}`}>
                <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                  {isDone && <CheckCircle size={20} className="text-emerald-500" />}
                  {isCurrent && <Loader2 size={20} className="text-cyan-500 animate-spin" />}
                  {isError && <XCircle size={20} className="text-red-500" />}
                  {isPending && <div className="w-2 h-2 rounded-full bg-slate-500" />}
                </div>
                <span className={`text-sm font-medium ${isCurrent ? 'text-cyan-500' : isError ? 'text-red-500' : 'text-[var(--text-main)]'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-xs text-red-400 font-mono break-words">{error}</p>
          </div>
        )}

        {(step === 5 || error) && (
          <div className="mt-6 flex flex-col gap-3">
            {error && hasPdfs && onDownloadManual && (
              <button
                onClick={onDownloadManual}
                className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-[#0a0a0a] rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Download size={16} /> Descargar PDFs Manualmente
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full py-2 bg-[var(--bg-card)] hover:bg-[var(--border-subtle)] border border-[var(--border-main)] rounded-lg text-sm font-bold text-[var(--text-main)] transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
