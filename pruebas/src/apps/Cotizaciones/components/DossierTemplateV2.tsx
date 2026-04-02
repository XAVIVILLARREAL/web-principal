import React, { useState, useEffect } from 'react';
import { 
  Truck, Wrench, Laptop, MonitorPlay, ShieldCheck, Headset,
  MapPin, Clock, Award, Tractor, Settings, CheckSquare, ShieldAlert, TrendingDown, DollarSign, Radio, Cable, CheckCircle2
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
            // Try the most reliable proxy first to speed up loading
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

export const DossierTemplateV2 = React.forwardRef<HTMLDivElement, { cliente: any; equipo: string }>(
  ({ cliente, equipo }, ref) => {
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
        `}</style>

        {/* PÁGINA 1 */}
        <div className="dossier-page bg-xtreme-dark text-white p-12 justify-between">
            <header className="flex justify-between items-start w-full">
                <CorsImage src="https://filedn.com/lOCbrTn2AD3hfK89ljyd7yV/Logo%20sin%20fondo.png" alt="Xtreme Diagnostics Logo" className="w-64 object-contain" />
                <div className="text-right">
                    <p className="font-mono text-xtreme-cyan font-bold tracking-[0.2em] text-sm">PROPUESTA DE VALOR</p>
                    <p className="text-slate-400 text-xs mt-2 tracking-widest font-mono">EDICIÓN 2026</p>
                </div>
            </header>
            <main className="w-full">
                <div className="w-24 h-2 bg-xtreme-cyan mb-8"></div>
                <h1 className="text-[5.5rem] font-black leading-[0.9] tracking-tighter uppercase text-white">
                    Diagnóstico<br/>Nivel<br/><span className="text-xtreme-cyan">Agencia.</span>
                </h1>
                <p className="text-2xl text-slate-300 font-light leading-relaxed max-w-2xl mt-8 border-l-4 border-xtreme-cyan pl-6">
                    Soluciones integrales de hardware militar y software multimarca para tomar el control total de su flotilla o taller.
                </p>
                <div className="mt-8 inline-flex items-center gap-3 bg-[#1e293b80] border border-slate-700 py-3 px-6 rounded-lg">
                    <MapPin className="w-6 h-6 text-xtreme-cyan" />
                    <span className="text-sm font-bold tracking-widest uppercase text-white">
                        Presente en más de <span className="text-xtreme-cyan">1,000 talleres</span> en México
                    </span>
                </div>
            </main>
            <footer className="w-full flex justify-between items-end border-t border-slate-800 pt-8">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] font-bold text-slate-400 mb-2">Propuesta Preparada Para:</p>
                    <p className="text-3xl font-black text-white uppercase tracking-wide">{cliente?.name || 'Estimado Cliente'}</p>
                    {cliente?.phone && (
                        <p className="text-lg text-xtreme-cyan font-mono mt-1">Tel: {cliente.phone}</p>
                    )}
                </div>
                <div className="text-right">
                    <p className="font-mono text-sm text-xtreme-cyan font-bold tracking-widest">WWW.XTREMEDIAGNOSTICS.COM</p>
                    <p className="font-mono text-xs text-slate-400 mt-1">VENTAS Y SOPORTE NACIONAL</p>
                </div>
            </footer>
        </div>

        {/* PÁGINA 2 */}
        <div className="dossier-page page-break-before bg-white p-12">
            <header className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-xtreme-dark text-white flex items-center justify-center font-mono font-bold text-xl rounded-lg">01</div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">Tomando el Control Total</h2>
            </header>
            <h3 className="text-4xl font-black text-slate-900 leading-tight mb-8">
                El tiempo que su unidad pasa detenida,<br/><span className="text-xtreme-blue">es dinero que su negocio pierde.</span>
            </h3>
            <CorsImage src="https://filedn.com/lOCbrTn2AD3hfK89ljyd7yV/web-principal/3-4%20copia.jpg" alt="Imagen Principal" className="w-full h-auto max-h-64 object-contain rounded-2xl mb-8" />
            <div className="grid grid-cols-2 gap-10 flex-1">
                <div>
                    <h4 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3 uppercase tracking-wide">
                        <Truck className="w-8 h-8 text-xtreme-blue" /> Para Flotillas
                    </h4>
                    <p className="text-base text-slate-600 leading-relaxed font-medium mb-6">
                        En Xtreme Diagnostics entendemos que depender de concesionarios genera tiempos de espera interminables. Nuestra tecnología elimina a los intermediarios.
                    </p>
                    <ul className="space-y-4">
                        <li className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <strong className="text-slate-900 block text-sm uppercase mb-1 flex items-center"><Clock className="w-4 h-4 text-red-500 mr-2" /> Cero Dependencia</strong>
                            <p className="text-sm text-slate-600 leading-relaxed">No vuelva a esperar días por una cita. Diagnostique en su propio patio.</p>
                        </li>
                        <li className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <strong className="text-slate-900 block text-sm uppercase mb-1 flex items-center"><TrendingDown className="w-4 h-4 text-red-500 mr-2" /> Ahorro Radical</strong>
                            <p className="text-sm text-slate-600 leading-relaxed">Evite pagos por escaneos básicos y costosos arrastres de grúa (derates).</p>
                        </li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3 uppercase tracking-wide">
                        <Wrench className="w-8 h-8 text-xtreme-blue" /> Para Talleres
                    </h4>
                    <p className="text-base text-slate-600 leading-relaxed font-medium mb-6">
                        Eleve el nivel de su taller ofreciendo servicios de diagnóstico avanzado. Aumente su ticket promedio y recupere su inversión en semanas.
                    </p>
                    <ul className="space-y-4">
                        <li className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <strong className="text-slate-900 block text-sm uppercase mb-1 flex items-center"><Award className="w-4 h-4 text-xtreme-blue mr-2" /> Servicios Agencia</strong>
                            <p className="text-sm text-slate-600 leading-relaxed">Ofrezca recalibraciones, cambios de parámetros y regeneraciones.</p>
                        </li>
                        <li className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <strong className="text-slate-900 block text-sm uppercase mb-1 flex items-center"><DollarSign className="w-4 h-4 text-xtreme-blue mr-2" /> Rescates Rentables</strong>
                            <p className="text-sm text-slate-600 leading-relaxed">Lleve el equipo rudo a carretera y facture grandes servicios in situ.</p>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        {/* PÁGINA 3 */}
        <div className="dossier-page page-break-before bg-slate-50 p-12">
            <header className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-xtreme-dark text-white flex items-center justify-center font-mono font-bold text-xl rounded-lg">02</div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">Anatomía del Ecosistema</h2>
            </header>
            <p className="text-2xl text-slate-600 font-light mb-8">
                Enviamos el equipo <strong className="text-slate-900 font-bold">100% configurado</strong>. Está listo para llegar, conectar y facturar desde el minuto uno.
            </p>
            <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <Laptop className="w-10 h-10 text-xtreme-blue mb-4" />
                    <h4 className="font-black text-lg text-slate-900 mb-2">1. Computadora Militar</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">Laptops Panasonic Toughbook reacondicionadas, diseñadas para resistir caídas, polvo, grasa y vibraciones extremas del taller.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <MonitorPlay className="w-10 h-10 text-xtreme-blue mb-4" />
                    <h4 className="font-black text-lg text-slate-900 mb-2">2. Software Premium</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">Más de 80 programas de diagnóstico instalados nativamente. Sin máquinas virtuales lentas. El 90% de las licencias no caducan.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <Radio className="w-10 h-10 text-xtreme-blue mb-4" />
                    <h4 className="font-black text-lg text-slate-900 mb-2">3. Interfaz de Comunicación</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">Comunicador Nexiq USB Link 2 (o equivalente) de alta velocidad, compatible con protocolos OBD2, J1939, J1708 y CAN.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <Cable className="w-10 h-10 text-xtreme-blue mb-4" />
                    <h4 className="font-black text-lg text-slate-900 mb-2">4. Set de Cables OEM</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">Incluye conectores de 6 pines, 9 pines (verde/negro) y OBD2 estándar para cubrir cualquier vehículo pesado o ligero.</p>
                </div>
            </div>
            <div className="flex-1 w-full grid grid-cols-4 gap-4">
                <CorsImage src="https://filedn.com/lOCbrTn2AD3hfK89ljyd7yV/IMAGENES%20DOSSIER/Gemini_Generated_Image_cae45wcae45wcae4.png" alt="Collage 1" className="w-full h-56 object-cover rounded-2xl shadow-md" />
                <CorsImage src="https://filedn.com/lOCbrTn2AD3hfK89ljyd7yV/IMAGENES%20DOSSIER/Gemini_Generated_Image_blhjheblhjheblhj.png" alt="Collage 2" className="w-full h-56 object-cover rounded-2xl shadow-md" />
                <CorsImage src="https://filedn.com/lOCbrTn2AD3hfK89ljyd7yV/IMAGENES%20DOSSIER/Gemini_Generated_Image_pbwrlhpbwrlhpbwr.png" alt="Collage 3" className="w-full h-56 object-cover rounded-2xl shadow-md" />
                <CorsImage src="https://filedn.com/lOCbrTn2AD3hfK89ljyd7yV/web-principal/1.png" alt="Collage 4" className="w-full h-56 object-cover rounded-2xl shadow-md" />
            </div>
        </div>

        {/* PÁGINA 4 */}
        <div className="dossier-page page-break-before bg-xtreme-dark text-white p-12">
            <header className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-xtreme-cyan text-xtreme-dark flex items-center justify-center font-mono font-bold text-xl rounded-lg">03</div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-white">Poder Multimarca</h2>
            </header>
            <p className="text-2xl text-slate-300 font-light mb-8 border-l-4 border-xtreme-cyan pl-6">
                Más de <strong className="text-white font-bold">80 programas instalados</strong> en el mismo equipo. Cubrimos la inmensa mayoría de motores y sistemas en el mercado americano, europeo y asiático.
            </p>
            <div className="grid grid-cols-2 gap-x-10 gap-y-8 flex-1">
                <div>
                    <div className="flex items-center gap-4 mb-6 border-b border-slate-700 pb-4">
                        <Truck className="w-8 h-8 text-xtreme-cyan" />
                        <h3 className="text-2xl font-bold text-white uppercase tracking-wide">Motores & Tractos</h3>
                    </div>
                    <ul className="space-y-4 text-slate-300 font-medium text-lg">
                        <li className="flex items-center gap-3"><div className="w-2 h-2 bg-xtreme-cyan rounded-full"></div> Cummins (Insite, Calterm)</li>
                        <li className="flex items-center gap-3"><div className="w-2 h-2 bg-xtreme-cyan rounded-full"></div> Detroit (DiagnosticLink)</li>
                        <li className="flex items-center gap-3"><div className="w-2 h-2 bg-xtreme-cyan rounded-full"></div> Navistar / International</li>
                        <li className="flex items-center gap-3"><div className="w-2 h-2 bg-xtreme-cyan rounded-full"></div> Volvo & Mack (Tech Tool)</li>
                        <li className="flex items-center gap-3"><div className="w-2 h-2 bg-xtreme-cyan rounded-full"></div> Paccar (ESA, Davie4)</li>
                        <li className="flex items-center gap-3"><div className="w-2 h-2 bg-xtreme-cyan rounded-full"></div> Hino / Isuzu / Scania / MB</li>
                    </ul>
                </div>
                <div>
                    <div className="flex items-center gap-4 mb-6 border-b border-slate-700 pb-4">
                        <Tractor className="w-8 h-8 text-xtreme-cyan" />
                        <h3 className="text-2xl font-bold text-white uppercase tracking-wide">Maquinaria Pesada</h3>
                    </div>
                    <ul className="space-y-4 text-slate-300 font-medium text-lg">
                        <li className="flex items-center gap-3"><div className="w-2 h-2 bg-xtreme-cyan rounded-full"></div> CAT (ET, SIS)</li>
                        <li className="flex items-center gap-3"><div className="w-2 h-2 bg-xtreme-cyan rounded-full"></div> John Deere (ADVISOR)</li>
                        <li className="flex items-center gap-3"><div className="w-2 h-2 bg-xtreme-cyan rounded-full"></div> Case Construction</li>
                        <li className="flex items-center gap-3"><div className="w-2 h-2 bg-xtreme-cyan rounded-full"></div> Bobcat / Kubota</li>
                        <li className="flex items-center gap-3"><div className="w-2 h-2 bg-xtreme-cyan rounded-full"></div> Komatsu / JCB</li>
                        <li className="flex items-center gap-3"><div className="w-2 h-2 bg-xtreme-cyan rounded-full"></div> Fendt / Massey</li>
                    </ul>
                </div>
                <div className="col-span-2 mt-4">
                    <div className="flex items-center gap-4 mb-6 border-b border-slate-700 pb-4">
                        <Settings className="w-8 h-8 text-xtreme-cyan" />
                        <h3 className="text-2xl font-bold text-white uppercase tracking-wide">Transmisiones, Frenos & Utilitarios</h3>
                    </div>
                    <ul className="grid grid-cols-2 gap-4 text-slate-300 font-medium text-lg">
                        <li className="flex items-center gap-3"><div className="w-2 h-2 bg-xtreme-cyan rounded-full"></div> Allison Transmission</li>
                        <li className="flex items-center gap-3"><div className="w-2 h-2 bg-xtreme-cyan rounded-full"></div> Eaton Service Ranger</li>
                        <li className="flex items-center gap-3"><div className="w-2 h-2 bg-xtreme-cyan rounded-full"></div> Bendix (Acom Pro)</li>
                        <li className="flex items-center gap-3"><div className="w-2 h-2 bg-xtreme-cyan rounded-full"></div> Meritor WABCO Toolbox</li>
                        <li className="flex items-center gap-3"><div className="w-2 h-2 bg-xtreme-cyan rounded-full"></div> Haldex Trailer ABS</li>
                        <li className="flex items-center gap-3"><div className="w-2 h-2 bg-xtreme-cyan rounded-full"></div> JPRO Professional</li>
                    </ul>
                </div>
            </div>
        </div>

        {/* PÁGINA 5 */}
        <div className="dossier-page page-break-before bg-white p-12">
            <header className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-xtreme-dark text-white flex items-center justify-center font-mono font-bold text-xl rounded-lg">04</div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">Calidad y Respaldo</h2>
            </header>
            <div className="flex-1 flex flex-col justify-center gap-6">
                <div className="flex gap-6 items-start bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                        <CheckSquare className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-wide mb-2">Control de Calidad Estricto</h3>
                        <p className="text-slate-600 text-base leading-relaxed mb-4">Cada equipo pasa por un riguroso proceso de pruebas antes de ser enviado. Garantizamos que reciba una herramienta lista para el trabajo duro.</p>
                        <ul className="grid grid-cols-2 gap-y-2 gap-x-6 text-xs text-slate-800 font-bold uppercase tracking-wide">
                            <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Pantalla y Touchpad</li>
                            <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Software Activo</li>
                            <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Salud de Batería</li>
                            <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Puertos USB y WiFi</li>
                        </ul>
                    </div>
                </div>
                <div className="flex gap-6 items-start bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-wide mb-2">Garantía Directa</h3>
                        <p className="text-slate-600 text-base leading-relaxed">Ofrecemos 90 días de garantía directa en reparación de hardware y software preinstalado.</p>
                    </div>
                </div>
                <div className="flex gap-6 items-start bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
                        <Headset className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-wide mb-2">Soporte Técnico Especializado</h3>
                        <p className="text-slate-600 text-base leading-relaxed">Asistencia especializada vía WhatsApp para resolución de problemas del sistema operativo.</p>
                    </div>
                </div>
            </div>
        </div>

        {/* PÁGINA 6 */}
        <div className="dossier-page page-break-before bg-xtreme-dark text-white p-12 justify-between text-center">
            <div className="mt-8">
                <h2 className="text-[3.5rem] font-black uppercase tracking-tighter mb-4 text-white leading-none">La Solución Definitiva</h2>
                <p className="text-xl text-xtreme-cyan tracking-[0.2em] uppercase font-bold">Lista para trabajar</p>
            </div>
            <div className="flex-1 flex justify-center items-center py-8">
                <CorsImage src="https://filedn.com/lOCbrTn2AD3hfK89ljyd7yV/IMAGENES%20DOSSIER/Portada%20face%20xtreme%20diagnostics.png" alt="Kit de Diagnóstico Final" className="w-full max-w-2xl h-72 object-contain" />
            </div>
            <div className="w-full bg-[#1e293b80] border border-slate-700 p-8 rounded-2xl flex justify-between items-center text-left">
                <div>
                    <p className="text-xtreme-cyan font-bold font-mono text-xs tracking-widest uppercase mb-2">Siguiente Paso</p>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">Consulte su cotización</h3>
                    <p className="text-sm text-slate-400 font-light max-w-md">Revise el documento adjunto para conocer el modelo de laptop sugerido.</p>
                </div>
                <div className="flex items-center gap-6 border-l border-slate-700 pl-8">
                    <div className="text-right">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Línea Directa de Ventas</p>
                        <p className="text-3xl font-black text-white font-mono mb-2">(81) 1658 7138</p>
                    </div>
                    <div className="bg-white p-2 rounded-xl shrink-0">
                        <CorsImage src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://www.xtremediagnostics.com/catalogo" alt="QR Catálogo" className="w-16 h-16 object-contain" />
                    </div>
                </div>
            </div>
        </div>

      </div>
    );
  }
);
