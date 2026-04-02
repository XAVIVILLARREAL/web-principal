import React from 'react';
import { images } from '../../Cotizaciones/assets/images_base64';

export interface TicketData {
  id: string;
  fecha: string;
  cliente: {
    name: string;
    email: string;
    phone: string;
    xtreme_id: string;
  };
  titulo: string;
  prioridad: string;
  notas: string;
  tecnico: string;
  equipo?: string;
  isUnderWarranty?: boolean;
}

export const TicketTemplate = React.forwardRef<HTMLDivElement, { data: TicketData }>(
  ({ data }, ref) => {
    return (
      <div ref={ref} className="print-container relative flex flex-col bg-white font-sans text-slate-800" style={{ width: '816px', height: '528px', overflow: 'hidden', boxSizing: 'border-box' }}>
        <style>
          {`
            .print-container {
              background-color: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @media print {
              .print-container {
                width: 816px !important;
                height: 528px !important;
              }
            }
          `}
        </style>

        {/* Top Accent Bar */}
        <div className="h-4 w-full bg-slate-900 flex items-center">
          <div className="w-1/3 h-full bg-blue-600"></div>
        </div>
        
        <div className="p-8 flex flex-col h-full relative z-10">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            {/* Logo */}
            <div className="w-1/2">
              <img src={images.logo_letras_negrass1} alt="Logo" className="h-14 w-auto object-contain" style={{ maxWidth: '250px' }} referrerPolicy="no-referrer" />
            </div>
            
            {/* Ticket Info */}
            <div className="w-1/2 text-right flex flex-col items-end">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-2">Ticket de Soporte</h1>
              <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                <div className="text-right">
                  <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Fecha</p>
                  <p className="text-sm font-bold text-slate-800">{data.fecha}</p>
                </div>
                <div className="h-8 w-px bg-slate-300"></div>
                <div className="text-right">
                  <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Folio</p>
                  <p className="text-lg font-black text-slate-900 leading-none">#{data.id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Warranty Stamp */}
          {data.isUnderWarranty && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] pointer-events-none z-0 flex justify-center items-center w-full h-full opacity-10">
              <div className="border-[8px] border-emerald-600 text-emerald-600 px-12 py-6 rounded-3xl text-[80px] leading-none font-black uppercase tracking-tighter text-center">
                PAGADO POR<br/>GARANTÍA
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-8 relative z-10 flex-grow">
            
            {/* Client Info */}
            <div>
              <div className="flex items-center gap-2 mb-3 border-b-2 border-slate-100 pb-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <h3 className="text-xs uppercase font-black tracking-widest text-slate-500">Datos del Cliente</h3>
              </div>
              <div className="space-y-1.5 pl-4 border-l-2 border-slate-100">
                <p className="text-lg font-bold text-slate-900">{data.cliente.name}</p>
                <p className="text-sm text-slate-600 flex items-center gap-2">
                  <span className="font-bold text-slate-400 w-16 text-[10px] uppercase tracking-wider">Teléfono</span> {data.cliente.phone}
                </p>
                {data.cliente.email && data.cliente.email !== 'S/N' && (
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <span className="font-bold text-slate-400 w-16 text-[10px] uppercase tracking-wider">Email</span> {data.cliente.email}
                  </p>
                )}
              </div>
            </div>

            {/* Ticket Details */}
            <div>
              <div className="flex items-center gap-2 mb-3 border-b-2 border-slate-100 pb-1">
                <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
                <h3 className="text-xs uppercase font-black tracking-widest text-slate-500">Detalles del Caso</h3>
              </div>
              <div className="space-y-4 pl-4 border-l-2 border-slate-100">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Asunto</p>
                  <p className="text-base font-bold text-slate-900 leading-snug">{data.titulo}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Técnico Asignado</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                      {data.tecnico.charAt(0)}
                    </div>
                    <p className="font-bold text-slate-800 text-sm">{data.tecnico}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Equipment Info */}
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-3 border-b-2 border-slate-100 pb-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <h3 className="text-xs uppercase font-black tracking-widest text-slate-500">Equipo Relacionado</h3>
              </div>
              <div className="flex gap-6 pl-4">
                <div className="bg-slate-50 px-5 py-3 rounded-xl border border-slate-200 min-w-[180px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Xtreme ID</span>
                  <span className="text-xl font-mono font-black text-slate-900 tracking-tight">{data.cliente.xtreme_id || 'N/A'}</span>
                </div>
                {data.equipo && (
                  <div className="bg-slate-50 px-5 py-3 rounded-xl border border-slate-200 flex-grow">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Equipo / Modelo</span>
                    <span className="text-xl font-mono font-bold text-slate-900 tracking-tight">{data.equipo}</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="mt-auto pt-5 border-t-2 border-slate-100 flex justify-between items-end relative z-10">
            <div className="max-w-[65%]">
              <p className="text-[10px] text-slate-500 leading-relaxed text-justify font-medium">
                Este documento confirma la creación de su ticket de soporte técnico. Un especialista revisará su caso y se pondrá en contacto con usted a la brevedad posible para darle seguimiento. Agradecemos su preferencia y confianza en nuestros servicios.
              </p>
            </div>
            
            <div className="flex items-center gap-3 text-right">
              <div>
                <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-0.5">Términos y Condiciones</p>
                <p className="text-[8px] text-slate-500 font-medium">Escanee el código QR para consultar<br/>nuestras políticas de servicio.</p>
              </div>
              <div className="bg-white p-1.5 border-2 border-slate-900 rounded-xl shadow-sm">
                <img src={images.qrterminosycondiciones} alt="QR Terms" className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
