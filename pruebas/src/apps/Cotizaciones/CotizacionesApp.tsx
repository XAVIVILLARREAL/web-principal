import { useState, useEffect, useRef } from 'react';
import { FileText, Send, CheckCircle, AlertCircle, Loader2, Plus, Trash2, Tag, Gift, Stamp, PenTool, History, Copy, Save, FilePlus, Menu, X, Eye, Columns, AlertTriangle, Search, Moon, Sun, XCircle, Download, ShieldCheck, BarChart3, ScanLine } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { format, addBusinessDays } from 'date-fns';
import { es } from 'date-fns/locale';
import Papa from 'papaparse';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { openS3File } from '../../lib/s3Utils';
import { CotizacionTemplate, CotizacionData, CotizacionItem } from './components/CotizacionTemplate';
import { DossierTemplate } from './components/DossierTemplate';
import { DossierTemplateV2 } from './components/DossierTemplateV2';
import { SendingOverlay } from './components/SendingOverlay';

interface ProductData {
  name: string;
  price: number;
  inventory: number;
  description: string;
}

const ProductSelector = ({ item, products, loadingProducts, updateItem }: { item: CotizacionItem, products: ProductData[], loadingProducts: boolean, updateItem: (id: string, field: keyof CotizacionItem, value: any) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwd, setPwd] = useState('');
  const [pwdError, setPwdError] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowPwd(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleSelect = (val: string) => {
    if (val === 'Personalizado') {
      setShowPwd(true);
    } else {
      const prod = products.find(p => p.name === val);
      if (prod) {
        updateItem(item.id, 'name', prod.name);
        updateItem(item.id, 'unitPrice', prod.price);
        updateItem(item.id, 'description', prod.description);
      }
      setIsOpen(false);
      setSearch('');
    }
  };

  const verifyPwd = () => {
    const p = pwd.toLowerCase();
    const names = ['ivan', 'valeria', 'jona', 'javier'];
    const hasName = names.some(n => p.includes(n));
    const hasDigits = (p.match(/\d/g) || []).length >= 1;
    if (hasName && hasDigits) {
      updateItem(item.id, 'name', 'Personalizado: ');
      setShowPwd(false);
      setIsOpen(false);
      setPwd('');
      setPwdError('');
    } else {
      setPwdError('Contraseña incorrecta');
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {loadingProducts ? (
        <div className="flex items-center gap-2 py-1.5 text-sm sm:text-base text-[var(--text-muted)]">
          <Loader2 size={14} className="animate-spin" /> Cargando catálogo...
        </div>
      ) : (
        <>
          <div 
            className="w-full bg-transparent border-b border-[var(--border-main)] py-1.5 text-sm sm:text-base font-bold text-[var(--text-main)] outline-none hover:border-cyan-500 transition-colors cursor-pointer flex justify-between items-center"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="truncate">{item.name || 'Selecciona un producto o servicio'}</span>
            <Search size={14} className="text-[var(--text-muted)] shrink-0 ml-2" />
          </div>

          {isOpen && !showPwd && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-lg shadow-2xl max-h-80 flex flex-col overflow-hidden">
              <div className="p-2 border-b border-[var(--border-main)] shrink-0 bg-[var(--bg-panel)]">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Buscar producto..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded px-3 py-2 text-sm text-[var(--text-main)] outline-none focus:border-cyan-500"
                />
              </div>
              <div className="overflow-y-auto flex-1 p-1">
                {filteredProducts.map((p, i) => (
                  <div 
                    key={i} 
                    onClick={() => handleSelect(p.name)}
                    className="px-3 py-2.5 hover:bg-[var(--border-subtle)] cursor-pointer rounded text-sm text-[var(--text-main)] flex justify-between items-center border-b border-[var(--border-subtle)] last:border-0"
                  >
                    <span className="truncate pr-4">{p.name}</span>
                    <span className="font-mono text-cyan-400 shrink-0">${p.price.toLocaleString('es-MX')}</span>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="px-3 py-4 text-center text-sm text-[var(--text-muted)]">No se encontraron productos</div>
                )}
                <div 
                  onClick={() => handleSelect('Personalizado')}
                  className="px-3 py-3 mt-1 border-t border-[var(--border-main)] hover:bg-cyan-500/10 cursor-pointer rounded text-sm text-cyan-400 font-bold flex items-center gap-2 bg-[var(--bg-panel)]"
                >
                  ✨ Concepto Personalizado
                </div>
              </div>
            </div>
          )}

          {isOpen && showPwd && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--bg-card)] border border-cyan-500/30 rounded-lg shadow-2xl p-4">
              <label className="block text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-2">
                Contraseña de Autorización
              </label>
              <input 
                type="password" 
                autoFocus
                placeholder="Ej: 10marzovaleria" 
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && verifyPwd()}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded px-3 py-2 text-sm text-[var(--text-main)] outline-none focus:border-cyan-500 mb-2"
              />
              {pwdError && <p className="text-red-400 text-xs mb-2">{pwdError}</p>}
              <div className="flex justify-end gap-2 mt-3">
                <button onClick={() => setShowPwd(false)} className="px-3 py-1.5 text-xs text-[var(--text-subtle)] hover:text-[var(--text-main)] transition-colors">Cancelar</button>
                <button onClick={verifyPwd} className="px-3 py-1.5 text-xs bg-cyan-500 text-black font-bold rounded hover:bg-cyan-400 transition-colors">Verificar</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default function CotizacionesApp({ contactIdProp, conversationIdProp }: { contactIdProp?: string, conversationIdProp?: string }) {
  // Theme and Progress state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('theme') as 'dark' | 'light') || 'dark');
  const [progressStep, setProgressStep] = useState(0);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [generatedPdfs, setGeneratedPdfs] = useState<{cot: Blob, dos: Blob} | null>(null);
  const [showSendOptions, setShowSendOptions] = useState(false);
  const [sendOptions, setSendOptions] = useState({ includeDossier: true });
  const [sendActionArgs, setSendActionArgs] = useState<{ overwrite: boolean, overrideFolio?: string } | null>(null);

  const handleSendClick = (overwrite: boolean, overrideFolio?: string) => {
    setSendActionArgs({ overwrite, overrideFolio });
    setShowSendOptions(true);
  };

  const handleDownloadManual = () => {
    if (!generatedPdfs) return;
    
    const sanitizeName = (name: string) => name.replace(/[^a-zA-Z0-9]/g, '_');
    const safePhone = cliente.phone ? cliente.phone.replace(/[^0-9]/g, '') : 'SinTelefono';
    const safeName = sanitizeName(cliente.name || 'Cliente');
    const cotFileName = `${safePhone}_${safeName}_Cotizacion_${folio}.pdf`;
    const dosFileName = `${safePhone}_${safeName}_Propuesta_Valor.pdf`;

    const urlCot = URL.createObjectURL(generatedPdfs.cot);
    const aCot = document.createElement('a');
    aCot.href = urlCot;
    aCot.download = cotFileName;
    aCot.click();
    URL.revokeObjectURL(urlCot);

    setTimeout(() => {
      const urlDos = URL.createObjectURL(generatedPdfs.dos);
      const aDos = document.createElement('a');
      aDos.href = urlDos;
      aDos.download = dosFileName;
      aDos.click();
      URL.revokeObjectURL(urlDos);
    }, 500);
  };

  // Función para esperar a que todas las imágenes en un elemento estén cargadas
  const waitForImages = async (element: HTMLElement | null) => {
    if (!element) return;
    const imgs = Array.from(element.querySelectorAll('img'));
    const loadingDivs = Array.from(element.querySelectorAll('[data-loading="true"]'));
    
    const promises = imgs.map(img => {
      if (img.complete && img.getAttribute('data-loaded') === 'true') return Promise.resolve();
      return new Promise(resolve => {
        const check = () => {
          if (img.getAttribute('data-loaded') === 'true' || img.complete) {
            resolve(true);
          } else {
            setTimeout(check, 100);
          }
        };
        img.onload = resolve;
        img.onerror = resolve;
        check();
      });
    });

    const loadingPromises = loadingDivs.map(div => {
      return new Promise(resolve => {
        const check = () => {
          if (!element.contains(div) || div.getAttribute('data-loading') !== 'true') {
            resolve(true);
          } else {
            setTimeout(check, 200);
          }
        };
        check();
      });
    });

    await Promise.all([...promises, ...loadingPromises]);
    // También esperamos un poco extra por si hay componentes con carga asíncrona (como CorsImage)
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  const generateDossierPdfBlob = async (dossierElement: HTMLElement, opt: any): Promise<Blob> => {
    const pages = Array.from(dossierElement.querySelectorAll('.dossier-page')) as HTMLElement[];
    if (pages.length === 0) {
      return await html2pdf().set(opt).from(dossierElement).output('blob');
    }

    const originalStyles = pages.map(p => ({
      marginBottom: p.style.marginBottom,
      marginTop: p.style.marginTop,
      boxShadow: p.style.boxShadow,
      border: p.style.border,
      borderRadius: p.style.borderRadius
    }));

    pages.forEach(p => {
      p.style.marginBottom = '0px';
      p.style.marginTop = '0px';
      p.style.boxShadow = 'none';
      p.style.border = 'none';
      p.style.borderRadius = '0px';
    });

    const pdf = new jsPDF({ unit: 'px', format: [816, 1056], orientation: 'portrait', hotfixes: ['px_scaling'] });

    for (let i = 0; i < pages.length; i++) {
      if (i > 0) {
        pdf.addPage([816, 1056], 'portrait');
      }
      
      const canvas = await html2canvas(pages[i], {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        windowWidth: 816,
        height: 1056,
        logging: false,
        onclone: (clonedDoc) => {
          const hiddenContainers = clonedDoc.querySelectorAll('div[class*="-left-[9999px]"]');
          hiddenContainers.forEach(el => {
            (el as HTMLElement).style.left = '0px';
            (el as HTMLElement).style.position = 'relative';
          });
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(imgData, 'JPEG', 0, 0, 816, 1056);
    }

    pages.forEach((p, i) => {
      p.style.marginBottom = originalStyles[i].marginBottom;
      p.style.marginTop = originalStyles[i].marginTop;
      p.style.boxShadow = originalStyles[i].boxShadow;
      p.style.border = originalStyles[i].border;
      p.style.borderRadius = originalStyles[i].borderRadius;
    });

    return pdf.output('blob');
  };

  const handleDownloadTest = async () => {
    setLoading(true);
    setStatus('Esperando a que carguen las imágenes...');
    try {
      const sanitizeName = (name: string) => name.replace(/[^a-zA-Z0-9]/g, '_');
      const safePhone = cliente.phone ? cliente.phone.replace(/[^0-9]/g, '') : 'SinTelefono';
      const safeName = sanitizeName(cliente.name || 'Cliente');
      const dosFileName = `${safePhone}_${safeName}_Propuesta_Valor_PRUEBA.pdf`;

      const optDos = {
        margin: [0, 0, 0, 0] as [number, number, number, number],
        filename: dosFileName,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true, 
          windowWidth: 816,
          allowTaint: true,
          onclone: (doc: Document) => {
            const pages = doc.querySelectorAll('.dossier-page');
            pages.forEach((p: any) => {
              p.style.marginBottom = '0px';
              p.style.marginTop = '0px';
              p.style.boxShadow = 'none';
            });
          }
        },
        jsPDF: { unit: 'px', format: [816, 1056] as [number, number], orientation: 'portrait' as const, hotfixes: ['px_scaling'] },
        pagebreak: { mode: 'css', before: '.page-break-before' }
      };

      // Wait for images to load
      await waitForImages(dossierRef.current);
      
      setStatus('Generando PDF...');

      // Generate Dossier
      const pdfDosBlob = await generateDossierPdfBlob(dossierRef.current, optDos);
      const urlDos = URL.createObjectURL(pdfDosBlob);
      const aDos = document.createElement('a');
      aDos.href = urlDos;
      aDos.download = dosFileName;
      aDos.click();
      URL.revokeObjectURL(urlDos);

    } catch (e: any) {
      console.error('Error generating test PDFs:', e);
      setAppError('Error al generar PDFs de prueba: ' + (e.message || 'Desconocido'));
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Estado del Cliente
  const [contactId, setContactId] = useState<string | null>(null);
  const [convId, setConvId] = useState<string | null>(null);
  const [cliente, setCliente] = useState({
    name: 'Nombre del Cliente (Pendiente)',
    rfc: 'RFC Pendiente',
    contact: 'Contacto no especificado',
    address: 'Dirección pendiente de proporcionar',
    email: 'correo@pendiente.com',
    phone: 'Teléfono no especificado',
    sistema: 'ECM PRO',
    sector: 'Diesel pesado'
  });

  // Estado de la Cotización
  const [folio, setFolio] = useState('');
  const [items, setItems] = useState<CotizacionItem[]>([
    {
      id: '1',
      name: 'Scanner Panasonic Toughbook CF-54',
      description: 'Uso rudo militar, Intel i5 vPro, 16GB RAM, 512GB SSD. Reacondicionado Grado A con garantía extendida de 24 meses.',
      qty: 1,
      unitPrice: 28500.00
    }
  ]);
  const [discountAmount, setDiscountAmount] = useState(0); // Default 0
  const [showGifts, setShowGifts] = useState(false); // Default false
  const [isPaid, setIsPaid] = useState(false);
  const [isWarrantyPayment, setIsWarrantyPayment] = useState(false);
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [supervisorCode, setSupervisorCode] = useState('');
  const [supportTicketNumber, setSupportTicketNumber] = useState('');
  const [wasPaid, setWasPaid] = useState(false);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Transferencia');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [signer, setSigner] = useState<'Valeria' | 'Ivan' | 'David'>('Valeria');
  const [notes, setNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [warranty, setWarranty] = useState('Sujeto a los Términos y Condiciones vigentes. Escanee el código QR para consultarlos.');

  // Historial y UI
  const [history, setHistory] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'both'>('both');
  const [viewMode, setViewMode] = useState<'history' | 'editor'>('history');
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [appError, setAppError] = useState<string | null>(null);
  const [appConfirm, setAppConfirm] = useState<{ message: string, onConfirm: () => void } | null>(null);

  const cotizacionRef = useRef<HTMLDivElement>(null);
  const dossierRef = useRef<HTMLDivElement>(null);

  // Configs
  const CW_CONFIG = {
    url: 'https://crm.xtremediagnostics.com',
    token: 'EQN2pbRUuBrjdwEmM7PYyjY6'
  };
  const S3_CONFIG = {
    endpoint: 'https://s3.xtremediagnostics.com',
    bucket: 'cotizaciones-xtreme',
    accessKey: 'PMVOF73TI5D7H0HQ0PX3',
    secretKey: 'GyQgYLdOu8jp2KzAl58vy92EqTPS7DA+0KpiUz2l'
  };
  const DB_CONFIG = {
    url: 'https://api-datos.xtremediagnostics.com'
  };

  const generateNextFolio = (lastFolio: string) => {
    const year = new Date().getFullYear();
    if (!lastFolio) return `XT-${year}-001`;
    const parts = lastFolio.split('-');
    if (parts.length === 3 && parts[1] === year.toString()) {
      const nextNum = parseInt(parts[2], 10) + 1;
      return `XT-${year}-${nextNum.toString().padStart(3, '0')}`;
    }
    return `XT-${year}-001`;
  };

  const fetchFolio = async () => {
    try {
      const resFolio = await fetch(`${DB_CONFIG.url}/cotizaciones?select=detalles&order=created_at.desc&limit=20`);
      if (resFolio.ok) {
        const contentType = resFolio.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const dataFolio = await resFolio.json();
          
          // Find the first valid folio that matches XT-YYYY-XXX
          const currentYear = new Date().getFullYear().toString();
          const validEntry = dataFolio.find((d: any) => {
            const f = d.detalles?.folio;
            return f && f.startsWith(`XT-${currentYear}-`) && f.split('-').length === 3;
          });

          if (validEntry) {
            setFolio(generateNextFolio(validEntry.detalles.folio));
          } else {
            setFolio(`XT-${currentYear}-001`);
          }
        } else {
          console.warn("Folio: La respuesta no es JSON válido. Verifica que el backend esté desplegado.");
          setFolio(`XT-${new Date().getFullYear()}-001`);
        }
      } else {
        setFolio(`XT-${new Date().getFullYear()}-001`);
      }
    } catch (e) {
      setFolio(`XT-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`);
    }
  };

  const fetchHistory = async (cid: string) => {
    if (!cid) return;
    console.log(`Fetching history for contact_id: ${cid}`);
    try {
      const resHist = await fetch(`${DB_CONFIG.url}/cotizaciones?contact_id=eq.${cid}&order=created_at.desc`);
      if (resHist.ok) {
        const contentType = resHist.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const dataHist = await resHist.json();
          setHistory(dataHist);
          console.log(`Fetched ${dataHist.length} quotes for contact_id: ${cid}`);
        } else {
          console.warn("Historial: La respuesta no es JSON válido. Verifica que el backend esté desplegado.");
        }
      } else {
        console.error(`Error fetching history for ${cid}:`, resHist.status);
      }
    } catch (e) {
      console.warn("No se pudo obtener el historial", e);
    }
  };

  useEffect(() => {
    fetchFolio();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const sheetUrl = 'https://docs.google.com/spreadsheets/d/1SX3XCJgNeuAbBaDvTuvqHGIDBQU1ZYxn8L4NjH_umic/gviz/tq?tqx=out:csv&sheet=Catalogo%20e%20inventario';
        const response = await fetch(sheetUrl);
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const parsedProducts: ProductData[] = results.data
              .filter((row: any) => {
                const keys = Object.keys(row);
                const nameKey = keys.find(k => k.trim() === 'Producto/Servicio');
                return nameKey && row[nameKey] && row[nameKey].trim() !== '';
              })
              .map((row: any) => {
                const keys = Object.keys(row);
                const nameKey = keys.find(k => k.trim() === 'Producto/Servicio');
                const priceKey = keys.find(k => k.trim() === 'Precio final con iva');
                const invKey = keys.find(k => k.trim() === 'Pcs totales');
                const descKey = keys.find(k => k.trim() === 'Descripcion detallada');

                const priceStr = priceKey ? (row[priceKey] || '0') : '0';
                const price = parseFloat(priceStr.toString().replace(/[^0-9.-]+/g, '')) || 0;
                
                const invStr = invKey ? (row[invKey] || '0') : '0';
                const inventory = parseInt(invStr.toString().replace(/[^0-9.-]+/g, ''), 10) || 0;

                const description = descKey ? (row[descKey] || '') : '';

                return {
                  name: row[nameKey!].trim(),
                  price,
                  inventory,
                  description: description.trim()
                };
              });
            setProducts(parsedProducts);
            setLoadingProducts(false);
          },
          error: (err: any) => {
            console.error("Error parsing CSV:", err);
            setLoadingProducts(false);
          }
        });
      } catch (e) {
        console.error("Failed to fetch products", e);
        setLoadingProducts(false);
      }
    };

    fetchProducts();

    const handleMessage = (event: MessageEvent) => {
      try {
        let data = event.data;
        
        // Handle request for context from pop-outs
        if (data === 'request_context') {
          if (contactId || convId) {
            try {
              (event.source as Window)?.postMessage({
                type: 'chatwoot_context',
                contact_id: contactId,
                conversation_id: convId
              }, '*');
            } catch (e) {}
          }
          return;
        }

        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) {
            // Not JSON, ignore
            return;
          }
        }
        
        // Handle Chatwoot context directly or forwarded from wrapper
        if (data && data.event === 'appContext') {
          const ctx = data.data;
          if (ctx.conversation && ctx.conversation.id) {
            setConvId(ctx.conversation.id.toString());
          }
          if (ctx.contact && ctx.contact.id) {
            setContactId(ctx.contact.id.toString());
          }
        }
        
        // Handle custom forwarded context from wrapper
        if (data && data.type === 'chatwoot_context') {
          if (data.conversation_id) setConvId(data.conversation_id.toString());
          if (data.contact_id) setContactId(data.contact_id.toString());
        }
        
        // Also check global params if they were updated by parent
        if (window.XTREME_URL_PARAMS?.contact_id) {
          setContactId(window.XTREME_URL_PARAMS.contact_id);
        }
        if (window.XTREME_URL_PARAMS?.conversation_id) {
          setConvId(window.XTREME_URL_PARAMS.conversation_id);
        }
      } catch (e) {
        console.error("Error handling message:", e);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Request context immediately and then every 2 seconds for a few times
    // in case the iframe loads before Chatwoot is ready to send the message
    const requestContext = () => {
      try {
        // Request from Chatwoot (if in iframe)
        if (window.parent !== window) {
          window.parent.postMessage('chatwoot-dashboard-app:fetch-info', '*');
          window.parent.postMessage('request_context', '*');
        }
        // Request from opener (if in pop-out)
        if (window.opener) {
          window.opener.postMessage('request_context', '*');
        }
      } catch (e) {}
    };
    
    requestContext();
    const intervalId = setInterval(requestContext, 2000);
    
    // Stop requesting after 10 seconds
    setTimeout(() => clearInterval(intervalId), 10000);

    // Fallbacks
    const params = new URLSearchParams(window.location.search);
    let urlConvId = conversationIdProp || params.get('conversation_id') || window.XTREME_URL_PARAMS?.conversation_id;
    let urlCid = contactIdProp || params.get('contact_id') || window.XTREME_URL_PARAMS?.contact_id;

    // Try to get conversation ID from referrer if not in URL
    if (!urlConvId) {
      const match = document.referrer.match(/conversations\/(\d+)/);
      if (match) urlConvId = match[1];
    }
    
    // Try to get conversation ID from parent window URL if possible (might be blocked by CORS)
    if (!urlConvId) {
      try {
        if (window.parent !== window && window.parent.location.href) {
          const match = window.parent.location.href.match(/conversations\/(\d+)/);
          if (match) urlConvId = match[1];
        }
      } catch (e) {
        // CORS error expected if domains don't match
      }
    }

    if (urlConvId) {
      setConvId(urlConvId);
      // If we have conversation ID but no contact ID, fetch it from Chatwoot API
      if (!urlCid) {
        fetch(`${CW_CONFIG.url}/api/v1/accounts/1/conversations/${urlConvId}`, {
          headers: { 
            'api-access-token': CW_CONFIG.token
          }
        })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (data.meta?.sender?.id) {
            setContactId(data.meta.sender.id.toString());
          }
        })
        .catch(e => console.warn("No se pudo obtener el contact_id de la conversación", e));
      }
    }

    if (urlCid) {
      setContactId(urlCid);
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(intervalId);
    };
  }, [contactIdProp, conversationIdProp]);

  useEffect(() => {
    if (!contactId) return;

    const fetchClient = async () => {
      try {
        const res = await fetch(`${CW_CONFIG.url}/api/v1/accounts/1/contacts/${contactId}`, {
          headers: { 
            'api-access-token': CW_CONFIG.token
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.payload?.name) {
            setCliente(prev => ({ 
              ...prev, 
              name: data.payload.name || 'Nombre del Cliente (Pendiente)',
              email: data.payload.email || 'correo@pendiente.com',
              phone: data.payload.phone_number || 'Teléfono no especificado'
            }));
          }
        }
      } catch (e) {
        console.warn("No se pudo obtener el cliente de Chatwoot", e);
      }
    };

    fetchClient();
    if (contactId) {
      fetchHistory(contactId);
    }
  }, [contactId]);

  const handleNewQuote = async () => {
    setEditingId(null);
    setItems([{ id: Date.now().toString(), name: '', description: '', qty: 1, unitPrice: 0 }]);
    setDiscountAmount(0);
    setShowGifts(false);
    setIsPaid(false);
    setWasPaid(false);
    setSupportTicketNumber('');
    setPaymentDate('');
    setPaymentMethod('Transferencia');
    setPaymentNotes('');
    setSuccess(false);
    setShowSidebar(false);
    setViewMode('editor');
    
    // Always fetch a fresh folio
    await fetchFolio();
    
    if (contactId) {
      await fetchHistory(contactId);
    }
  };

  const handleDeleteQuote = async () => {
    if (!editingId) return;
    if (isPaid) {
      setAppError("No se puede borrar una cotización pagada.");
      return;
    }
    setAppConfirm({
      message: "¿Estás seguro de que deseas eliminar esta cotización?",
      onConfirm: async () => {
        setLoading(true);
        try {
          const res = await fetch(`${DB_CONFIG.url}/cotizaciones?id=eq.${editingId}`, {
            method: 'DELETE'
          });
          if (!res.ok) {
            throw new Error("Error al eliminar la cotización");
          }
          
          if (contactId) {
            await fetchHistory(contactId);
          }
          setViewMode('history');
          setEditingId(null);
        } catch (e) {
          console.error(e);
          setAppError("No se pudo eliminar la cotización");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const loadQuote = (quote: any) => {
    setEditingId(quote.id);
    const det = quote.detalles || {};
    if (det.folio) setFolio(det.folio);
    if (det.items) setItems(det.items);
    if (det.discountAmount !== undefined) setDiscountAmount(det.discountAmount);
    if (det.showGifts !== undefined) setShowGifts(det.showGifts);
    if (det.isPaid !== undefined) {
      setIsPaid(det.isPaid);
      setWasPaid(det.isPaid);
      setSupportTicketNumber(det.supportTicket || '');
    } else {
      setIsPaid(false);
      setWasPaid(false);
      setSupportTicketNumber('');
    }
    if (det.paymentDate) setPaymentDate(det.paymentDate); else setPaymentDate('');
    if (det.paymentMethod) setPaymentMethod(det.paymentMethod); else setPaymentMethod('Transferencia');
    if (det.paymentNotes) setPaymentNotes(det.paymentNotes); else setPaymentNotes('');
    if (det.signer) setSigner(det.signer);
    if (det.notes !== undefined) setNotes(det.notes);
    if (det.internalNotes !== undefined) setInternalNotes(det.internalNotes);
    if (det.warranty) setWarranty(det.warranty);
    setSuccess(false);
    setShowSidebar(false);
    setViewMode('editor');
  };

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), name: '', description: '', qty: 1, unitPrice: 0 }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof CotizacionItem, value: any) => {
    setItems(prevItems => prevItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const enviarPaqueteCompleto = async (overwrite: boolean, overrideFolio?: string) => {
    const currentFolio = overrideFolio || folio;
    let currentConvId = convId || new URLSearchParams(window.location.search).get('conversation_id') || window.XTREME_URL_PARAMS?.conversation_id;
    let currentContactId = contactId || new URLSearchParams(window.location.search).get('contact_id') || window.XTREME_URL_PARAMS?.contact_id;

    // Fallback for conversation ID from referrer
    if (!currentConvId) {
      const match = document.referrer.match(/conversations\/(\d+)/);
      if (match) currentConvId = match[1];
    }
    
    // Fallback for conversation ID from parent window URL if possible
    if (!currentConvId) {
      try {
        if (window.parent !== window && window.parent.location.href) {
          const match = window.parent.location.href.match(/conversations\/(\d+)/);
          if (match) currentConvId = match[1];
        }
      } catch (e) {}
    }

    console.log("CotizacionesApp: enviarPaqueteCompleto context detection:", { currentConvId, currentContactId });

    let safeContactId = currentContactId || '0';

    // If we have convId but no contactId, try to get it from Chatwoot before saving
    if (safeContactId === '0' && currentConvId && currentConvId !== '0') {
      console.log("CotizacionesApp: Missing contact_id, attempting to fetch from conversation", currentConvId);
      try {
        const cwRes = await fetch(`${CW_CONFIG.url}/api/v1/accounts/1/conversations/${currentConvId}`, {
          headers: { 
            'api-access-token': CW_CONFIG.token
          }
        });
        if (cwRes.ok) {
          const cwData = await cwRes.json();
          if (cwData.meta?.sender?.id) {
            safeContactId = cwData.meta.sender.id.toString();
            console.log("CotizacionesApp: Successfully fetched contact_id from CW:", safeContactId);
            setContactId(safeContactId);
          } else if (cwData.contact_id) {
            safeContactId = cwData.contact_id.toString();
            console.log("CotizacionesApp: Successfully fetched contact_id from CW (legacy field):", safeContactId);
            setContactId(safeContactId);
          }
        }
      } catch (e) {
        console.warn("Could not fetch contact_id from Chatwoot during send:", e);
      }
    }

    setLoading(true);
    setSuccess(false);
    setError('');
    setProgressStep(1);
    setProgressError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 100)); // Yield to browser to show overlay

      const sanitizeName = (name: string) => name.replace(/[^a-zA-Z0-9]/g, '_');
      const safePhone = cliente.phone ? cliente.phone.replace(/[^0-9]/g, '') : 'SinTelefono';
      const safeName = sanitizeName(cliente.name || 'Cliente');
      const folderName = `clientes/${safePhone}_${safeName}/cotizaciones`;
      const cotFileName = `${safePhone}_${safeName}_Cotizacion_${currentFolio}.pdf`;
      const dosFileName = `${safePhone}_${safeName}_Propuesta_Valor.pdf`;

      const optCot = {
        margin: [0, 0, 0, 0] as [number, number, number, number],
        filename: cotFileName,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true, 
          windowWidth: 816,
          allowTaint: true,
          onclone: (doc: Document) => {
            const el = doc.querySelector('.print-container') as HTMLElement;
            if (el) {
              el.style.backgroundImage = 'none';
              el.style.backgroundColor = 'white';
              el.style.margin = '0';
              el.style.padding = '0';
            }
          }
        },
        jsPDF: { unit: 'px', format: [816, 1344] as [number, number], orientation: 'portrait' as const, hotfixes: ['px_scaling'] },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['.avoid-page-break', 'tr', 'h2', 'h3', 'h4', 'h5', 'h6'] }
      };

      const optDos = {
        margin: [0, 0, 0, 0] as [number, number, number, number],
        filename: dosFileName,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true, 
          windowWidth: 816,
          allowTaint: true,
          onclone: (doc: Document) => {
            const pages = doc.querySelectorAll('.dossier-page');
            pages.forEach((p: any) => {
              p.style.marginBottom = '0px';
              p.style.marginTop = '0px';
              p.style.boxShadow = 'none';
            });
          }
        },
        jsPDF: { unit: 'px', format: [816, 1056] as [number, number], orientation: 'portrait' as const, hotfixes: ['px_scaling'] },
        pagebreak: { mode: 'css', before: '.page-break-before' }
      };

      let pdfCotBlob;
      try {
        setStatus('Esperando a que carguen las imágenes (esto puede tardar unos segundos)...');
        
        await waitForImages(cotizacionRef.current);

        setStatus('Generando Cotización...');
        pdfCotBlob = await html2pdf().set(optCot).from(cotizacionRef.current).output('blob');
        setGeneratedPdfs(prev => prev ? { ...prev, cot: pdfCotBlob } : { cot: pdfCotBlob, dos: new Blob() });
        setStatus('');
      } catch (e: any) {
        throw new Error(`Error al generar Cotización: ${e.message || 'Desconocido'}`);
      }

      setProgressStep(2);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const timestamp = Date.now();
      const cotKey = `${folderName}/${timestamp}_${cotFileName}`;
      const dosKey = `${folderName}/${timestamp}_${dosFileName}`;

      const s3Client = new S3Client({
        endpoint: S3_CONFIG.endpoint,
        region: 'us-east-1',
        credentials: {
          accessKeyId: S3_CONFIG.accessKey,
          secretAccessKey: S3_CONFIG.secretKey
        },
        forcePathStyle: true
      });

      try {
        const pdfCotBuffer = await pdfCotBlob.arrayBuffer();
        await s3Client.send(new PutObjectCommand({
          Bucket: S3_CONFIG.bucket,
          Key: cotKey,
          Body: new Uint8Array(pdfCotBuffer),
          ContentType: 'application/pdf',
          ACL: 'public-read'
        }));
      } catch (e: any) {
         throw new Error(`Error al subir a MinIO: ${e.message || 'Desconocido'}`);
      }

      setProgressStep(3);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const subtotalItems = items.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);
      const totalGeneral = subtotalItems * 1.16 - discountAmount;
      
      const payload = {
        contact_id: safeContactId,
        folio: currentFolio,
        telefono_cliente: cliente.phone,
        datos_cliente: cliente,
        agente: signer,
        monto: totalGeneral,
        descuento_especial: discountAmount,
        conceptos: items.map(item => ({
          nombre: item.name,
          descripcion: item.description,
          cantidad: item.qty,
          precio_unitario: item.unitPrice,
          subtotal: item.qty * item.unitPrice
        })),
        notas_internas: internalNotes,
        detalles: { 
          items, 
          folio: currentFolio, 
          discountAmount, 
          showGifts, 
          isPaid, 
          isWarrantyPayment,
          supportTicket: supportTicketNumber,
          paymentDate,
          paymentMethod,
          paymentNotes,
          signer, 
          notes, 
          internalNotes, 
          warranty,
          s3_dossier_path: sendOptions.includeDossier ? dosKey : null
        },
        s3_path: cotKey
      };

      try {
        if (overwrite && editingId) {
          const res = await fetch(`${DB_CONFIG.url}/cotizaciones?id=eq.${editingId}`, {
            method: 'PATCH',
            headers: { 
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });
          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`HTTP ${res.status}: ${errText}`);
          }
        } else {
          const res = await fetch(`${DB_CONFIG.url}/cotizaciones`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json', 
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(payload)
          });
          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`HTTP ${res.status}: ${errText}`);
          }
          
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const newData = await res.json();
            if (newData && newData.length > 0) {
              setEditingId(newData[0].id);
            }
          } else {
             const text = await res.text();
             console.error("Non-JSON response:", text.substring(0, 200));
             throw new Error("El servidor no devolvió JSON válido. Si estás usando la URL compartida en Chatwoot, asegúrate de volver a hacer clic en 'Share' para actualizar la versión desplegada con el servidor backend.");
          }
        }
        // Refresh history
        fetchHistory(safeContactId);
      } catch (e: any) {
        throw new Error(`Error al guardar en DB: ${e.message || 'Desconocido'}`);
      }

      setProgressStep(4);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (currentConvId && currentConvId !== '0' && currentConvId !== 'null' && currentConvId !== 'undefined') {
        const sendWithRetry = async (formData: FormData, attempt = 1): Promise<any> => {
          try {
            const res = await fetch(`${CW_CONFIG.url}/api/v1/accounts/1/conversations/${currentConvId}/messages`, {
              method: 'POST',
              headers: { 
                'api-access-token': CW_CONFIG.token
              },
              body: formData
            });
            if (!res.ok) {
              const errText = await res.text();
              throw new Error(`HTTP ${res.status}: ${errText}`);
            }
            return await res.json();
          } catch (e: any) {
            if (attempt < 3) {
              console.warn(`Intento ${attempt} fallido, reintentando en 2 segundos...`, e);
              await new Promise(resolve => setTimeout(resolve, 2000));
              return sendWithRetry(formData, attempt + 1);
            } else {
              if (e.message && e.message.includes('Failed to fetch')) {
                throw new Error(`Error de conexión con Chatwoot (CORS o Red). Asegúrate de que tu servidor de Chatwoot (${CW_CONFIG.url}) permite peticiones desde este dominio (CORS), o revisa si un bloqueador de anuncios está interfiriendo. Presiona F12 y revisa la pestaña 'Network/Red' para ver el error exacto.`);
              }
              throw new Error(`Error al enviar a Chatwoot: ${e.message || 'Desconocido'}. Revisa la consola (F12) para más detalles.`);
            }
          }
        };

        try {
          // 1. Enviar solo el texto
          const textData = new FormData();
          let messageText = `Te adjunto tu cotización formal #${currentFolio}.`;
          if (sendOptions.includeDossier) {
            messageText = `Te adjunto tu cotización formal #${currentFolio} y nuestra propuesta de valor actualizada.`;
          }
          textData.append('content', messageText);
          textData.append('message_type', 'outgoing');
          textData.append('private', 'false');
          await sendWithRetry(textData);

          // 2. Enviar PDF de Cotización (sin texto adicional)
          const cotData = new FormData();
          cotData.append('message_type', 'outgoing');
          cotData.append('private', 'false');
          cotData.append('attachments[]', pdfCotBlob, `Cotizacion_${currentFolio}.pdf`);
          await sendWithRetry(cotData);

        } catch (e: any) {
          throw e;
        }

        // TAREA SINCRONA: Generar y enviar Dossier antes de finalizar
        if (sendOptions.includeDossier) {
          try {
            setStatus('Generando Propuesta de Valor...');
            console.log("Iniciando generación de Propuesta de Valor...");
            await waitForImages(dossierRef.current);
            const pdfDosBlob = await generateDossierPdfBlob(dossierRef.current, optDos);
            setGeneratedPdfs(prev => prev ? { ...prev, dos: pdfDosBlob } : { cot: pdfCotBlob, dos: pdfDosBlob });

            setStatus('Subiendo Propuesta de Valor...');
            console.log("Subiendo Propuesta de Valor a S3...");
            const pdfDosBuffer = await pdfDosBlob.arrayBuffer();
            await s3Client.send(new PutObjectCommand({
              Bucket: S3_CONFIG.bucket,
              Key: dosKey,
              Body: new Uint8Array(pdfDosBuffer),
              ContentType: 'application/pdf',
              ACL: 'public-read'
            }));

            setStatus('Enviando Propuesta de Valor...');
            console.log("Enviando Propuesta de Valor a Chatwoot...");
            const dosData = new FormData();
            dosData.append('message_type', 'outgoing');
            dosData.append('private', 'false');
            dosData.append('attachments[]', pdfDosBlob, `Propuesta_Valor_Xtreme.pdf`);
            await sendWithRetry(dosData);

            console.log("Propuesta de Valor enviada con éxito.");
          } catch (bgError) {
            console.error("Error al generar/enviar Propuesta de Valor:", bgError);
          }
        }
      } else {
        console.log("CotizacionesApp: No conversation ID found, skipping Chatwoot send.");
        
        // If we still want to generate and upload the dossier even if not sending to Chatwoot
        if (sendOptions.includeDossier) {
          try {
            setStatus('Generando Propuesta de Valor...');
            await waitForImages(dossierRef.current);
            const pdfDosBlob = await generateDossierPdfBlob(dossierRef.current, optDos);
            setGeneratedPdfs(prev => prev ? { ...prev, dos: pdfDosBlob } : { cot: pdfCotBlob, dos: pdfDosBlob });
            
            setStatus('Subiendo Propuesta de Valor...');
            const pdfDosBuffer = await pdfDosBlob.arrayBuffer();
            await s3Client.send(new PutObjectCommand({
              Bucket: S3_CONFIG.bucket,
              Key: dosKey,
              Body: new Uint8Array(pdfDosBuffer),
              ContentType: 'application/pdf',
              ACL: 'public-read'
            }));
          } catch (e: any) {
            console.error("Error al procesar el dossier:", e);
          }
        }
      }

      setProgressStep(5);
      setSuccess(true);
      
    } catch (err: any) {
      console.error('Error en enviarPaqueteCompleto:', err);
      let errorMessage = 'Error en el proceso';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object') {
        try {
          errorMessage = JSON.stringify(err);
        } catch (e) {
          errorMessage = 'Error desconocido (objeto no serializable)';
        }
      }
      setProgressError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsNew = async () => {
    // Generate a new folio before saving as new
    try {
      const resFolio = await fetch(`${DB_CONFIG.url}/cotizaciones?select=detalles&order=created_at.desc&limit=20`);
      if (resFolio.ok) {
        const contentType = resFolio.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const dataFolio = await resFolio.json();
          
          const currentYear = new Date().getFullYear().toString();
          const validEntry = dataFolio.find((d: any) => {
            const f = d.detalles?.folio;
            return f && f.startsWith(`XT-${currentYear}-`) && f.split('-').length === 3;
          });

          if (validEntry) {
            const newFolio = generateNextFolio(validEntry.detalles.folio);
            setFolio(newFolio);
            // Pass the new folio directly to avoid closure state issues
            setTimeout(() => handleSendClick(false, newFolio), 100);
            return;
          }
        } else {
          console.warn("SaveAsNew: La respuesta no es JSON válido. Verifica que el backend esté desplegado.");
        }
      }
    } catch (e) {}
    
    // Fallback if no valid entry found or error occurred
    const currentYear = new Date().getFullYear().toString();
    const newFolio = `XT-${currentYear}-001`;
    setFolio(newFolio);
    handleSendClick(false, newFolio);
  };

  const today = new Date();
  const validUntil = addBusinessDays(today, 10);
  
  const cotizacionData: CotizacionData = {
    folio,
    fechaEmision: format(today, "dd MMM yyyy", { locale: es }).toUpperCase(),
    validoHasta: format(validUntil, "dd MMM yyyy", { locale: es }).toUpperCase(),
    cliente,
    items,
    discountAmount,
    showGifts,
    isPaid,
    isWarrantyPayment,
    supportTicket: supportTicketNumber,
    signer,
    notes,
    conditions: { warranty }
  };

  const subtotalItems = items.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);
  const totalOriginal = subtotalItems * 1.16;
  const totalFinal = totalOriginal - discountAmount;

  return (
    <div className={`min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans flex flex-col ${theme === 'dark' ? 'dark' : ''}`}>
      {(loading || progressStep > 0) && (
        <SendingOverlay 
          step={progressStep} 
          error={progressError} 
          onClose={() => {
            setProgressStep(0);
            setProgressError(null);
            setLoading(false);
          }} 
          onDownloadManual={handleDownloadManual}
          hasPdfs={!!generatedPdfs}
        />
      )}
      {/* Top Navigation Bar */}
      <header className="h-14 bg-[var(--bg-panel)] border-b border-[var(--border-main)] flex items-center justify-between px-2 sm:px-4 lg:px-6 shrink-0 z-30 relative gap-2">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {viewMode === 'editor' && (
            <button 
              onClick={() => setViewMode('history')}
              className="p-1.5 sm:p-2 -ml-1 sm:-ml-2 text-[var(--text-subtle)] hover:text-[var(--text-main)] rounded-lg hover:bg-[var(--border-subtle)]"
              title="Volver al Historial"
            >
              <i className="fa-solid fa-arrow-left" />
            </button>
          )}
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            className="lg:hidden p-1.5 sm:p-2 text-[var(--text-subtle)] hover:text-[var(--text-main)] rounded-lg hover:bg-[var(--border-subtle)]"
          >
            {showSidebar ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div 
            className="flex items-center gap-3 cursor-default" 
            onDoubleClick={handleDownloadTest}
            title="Doble clic para descargar PDF de prueba"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <FileText size={14} className="sm:w-4 sm:h-4" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-sm font-bold text-[var(--text-main)] tracking-wide">Xtreme Diagnostics</h1>
              <p className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-widest">Generador de Cotizaciones</p>
            </div>
          </div>
        </div>
        
        {viewMode === 'editor' && (
          <div className="flex xl:hidden items-center bg-[var(--bg-main)] p-1 rounded-lg border border-[var(--border-main)] shrink-0">
            <button onClick={() => setActiveTab('editor')} className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded-md flex items-center gap-1.5 transition-all ${activeTab === 'editor' ? 'bg-[var(--border-main)] text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
              <PenTool size={12} /> <span className="hidden sm:inline">Editor</span>
            </button>
            <button onClick={() => setActiveTab('both')} className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded-md flex items-center gap-1.5 transition-all ${activeTab === 'both' ? 'bg-[var(--border-main)] text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
              <Columns size={12} /> <span className="hidden sm:inline">Ambos</span>
            </button>
            <button onClick={() => setActiveTab('preview')} className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded-md flex items-center gap-1.5 transition-all ${activeTab === 'preview' ? 'bg-[var(--border-main)] text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
              <Eye size={12} /> <span className="sm:hidden">PDF</span><span className="hidden sm:inline">Vista Previa</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg text-[var(--text-subtle)] hover:text-[var(--text-main)] hover:bg-[var(--border-subtle)] transition-colors"
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {viewMode === 'editor' && (
            editingId ? (
              <>
                <button 
                  onClick={handleDeleteQuote}
                  disabled={loading || success || wasPaid}
                  className="px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg text-[9px] sm:text-[10px] lg:text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 sm:gap-2 transition-all bg-red-600/20 text-red-400 border border-red-600/50 hover:bg-red-600/30 disabled:opacity-50"
                  title={wasPaid ? "No se puede borrar una cotización que ya fue pagada" : "Eliminar"}
                >
                  <Trash2 size={14} />
                  <span className="hidden sm:inline">Eliminar</span>
                </button>
                <button 
                  onClick={() => handleSendClick(true)}
                  disabled={loading || success}
                  className="px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg text-[9px] sm:text-[10px] lg:text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 sm:gap-2 transition-all bg-blue-600/20 text-blue-400 border border-blue-600/50 hover:bg-blue-600/30 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span className="hidden sm:inline">Sobrescribir</span>
                </button>
                <button 
                  onClick={handleSaveAsNew}
                  disabled={loading || success}
                  className="px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg text-[9px] sm:text-[10px] lg:text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 sm:gap-2 transition-all bg-cyan-500 text-[#0a0a0a] hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
                  <span className="hidden sm:inline">Duplicar</span>
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => handleSendClick(false)}
                  disabled={loading || success}
                  className={`px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 rounded-lg text-[9px] sm:text-[10px] lg:text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 sm:gap-2 transition-all
                    ${success 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                      : 'bg-cyan-500 text-[#0a0a0a] hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50'
                    }`}
                >
                  {loading ? <><Loader2 size={14} className="animate-spin" /> <span className="hidden sm:inline">Procesando</span></> : 
                   success ? <><CheckCircle size={14} /> <span className="hidden sm:inline">Enviado</span></> : 
                   <><Send size={14} /> <span className="hidden sm:inline">Crear y Enviar</span></>}
                </button>
              </>
            )
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden flex relative">
        
        {viewMode === 'history' ? (
          <div className="flex-1 flex flex-col p-4 sm:p-8 overflow-y-auto bg-[var(--bg-main)]">
            <div className="max-w-6xl mx-auto w-full">
              {history.some(q => q.detalles?.envio?.laptopBarcode) && (
                <div className="mb-8 bg-[var(--bg-panel)] rounded-2xl border border-[var(--border-subtle)] p-6">
                  <h3 className="text-lg font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
                    <BarChart3 className="text-cyan-500 w-5 h-5" />
                    Resumen del Cliente (Equipos Enviados)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {history.filter(q => q.detalles?.envio?.laptopBarcode).map(q => (
                      <div key={q.id} className="bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border-main)] flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Cotización: {q.detalles?.folio || 'S/F'}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="font-mono text-2xl font-black text-emerald-400 break-all tracking-wider bg-emerald-950/30 px-3 py-1 rounded-lg border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                              {q.detalles.envio.laptopBarcode}
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(q.detalles.envio.laptopBarcode);
                                setStatus("Código copiado");
                                setSuccess(true);
                                setTimeout(() => setSuccess(false), 2000);
                              }}
                              className="p-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 transition-all active:scale-95 group"
                              title="Copiar Código"
                            >
                              <Copy size={20} className="group-hover:rotate-12 transition-transform" />
                            </button>
                          </div>
                        </div>
                        <div className="text-[10px] text-[var(--text-subtle)] mt-3 pt-3 border-t border-[var(--border-subtle)] flex justify-between items-center">
                          <span>Enviado: {new Date(q.detalles.envio.fechaEnvio).toLocaleDateString('es-MX')}</span>
                          <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md font-bold">Entregado</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[var(--text-main)] mb-1">Cotizaciones del Cliente</h2>
                  <p className="text-sm text-[var(--text-muted)]">Historial de cotizaciones generadas para {cliente.name !== 'Nombre del Cliente (Pendiente)' ? cliente.name : 'este cliente'}</p>
                </div>
                <button 
                  onClick={handleNewQuote}
                  className="px-6 py-3 bg-cyan-500 text-[#0a0a0a] font-bold rounded-xl hover:bg-cyan-400 flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all shrink-0"
                >
                  <Plus size={18} /> Crear Nueva Cotización
                </button>
              </div>

              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-[var(--bg-panel)] rounded-2xl border border-[var(--border-subtle)]">
                  <div className="w-16 h-16 rounded-full bg-[var(--border-subtle)] flex items-center justify-center mb-4">
                    <FileText size={24} className="text-[var(--text-muted)]" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">No hay cotizaciones</h3>
                  <p className="text-[var(--text-muted)] text-center max-w-sm mb-6">Este cliente aún no tiene cotizaciones generadas en el sistema.</p>
                  <button 
                    onClick={handleNewQuote}
                    className="px-4 py-2 bg-[var(--border-main)] text-[var(--text-main)] font-bold rounded-lg hover:bg-[var(--border-subtle)] transition-colors"
                  >
                    Crear la primera
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {history.map((q) => (
                    <div 
                      key={q.id} 
                      onClick={() => !q.detalles?.is_historical && loadQuote(q)}
                      className={`p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] transition-all group flex flex-col h-full ${!q.detalles?.is_historical ? 'hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)] cursor-pointer' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-mono font-bold text-cyan-400 text-sm group-hover:text-cyan-300 transition-colors">{q.detalles?.folio || 'Sin Folio'}</span>
                        <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-main)] px-2 py-1 rounded-md">{format(new Date(q.created_at), 'dd MMM yyyy', { locale: es })}</span>
                      </div>
                      <div className="flex-1 mb-4">
                        <p className="text-sm text-[var(--text-main)] line-clamp-2" title={q.detalles?.items?.[0]?.name || 'Equipos varios'}>
                          {q.detalles?.items?.[0]?.name || 'Equipos varios'}
                        </p>
                        {q.detalles?.envio?.laptopBarcode && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <span className="text-[11px] font-black font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-md flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                              <ScanLine size={12} /> {q.detalles.envio.laptopBarcode}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-end mt-auto pt-4 border-t border-[var(--border-subtle)]">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Monto Total</span>
                          <span className="font-bold text-emerald-400 text-lg">
                            ${Number(q.monto).toLocaleString('es-MX', {minimumFractionDigits: 2})}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {q.detalles?.isPaid && (
                            <span className="text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded-md flex items-center gap-1">
                              <Stamp size={12} /> PAGADO
                            </span>
                          )}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!q.detalles?.is_historical && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); loadQuote(q); }}
                                className="p-1.5 bg-[var(--bg-main)] hover:bg-cyan-500/20 text-[var(--text-muted)] hover:text-cyan-400 rounded-md transition-colors"
                                title="Editar"
                              >
                                <PenTool size={14} />
                              </button>
                            )}
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                if (q.s3_path) {
                                  openS3File(`${S3_CONFIG.endpoint}/${S3_CONFIG.bucket}/${q.s3_path}`);
                                  const dosKey = q.s3_path.replace('cotizacion_', 'propuesta_');
                                  setTimeout(() => openS3File(`${S3_CONFIG.endpoint}/${S3_CONFIG.bucket}/${dosKey}`), 100);
                                }
                              }}
                              className="p-1.5 bg-[var(--bg-main)] hover:bg-blue-500/20 text-[var(--text-muted)] hover:text-blue-400 rounded-md transition-colors"
                              title="Descargar PDFs"
                            >
                              <Download size={14} />
                            </button>
                            <button 
                              onClick={async (e) => { 
                                e.stopPropagation(); 
                                if (q.detalles?.isPaid) {
                                  setAppError("No se puede borrar una cotización pagada.");
                                  return;
                                }
                                setAppConfirm({
                                  message: "¿Estás seguro de que deseas eliminar esta cotización?",
                                  onConfirm: async () => {
                                    try {
                                      await fetch(`${DB_CONFIG.url}/cotizaciones?id=eq.${q.id}`, { method: 'DELETE' });
                                      fetchHistory(contactId || '0');
                                    } catch (err) {
                                      console.error(err);
                                      setAppError("Error al eliminar la cotización.");
                                    }
                                  }
                                });
                              }}
                              className="p-1.5 bg-[var(--bg-main)] hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 rounded-md transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Left Column: History (Responsive Sidebar) */}
            <div className={`
              absolute lg:static inset-y-0 left-0 z-20
              w-32 bg-[var(--bg-panel)] border-r border-[var(--border-main)] flex flex-col shrink-0
              transform transition-transform duration-300 ease-in-out
              ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
              <div className="p-3 border-b border-[var(--border-main)]">
                <button 
                  onClick={handleNewQuote}
                  className="w-full py-2 bg-[var(--border-subtle)] hover:bg-[var(--border-main)] border border-[var(--border-main)] rounded-lg text-[9px] font-bold text-[var(--text-main)] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FilePlus size={12} /> NUEVA
                </button>
              </div>
              <div className="p-3 bg-[var(--bg-main)] border-b border-[var(--border-main)] flex items-center justify-center gap-1.5">
                <History size={12} className="text-cyan-500" />
                <h3 className="text-[9px] font-bold text-[var(--text-subtle)] uppercase tracking-widest">Historial</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {history.length === 0 ? (
                  <p className="text-[10px] text-slate-600 text-center py-4">No hay previas.</p>
                ) : (
                  history.map((q) => (
                    <div 
                      key={q.id} 
                      onClick={() => !q.detalles?.is_historical && loadQuote(q)}
                      className={`p-2 rounded-xl border transition-all ${editingId === q.id ? 'bg-cyan-500/10 border-cyan-500/50' : 'bg-[var(--bg-card)] border-[var(--border-subtle)]'} ${!q.detalles?.is_historical ? 'cursor-pointer hover:border-[var(--border-main)]' : 'opacity-70'}`}
                    >
                      <div className="flex flex-col gap-0.5 mb-1.5">
                        <span className={`text-[10px] font-bold font-mono truncate ${editingId === q.id ? 'text-cyan-400' : 'text-[var(--text-main)]'}`}>
                          {q.detalles?.folio || 'Sin Folio'}
                        </span>
                        <span className="text-[8px] text-[var(--text-muted)]">
                          {format(new Date(q.created_at), 'dd MMM', { locale: es })}
                        </span>
                      </div>
                      <p className="text-[9px] text-[var(--text-subtle)] truncate mb-1.5" title={q.detalles?.items?.[0]?.name || 'Equipos varios'}>
                        {q.detalles?.items?.[0]?.name || 'Equipos varios'}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-1 py-0.5 rounded truncate max-w-[75%]">
                          ${Number(q.monto).toLocaleString('es-MX', {minimumFractionDigits: 0})}
                        </span>
                        {q.detalles?.isPaid && <Stamp size={10} className="text-red-500 shrink-0" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Overlay for mobile sidebar */}
            {showSidebar && (
              <div 
                className="absolute inset-0 bg-black/50 z-10 lg:hidden"
                onClick={() => setShowSidebar(false)}
              />
            )}

            {/* Center Column: Editor */}
            <div className={`flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 bg-[var(--bg-main)] ${activeTab === 'preview' ? 'hidden xl:block' : 'block'} ${activeTab === 'both' ? 'min-w-[600px] shrink-0 border-r border-[var(--border-main)]' : ''}`}>
              <div className={`${activeTab === 'both' ? 'max-w-full' : 'max-w-3xl mx-auto'} space-y-4 sm:space-y-6 pb-32 transition-all duration-300`}>
                
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[var(--bg-panel)] p-3 rounded-xl border border-[var(--border-subtle)] sticky top-0 z-10 shadow-xl gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">FOLIO:</span>
                    <input 
                      type="text" 
                      value={folio} 
                      onChange={(e) => setFolio(e.target.value)}
                      className="bg-transparent border-b border-dashed border-slate-600 text-cyan-400 font-mono font-bold w-full sm:w-28 outline-none focus:border-cyan-400 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    <button 
                      onClick={() => setShowGifts(!showGifts)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border whitespace-nowrap ${showGifts ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' : 'bg-[var(--bg-card)] text-[var(--text-subtle)] border-[var(--border-subtle)] hover:bg-[var(--border-main)]'}`}
                    >
                      <Gift size={12} /> Regalos
                    </button>
                    <button 
                      onClick={() => {
                        if (wasPaid) return;
                        if (!isPaid) {
                          setPaymentDate(new Date().toISOString().split('T')[0]);
                          setIsWarrantyPayment(false);
                          setShowPaymentModal(true);
                        } else {
                          setIsPaid(false);
                          setIsWarrantyPayment(false);
                        }
                      }}
                      disabled={wasPaid}
                      title={wasPaid ? "Esta cotización ya fue marcada como pagada" : ""}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border whitespace-nowrap ${isPaid && !isWarrantyPayment ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-[var(--bg-card)] text-[var(--text-subtle)] border-[var(--border-subtle)] hover:bg-[var(--border-main)]'} ${wasPaid ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Stamp size={12} /> Pagado
                    </button>
                    <button 
                      onClick={() => {
                        if (wasPaid) return;
                        if (!isPaid) {
                          setPaymentDate(new Date().toISOString().split('T')[0]);
                          setIsWarrantyPayment(true);
                          setShowSupervisorModal(true);
                        } else {
                          setIsPaid(false);
                          setIsWarrantyPayment(false);
                        }
                      }}
                      disabled={wasPaid}
                      title={wasPaid ? "Esta cotización ya fue marcada como pagada" : ""}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border whitespace-nowrap ${isPaid && isWarrantyPayment ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'bg-[var(--bg-card)] text-[var(--text-subtle)] border-[var(--border-subtle)] hover:bg-[var(--border-main)]'} ${wasPaid ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <ShieldCheck size={12} /> Garantía
                    </button>
                    <select 
                      value={signer}
                      onChange={(e) => setSigner(e.target.value as any)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-subtle)] hover:bg-[var(--border-main)] whitespace-nowrap outline-none appearance-none cursor-pointer"
                    >
                      <option value="Valeria">Valeria</option>
                      <option value="Ivan">Ivan</option>
                      <option value="David">David</option>
                    </select>
                  </div>
                </div>

            {/* Client Section */}
            <section>
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 flex items-center gap-2">
                <div className="w-1 h-3 bg-cyan-500 rounded-full"></div> Datos del Cliente
              </h2>
              <div className="bg-[var(--bg-panel)] rounded-xl border border-[var(--border-subtle)] p-3 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div className="sm:col-span-2">
                  <label className="block text-[9px] font-mono text-[var(--text-muted)] mb-1">EMPRESA / RAZÓN SOCIAL</label>
                  <input type="text" value={cliente.name} onChange={(e) => setCliente({...cliente, name: e.target.value})} className="w-full bg-transparent border-b border-[var(--border-main)] py-1.5 text-sm sm:text-base font-bold text-[var(--text-main)] outline-none focus:border-cyan-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-[var(--text-muted)] mb-1">ATENCIÓN A</label>
                  <input type="text" value={cliente.contact} onChange={(e) => setCliente({...cliente, contact: e.target.value})} className="w-full bg-transparent border-b border-[var(--border-main)] py-1.5 text-xs sm:text-sm text-[var(--text-main)] outline-none focus:border-cyan-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-[var(--text-muted)] mb-1">RFC</label>
                  <input type="text" value={cliente.rfc} onChange={(e) => setCliente({...cliente, rfc: e.target.value})} className="w-full bg-transparent border-b border-[var(--border-main)] py-1.5 text-xs sm:text-sm font-mono text-[var(--text-main)] outline-none focus:border-cyan-500 transition-colors" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[9px] font-mono text-[var(--text-muted)] mb-1">DIRECCIÓN COMPLETA</label>
                  <input type="text" value={cliente.address} onChange={(e) => setCliente({...cliente, address: e.target.value})} className="w-full bg-transparent border-b border-[var(--border-main)] py-1.5 text-xs sm:text-sm text-[var(--text-main)] outline-none focus:border-cyan-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-[var(--text-muted)] mb-1">CORREO ELECTRÓNICO</label>
                  <input type="email" value={cliente.email} onChange={(e) => setCliente({...cliente, email: e.target.value})} className="w-full bg-transparent border-b border-[var(--border-main)] py-1.5 text-xs sm:text-sm text-[var(--text-main)] outline-none focus:border-cyan-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-[var(--text-muted)] mb-1">TELÉFONO</label>
                  <input type="text" value={cliente.phone} onChange={(e) => setCliente({...cliente, phone: e.target.value})} className="w-full bg-transparent border-b border-[var(--border-main)] py-1.5 text-xs sm:text-sm font-mono text-[var(--text-main)] outline-none focus:border-cyan-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-[var(--text-muted)] mb-1">SISTEMA</label>
                  <input type="text" value={cliente.sistema} onChange={(e) => setCliente({...cliente, sistema: e.target.value})} className="w-full bg-transparent border-b border-[var(--border-main)] py-1.5 text-xs sm:text-sm text-[var(--text-main)] outline-none focus:border-cyan-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-[var(--text-muted)] mb-1">SECTOR</label>
                  <input type="text" value={cliente.sector} onChange={(e) => setCliente({...cliente, sector: e.target.value})} className="w-full bg-transparent border-b border-[var(--border-main)] py-1.5 text-xs sm:text-sm text-[var(--text-main)] outline-none focus:border-cyan-500 transition-colors" />
                </div>
              </div>
            </section>

            {/* Items Section */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                  <div className="w-1 h-3 bg-cyan-500 rounded-full"></div> Equipos y Conceptos
                </h2>
                <button onClick={addItem} className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 uppercase tracking-widest">
                  <Plus size={12} /> Añadir
                </button>
              </div>
              
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="bg-[var(--bg-panel)] rounded-xl border border-[var(--border-subtle)] p-3 sm:p-5 relative group">
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-300 p-1.5 bg-red-400/10 rounded-md">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 sm:pr-10 relative">
                      <div className="sm:col-span-12">
                        <label className="block text-[9px] font-mono text-[var(--text-muted)] mb-1">NOMBRE DEL EQUIPO / SERVICIO</label>
                        <ProductSelector 
                          item={item} 
                          products={products} 
                          loadingProducts={loadingProducts} 
                          updateItem={updateItem} 
                        />
                        {item.name.startsWith('Personalizado') && (
                          <input 
                            type="text" 
                            value={item.name.replace('Personalizado: ', '')}
                            onChange={(e) => updateItem(item.id, 'name', 'Personalizado: ' + e.target.value)}
                            placeholder="Escribe el concepto personalizado..."
                            className="w-full mt-3 bg-transparent border-b border-cyan-700/50 py-1.5 text-sm sm:text-base font-bold text-cyan-300 outline-none focus:border-cyan-500 transition-colors" 
                          />
                        )}
                        {/* Inventory Warning */}
                        {products.find(p => p.name === item.name) && products.find(p => p.name === item.name)!.inventory <= 0 && (
                          <div className="mt-2 flex items-center gap-1.5 text-red-400 text-[10px] font-bold uppercase tracking-widest bg-red-400/10 px-2 py-1 rounded w-fit">
                            <AlertTriangle size={12} /> Sin inventario ({products.find(p => p.name === item.name)!.inventory} pcs)
                          </div>
                        )}
                        {products.find(p => p.name === item.name) && products.find(p => p.name === item.name)!.inventory > 0 && products.find(p => p.name === item.name)!.inventory <= 3 && (
                          <div className="mt-2 flex items-center gap-1.5 text-orange-400 text-[10px] font-bold uppercase tracking-widest bg-orange-400/10 px-2 py-1 rounded w-fit">
                            <AlertTriangle size={12} /> Inventario bajo ({products.find(p => p.name === item.name)!.inventory} pcs)
                          </div>
                        )}
                      </div>
                      <div className="sm:col-span-12">
                        <label className="block text-[9px] font-mono text-[var(--text-muted)] mb-1">DESCRIPCIÓN DETALLADA</label>
                        <textarea 
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          className="w-full bg-transparent border-b border-[var(--border-main)] py-1.5 text-xs sm:text-sm text-[var(--text-subtle)] outline-none focus:border-cyan-500 transition-colors resize-none h-16" 
                        />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-12 sm:col-span-12 gap-4 sm:gap-6">
                        <div className="sm:col-span-3">
                          <label className="block text-[9px] font-mono text-[var(--text-muted)] mb-1">CANTIDAD</label>
                          <input 
                            type="number" 
                            value={item.qty}
                            onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent border-b border-[var(--border-main)] py-1.5 text-sm sm:text-base font-mono text-[var(--text-main)] outline-none focus:border-cyan-500 transition-colors" 
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <label className="block text-[9px] font-mono text-[var(--text-muted)] mb-1">PRECIO UNITARIO</label>
                          <div className="relative">
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-mono text-sm">$</span>
                            <input 
                              type="number" 
                              value={item.unitPrice}
                              onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-full bg-transparent border-b border-[var(--border-main)] py-1.5 pl-3 text-sm sm:text-base font-mono text-[var(--text-main)] outline-none focus:border-cyan-500 transition-colors" 
                            />
                          </div>
                        </div>
                        <div className="col-span-2 sm:col-span-5 flex flex-col justify-end pb-1.5 sm:text-right">
                          <span className="text-[9px] font-mono text-[var(--text-muted)] mb-0.5">SUBTOTAL CONCEPTO</span>
                          <span className="text-base sm:text-lg font-mono font-bold text-cyan-400">
                            ${(item.qty * item.unitPrice).toLocaleString('es-MX', {minimumFractionDigits: 2})}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Totals & Config Section */}
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div>
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 flex items-center gap-2">
                  <div className="w-1 h-3 bg-cyan-500 rounded-full"></div> Ajustes Finales
                </h2>
                <div className="bg-[var(--bg-panel)] rounded-xl border border-[var(--border-subtle)] p-3 sm:p-5 space-y-5">
                  <div>
                    <label className="block text-[9px] font-mono text-red-400 mb-1 flex items-center gap-1.5">
                      <Tag size={10} /> DESCUENTO ESPECIAL
                    </label>
                    <div className="relative">
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 text-red-500/50 font-mono text-sm">-$</span>
                      <input 
                        type="number" 
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                        className="w-full bg-transparent border-b border-red-900/50 py-1.5 pl-4 text-sm sm:text-base font-mono font-bold text-red-400 outline-none focus:border-red-500 transition-colors" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
                      <PenTool size={10} /> NOTAS ADICIONALES (CLIENTE)
                    </label>
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Escribe notas adicionales para el cliente..."
                      className="w-full bg-transparent border border-[var(--border-main)]/50 rounded p-2 text-sm text-[var(--text-main)] outline-none focus:border-cyan-500 transition-colors resize-none h-20" 
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-amber-500/70 mb-1 flex items-center gap-1.5">
                      <PenTool size={10} /> NOTAS INTERNAS (EQUIPO)
                    </label>
                    <textarea 
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      placeholder="Notas privadas para el equipo (no salen en el PDF)..."
                      className="w-full bg-amber-900/10 border border-amber-700/30 rounded p-2 text-sm text-amber-200/80 outline-none focus:border-amber-500 transition-colors resize-none h-20 placeholder:text-amber-700/50" 
                    />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 flex items-center gap-2">
                  <div className="w-1 h-3 bg-cyan-500 rounded-full"></div> Resumen de Inversión
                </h2>
                <div className="bg-gradient-to-br from-[#141414] to-[#0a0a0a] rounded-xl border border-[var(--border-subtle)] p-3 sm:p-5 shadow-2xl">
                  <div className="space-y-2.5 mb-5">
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-[var(--text-subtle)] font-mono">Subtotal Equipos</span>
                      <span className="font-mono text-[var(--text-main)]">${subtotalItems.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-[var(--text-subtle)] font-mono">IVA (16%)</span>
                      <span className="font-mono text-[var(--text-main)]">${(subtotalItems * 0.16).toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center text-xs sm:text-sm pt-2 border-t border-[var(--border-main)]">
                        <span className="text-red-400 font-mono flex items-center gap-1.5"><Tag size={10}/> Descuento</span>
                        <span className="font-mono text-red-400 font-bold">-${discountAmount.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-3 border-t-2 border-cyan-500/30">
                    <p className="text-[9px] font-bold text-cyan-500 uppercase tracking-widest mb-0.5">Total a Invertir</p>
                    <p className="text-2xl sm:text-3xl font-black font-mono text-[var(--text-main)] tracking-tight">
                      ${totalFinal.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                    </p>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* Right Column: Live Preview */}
        <div className={`bg-[var(--bg-card)] overflow-y-auto justify-center p-4 lg:p-6 relative ${activeTab === 'editor' ? 'hidden xl:flex' : 'flex'} ${activeTab === 'both' ? 'w-[450px] shrink-0' : 'w-full xl:w-[40%] 2xl:w-[45%] border-l border-[var(--border-main)]'}`}>
          <div className="absolute top-4 right-4 bg-[var(--bg-panel)]/80 backdrop-blur-md text-[var(--text-main)] text-[9px] lg:text-[10px] font-bold uppercase tracking-widest px-2 lg:px-3 py-1 lg:py-1.5 rounded-full border border-[var(--border-main)] z-20">
            Vista Previa
          </div>
          {/* Scaled container to fit the preview - responsive scaling */}
          <div className={`transform origin-top h-max shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-[var(--border-main)] transition-all ${activeTab === 'both' ? 'scale-[0.5]' : 'scale-[0.45] sm:scale-[0.6] md:scale-[0.8] xl:scale-[0.55] 2xl:scale-[0.65]'}`}>
            <CotizacionTemplate data={cotizacionData} />
          </div>
        </div>
        </>
        )}

        {/* Status Overlay */}
        {status && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[var(--bg-card)] border border-[var(--border-main)] shadow-2xl rounded-full px-4 sm:px-6 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 z-50 whitespace-nowrap">
            {loading ? <Loader2 size={14} className="text-cyan-400 animate-spin" /> : 
             success ? <CheckCircle size={14} className="text-emerald-400" /> : 
             <AlertCircle size={14} className="text-red-400" />}
            <span className="text-[10px] sm:text-xs font-mono text-[var(--text-main)] uppercase tracking-widest">{status}</span>
          </div>
        )}

        {/* Error Toast */}
        {error && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-red-500/90 text-white border border-red-400 shadow-2xl rounded-lg px-4 py-3 flex items-center gap-3 z-[200] max-w-md w-full">
            <AlertCircle size={20} className="shrink-0" />
            <span className="text-sm font-medium leading-tight">{error}</span>
            <button onClick={() => setError('')} className="ml-auto hover:bg-red-600/50 p-1 rounded-md transition-colors">
              <XCircle size={16} />
            </button>
          </div>
        )}

        {/* Debug Overlay */}
        <div className="fixed bottom-0 left-0 bg-black/80 text-white text-[10px] p-1 z-[9999] font-mono">
          Debug: Conv={convId || 'null'} | Contact={contactId || 'null'} | Folio={folio || 'null'}
        </div>
      </main>

      {/* Send Options Modal */}
      {showSendOptions && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Opciones de Envío</h3>
            <p className="text-slate-600 mb-6">¿Qué documentos deseas enviar al cliente?</p>
            
            <div className="space-y-4 mb-8">
              <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors border-xtreme-cyan bg-cyan-50/50">
                <input type="radio" name="sendOption" className="w-5 h-5 text-xtreme-cyan focus:ring-xtreme-cyan" checked={true} readOnly />
                <div>
                  <p className="font-bold text-slate-900">Cotización</p>
                  <p className="text-sm text-slate-500">Documento principal</p>
                </div>
              </label>
              
              <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors ${sendOptions.includeDossier ? 'border-xtreme-cyan bg-cyan-50/50' : 'border-slate-200'}`}>
                <input 
                  type="checkbox" 
                  className="w-5 h-5 text-xtreme-cyan focus:ring-xtreme-cyan rounded" 
                  checked={sendOptions.includeDossier}
                  onChange={(e) => setSendOptions({ includeDossier: e.target.checked })}
                />
                <div>
                  <p className="font-bold text-slate-900">Propuesta de Valor</p>
                  <p className="text-sm text-slate-500">Presentación comercial de la empresa</p>
                </div>
              </label>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowSendOptions(false)}
                className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  setShowSendOptions(false);
                  if (sendActionArgs) {
                    enviarPaqueteCompleto(sendActionArgs.overwrite, sendActionArgs.overrideFolio);
                  } else {
                    enviarPaqueteCompleto(!!editingId);
                  }
                }}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-xtreme-cyan to-blue-500 text-white rounded-xl font-bold hover:shadow-lg transition-all"
              >
                Confirmar Envío
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Supervisor para Garantía */}
      {showSupervisorModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-amber-100">
            <div className="p-8">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <ShieldCheck className="text-amber-600" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 text-center mb-2">Aprobación de Supervisor</h3>
              <p className="text-slate-500 text-center mb-8 text-sm">
                Se requiere un código de autorización para marcar esta cotización como <span className="font-bold text-amber-600">Pagado por Garantía</span>.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Código de Supervisor</label>
                  <input 
                    type="password" 
                    value={supervisorCode}
                    onChange={(e) => setSupervisorCode(e.target.value)}
                    placeholder="••••••"
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none text-center text-2xl tracking-[0.5em] font-mono transition-all"
                    autoFocus
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => {
                      setShowSupervisorModal(false);
                      setSupervisorCode('');
                      setIsPaid(false);
                      setIsWarrantyPayment(false);
                    }}
                    className="flex-1 py-4 px-6 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => {
                      if (supervisorCode === 'XT2026') {
                        setShowSupervisorModal(false);
                        setSupervisorCode('');
                        setPaymentDate(new Date().toISOString().split('T')[0]);
                        setPaymentMethod('Garantía');
                        setShowPaymentModal(true);
                      } else {
                        setAppError("Código de supervisor incorrecto.");
                      }
                    }}
                    className="flex-1 py-4 px-6 bg-amber-500 text-white rounded-2xl font-bold hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                  >
                    Validar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border ${isWarrantyPayment ? 'border-amber-100' : 'border-emerald-100'}`}>
            <div className={`p-6 border-b flex items-center gap-3 ${isWarrantyPayment ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isWarrantyPayment ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                {isWarrantyPayment ? <ShieldCheck size={20} /> : <Stamp size={20} />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {isWarrantyPayment ? 'Confirmar Pago por Garantía' : 'Confirmar Pago Estándar'}
                </h3>
                <p className="text-xs text-slate-500">Folio: {folio}</p>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Fecha de Pago</label>
                <input 
                  type="date" 
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Método de Pago</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={isWarrantyPayment}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all disabled:opacity-50"
                >
                  <option value="Transferencia">Transferencia</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                  <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Garantía">Garantía</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Notas del Agente</label>
                <textarea 
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder={isWarrantyPayment ? "Ej. Se autoriza por falla de hardware..." : "Ej. Pago recibido en sucursal..."}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none h-24 resize-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Ticket de Soporte {isWarrantyPayment && <span className="text-red-500">*</span>}</label>
                <input 
                  type="text" 
                  value={supportTicketNumber}
                  onChange={(e) => setSupportTicketNumber(e.target.value)}
                  placeholder="Ej. TK-12345"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t flex gap-3">
              <button 
                onClick={() => {
                  setShowPaymentModal(false);
                  setIsPaid(false);
                  setIsWarrantyPayment(false);
                  setSupportTicketNumber('');
                }}
                className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-all active:scale-95"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (isWarrantyPayment && !supportTicketNumber.trim()) {
                    setAppError("Por favor ingrese el número de ticket de soporte técnico para pagos por garantía.");
                    return;
                  }
                  setIsPaid(true);
                  setShowPaymentModal(false);
                }}
                className={`flex-1 py-3 px-4 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg ${isWarrantyPayment ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'}`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Elements for PDF Generation */}
      <div className="absolute -left-[9999px] top-0">
        <CotizacionTemplate ref={cotizacionRef} data={cotizacionData} />
        <DossierTemplateV2 ref={dossierRef} cliente={cliente} equipo={items[0]?.name || 'Equipos de Diagnóstico'} />
      </div>

      {/* App Error Modal */}
      {appError && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-panel)] border border-red-500/30 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <AlertCircle className="text-red-500" size={32} />
              </div>
              <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-widest mb-2">Error</h3>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-8">
                {appError}
              </p>
              <button 
                onClick={() => setAppError(null)}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 transition-all shadow-lg shadow-red-500/20 active:scale-95"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App Confirm Modal */}
      {appConfirm && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-panel)] border border-amber-500/30 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <AlertTriangle className="text-amber-500" size={32} />
              </div>
              <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-widest mb-2">Confirmar</h3>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-8">
                {appConfirm.message}
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setAppConfirm(null)}
                  className="flex-1 py-4 bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-main)] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[var(--border-subtle)] transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    appConfirm.onConfirm();
                    setAppConfirm(null);
                  }}
                  className="flex-1 py-4 bg-amber-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                >
                  Sí, Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
