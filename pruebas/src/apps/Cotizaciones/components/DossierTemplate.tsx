import React, { useState, useEffect } from 'react';
import { 
  MapPin, Truck, Clock, TrendingDown, Wrench, Award, DollarSign, 
  Laptop, MonitorPlay, Radio, Cable, Shield, Unlock, BookOpen, 
  Tractor, Settings, CheckSquare, CheckCircle, ShieldAlert, Headset 
} from 'lucide-react';

const CorsImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
    const [dataUrl, setDataUrl] = useState<string | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const loadImageAsBase64 = (url: string): Promise<string> => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0);
                        resolve(canvas.toDataURL('image/png'));
                    } else {
                        reject(new Error('Canvas context not available'));
                    }
                };
                img.onerror = () => reject(new Error('Load error'));
                img.src = url;
            });
        };

        const fetchImage = async () => {
            const proxies = [
                (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
                (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
                (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
                (url: string) => `${url}?t=${new Date().getTime()}`
            ];

            let success = false;
            for (const getProxyUrl of proxies) {
                if (success) break;
                try {
                    const base64 = await loadImageAsBase64(getProxyUrl(src));
                    if (isMounted) {
                        setDataUrl(base64);
                        success = true;
                    }
                } catch (err) { continue; }
            }
            if (!success && isMounted) setError(true);
        };

        fetchImage();
        return () => { isMounted = false; };
    }, [src]);

    // We use a data attribute to signal to the PDF generator that the image is ready
    if (error) return <img src={src} alt={alt} className={className} data-loaded="true" />;
    if (!dataUrl) return <div className={`bg-slate-800 animate-pulse ${className}`} data-loading="true" />;
    return <img src={dataUrl} alt={alt} className={className} data-loaded="true" />;
};

