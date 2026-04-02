import React from 'react';
import { images } from '../assets/images_base64';

export interface CotizacionItem {
  id: string;
  name: string;
  description: string;
  qty: number;
  unitPrice: number;
}

export interface CotizacionData {
  folio: string;
  fechaEmision: string;
  validoHasta: string;
  cliente: {
    name: string;
    rfc: string;
    contact: string;
    address: string;
    email: string;
    phone: string;
    sistema: string;
    sector: string;
  };
  items: CotizacionItem[];
  discountAmount: number;
  showGifts: boolean;
  isPaid: boolean;
  isWarrantyPayment?: boolean;
  supportTicket?: string;
  signer: 'Valeria' | 'Ivan' | 'David';
  notes?: string;
  conditions: {
    warranty: string;
  };
}

export const CotizacionTemplate = React.forwardRef<HTMLDivElement, { data: CotizacionData }>(
  ({ data }, ref) => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
      }).format(amount);
    };

    const subtotalItems = data.items.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);
    const iva = subtotalItems * 0.16;
    const totalOriginal = subtotalItems + iva;
    const totalFinal = totalOriginal - data.discountAmount;

    return (
      <div ref={ref} className="print-container relative flex flex-col p-8 pt-6 font-sans text-slate-800" style={{ width: '816px', height: '1344px', overflow: 'hidden', boxSizing: 'border-box' }}>
        <style>
          {`
            .print-container {
              background-image: repeating-linear-gradient(
                to bottom, 
                white, 
                white 1343px, 
                #94a3b8 1343px, 
                #94a3b8 1344px
              );
            }
            .avoid-page-break {
                page-break-inside: avoid;
                break-inside: avoid;
            }
            .page-break-before {
                page-break-before: always;
                break-before: page;
            }
            tr {
                page-break-inside: avoid;
                break-inside: avoid;
            }
            h2, h3, h4, h5, h6 {
                page-break-after: avoid;
                break-after: avoid;
            }
            @media print {
              .print-container {
                background-image: none !important;
                background-color: white !important;
                height: 1344px !important;
                overflow: hidden !important;
              }
            }
          `}
        </style>
        
        {/* SELLO DE PAGADO */}
        {data.isPaid && (
          <div className="absolute top-[350px] left-0 right-0 flex items-center justify-center pointer-events-none z-50">
            <div className={`border-double border-[20px] ${data.isWarrantyPayment ? 'border-amber-600/40 text-amber-600/40' : 'border-emerald-600/40 text-emerald-600/40'} rounded-[40px] px-20 py-12 transform -rotate-[15deg] mix-blend-multiply flex flex-col items-center justify-center`}>
              <span className="text-9xl font-black uppercase tracking-widest leading-none">Pagado</span>
              {data.isWarrantyPayment && (
                <span className="text-6xl font-black uppercase tracking-widest mt-4">Por Garantía</span>
              )}
              {data.supportTicket && (
                <span className={`text-3xl font-bold uppercase tracking-widest mt-4 border-t-4 ${data.isWarrantyPayment ? 'border-amber-600/40' : 'border-emerald-600/40'} pt-2`}>
                  Ticket: {data.supportTicket}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <header className="flex justify-between items-center mb-4 relative z-10">
            <div className="w-80 -ml-4">
                <img crossOrigin="anonymous" src={images.logo_letras_negrass1} alt="Bandi Sistemas y Redes Logo" className="w-full h-auto scale-110 origin-left object-contain" data-loaded="true" />
            </div>
            <div className="text-right">
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Cotización</h1>
                <p className="text-cyan-600 font-mono font-bold text-lg tracking-wider">#{data.folio}</p>
            </div>
        </header>

        {/* Status Bar */}
        <div className="flex justify-between text-white p-2.5 rounded-lg mb-5 shadow-md border border-slate-800 relative z-10" style={{ background: 'linear-gradient(to right, #0f172a, #172554, #0f172a)' }}>
            <div className="flex items-center gap-2">
                <div className="bg-[#06b6d433] p-1.5 rounded text-cyan-400">⚡</div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Sistema: <span className="font-mono text-cyan-400 ml-1 text-xs">ECM PRO</span></span>
            </div>
            <div className="flex items-center gap-2">
                <div className="bg-[#06b6d433] p-1.5 rounded text-cyan-400">🚜</div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Sector: <span className="font-mono text-cyan-400 ml-1 text-xs">Diesel Pesado</span></span>
            </div>
            <div className="flex items-center gap-2">
                <div className="bg-[#06b6d433] p-1.5 rounded text-cyan-400">📅</div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Fecha: <span className="font-mono text-cyan-400 ml-1 text-xs">{data.fechaEmision}</span></span>
            </div>
        </div>

        {/* Client Info & Dates Grid */}
        <div className="grid grid-cols-12 gap-4 mb-5 relative z-10">
            <div className="col-span-4 bg-slate-50 border border-slate-200 p-3.5 rounded-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-slate-800"></div>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Emisor:</h3>
                <h2 className="text-sm font-black text-slate-900 uppercase leading-tight mb-1">Bandi Sistemas y Redes S.A. de C.V.</h2>
                <div className="text-[9px] text-slate-600 space-y-0.5">
                    <p><strong className="text-slate-800">RFC:</strong> BSR220708U14</p>
                    <p>Av. Central 734 C Int 914, Chapultepec</p>
                    <p>San Nicolás de los Garza, N.L., C.P. 66450</p>
                    <p><strong className="text-slate-800">Tel:</strong> (81) 1658 7138</p>
                </div>
            </div>

            <div className="col-span-5 bg-slate-50 border border-slate-200 p-3.5 rounded-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                <h3 className="text-[10px] font-black text-cyan-600 uppercase tracking-widest mb-1.5">Cotizar A:</h3>
                <h2 className="text-sm font-black text-slate-900 uppercase leading-tight mb-1">{data.cliente.name}</h2>
                <div className="text-[9px] text-slate-600 space-y-0.5">
                    <p><strong className="text-slate-800">RFC:</strong> {data.cliente.rfc} <span className="mx-1 text-slate-300">|</span> <strong className="text-slate-800">Atención:</strong> {data.cliente.contact}</p>
                    <p>{data.cliente.address}</p>
                    <p><strong className="text-slate-800">Email:</strong> {data.cliente.email} <span className="mx-1 text-slate-300">|</span> <strong className="text-slate-800">Tel:</strong> {data.cliente.phone}</p>
                    <p><strong className="text-slate-800">Sistema:</strong> {data.cliente.sistema} <span className="mx-1 text-slate-300">|</span> <strong className="text-slate-800">Sector:</strong> {data.cliente.sector}</p>
                </div>
            </div>
            
            <div className="col-span-3 flex flex-col gap-2">
                <div className="text-white p-2.5 rounded-lg flex-1 flex flex-col justify-center border border-slate-800" style={{ background: 'linear-gradient(to bottom right, #0f172a, #172554)' }}>
                    <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest mb-0.5">Fecha de Emisión</span>
                    <span className="font-mono font-bold text-sm">{data.fechaEmision}</span>
                </div>
                <div className="text-white p-2.5 rounded-lg flex-1 flex flex-col justify-center shadow-[0_4px_15px_rgba(249,115,22,0.3)]" style={{ background: 'linear-gradient(to bottom right, #f97316, #ef4444)' }}>
                    <span className="text-[9px] text-orange-100 font-bold uppercase tracking-widest mb-0.5">Válido Hasta</span>
                    <span className="font-mono font-bold text-sm">{data.validoHasta}</span>
                </div>
            </div>
        </div>

        {/* Products Table */}
        <div className="mb-5 border border-slate-200 rounded-lg relative z-10 avoid-page-break">
            <table className="w-full text-left border-collapse">
                <thead className="text-cyan-400 border-b-2 border-cyan-500 avoid-page-break" style={{ background: 'linear-gradient(to right, #0f172a, #172554)', pageBreakInside: 'avoid' }}>
                    <tr>
                        <th className="py-2.5 px-4 text-[10px] font-bold uppercase tracking-widest w-[50%]">Concepto</th>
                        <th className="py-2.5 px-4 text-[10px] font-bold uppercase tracking-widest text-center">Cant.</th>
                        <th className="py-2.5 px-4 text-[10px] font-bold uppercase tracking-widest text-right">Precio Unit.</th>
                        <th className="py-2.5 px-4 text-[10px] font-bold uppercase tracking-widest text-right">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                    {data.items.map((item, index) => (
                      <tr key={index} className="bg-white avoid-page-break" style={{ pageBreakInside: 'avoid' }}>
                          <td className="py-3 px-4">
                              <p className="font-bold text-slate-900 text-xs uppercase mb-0.5">{item.name}</p>
                              <p className="text-[10px] text-slate-500 leading-relaxed whitespace-pre-wrap">{item.description}</p>
                          </td>
                          <td className="py-3 px-4 text-center">
                              <span className="inline-block bg-slate-100 text-slate-800 font-mono text-xs font-bold px-2 py-1 rounded">{item.qty}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-xs text-slate-600">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-3 px-4 text-right font-mono text-xs font-bold text-slate-900">{formatCurrency(item.qty * item.unitPrice)}</td>
                      </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Gifts Section */}
        {data.showGifts && (
          <div className="mb-6 rounded-lg p-4 border-l-4 border-orange-500 text-white flex justify-between items-center shadow-lg relative overflow-hidden z-10 avoid-page-break" style={{ background: 'linear-gradient(to right, #0f172a, #000000)', pageBreakInside: 'avoid' }}>
              <div className="absolute right-0 top-0 w-64 h-full pointer-events-none" style={{ background: 'linear-gradient(to left, rgba(249, 115, 22, 0.1), transparent)' }}></div>
              <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-3">
                      <h3 className="text-orange-500 font-black uppercase tracking-widest text-xs flex items-center gap-2">
                          🎁 Paquete de Regalos Premium Incluido
                      </h3>
                      <span className="text-[8px] text-slate-400 uppercase tracking-wider font-bold bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                          En la compra de cualquier kit
                      </span>
                  </div>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] text-slate-300">
                      <li><span className="text-orange-500 mr-1 font-bold">▸</span> <strong className="text-white">12 Cursos</strong> — Valor de $1,200 c/u</li>
                      <li><span className="text-orange-500 mr-1 font-bold">▸</span> <strong className="text-white">Caja Uso Rudo</strong> — Protección Total Extrema</li>
                      <li><span className="text-orange-500 mr-1 font-bold">▸</span> <strong className="text-white">Archivos de Reprogramación</strong> — Y eliminación</li>
                      <li><span className="text-orange-500 mr-1 font-bold">▸</span> <strong className="text-white">Base de Datos</strong> — 200,000 diagramas y manuales</li>
                  </ul>
              </div>
              <div className="text-right pl-6 border-l border-slate-700 flex flex-col justify-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Valor Real</p>
                  <p className="text-sm text-slate-300 line-through font-mono mb-1">$29,500.00</p>
                  <p className="text-2xl font-black text-emerald-400 tracking-tighter leading-none">GRATIS</p>
              </div>
          </div>
        )}

        {/* Totals & Extra Info */}
        <div className="grid grid-cols-12 gap-6 mb-8 relative z-10 avoid-page-break" style={{ pageBreakInside: 'avoid' }}>
            <div className="col-span-7 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex gap-2.5 items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <div className="bg-cyan-100 text-cyan-600 p-1.5 rounded-lg shrink-0">
                            🛡️
                        </div>
                        <div className="flex-1">
                            <h4 className="text-[9px] font-bold text-slate-900 uppercase tracking-widest mb-0.5">Términos y Condiciones</h4>
                            <p className="text-[8px] text-slate-600 leading-tight">{data.conditions.warranty}</p>
                        </div>
                        <div className="w-12 h-12 bg-white border border-slate-200 rounded shrink-0 overflow-hidden p-0.5 shadow-sm">
                            <img crossOrigin="anonymous" src={images.qrterminosycondiciones} alt="QR Términos" className="w-full h-full object-contain" data-loaded="true" />
                        </div>
                    </div>
                    
                    <div className="flex gap-2.5 items-center p-2.5 rounded-lg border border-slate-800 shadow-md" style={{ background: 'linear-gradient(to bottom right, #0f172a, #172554)' }}>
                        <div className="bg-[#06b6d433] text-cyan-400 p-1.5 rounded-lg shrink-0">
                            📖
                        </div>
                        <div className="flex-1">
                            <h4 className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest mb-0.5">Catálogo Digital</h4>
                            <p className="text-[8px] text-slate-300 leading-tight">Escanee para ver nuestra propuesta de valor y catálogo de equipos.</p>
                        </div>
                        <div className="w-12 h-12 bg-white border border-slate-200 rounded shrink-0 overflow-hidden p-0.5 shadow-sm">
                            <img crossOrigin="anonymous" src={images.qrcatalogo} alt="QR Catálogo" className="w-full h-full object-contain" data-loaded="true" />
                        </div>
                    </div>
                </div>
                <div className="flex-1 border-t border-dashed border-slate-300 pt-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Espacio Libre para Notas:</p>
                    <div className="h-12 w-full rounded bg-slate-50 border border-slate-200 p-2 text-[9px] text-slate-600 overflow-hidden whitespace-pre-wrap">
                      {data.notes || ''}
                    </div>
                </div>
            </div>

            <div className="col-span-5 bg-slate-50 rounded-lg p-4 border border-slate-200 flex flex-col justify-center relative overflow-hidden">
                <div className="flex justify-between text-[11px] mb-2.5">
                    <span className="text-slate-500 font-bold uppercase tracking-wider">Subtotal Equipos</span>
                    <span className="font-mono font-bold text-slate-800">{formatCurrency(subtotalItems)}</span>
                </div>
                <div className="flex justify-between text-[11px] mb-3.5">
                    <span className="text-slate-500 font-bold uppercase tracking-wider">IVA (16%)</span>
                    <span className="font-mono font-bold text-slate-800">{formatCurrency(iva)}</span>
                </div>
                
                {data.discountAmount > 0 ? (
                  <>
                    <div className="flex justify-between items-center border-t border-slate-300 pt-2 mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Original</span>
                        <span className="text-sm font-bold text-slate-400 font-mono line-through">{formatCurrency(totalOriginal)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-3 bg-red-50 p-1.5 rounded border border-red-100">
                        <span className="text-[11px] font-black text-red-600 uppercase tracking-widest flex items-center gap-1">
                            🏷️ Descuento Especial
                        </span>
                        <span className="text-sm font-black text-red-600 font-mono">-{formatCurrency(data.discountAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t-2 border-slate-900 pt-2" style={{ background: 'linear-gradient(to right, transparent, rgba(236, 254, 255, 0.5))' }}>
                        <span className="text-xs font-black text-cyan-600 uppercase tracking-widest">Nuevo Precio</span>
                        <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">{formatCurrency(totalFinal)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center border-t-2 border-slate-900 pt-3">
                      <span className="text-xs font-black text-cyan-600 uppercase tracking-widest">Total a Invertir</span>
                      <span className="text-xl font-black text-slate-900 font-mono tracking-tight">{formatCurrency(totalOriginal)}</span>
                  </div>
                )}
            </div>
        </div>

        {/* Signatures */}
        <div className="flex justify-between items-end mb-6 px-8 relative z-10 avoid-page-break" style={{ pageBreakInside: 'avoid' }}>
            <div className="w-56 text-center relative">
                <div className="h-12 flex items-center justify-center mb-1 relative opacity-80">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full text-slate-500" viewBox="0 0 200 50" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M 40 30 Q 90 40 160 25" strokeWidth="1" opacity="0.4" />
                            <path d="M 150 20 C 160 25, 155 35, 165 30" strokeWidth="0.8" opacity="0.3" />
                        </svg>
                        <span className="text-3xl text-slate-800 absolute" style={{ fontFamily: "'Zeyada', cursive", transform: "rotate(-5deg) translateY(0px)" }}>
                            {data.signer === 'Valeria' && 'V. Almaguer'}
                            {data.signer === 'Ivan' && 'I. Villarreal'}
                            {data.signer === 'David' && 'D. Sanchez'}
                        </span>
                    </div>
                </div>
                <div className="border-b border-slate-400 mb-2 relative z-10"></div>
                <p className="text-[9px] font-bold text-slate-800 uppercase tracking-widest">Autorizado por</p>
                <p className="text-[9px] text-slate-500 mt-0.5">
                  {data.signer === 'Valeria' && 'Valeria Almaguer'}
                  {data.signer === 'Ivan' && 'Ivan Villarreal'}
                  {data.signer === 'David' && 'David Sanchez'}
                  <br/>
                  Bandi Sistemas y Redes
                </p>
            </div>
            <div className="w-56 text-center">
                <div className="h-16 mb-1"></div>
                <div className="border-b border-slate-400 mb-2"></div>
                <p className="text-[9px] font-bold text-slate-800 uppercase tracking-widest">Firma de Recibido / Aceptado</p>
                <p className="text-[9px] text-slate-500 mt-0.5">{data.cliente.name}</p>
            </div>
        </div>

        {/* Footer */}
        <footer className="mt-auto text-white rounded-xl p-4 border border-slate-800 shadow-lg relative z-10 avoid-page-break" style={{ background: 'linear-gradient(to right, #0f172a, #172554, #0f172a)', pageBreakInside: 'avoid' }}>
            <div className="flex justify-center gap-12 border-b border-slate-700 pb-3 mb-3">
                <div className="flex items-center gap-2">
                    <div className="bg-[#06b6d433] p-1.5 rounded text-cyan-400">📖</div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-200">Diagramas y Manuales</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-[#06b6d433] p-1.5 rounded text-cyan-400">🎧</div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-200">Soporte Técnico</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-[#06b6d433] p-1.5 rounded text-cyan-400">🚚</div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-200">Envío Asegurado</span>
                </div>
            </div>
            <div className="text-center text-[8px] text-slate-400 leading-relaxed">
                <strong className="text-cyan-400">BANDI SISTEMAS Y REDES S.A. DE C.V.</strong> • www.xtremediagnostics.com • ventas@xtremediagnostics.com<br/>
                Monterrey, N.L., México • Tel: (81) 1658 7138 • RFC: BSR220708U14<br/>
                <span className="text-slate-500 mt-1 block">*Promociones y precios pueden cambiar expirando el plazo de la cotizacion.</span>
            </div>
        </footer>
      </div>
    );
  }
);