export const DossierTemplate = React.forwardRef<HTMLDivElement, { cliente: any; equipo: string }>(
  ({ cliente, equipo }, ref) => {
    const isDefault = (val: string) => !val || val.toLowerCase().includes('pendiente') || val.toLowerCase().includes('no especificado');

    return (
      <div ref={ref} className="bg-slate-200 font-sans text-slate-800 flex flex-col items-center" style={{ width: '816px' }}>
        <style>{`
          .dossier-page {
            width: 816px;
            height: 1055px;
            position: relative;
            overflow: hidden;
            background: white;
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
            box-sizing: border-box;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.2);
            margin-bottom: 2rem;
          }
          .page-break-before {
            page-break-before: always;
            break-before: page;
          }
          @media print {
            .dossier-page {
              box-shadow: none !important;
              margin-bottom: 0 !important;
              height: 1055px !important;
            }
            .bg-slate-200 {
                background-color: white !important;
            }
          }
          .text-xtreme-cyan { color: #00e5ff; }
          .bg-xtreme-cyan { background-color: #00e5ff; }
          .border-xtreme-cyan { border-color: #00e5ff; }
          .text-xtreme-dark { color: #0B1120; }
          .bg-xtreme-dark { background-color: #0B1120; }
          .text-xtreme-blue { color: #0284c7; }
          .font-mono { font-family: 'JetBrains Mono', monospace; }
          .hex-bg {
            background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45v-30L30 0z' fill-rule='evenodd' stroke='%23ffffff' stroke-opacity='0.05' fill='none'/%3E%3C/svg%3E");
          }
        `}</style>
        {/* PÁGINA 1: PORTADA EJECUTIVA */}
        <div className="dossier-page flex flex-col bg-xtreme-dark text-white relative">
          <div className="absolute inset-0 hex-bg z-0"></div>
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-[rgba(0,229,255,0.05)] rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 z-0"></div>
          
          <header className="p-12 pb-6 relative z-20 flex justify-between items-center">
              <CorsImage src="https://filedn.com/lOCbrTn2AD3hfK89ljyd7yV/logo%20letras%20negrass1.png" alt="Xtreme Diagnostics Logo" className="w-64 drop-shadow-2xl brightness-0 invert" />
              <div className="text-right">
                  <p className="font-mono text-xtreme-cyan font-bold tracking-[0.2em] text-sm">DOSSIER COMERCIAL</p>
                  <p className="text-slate-400 text-xs mt-1 tracking-widest">EDICIÓN 2026</p>
              </div>
          </header>

          <main className="flex-1 flex flex-col justify-center items-center px-16 text-center relative z-10">
              <div className="mb-10 inline-flex items-center gap-3 bg-[rgba(0,229,255,0.1)] border border-[rgba(0,229,255,0.3)] py-3 px-6 rounded-full shadow-[0_0_30px_rgba(0,229,255,0.15)]">
                  <MapPin className="w-6 h-6 text-xtreme-cyan" />
                  <span className="text-base font-black tracking-widest uppercase text-white">
                      Presente en más de <span className="text-xtreme-cyan">1,000 talleres</span> en México
                  </span>
              </div>

              <h1 className="text-[5rem] font-black leading-[1.05] tracking-tighter mb-8 uppercase drop-shadow-lg">
                  Diagnóstico<br/>Nivel Agencia<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-xtreme-cyan to-blue-400">Sin Límites.</span>
              </h1>
              
              <p className="text-2xl text-slate-300 font-light leading-relaxed max-w-3xl mx-auto border-t border-b border-[rgba(255,255,255,0.1)] py-8">
                  Soluciones integrales de hardware militar y software multimarca para tomar el control total de su flotilla o taller.<br/><strong className="text-white mt-4 block">Llegar, conectar y diagnosticar.</strong>
              </p>
          </main>

          <footer className="p-12 pt-6 relative z-20 flex justify-between items-end">
              <div className="bg-[rgba(255,255,255,0.1)] backdrop-blur-sm px-8 py-5 rounded-2xl border border-[rgba(255,255,255,0.1)] text-left max-w-lg">
                  <p className="text-xs uppercase tracking-[0.2em] font-bold text-slate-400 mb-1">Propuesta Preparada Para:</p>
                  <p className="text-xl font-black text-white uppercase tracking-wide mb-2">{cliente?.name || 'Estimado Cliente'}</p>
                  
                  {cliente && (
                    <div className="space-y-1 text-xs text-slate-300">
                      {!isDefault(cliente.contact) && <p><span className="text-xtreme-cyan font-bold">ATN:</span> {cliente.contact}</p>}
                      {!isDefault(cliente.address) && <p><span className="text-xtreme-cyan font-bold">DIR:</span> {cliente.address}</p>}
                      <div className="flex gap-4 mt-2 pt-2 border-t border-[rgba(255,255,255,0.1)]">
                        {!isDefault(cliente.phone) && <p><span className="text-xtreme-cyan font-bold">TEL:</span> {cliente.phone}</p>}
                        {!isDefault(cliente.email) && <p><span className="text-xtreme-cyan font-bold">MAIL:</span> {cliente.email}</p>}
                      </div>
                    </div>
                  )}
              </div>
              <div className="text-right">
                  <p className="font-mono text-sm text-xtreme-cyan font-bold tracking-widest">WWW.XTREMEDIAGNOSTICS.COM</p>
                  <p className="font-mono text-xs text-slate-400 mt-1">VENTAS Y SOPORTE NACIONAL</p>
              </div>
          </footer>
        </div>

        {/* PÁGINA 2: EL PROBLEMA */}
        <div className="dossier-page page-break-before flex flex-col relative bg-white">
          <div className="p-12 pb-6">
              <div className="flex items-center gap-4 mb-6">
                  <span className="bg-xtreme-cyan text-xtreme-dark font-black font-mono px-3 py-1 text-sm rounded shadow-sm">01</span>
                  <h2 className="text-2xl font-black uppercase tracking-widest text-slate-900">Tomando el Control Total</h2>
              </div>

              <h3 className="text-4xl font-black text-slate-800 leading-tight mb-8">
                  El tiempo que su unidad pasa detenida,<br/><span className="text-xtreme-blue">es dinero que su negocio pierde.</span>
              </h3>
          </div>
              
          <div className="w-full px-12 mb-10">
              <CorsImage src="https://filedn.com/lOCbrTn2AD3hfK89ljyd7yV/web-principal/7.jpg" alt="Taller Diésel" className="w-full h-auto max-h-[400px] object-cover rounded-3xl shadow-2xl border-4 border-slate-100" />
          </div>

          <div className="px-12 flex-1 flex flex-col">
              <p className="text-lg text-slate-600 leading-relaxed font-medium mb-10 text-center max-w-4xl mx-auto bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  En <strong className="text-slate-900">Xtreme Diagnostics</strong> entendemos que depender de concesionarios o técnicos externos genera tiempos de espera interminables, diagnósticos imprecisos y facturas muy elevadas. Nuestra tecnología elimina a los intermediarios.
              </p>

              <div className="grid grid-cols-2 gap-10 flex-1">
                  {/* Para Flotillas */}
                  <div className="flex flex-col bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="bg-slate-800 p-4 flex items-center gap-3">
                          <div className="bg-[rgba(255,255,255,0.1)] text-white p-2 rounded-lg"><Truck className="w-6 h-6" /></div>
                          <h4 className="text-lg font-black text-white uppercase tracking-wide">Para Flotillas</h4>
                      </div>
                      <div className="p-6 flex-1">
                          <ul className="space-y-6">
                              <li>
                                  <strong className="text-slate-900 block text-base uppercase mb-1"><Clock className="w-5 h-5 inline text-red-500 mr-1 mb-1" /> Cero Dependencia</strong>
                                  <p className="text-sm text-slate-600 leading-relaxed">No vuelva a esperar días por una cita. Diagnostique en su patio.</p>
                              </li>
                              <li>
                                  <strong className="text-slate-900 block text-base uppercase mb-1"><TrendingDown className="w-5 h-5 inline text-red-500 mr-1 mb-1" /> Ahorro Radical</strong>
                                  <p className="text-sm text-slate-600 leading-relaxed">Evite pagos por escaneos básicos y arrastres de grúa (derates).</p>
                              </li>
                          </ul>
                      </div>
                  </div>

                  {/* Para Talleres */}
                  <div className="flex flex-col bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="bg-xtreme-blue p-4 flex items-center gap-3">
                          <div className="bg-[rgba(255,255,255,0.2)] text-white p-2 rounded-lg"><Wrench className="w-6 h-6" /></div>
                          <h4 className="text-lg font-black text-white uppercase tracking-wide">Para Talleres</h4>
                      </div>
                      <div className="p-6 flex-1">
                          <ul className="space-y-6">
                              <li>
                                  <strong className="text-slate-900 block text-base uppercase mb-1"><Award className="w-5 h-5 inline text-xtreme-blue mr-1 mb-1" /> Servicios Agencia</strong>
                                  <p className="text-sm text-slate-600 leading-relaxed">Ofrezca recalibraciones, cambios de parámetros y regeneraciones.</p>
                              </li>
                              <li>
                                  <strong className="text-slate-900 block text-base uppercase mb-1"><DollarSign className="w-5 h-5 inline text-xtreme-blue mr-1 mb-1" /> Rescates Rentables</strong>
                                  <p className="text-sm text-slate-600 leading-relaxed">Lleve el equipo rudo a carretera y facture grandes servicios in situ.</p>
                              </li>
                          </ul>
                      </div>
                  </div>
              </div>
          </div>
        </div>

        {/* PÁGINA 3: EL ECOSISTEMA */}
        <div className="dossier-page page-break-before flex flex-col p-12 relative bg-slate-50">
          <div className="flex items-center gap-4 mb-8">
              <span className="bg-xtreme-dark text-white font-black font-mono px-3 py-1 text-sm rounded shadow-sm">02</span>
              <h2 className="text-2xl font-black uppercase tracking-widest text-slate-900">Anatomía del Ecosistema</h2>
          </div>
          
          <p className="text-xl text-slate-600 font-medium mb-10">Enviamos el equipo <strong className="text-xtreme-dark">100% configurado</strong>. Está listo para llegar, conectar y facturar desde el minuto uno.</p>

          <div className="grid grid-cols-4 gap-6 mb-12">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-md">
                  <div className="w-16 h-16 mx-auto bg-slate-800 rounded-2xl flex items-center justify-center text-white mb-4"><Laptop className="w-8 h-8" /></div>
                  <h4 className="font-black text-sm uppercase tracking-widest text-slate-800 mb-2">1. Computadora</h4>
                  <p className="text-xs text-slate-500">Uso Rudo Militar</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-md">
                  <div className="w-16 h-16 mx-auto bg-xtreme-cyan rounded-2xl flex items-center justify-center text-xtreme-dark mb-4"><MonitorPlay className="w-8 h-8" /></div>
                  <h4 className="font-black text-sm uppercase tracking-widest text-slate-800 mb-2">2. Software</h4>
                  <p className="text-xs text-slate-500">+80 Programas</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-md">
                  <div className="w-16 h-16 mx-auto bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-4"><Radio className="w-8 h-8" /></div>
                  <h4 className="font-black text-sm uppercase tracking-widest text-slate-800 mb-2">3. Comunicador</h4>
                  <p className="text-xs text-slate-500">Interfaz OBD/CAN</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-md">
                  <div className="w-16 h-16 mx-auto bg-slate-500 rounded-2xl flex items-center justify-center text-white mb-4"><Cable className="w-8 h-8" /></div>
                  <h4 className="font-black text-sm uppercase tracking-widest text-slate-800 mb-2">4. Cables</h4>
                  <p className="text-xs text-slate-500">Conectores OEM</p>
              </div>
          </div>

          <div className="grid grid-cols-3 gap-8 mb-10">
              <div>
                  <h4 className="font-black text-slate-900 text-base uppercase tracking-wide mb-2"><Shield className="w-5 h-5 text-xtreme-blue inline mb-1" /> Hardware Militar</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">Construidos para soportar caídas, grasa, polvo y vibraciones extremas.</p>
              </div>
              <div>
                  <h4 className="font-black text-slate-900 text-base uppercase tracking-wide mb-2"><Unlock className="w-5 h-5 text-xtreme-blue inline mb-1" /> Inversión Permanente</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">A diferencia de otras marcas, <strong className="text-slate-900">el 90% de nuestros programas no caducan</strong>.</p>
              </div>
              <div>
                  <h4 className="font-black text-slate-900 text-base uppercase tracking-wide mb-2"><BookOpen className="w-5 h-5 text-xtreme-blue inline mb-1" /> Datos Incluidos</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">Incluimos manuales y +200,000 diagramas de cableado precisos.</p>
              </div>
          </div>

          <div className="flex-1 w-full flex flex-col justify-end">
              <div className="w-full relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white">
                  <CorsImage src="https://filedn.com/lOCbrTn2AD3hfK89ljyd7yV/web-principal/6.jpg" alt="Mecánico en campo" className="w-full h-auto max-h-[400px] object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-xtreme-dark to-transparent p-6 pt-16">
                      <p className="text-white text-lg font-black uppercase tracking-widest leading-tight">Resistencia y Poder <span className="text-xtreme-cyan">Directo en Campo</span></p>
                  </div>
              </div>
          </div>
        </div>

        {/* PÁGINA 4: COBERTURA MULTIMARCA */}
        <div className="dossier-page page-break-before flex flex-col relative bg-xtreme-dark text-white">
          <div className="absolute inset-0 hex-bg z-0 opacity-10"></div>
          
          <div className="p-12 relative z-10 flex-1 flex flex-col">
              <div className="flex items-center gap-4 mb-10">
                  <span className="bg-xtreme-cyan text-xtreme-dark font-black font-mono px-3 py-1 text-sm rounded">03</span>
                  <h2 className="text-3xl font-black uppercase tracking-widest text-white">Poder Multimarca</h2>
              </div>

              <p className="text-2xl text-slate-300 font-light mb-12 border-l-4 border-xtreme-cyan pl-6">
                  Más de <strong className="text-white font-bold">80 programas instalados</strong> en el mismo equipo. Cubrimos la inmensa mayoría de motores y sistemas en el mercado americano, europeo y asiático.
              </p>

              <div className="grid grid-cols-2 gap-x-12 gap-y-12 flex-1 content-start">
                  {/* Category 1 */}
                  <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-3xl p-8 backdrop-blur-sm">
                      <div className="flex items-center gap-4 mb-8 border-b border-[rgba(255,255,255,0.1)] pb-4">
                          <div className="w-14 h-14 bg-xtreme-cyan text-xtreme-dark rounded-xl flex items-center justify-center"><Truck className="w-8 h-8" /></div>
                          <h3 className="text-white font-black uppercase tracking-widest text-lg">Motores & Tractos</h3>
                      </div>
                      <ul className="text-base text-slate-300 space-y-5 font-medium">
                          <li className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-xtreme-cyan rounded-full"></div> Cummins (Insite, Calterm)</li>
                          <li className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-xtreme-cyan rounded-full"></div> Detroit (DiagnosticLink)</li>
                          <li className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-xtreme-cyan rounded-full"></div> Navistar / International</li>
                          <li className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-xtreme-cyan rounded-full"></div> Volvo & Mack (Tech Tool)</li>
                          <li className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-xtreme-cyan rounded-full"></div> Paccar (ESA, Davie4)</li>
                          <li className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-xtreme-cyan rounded-full"></div> Hino / Isuzu / Scania / MB</li>
                      </ul>
                  </div>

                  {/* Category 2 */}
                  <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-3xl p-8 backdrop-blur-sm">
                      <div className="flex items-center gap-4 mb-8 border-b border-[rgba(255,255,255,0.1)] pb-4">
                          <div className="w-14 h-14 bg-xtreme-cyan text-xtreme-dark rounded-xl flex items-center justify-center"><Tractor className="w-8 h-8" /></div>
                          <h3 className="text-white font-black uppercase tracking-widest text-lg">Maquinaria Pesada</h3>
                      </div>
                      <ul className="text-base text-slate-300 space-y-5 font-medium">
                          <li className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-xtreme-cyan rounded-full"></div> CAT (ET, SIS)</li>
                          <li className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-xtreme-cyan rounded-full"></div> John Deere (ADVISOR)</li>
                          <li className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-xtreme-cyan rounded-full"></div> Case Construction</li>
                          <li className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-xtreme-cyan rounded-full"></div> Bobcat / Kubota</li>
                          <li className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-xtreme-cyan rounded-full"></div> Komatsu / JCB</li>
                          <li className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-xtreme-cyan rounded-full"></div> Fendt / Massey</li>
                      </ul>
                  </div>

                  {/* Category 3 */}
                  <div className="col-span-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-3xl p-8 backdrop-blur-sm">
                      <div className="flex items-center gap-4 mb-8 border-b border-[rgba(255,255,255,0.1)] pb-4">
                          <div className="w-14 h-14 bg-xtreme-cyan text-xtreme-dark rounded-xl flex items-center justify-center"><Settings className="w-8 h-8" /></div>
                          <h3 className="text-white font-black uppercase tracking-widest text-lg">Transmisiones, Frenos & Utilitarios</h3>
                      </div>
                      <ul className="text-base text-slate-300 space-y-5 font-medium grid grid-cols-2 gap-x-12">
                          <li className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-xtreme-cyan rounded-full"></div> Allison Transmission (DOC)</li>
                          <li className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-xtreme-cyan rounded-full"></div> Eaton Service Ranger</li>
                          <li className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-xtreme-cyan rounded-full"></div> Bendix (Acom Pro)</li>
                          <li className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-xtreme-cyan rounded-full"></div> Meritor WABCO Toolbox</li>
                          <li className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-xtreme-cyan rounded-full"></div> Haldex Trailer ABS</li>
                          <li className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-xtreme-cyan rounded-full"></div> JPRO Professional</li>
                      </ul>
                  </div>
              </div>
          </div>
          
          <div className="h-6 w-full bg-gradient-to-r from-xtreme-cyan to-blue-600 mt-auto"></div>
        </div>

        {/* PÁGINA 5: RESPALDO, GARANTÍA */}
        <div className="dossier-page page-break-before flex flex-col p-12 relative bg-white">
          <div className="flex items-center gap-4 mb-16">
              <span className="bg-xtreme-dark text-white font-black font-mono px-3 py-1 text-sm rounded shadow-sm">04</span>
              <h2 className="text-3xl font-black uppercase tracking-widest text-slate-900">Calidad y Respaldo</h2>
          </div>

          <div className="flex-1 flex flex-col gap-12">
              <div className="bg-slate-50 p-10 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-4 mb-8 border-b border-slate-200 pb-6">
                      <div className="bg-emerald-100 text-emerald-600 p-4 rounded-xl"><CheckSquare className="w-8 h-8" /></div>
                      <h3 className="text-2xl font-black text-slate-900 uppercase">Filtros de Calidad Estrictos</h3>
                  </div>
                  <p className="text-lg text-slate-600 leading-relaxed mb-8">Antes de ser empacado, todo equipo pasa por una revisión técnica estricta para asegurar el 100% de operatividad en campo.</p>
                  <ul className="space-y-6 text-sm text-slate-800 font-bold uppercase tracking-wide grid grid-cols-2 gap-x-8">
                      <li className="flex items-center gap-4"><CheckCircle className="w-6 h-6 text-emerald-500" /> Pantalla y Touchpad</li>
                      <li className="flex items-center gap-4"><CheckCircle className="w-6 h-6 text-emerald-500" /> Software Activo</li>
                      <li className="flex items-center gap-4"><CheckCircle className="w-6 h-6 text-emerald-500" /> Salud de Batería</li>
                      <li className="flex items-center gap-4"><CheckCircle className="w-6 h-6 text-emerald-500" /> Puertos USB y WiFi</li>
                      <li className="flex items-center gap-4 col-span-2"><CheckCircle className="w-6 h-6 text-emerald-500" /> Testeo Físico de Comunicadores e Interfaces</li>
                  </ul>
              </div>

              <div className="bg-[rgba(239,246,255,0.5)] p-10 rounded-3xl border border-blue-100 shadow-sm">
                  <div className="flex items-center gap-4 mb-8 border-b border-blue-200 pb-6">
                      <div className="bg-blue-600 text-white p-4 rounded-xl"><ShieldAlert className="w-8 h-8" /></div>
                      <h3 className="text-2xl font-black text-slate-900 uppercase">Garantía y Soporte</h3>
                  </div>
                  <p className="text-lg text-slate-600 leading-relaxed mb-8">Nuestra meta es construir relaciones comerciales de años. No lo dejamos solo después de su compra.</p>
                  
                  <div className="space-y-8">
                      <div className="flex items-start gap-6">
                          <div className="bg-white p-4 rounded-full text-xtreme-blue shadow-sm"><Award className="w-8 h-8" /></div>
                          <div>
                              <strong className="block text-xl uppercase text-slate-900 tracking-wide mb-2">Garantía Directa</strong>
                              <p className="text-base text-slate-600 leading-relaxed">Cobertura de 90 días en reparación de hardware y software preinstalado (consulte términos de no modificación).</p>
                          </div>
                      </div>
                      <div className="flex items-start gap-6">
                          <div className="bg-white p-4 rounded-full text-xtreme-blue shadow-sm"><Headset className="w-8 h-8" /></div>
                          <div>
                              <strong className="block text-xl uppercase text-slate-900 tracking-wide mb-2">Soporte Técnico</strong>
                              <p className="text-base text-slate-600 leading-relaxed">Asistencia especializada vía WhatsApp para resolución de problemas del sistema operativo y herramientas de diagnóstico.</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
        </div>

        {/* PÁGINA 6: EL SIGUIENTE PASO */}
        <div className="dossier-page page-break-before flex flex-col bg-xtreme-dark text-white relative items-center justify-center pt-20">
          <div className="absolute inset-0 hex-bg z-0 opacity-20"></div>
          <div className="absolute top-1/2 left-1/2 w-full h-[600px] bg-[rgba(0,229,255,0.1)] rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2 z-0"></div>

          <div className="relative z-10 text-center px-12 w-full">
              <h2 className="text-[3.5rem] font-black uppercase tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                  La Solución Definitiva
              </h2>
              <p className="text-xl text-xtreme-cyan tracking-[0.2em] uppercase font-bold mb-12">Lista para trabajar</p>
              
              <div className="w-full flex justify-center items-center mb-16 relative">
                  <div className="absolute inset-0 bg-[rgba(0,229,255,0.2)] blur-[80px] rounded-full w-[80%] h-[80%] m-auto z-0"></div>
                  <CorsImage src="https://filedn.com/lOCbrTn2AD3hfK89ljyd7yV/web-principal/1.png" alt="Equipos Xtreme" className="w-full max-w-[85%] h-auto object-contain relative z-10 drop-shadow-[0_30px_40px_rgba(0,0,0,0.8)] scale-110" />
              </div>
          </div>

          <div className="w-full mt-auto bg-slate-900 p-12 border-t border-[rgba(255,255,255,0.1)] relative z-20 flex justify-between items-center">
              <div className="w-2/3 pr-10 border-r border-[rgba(255,255,255,0.2)]">
                  <p className="text-xtreme-cyan font-bold font-mono text-base tracking-widest uppercase mb-3">Siguiente Paso</p>
                  <h3 className="text-3xl font-black uppercase tracking-tight drop-shadow-md mb-4">Consulte la cotización adjunta</h3>
                  <p className="text-lg text-slate-400 font-light leading-relaxed">Revise el documento de cotización para conocer el modelo de laptop sugerido, el nivel de inversión y los métodos de pago.</p>
              </div>
              
              <div className="w-1/3 flex flex-col items-end pl-10 text-right">
                  <img crossOrigin="anonymous" src="https://filedn.com/lOCbrTn2AD3hfK89ljyd7yV/logo%20letras%20negrass1.png" alt="Logo" className="w-56 brightness-0 invert opacity-90 mb-6" />
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">Línea Directa de Ventas</p>
                  <p className="text-3xl font-black text-xtreme-cyan font-mono drop-shadow-md">(81) 1658 7138</p>
              </div>
          </div>
        </div>
      </div>
    );
  }
);
