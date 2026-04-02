import React, { useState, useEffect, useRef } from 'react';
import { User, FileText, Phone, Mail, MapPin, ExternalLink, AlertCircle, Edit2, CheckCircle2, Package, DollarSign, CreditCard, Link as LinkIcon, Search, Plus, X, Tag, ShieldCheck, TrendingUp, MessageSquare, Calendar, Zap, Trophy, PartyPopper, Sparkles, Activity, Upload, Loader2, FileCheck, LifeBuoy, Star, Receipt, Trash2, ScanLine, History } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getPresignedS3Url, openS3File } from '../../lib/s3Utils';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import Papa from 'papaparse';
import { TicketTemplate, TicketData } from '../TicketsSoporte/components/TicketTemplate';

const CW_CONFIG = {
  url: 'https://crm.xtremediagnostics.com',
  token: 'EQN2pbRUuBrjdwEmM7PYyjY6'
};

const DB_CONFIG = {
  url: 'https://api-datos.xtremediagnostics.com'
};

const S3_CONFIG = {
  endpoint: 'https://s3.xtremediagnostics.com',
  bucket: 'cotizaciones-xtreme',
  accessKey: 'PMVOF73TI5D7H0HQ0PX3',
  secretKey: 'GyQgYLdOu8jp2KzAl58vy92EqTPS7DA+0KpiUz2l'
};

interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  telefonos_vinculados: string[];
  direccion: string;
  rfc: string;
  tipo: 'Empresa' | 'Particular';
  clasificacion?: 'Taller' | 'Empresas' | 'Independiente' | 'Revendedor' | 'Distribuidor';
  xtreme_id?: string;
  status?: 'Frío' | 'Tibio' | 'Caliente' | 'Cliente' | 'Recompra' | 'Garantía y Recompra' | 'Cliente sin Garantía' | 'Seguimiento';
}

interface Ticket {
  id: string;
  titulo: string;
  estado: 'Abierto' | 'En Progreso' | 'Cerrado';
  prioridad: string;
  fecha: string;
  fecha_cierre?: string;
  solucion?: string;
  notas?: string;
}

interface Envio {
  id: string;
  folio: string;
  estado: 'Pendiente' | 'Enviado';
  fecha: string;
  paqueteria?: string;
  guia?: string;
}

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  timestamp: string;
}

interface Cotizacion {
  id: string;
  fecha: string;
  monto: number;
  estado: string;
  desc: string;
  folio: string;
  detalles: any;
  isExpired?: boolean;
  s3_path?: string;
}

const MOTIVATIONAL_PHRASES = [
  "¡Excelente cierre! Sigamos rompiendo récords. 🚀",
  "¡Venta confirmada! Tu esfuerzo rinde frutos. 💰",
  "¡Gran trabajo! Un cliente más satisfecho. ✨",
  "¡Felicidades! Eres una máquina de ventas. 🔥",
  "¡Meta alcanzada! El éxito es tuyo. 🏆",
  "¡Impresionante! Tu dedicación inspira al equipo. 🌟",
  "¡Boom! Otro trato cerrado con éxito. 🎯",
  "¡Sigue así! Estás dominando el mercado. 📈"
];

const HistoricalProductSelector = ({ item, index, products, loadingProducts, updateItem }: { item: {name: string, price: number, quantity: number}, index: number, products: any[], loadingProducts: boolean, updateItem: (index: number, field: string, value: any) => void }) => {
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
        updateItem(index, 'name', prod.name);
        updateItem(index, 'price', prod.price);
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
      updateItem(index, 'name', 'Personalizado: ');
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
        <div className="flex items-center gap-2 py-1.5 text-sm sm:text-base text-slate-500">
          <Loader2 size={14} className="animate-spin" /> Cargando catálogo...
        </div>
      ) : (
        <>
          <div 
            className="w-full bg-transparent border-b border-[#2a2b32] py-1.5 text-sm sm:text-base font-bold text-white outline-none hover:border-emerald-500 transition-colors cursor-pointer flex justify-between items-center"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="truncate">{item.name || 'Selecciona un producto o servicio'}</span>
            <Search size={14} className="text-slate-500 shrink-0 ml-2" />
          </div>

          {isOpen && !showPwd && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#1f2026] border border-[#2a2b32] rounded-lg shadow-2xl max-h-80 flex flex-col overflow-hidden">
              <div className="p-2 border-b border-[#2a2b32] shrink-0 bg-[#14151a]">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Buscar producto..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#14151a] border border-[#2a2b32] rounded px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div className="overflow-y-auto flex-1 p-1">
                {filteredProducts.map((p, i) => (
                  <div 
                    key={i} 
                    onClick={() => handleSelect(p.name)}
                    className="px-3 py-2.5 hover:bg-[#2a2b32] cursor-pointer rounded text-sm text-white flex justify-between items-center border-b border-[#2a2b32] last:border-0"
                  >
                    <span className="truncate pr-4">{p.name}</span>
                    <span className="font-mono text-emerald-400 shrink-0">${p.price.toLocaleString('es-MX')}</span>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="px-3 py-4 text-center text-sm text-slate-500">No se encontraron productos</div>
                )}
                <div 
                  onClick={() => handleSelect('Personalizado')}
                  className="px-3 py-3 mt-1 border-t border-[#2a2b32] hover:bg-emerald-500/10 cursor-pointer rounded text-sm text-emerald-400 font-bold flex items-center gap-2 bg-[#14151a]"
                >
                  ✨ Concepto Personalizado
                </div>
              </div>
            </div>
          )}

          {isOpen && showPwd && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#1f2026] border border-emerald-500/30 rounded-lg shadow-2xl p-4">
              <label className="block text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">
                Contraseña de Autorización
              </label>
              <input 
                type="password" 
                autoFocus
                placeholder="Ej: 10marzovaleria" 
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && verifyPwd()}
                className="w-full bg-[#14151a] border border-[#2a2b32] rounded px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 mb-2"
              />
              {pwdError && <div className="text-red-400 text-xs mb-3">{pwdError}</div>}
              <div className="flex gap-2">
                <button onClick={() => setShowPwd(false)} className="flex-1 py-1.5 text-xs text-slate-400 hover:text-white bg-[#2a2b32] rounded">Cancelar</button>
                <button onClick={verifyPwd} className="flex-1 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-500 rounded font-bold">Autorizar</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default function ClienteResumenApp({ onOpenApp, session, contactId, conversationId }: { onOpenApp?: (appId: string) => void, session?: any, contactId?: string, conversationId?: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCot, setSelectedCot] = useState<Cotizacion | null>(null);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Transferencia');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [clienteData, setClienteData] = useState<Cliente>({
    id: 'Pendiente',
    nombre: 'Cargando...',
    email: 'Pendiente',
    telefono: 'Pendiente',
    telefonos_vinculados: [],
    direccion: 'Pendiente',
    rfc: 'Pendiente',
    tipo: 'Empresa',
    clasificacion: 'Independiente',
    status: 'Frío'
  });
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [isFacturacionModalOpen, setIsFacturacionModalOpen] = useState(false);
  const [selectedCotIdForFacturacion, setSelectedCotIdForFacturacion] = useState<string | null>(null);

  // Historical Purchase State
  const [showHistoricalModal, setShowHistoricalModal] = useState(false);
  const [showHistoricalForm, setShowHistoricalForm] = useState(false);
  const [historicalDate, setHistoricalDate] = useState('');
  const [historicalItems, setHistoricalItems] = useState<{name: string, price: number, quantity: number}[]>([]);
  const [historicalTotal, setHistoricalTotal] = useState(0);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [historicalSearch, setHistoricalSearch] = useState('');

  useEffect(() => {
    const total = historicalItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setHistoricalTotal(total);
  }, [historicalItems]);

  useEffect(() => {
    if (showHistoricalForm && catalogProducts.length === 0) {
      setLoadingCatalog(true);
      const fetchProducts = async () => {
        try {
          const sheetUrl = 'https://docs.google.com/spreadsheets/d/1SX3XCJgNeuAbBaDvTuvqHGIDBQU1ZYxn8L4NjH_umic/gviz/tq?tqx=out:csv&sheet=Catalogo%20e%20inventario';
          const response = await fetch(sheetUrl);
          const csvText = await response.text();
          
          Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              const parsedProducts = results.data
                .filter((row: any) => {
                  const keys = Object.keys(row);
                  const nameKey = keys.find(k => k.trim() === 'Producto/Servicio');
                  return nameKey && row[nameKey] && row[nameKey].trim() !== '';
                })
                .map((row: any) => {
                  const keys = Object.keys(row);
                  const nameKey = keys.find(k => k.trim() === 'Producto/Servicio');
                  const priceKey = keys.find(k => k.trim() === 'Precio final con iva');
                  
                  const priceStr = priceKey ? (row[priceKey] || '0') : '0';
                  const price = parseFloat(priceStr.toString().replace(/[^0-9.-]+/g, '')) || 0;

                  return {
                    name: row[nameKey!].trim(),
                    price,
                  };
                });
              setCatalogProducts(parsedProducts);
              setLoadingCatalog(false);
            },
            error: (err: any) => {
              console.error("Error parsing CSV:", err);
              setLoadingCatalog(false);
            }
          });
        } catch (e) {
          console.error("Failed to fetch products", e);
          setLoadingCatalog(false);
        }
      };
      fetchProducts();
    }
  }, [showHistoricalForm]);

  const handleDeleteConstancia = async (cotId: string) => {
    const cot = cotizaciones.find(c => c.id === cotId);
    if (!cot) return;

    if (!window.confirm('¿Estás seguro de que deseas borrar la constancia fiscal? Esto reiniciará el proceso de facturación para esta cotización.')) {
      return;
    }

    setIsUploading(`${cotId}-delete-constancia`);
    try {
      const updatedDetalles = { ...cot.detalles };
      delete updatedDetalles.constancia_url;

      const res = await fetch(`${DB_CONFIG.url}/cotizaciones?id=eq.${cotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detalles: updatedDetalles })
      });

      if (res.ok) {
        setCotizaciones(prev => prev.map(c => c.id === cotId ? { ...c, detalles: updatedDetalles } : c));
      } else {
        throw new Error('Error al actualizar base de datos');
      }
    } catch (error) {
      console.error('Error deleting constancia:', error);
      alert('No se pudo borrar la constancia. Inténtalo de nuevo.');
    } finally {
      setIsUploading(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, cotId: string, type: 'label' | 'invoice' | 'constancia') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(`${cotId}-${type}`);
    try {
      const s3Client = new S3Client({
        endpoint: S3_CONFIG.endpoint,
        region: 'us-east-1',
        credentials: {
          accessKeyId: S3_CONFIG.accessKey,
          secretAccessKey: S3_CONFIG.secretKey,
        },
        forcePathStyle: true,
      });

      const fileExtension = file.name.split('.').pop();
      const safeName = clienteData.nombre?.replace(/[^a-zA-Z0-9]/g, '_') || 'Cliente';
      const safePhone = clienteData.telefono?.replace(/[^a-zA-Z0-9]/g, '') || 'SinTelefono';
      
      let fileName = `clientes/${safePhone}_${safeName}/${type}s/${type}_${Date.now()}.${fileExtension}`;
      
      console.log('Uploading file to S3:', { bucket: S3_CONFIG.bucket, key: fileName, type: file.type });
      
      const fileBuffer = await file.arrayBuffer();
      await s3Client.send(new PutObjectCommand({
        Bucket: S3_CONFIG.bucket,
        Key: fileName,
        Body: new Uint8Array(fileBuffer),
        ContentType: file.type,
        ACL: 'public-read'
      }));

      const fileUrl = `${S3_CONFIG.endpoint}/${S3_CONFIG.bucket}/${fileName}`;

      // Update cotizacion in DB
      const cot = cotizaciones.find(c => c.id === cotId);
      if (cot) {
        const updatedDetalles = {
          ...(cot.detalles || {})
        };
        
        if (type === 'label') updatedDetalles.shipping_label_url = fileUrl;
        else if (type === 'invoice') updatedDetalles.invoice_url = fileUrl;
        else if (type === 'constancia') {
          updatedDetalles.constancia_url = fileUrl;
          updatedDetalles.requiere_factura = true;
        }

        const res = await fetch(`${DB_CONFIG.url}/cotizaciones?id=eq.${cotId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ detalles: updatedDetalles })
        });

        if (res.ok) {
          setCotizaciones(prev => prev.map(c => c.id === cotId ? { ...c, detalles: updatedDetalles } : c));
          
          if (type === 'constancia') {
            try {
              // Buscar contacto de facturación por teléfono
              const searchRes = await fetch(`${CW_CONFIG.url}/api/v1/accounts/1/contacts/search?q=+5218114960088`, {
                headers: { 'api-access-token': CW_CONFIG.token }
              });
              const searchData = await searchRes.json();
              let facturacionContactId = null;
              if (searchData.payload && searchData.payload.length > 0) {
                facturacionContactId = searchData.payload[0].id;
              }

              if (facturacionContactId) {
                const convRes = await fetch(`${CW_CONFIG.url}/api/v1/accounts/1/contacts/${facturacionContactId}/conversations`, {
                  headers: { 'api-access-token': CW_CONFIG.token }
                });
                const convData = await convRes.json();
                let facturacionConvId = null;
                if (convData.payload && convData.payload.length > 0) {
                  facturacionConvId = convData.payload[0].id;
                }

                if (facturacionConvId) {
                  const sendWithRetry = async (formData: FormData, attempt = 1): Promise<any> => {
                    try {
                      const res = await fetch(`${CW_CONFIG.url}/api/v1/accounts/1/conversations/${facturacionConvId}/messages`, {
                        method: 'POST',
                        headers: { 'api-access-token': CW_CONFIG.token },
                        body: formData
                      });
                      if (!res.ok) {
                        const errText = await res.text();
                        throw new Error(`HTTP ${res.status}: ${errText}`);
                      }
                      return await res.json();
                    } catch (e: any) {
                      if (attempt < 3) {
                        console.warn(`Intento ${attempt} fallido, reintentando en 2...`, e);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        return sendWithRetry(formData, attempt + 1);
                      }
                      throw e;
                    }
                  };

                  const appUrl = window.location.href.split('?')[0].replace(/\/$/, '');
                  const fastInvoiceLink = `${appUrl}/?factura_rapida=${cot.id}`;
                  const messageContent = `Hola, un cliente requiere factura.\nCliente: ${clienteData.nombre}\nTeléfono: ${clienteData.telefono}\nCotización: ${cot.detalles?.folio || 'S/N'}\n\n👉 Sube la factura aquí: ${fastInvoiceLink}`;
                  
                  const formData = new FormData();
                  formData.append('content', messageContent);
                  formData.append('message_type', 'incoming');
                  formData.append('private', 'false');
                  
                  // Attach constancia
                  formData.append('attachments[]', file, file.name);

                  // Fetch and attach cotizacion
                  if (cot.s3_path) {
                    try {
                      const cotUrl = `${S3_CONFIG.endpoint}/${S3_CONFIG.bucket}/${cot.s3_path}`;
                      const presignedUrl = await getPresignedS3Url(cotUrl);
                      const cotRes = await fetch(presignedUrl);
                      if (cotRes.ok) {
                        const cotBlob = await cotRes.blob();
                        formData.append('attachments[]', cotBlob, `Cotizacion_${cot.detalles?.folio || 'S_N'}.pdf`);
                      } else {
                        console.error("Failed to fetch cotizacion with presigned URL:", cotRes.status, cotRes.statusText);
                      }
                    } catch (e) {
                      console.error("Error fetching cotizacion for attachment:", e);
                    }
                  }

                  await sendWithRetry(formData);
                }
              }
            } catch (e) {
              console.error("Error sending message to facturacion:", e);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setAppError(`Error al subir el archivo: ${error.message || 'Intente de nuevo.'}`);
    } finally {
      setIsUploading(null);
    }
  };
  const [isLoading, setIsLoading] = useState(true);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkPhoneInput, setLinkPhoneInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showCloseTicketModal, setShowCloseTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketSolution, setTicketSolution] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [newTicket, setNewTicket] = useState({
    titulo: '',
    prioridad: 'Media',
    notas: '',
    xtreme_id: '',
    equipo: '',
    agente_asignado: 'Soporte Técnico'
  });
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [creationProgress, setCreationProgress] = useState('');
  const [appError, setAppError] = useState<string | null>(null);
  const [appSuccess, setAppSuccess] = useState<string | null>(null);
  const [currentTicketData, setCurrentTicketData] = useState<TicketData | null>(null);
  const ticketPdfRef = useRef<HTMLDivElement>(null);

  const [contactIdState, setContactIdState] = useState<string | null>(contactId || null);
  const [convIdState, setConvIdState] = useState<string | null>(conversationId || null);

  const handleSaveHistorical = async () => {
    if (!historicalDate) {
      alert("Por favor selecciona la fecha de compra.");
      return;
    }
    if (historicalItems.length === 0) {
      alert("Por favor agrega al menos un producto.");
      return;
    }

    setIsUploading('historical');
    try {
      const cotizacionPayload = {
        contact_id: clienteData.id,
        folio: `HIST-${Date.now()}`,
        telefono_cliente: clienteData.telefono || '',
        datos_cliente: clienteData,
        agente: 'Sistema',
        monto: historicalTotal,
        descuento_especial: 0,
        conceptos: historicalItems.map(item => ({
          nombre: item.name,
          descripcion: '',
          cantidad: item.quantity,
          precio_unitario: item.price,
          subtotal: item.quantity * item.price
        })),
        notas_internas: "Registro histórico de compra anterior al sistema.",
        estado: 'Pagada',
        detalles: {
          items: historicalItems.map(item => ({
            id: Date.now().toString() + Math.random().toString(),
            name: item.name,
            qty: item.quantity,
            unitPrice: item.price,
            description: ''
          })),
          folio: `HIST-${Date.now()}`,
          discountAmount: 0,
          is_historical: true,
          isPaid: true,
          paymentMethod: "Histórico",
          paymentDate: historicalDate,
          notes: "Registro histórico de compra anterior al sistema.",
          envio: {
            status: 'Entregado',
            metodo: 'Histórico'
          },
          facturacion: {
            status: 'No Requiere'
          }
        }
      };

      const resCot = await fetch(`${DB_CONFIG.url}/cotizaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cotizacionPayload)
      });

      if (!resCot.ok) {
        const errText = await resCot.text();
        console.error("Error saving historical quotation:", errText);
        throw new Error(`Error saving historical quotation: ${errText}`);
      }

      if (clienteData.status !== 'Cliente' && clienteData.status !== 'Recompra' && clienteData.status !== 'Garantía y Recompra') {
        await fetch(`${DB_CONFIG.url}/clientes?id=eq.${clienteData.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Cliente' })
        });
        setClienteData(prev => ({ ...prev, status: 'Cliente' }));
      }

      const resQuotes = await fetch(`${DB_CONFIG.url}/cotizaciones?contact_id=eq.${clienteData.id}&order=created_at.desc`);
      if (resQuotes.ok) {
        const quotesData = await resQuotes.json();
        setCotizaciones(quotesData);
      }

      setShowHistoricalForm(false);
      setHistoricalItems([]);
      setHistoricalDate('');
      setHistoricalSearch('');
      setAppSuccess('Registro histórico guardado correctamente.');
      
    } catch (error) {
      console.error("Error saving historical data:", error);
      alert("Hubo un error al guardar el registro histórico.");
    } finally {
      setIsUploading(null);
    }
  };

  useEffect(() => {
    if (contactId) setContactIdState(contactId);
    if (conversationId) setConvIdState(conversationId);
  }, [contactId, conversationId]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        let data = event.data;
        
        // Handle request for context from pop-outs
        if (data === 'request_context') {
          if (contactIdState || convIdState) {
            try {
              (event.source as Window)?.postMessage({
                type: 'chatwoot_context',
                contact_id: contactIdState,
                conversation_id: convIdState
              }, '*');
            } catch (e) {}
          }
          return;
        }

        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) {
            return;
          }
        }
        
        if (data && data.event === 'appContext') {
          const ctx = data.data;
          if (ctx.conversation && ctx.conversation.id) {
            setConvIdState(ctx.conversation.id.toString());
          }
          if (ctx.contact && ctx.contact.id) {
            setContactIdState(ctx.contact.id.toString());
          }
        }
        
        if (data && data.type === 'chatwoot_context') {
          if (data.conversation_id) setConvIdState(data.conversation_id.toString());
          if (data.contact_id) setContactIdState(data.contact_id.toString());
        }
        
        if (window.XTREME_URL_PARAMS?.contact_id) {
          setContactIdState(window.XTREME_URL_PARAMS.contact_id);
        }
        if (window.XTREME_URL_PARAMS?.conversation_id) {
          setConvIdState(window.XTREME_URL_PARAMS.conversation_id);
        }
      } catch (e) {
        console.error("Error handling message:", e);
      }
    };

    window.addEventListener('message', handleMessage);
    
    const requestContext = () => {
      try {
        if (window.parent !== window) {
          window.parent.postMessage('chatwoot-dashboard-app:fetch-info', '*');
          window.parent.postMessage('request_context', '*');
        }
        if (window.opener) {
          window.opener.postMessage('request_context', '*');
        }
      } catch (e) {}
    };

    requestContext();
    const t1 = setTimeout(requestContext, 1000);
    const t2 = setTimeout(requestContext, 3000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const lastLaptopBarcode = React.useMemo(() => {
    const paidWithBarcode = cotizaciones.filter(c => c.detalles?.envio?.laptopBarcode);
    if (paidWithBarcode.length > 0) {
      return paidWithBarcode[0].detalles.envio.laptopBarcode;
    }
    return '';
  }, [cotizaciones]);

  const [nextTicketId, setNextTicketId] = useState<number | null>(null);
  const [fetchedXtremeIds, setFetchedXtremeIds] = useState<string[]>([]);
  const [selectedXtremeId, setSelectedXtremeId] = useState<string>('');

  const handleOpenTicketModal = async () => {
    setNewTicket(prev => ({
      ...prev,
      equipo: lastLaptopBarcode || ''
    }));
    setShowTicketModal(true);
    setNextTicketId(null);
    setFetchedXtremeIds([]);
    setSelectedXtremeId('');

    // Fetch next ID
    try {
      const resAll = await fetch(`${DB_CONFIG.url}/tickets_soporte?select=id&order=id.desc&limit=1`);
      const lastTickets = await resAll.json();
      let nextId = 1;
      if (lastTickets && lastTickets.length > 0) {
        nextId = parseInt(lastTickets[0].id) + 1;
      }
      setNextTicketId(nextId);
    } catch (e) {
      console.error('Error fetching next ID', e);
    }

    // Fetch Xtreme ID
    const cid = contactIdState || new URLSearchParams(window.location.search).get('contact_id') || window.XTREME_URL_PARAMS?.contact_id;
    if (cid) {
      try {
        let xtremeIds: string[] = [];
        // 1. Check clientes table
        const resCliente = await fetch(`${DB_CONFIG.url}/clientes?contact_id=eq.${cid}`);
        if (resCliente.ok) {
          const data = await resCliente.json();
          if (data && data.length > 0 && data[0].xtreme_id) {
            xtremeIds.push(data[0].xtreme_id);
          }
        }
        
        // 2. Check quotes
        const resQuotes = await fetch(`${DB_CONFIG.url}/cotizaciones?contact_id=eq.${cid}&order=created_at.desc`);
        const quotes = await resQuotes.json();
        if (Array.isArray(quotes)) {
          for (const q of quotes) {
            if (q.detalles?.envio?.laptopBarcodes && Array.isArray(q.detalles.envio.laptopBarcodes)) {
              xtremeIds.push(...q.detalles.envio.laptopBarcodes);
            }
            if (q.detalles?.xtreme_id) {
              xtremeIds.push(q.detalles.xtreme_id);
            }
            if (q.detalles?.envio?.laptopBarcode) {
              xtremeIds.push(q.detalles.envio.laptopBarcode);
            }
            if (q.detalles?.envio?.xtremeId) {
              xtremeIds.push(q.detalles.envio.xtremeId);
            }
            const itemsWithXtremeId = q.detalles?.items?.filter((i: any) => i.xtreme_id || (i.description && i.description.includes('Xtreme ID:')));
            if (itemsWithXtremeId && itemsWithXtremeId.length > 0) {
              for (const item of itemsWithXtremeId) {
                if (item.xtreme_id) {
                  xtremeIds.push(item.xtreme_id);
                } else if (item.description) {
                  const match = item.description.match(/Xtreme ID:\s*([^\s,.]+)/);
                  if (match) xtremeIds.push(match[1]);
                }
              }
            }
          }
        }

        // 3. Check Chatwoot if not found
        if (xtremeIds.length === 0) {
          const resClient = await fetch(`${CW_CONFIG.url}/api/v1/accounts/1/contacts/${cid}`, {
            headers: { 'api-access-token': CW_CONFIG.token }
          });
          if (resClient.ok) {
            const clientData = await resClient.json();
            if (clientData.payload?.custom_attributes?.xtreme_id) {
              xtremeIds.push(clientData.payload.custom_attributes.xtreme_id);
            }
          }
        }
        
        // Remove duplicates and empty strings
        xtremeIds = Array.from(new Set(xtremeIds.filter(id => id && String(id).trim() !== '')));
        
        setFetchedXtremeIds(xtremeIds);
        if (xtremeIds.length > 0) {
          setSelectedXtremeId(xtremeIds[0]);
          setNewTicket(prev => ({ ...prev, xtreme_id: xtremeIds[0] }));
        } else {
          setNewTicket(prev => ({ ...prev, xtreme_id: '' }));
        }
      } catch (e) {
        console.error('Error fetching Xtreme ID', e);
      }
    }
  };

  const paidCount = React.useMemo(() => cotizaciones.filter(c => c.estado === 'Pagada').length, [cotizaciones]);

  const statusInfo = React.useMemo(() => {
    const now = new Date();
    const pendingQuotes = cotizaciones
      .filter(c => c.estado === 'Pendiente')
      .sort((a, b) => new Date(b.fecha.split('/').reverse().join('-')).getTime() - new Date(a.fecha.split('/').reverse().join('-')).getTime());

    const paidQuotes = cotizaciones
      .filter(c => c.estado === 'Pagada' && c.detalles?.paymentDate)
      .sort((a, b) => new Date(b.detalles.paymentDate).getTime() - new Date(a.detalles.paymentDate).getTime());

    if (paidQuotes.length > 0) {
      const lastPayment = new Date(paidQuotes[0].detalles.paymentDate);
      const diffDays = Math.floor((now.getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24));
      const remainingGarantia = Math.max(0, 91 - diffDays);
      return { days: diffDays, remaining: remainingGarantia, type: 'payment' };
    }

    if (pendingQuotes.length > 0) {
      const lastQuoteDate = new Date(pendingQuotes[0].fecha.split('/').reverse().join('-'));
      const diffDays = Math.floor((now.getTime() - lastQuoteDate.getTime()) / (1000 * 60 * 60 * 24));
      return { days: diffDays, type: 'quote' };
    }

    return null;
  }, [cotizaciones]);

  const loyaltyStep = React.useMemo(() => {
    if (paidCount === 0) return 0;
    if (paidCount === 1) {
      if (statusInfo && statusInfo.type === 'payment' && statusInfo.days > 15) return 2; // Post-Venta
      return 1; // Conversión
    }
    if (paidCount === 2) return 3; // Reventa
    if (paidCount >= 3 && paidCount < 5) return 4; // Fidelizado
    if (paidCount >= 5) return 5; // Embajador
    return 1;
  }, [paidCount, statusInfo]);

  const calculatedStatus = React.useMemo(() => {
    if (cotizaciones.length === 0) return clienteData.status || 'Frío';

    const now = new Date();
    const paidQuotes = cotizaciones
      .filter(c => c.estado === 'Pagada' && c.detalles?.paymentDate)
      .sort((a, b) => new Date(b.detalles.paymentDate).getTime() - new Date(a.detalles.paymentDate).getTime());

    if (paidQuotes.length > 0) {
      const lastPayment = new Date(paidQuotes[0].detalles.paymentDate);
      const diffMonths = (now.getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
      
      if (diffMonths <= 3) return 'Garantía y Recompra';
      return 'Cliente sin Garantía';
    }

    const pendingQuotes = cotizaciones
      .filter(c => c.estado === 'Pendiente')
      .sort((a, b) => new Date(b.fecha.split('/').reverse().join('-')).getTime() - new Date(a.fecha.split('/').reverse().join('-')).getTime());

    if (pendingQuotes.length > 0) {
      const lastQuoteDate = new Date(pendingQuotes[0].fecha.split('/').reverse().join('-'));
      const diffDays = (now.getTime() - lastQuoteDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (diffDays > 15) return 'Seguimiento';
      return 'Caliente';
    }

    return clienteData.status || 'Frío';
  }, [cotizaciones, clienteData.status]);

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      const params = new URLSearchParams(window.location.search);
      let urlCid = contactIdState || params.get('contact_id') || window.XTREME_URL_PARAMS?.contact_id;
      let urlConvId = convIdState || params.get('conversation_id') || window.XTREME_URL_PARAMS?.conversation_id;

      // Try to get conversation ID from referrer if not in URL or props
      if (!urlConvId) {
        const match = document.referrer.match(/conversations\/(\d+)/);
        if (match) urlConvId = match[1];
      }
      
      // Try to get conversation ID from parent window URL if possible
      if (!urlConvId) {
        try {
          if (window.parent !== window && window.parent.location.href) {
            const match = window.parent.location.href.match(/conversations\/(\d+)/);
            if (match) urlConvId = match[1];
          }
        } catch (e) {}
      }

      let finalCid = urlCid;

      if (!finalCid && urlConvId) {
        try {
          const res = await fetch(`${CW_CONFIG.url}/api/v1/accounts/1/conversations/${urlConvId}`, {
            headers: { 
              'api-access-token': CW_CONFIG.token
            }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.meta?.sender?.id) {
              finalCid = data.meta.sender.id.toString();
            }
          } else {
            console.warn(`Error fetching conversation: ${res.status} ${res.statusText}`);
          }
        } catch (e) {
          console.warn("No se pudo obtener el contact_id de la conversación", e);
        }
      }

      if (finalCid) {
        console.log("ClienteResumenApp: Fetching data for contact", finalCid);
        // Fetch Client
        try {
          const res = await fetch(`${CW_CONFIG.url}/api/v1/accounts/1/contacts/${finalCid}`, {
            headers: { 
              'api-access-token': CW_CONFIG.token
            }
          });
          if (res.ok) {
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
              const data = await res.json();
              const payload = data.payload;
              if (payload) {
                setClienteData({
                  id: payload.id ? payload.id.toString() : 'Pendiente',
                  nombre: payload.name || 'Pendiente',
                  email: payload.email || 'Pendiente',
                  telefono: payload.phone_number || 'Pendiente',
                  telefonos_vinculados: [],
                  direccion: payload.custom_attributes?.direccion || 'Pendiente',
                  rfc: payload.custom_attributes?.rfc || 'Pendiente',
                  tipo: payload.custom_attributes?.tipo_cliente === 'Particular' ? 'Particular' : 'Empresa',
                  clasificacion: payload.custom_attributes?.clasificacion || 'Independiente',
                  status: payload.custom_attributes?.status || 'Frío',
                  xtreme_id: payload.custom_attributes?.xtreme_id || ''
                });
              } else {
                setClienteData(prev => ({ ...prev, nombre: 'Sin datos' }));
              }
            } else {
              setClienteData(prev => ({ ...prev, nombre: 'Error de formato' }));
            }
          } else {
            console.error(`Error fetching client: ${res.status} ${res.statusText}`);
            setClienteData(prev => ({ ...prev, nombre: 'No encontrado' }));
          }
        } catch (e) {
          console.error("Error fetching client", e);
          setClienteData(prev => ({ ...prev, nombre: 'Error de conexión' }));
        }

        // Fetch Tickets
        try {
          const resTickets = await fetch(`${DB_CONFIG.url}/tickets_soporte?cliente_id=eq.${finalCid}&order=created_at.desc`);
          if (resTickets.ok) {
            const data = await resTickets.json();
            if (Array.isArray(data)) {
              setTickets(data.map((t: any) => ({
                id: t.id.toString(),
                titulo: t.titulo || 'Sin título',
                estado: t.estado || 'Abierto',
                prioridad: t.prioridad || 'Media',
                fecha: new Date(t.created_at).toLocaleDateString('es-MX'),
                notas: t.notas
              })));
            }
          }
        } catch (e) {}

        // Fetch Envios
        try {
          const resEnvios = await fetch(`${DB_CONFIG.url}/envios?cliente_id=eq.${finalCid}&order=created_at.desc`);
          if (resEnvios.ok) {
            const data = await resEnvios.json();
            if (Array.isArray(data)) {
              setEnvios(data.map((e: any) => ({
                id: e.id.toString(),
                folio: e.folio || e.id.toString(),
                estado: e.estado || 'Pendiente',
                fecha: new Date(e.created_at).toLocaleDateString('es-MX'),
                paqueteria: e.paqueteria,
                guia: e.guia,
                laptopBarcode: e.laptop_barcode
              })));
            }
          }
        } catch (e) {}

        // Fetch Chat Messages
        try {
          const resChat = await fetch(`${DB_CONFIG.url}/chat_interno?cliente_id=eq.${finalCid}&order=created_at.asc`);
          if (resChat.ok) {
            const data = await resChat.json();
            if (Array.isArray(data)) {
              setChatMessages(data.map((m: any) => ({
                id: m.id.toString(),
                user: m.usuario || 'Sistema',
                text: m.mensaje,
                timestamp: new Date(m.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
              })));
            }
          }
        } catch (e) {
          console.error('Error fetching chat:', e);
        }

        // Fetch Cotizaciones
        try {
          const resHist = await fetch(`${DB_CONFIG.url}/cotizaciones?contact_id=eq.${finalCid}&order=created_at.desc`);
          if (resHist.ok) {
            const contentType = resHist.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
              const dataHist = await resHist.json();
              if (Array.isArray(dataHist)) {
                const mappedCots = dataHist.map((d: any) => {
                  const createdAt = d.created_at ? new Date(d.created_at) : null;
                  const isPaid = d.detalles?.isPaid || d.estado === 'Pagada' || d.estado === 'Facturada';
                  const isExpired = !isPaid && createdAt && (new Date().getTime() - createdAt.getTime()) > (15 * 24 * 60 * 60 * 1000);
                  
                  return {
                    id: d.id ? d.id.toString() : Math.random().toString(),
                    folio: d.detalles?.folio || (d.id ? d.id.toString() : 'S/F'),
                    fecha: d.created_at ? new Date(d.created_at).toLocaleDateString('es-MX') : 'Pendiente',
                    monto: d.monto || 0,
                    estado: isPaid ? 'Pagada' : 'Pendiente',
                    desc: d.detalles?.items?.[0]?.name || 'Cotización',
                    detalles: d.detalles || {},
                    isExpired: isExpired
                  };
                });
                setCotizaciones(mappedCots);
              }
            }
          }
        } catch (e) {
          console.error("Error fetching history", e);
        }
      } else {
        setClienteData(prev => ({ ...prev, nombre: 'No se encontró contacto' }));
      }
      setIsLoading(false);
    };

    fetchAll();
  }, [contactIdState, convIdState]);

  const handleSave = async (updatedData?: Partial<Cliente>) => {
    const dataToSave = { ...clienteData, ...updatedData };
    setIsEditing(false);
    try {
      const params = new URLSearchParams(window.location.search);
      const cid = contactIdState || params.get('contact_id') || window.XTREME_URL_PARAMS?.contact_id;
      if (!cid) return;

      const response = await fetch(`${CW_CONFIG.url}/api/v1/accounts/1/contacts/${cid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'api-access-token': CW_CONFIG.token
        },
        body: JSON.stringify({
          custom_attributes: {
            direccion: dataToSave.direccion,
            rfc: dataToSave.rfc,
            tipo_cliente: dataToSave.tipo,
            clasificacion: dataToSave.clasificacion,
            status: dataToSave.status,
            xtreme_id: dataToSave.xtreme_id
          }
        })
      });

      if (response.ok) {
        setClienteData(dataToSave);
        console.log('Datos guardados correctamente');
      }
    } catch (e) {
      console.error('Error al guardar datos:', e);
    }
  };

  const handleCreateTicket = async () => {
    const params = new URLSearchParams(window.location.search);
    const cid = contactIdState || params.get('contact_id') || window.XTREME_URL_PARAMS?.contact_id;
    if (!cid || !newTicket.titulo.trim()) return;

    setIsCreatingTicket(true);
    setCreationProgress('Iniciando creación de ticket...');

    try {
      // 1. Obtener el ID consecutivo
      setCreationProgress('Generando ID de ticket...');
      const resAll = await fetch(`${DB_CONFIG.url}/tickets_soporte?select=id&order=id.desc&limit=1`);
      const lastTickets = await resAll.json();
      let nextId = 1;
      if (lastTickets && lastTickets.length > 0) {
        nextId = parseInt(lastTickets[0].id) + 1;
      }

      // 2. Obtener datos de garantía y Xtreme ID
      setCreationProgress('Verificando garantía y Xtreme ID...');
      const resQuotes = await fetch(`${DB_CONFIG.url}/cotizaciones?contact_id=eq.${cid}&order=created_at.desc`);
      const quotes = await resQuotes.json();
      const now = new Date();
      const paidQuotes = Array.isArray(quotes) ? quotes.filter((c: any) => c.detalles?.isPaid || c.estado === 'Pagada' || c.estado === 'Facturada') : [];
      
      let isUnderWarranty = false;
      if (paidQuotes.length > 0) {
        const lastPayment = paidQuotes[0].detalles?.paymentDate ? new Date(paidQuotes[0].detalles.paymentDate) : new Date(paidQuotes[0].created_at);
        const diffMonths = (now.getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
        if (diffMonths <= 3) isUnderWarranty = true;
      }

      const xtremeId = newTicket.xtreme_id || clienteData.xtreme_id || 'N/A';

      // 3. Crear el Ticket en la DB
      setCreationProgress('Guardando ticket en base de datos...');
      const ticketPayload = {
        id: nextId,
        cliente_id: cid,
        contact_id: cid,
        titulo: newTicket.titulo,
        prioridad: newTicket.prioridad,
        estado: 'Abierto',
        notas: newTicket.equipo ? `Equipo: ${newTicket.equipo}\n\n${newTicket.notas}` : newTicket.notas,
        xtreme_id: xtremeId,
        agente_asignado: newTicket.agente_asignado,
        created_at: new Date().toISOString()
      };

      const resTicket = await fetch(`${DB_CONFIG.url}/tickets_soporte`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketPayload)
      });

      if (!resTicket.ok) {
        const errText = await resTicket.text();
        throw new Error(`Error al crear el ticket en DB (${resTicket.status}): ${errText}`);
      }

      // 4. Generar PDF del Ticket
      setCreationProgress('Generando PDF de soporte...');
      const ticketData: TicketData = {
        id: nextId.toString(),
        fecha: new Date().toLocaleDateString('es-MX'),
        cliente: {
          name: clienteData.nombre,
          email: clienteData.email || 'S/N',
          phone: clienteData.telefono,
          xtreme_id: xtremeId
        },
        titulo: newTicket.titulo,
        prioridad: newTicket.prioridad,
        notas: newTicket.notas,
        tecnico: newTicket.agente_asignado,
        equipo: newTicket.equipo,
        isUnderWarranty: isUnderWarranty
      };

      setCurrentTicketData(ticketData);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const element = ticketPdfRef.current;
      if (element) {
        const opt = {
          margin: 0,
          filename: `Ticket_Soporte_${nextId}.pdf`,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: 'in' as const, format: [5.5, 8.5] as [number, number], orientation: 'landscape' as const }
        };

        const pdfBlob = await html2pdf().from(element).set(opt).output('blob');
        
        // 5. Subir a S3
        setCreationProgress('Subiendo PDF a la nube...');
        const s3Client = new S3Client({
          region: 'us-east-1',
          endpoint: S3_CONFIG.endpoint,
          credentials: {
            accessKeyId: S3_CONFIG.accessKey,
            secretAccessKey: S3_CONFIG.secretKey
          },
          forcePathStyle: true
        });

        const pdfKey = `tickets/Ticket_${nextId}_${Date.now()}.pdf`;
        const pdfBuffer = await pdfBlob.arrayBuffer();
        await s3Client.send(new PutObjectCommand({
          Bucket: S3_CONFIG.bucket,
          Key: pdfKey,
          Body: new Uint8Array(pdfBuffer),
          ContentType: 'application/pdf',
          ACL: 'public-read'
        }));

        // 6. Enviar a Chatwoot
        setCreationProgress('Enviando ficha al cliente...');
        let currentConvId = convIdState || params.get('conversation_id') || window.XTREME_URL_PARAMS?.conversation_id;
        if (!currentConvId) {
          const match = document.referrer.match(/conversations\/(\d+)/);
          if (match) currentConvId = match[1];
        }

        if (currentConvId && currentConvId !== '0' && currentConvId !== 'null' && currentConvId !== 'undefined') {
          const sendWithRetry = async (formData: FormData, attempt = 1): Promise<any> => {
            try {
              const res = await fetch(`${CW_CONFIG.url}/api/v1/accounts/1/conversations/${currentConvId}/messages`, {
                method: 'POST',
                headers: { 'api-access-token': CW_CONFIG.token },
                body: formData
              });
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return await res.json();
            } catch (e: any) {
              if (attempt < 3) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return sendWithRetry(formData, attempt + 1);
              }
            }
          };

          const messageText = `✅ *Ticket de Soporte Asignado*

Se ha asignado un ticket de seguimiento para soporte técnico y un agente especializado para ayudarte. Por favor, danos oportunidad de que se libere un técnico para atenderte de la mejor manera.

⚠️ *IMPORTANTE:* Antes de eso, ¿podrías enviarnos fotos del problema, mensaje o error que aparece en la pantalla? Esto nos permitirá darte una solución mucho más rápida.

*Detalles del Ticket:*
🎫 Folio: #${nextId}
📌 Asunto: ${newTicket.titulo}
👤 Agente: ${newTicket.agente_asignado}

_Puedes enviarnos las fotos por aquí mismo o por WhatsApp de favor._`;

          const textData = new FormData();
          textData.append('content', messageText);
          textData.append('message_type', 'outgoing');
          textData.append('private', 'false');
          await sendWithRetry(textData);

          const pdfData = new FormData();
          pdfData.append('message_type', 'outgoing');
          pdfData.append('private', 'false');
          pdfData.append('attachments[]', new File([pdfBlob], `Ticket_Soporte_${nextId}.pdf`, { type: 'application/pdf' }));
          await sendWithRetry(pdfData);
        }
      }

      // Refresh tickets
      const resTickets = await fetch(`${DB_CONFIG.url}/tickets_soporte?cliente_id=eq.${cid}&order=created_at.desc`);
      const data = await resTickets.json();
      setTickets(data.map((t: any) => ({
        id: t.id.toString(),
        titulo: t.titulo || 'Sin título',
        estado: t.estado || 'Abierto',
        prioridad: t.prioridad || 'Media',
        fecha: new Date(t.created_at).toLocaleDateString('es-MX'),
        fecha_cierre: t.fecha_cierre ? new Date(t.fecha_cierre).toLocaleDateString('es-MX') : undefined,
        solucion: t.solucion,
        notas: t.notas
      })));

      setShowTicketModal(false);
      setNewTicket({ titulo: '', prioridad: 'Media', notas: '', xtreme_id: '', agente_asignado: 'Soporte Técnico' });
      setAppSuccess('Ticket creado exitosamente y enviado al cliente.');

    } catch (e: any) {
      console.error('Error creating ticket:', e);
      setAppError(`Error al crear el ticket: ${e.message}`);
    } finally {
      setIsCreatingTicket(false);
      setCreationProgress('');
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket || !ticketSolution.trim()) return;

    try {
      const res = await fetch(`${DB_CONFIG.url}/tickets_soporte?id=eq.${selectedTicket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          estado: 'Cerrado',
          fecha_cierre: new Date().toISOString(),
          solucion: ticketSolution
        })
      });

      if (res.ok) {
        setTickets(prev => prev.map(t => 
          t.id === selectedTicket.id 
            ? { ...t, estado: 'Cerrado', fecha_cierre: new Date().toLocaleDateString('es-MX'), solucion: ticketSolution }
            : t
        ));
        setShowCloseTicketModal(false);
        setSelectedTicket(null);
        setTicketSolution('');
        setInternalNotes('');

        // Notify Chatwoot
        const params = new URLSearchParams(window.location.search);
        let currentConvId = convIdState || params.get('conversation_id') || window.XTREME_URL_PARAMS?.conversation_id;
        if (!currentConvId) {
          const match = document.referrer.match(/conversations\/(\d+)/);
          if (match) currentConvId = match[1];
        }

        if (currentConvId && currentConvId !== '0' && currentConvId !== 'null' && currentConvId !== 'undefined') {
          const sendWithRetry = async (formData: FormData, attempt = 1): Promise<any> => {
            try {
              const res = await fetch(`${CW_CONFIG.url}/api/v1/accounts/1/conversations/${currentConvId}/messages`, {
                method: 'POST',
                headers: { 'api-access-token': CW_CONFIG.token },
                body: formData
              });
              if (!res.ok) {
                const errText = await res.text();
                throw new Error(`HTTP ${res.status}: ${errText}`);
              }
              return await res.json();
            } catch (e: any) {
              if (attempt < 3) {
                console.warn(`Intento ${attempt} fallido, reintentando en 2...`, e);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return sendWithRetry(formData, attempt + 1);
              }
              throw e;
            }
          };

          const textData = new FormData();
          textData.append('content', `✅ *Ticket Cerrado*\n\nTu ticket de soporte #${selectedTicket.id} ha sido marcado como cerrado.\n\n*Anotaciones:* ${ticketSolution}`);
          textData.append('message_type', 'outgoing');
          textData.append('private', 'false');
          
          await sendWithRetry(textData);

          if (internalNotes.trim()) {
            const internalData = new FormData();
            internalData.append('content', `Anotaciones internas para el equipo de xtreme diagnostics:\n\n${internalNotes}`);
            internalData.append('message_type', 'outgoing');
            internalData.append('private', 'true');
            await sendWithRetry(internalData);
          }
        }
      }
    } catch (e) {
      console.error('Error closing ticket:', e);
    }
  };
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const params = new URLSearchParams(window.location.search);
    const cid = contactIdState || params.get('contact_id') || window.XTREME_URL_PARAMS?.contact_id;
    if (!cid) return;

    const msg: ChatMessage = {
      id: Date.now().toString(),
      user: session?.username || 'Usuario',
      text: newMessage,
      timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, msg]);
    setNewMessage('');

    try {
      await fetch(`${DB_CONFIG.url}/chat_interno`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cliente_id: cid,
          usuario: msg.user,
          mensaje: msg.text,
          created_at: new Date().toISOString()
        })
      });
    } catch (e) {
      console.error('Error saving chat message:', e);
    }
  };

  const handleLinkPhone = () => {
    if (!linkPhoneInput.trim()) return;
    setIsSearching(true);
    // Simular búsqueda y vinculación
    setTimeout(() => {
      setClienteData(prev => ({
        ...prev,
        telefonos_vinculados: [...prev.telefonos_vinculados, linkPhoneInput]
      }));
      setLinkPhoneInput('');
      setIsSearching(false);
      setIsLinkModalOpen(false);
    }, 800);
  };

  const hasPaidQuote = cotizaciones.some(c => c.estado === 'Pagada');
  const hasPendingQuote = cotizaciones.some(c => c.estado === 'Pendiente');
  const totalPagado = cotizaciones.filter(c => c.estado === 'Pagada').reduce((acc, curr) => acc + curr.monto, 0);
  const totalPendiente = cotizaciones.filter(c => c.estado === 'Pendiente').reduce((acc, curr) => acc + curr.monto, 0);

  let classificationTag = null;
  const status = calculatedStatus;
  
  if (status === 'Garantía y Recompra') {
    classificationTag = (
      <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm shadow-emerald-500/30 uppercase tracking-tighter">
        <ShieldCheck className="w-3 h-3" /> Garantía y Recompra
      </span>
    );
  } else if (status === 'Cliente sin Garantía') {
    classificationTag = (
      <span className="text-[10px] font-black bg-slate-600 text-white px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm shadow-slate-500/30 uppercase tracking-tighter">
        <User className="w-3 h-3" /> Cliente sin Garantía
      </span>
    );
  } else if (status === 'Seguimiento') {
    classificationTag = (
      <span className="text-[10px] font-black bg-amber-600 text-white px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm shadow-amber-500/30 uppercase tracking-tighter">
        <Calendar className="w-3 h-3" /> Seguimiento
      </span>
    );
  } else if (status === 'Caliente') {
    classificationTag = (
      <span className="text-[10px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm shadow-rose-500/30 animate-pulse uppercase tracking-tighter">
        <Zap className="w-3 h-3" /> Caliente
      </span>
    );
  } else if (status === 'Tibio') {
    classificationTag = (
      <span className="text-[10px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm shadow-amber-500/30 uppercase tracking-tighter">
        <AlertCircle className="w-3 h-3" /> Tibio
      </span>
    );
  } else {
    classificationTag = (
      <span className="text-[10px] font-black bg-blue-500 text-white px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm shadow-blue-500/30 uppercase tracking-tighter">
        <User className="w-3 h-3" /> Frío
      </span>
    );
  }

  const [isWarrantyPayment, setIsWarrantyPayment] = useState(false);
  const [supportTicketNumber, setSupportTicketNumber] = useState('');

  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMsg, setCelebrationMsg] = useState("");

  const handleConfirmPayment = async () => {
    if (!selectedCot) return;
    
    if (isWarrantyPayment && !supportTicketNumber.trim()) {
      console.error("Por favor ingrese el número de ticket de soporte para pagos por garantía.");
      return;
    }

    const updatedDetalles = {
      ...selectedCot.detalles,
      isPaid: true,
      paymentDate,
      paymentMethod: isWarrantyPayment ? 'Garantía' : paymentMethod,
      paymentNotes,
      supportTicket: isWarrantyPayment ? supportTicketNumber : undefined
    };

    try {
      const res = await fetch(`${DB_CONFIG.url}/cotizaciones?id=eq.${selectedCot.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ detalles: updatedDetalles })
      });

      if (res.ok) {
        setCotizaciones(prev => prev.map(c => 
          c.id === selectedCot.id 
            ? { ...c, estado: 'Pagada', detalles: updatedDetalles }
            : c
        ));
        setShowPaymentModal(false);
        setSelectedCot(null);
        setIsWarrantyPayment(false);
        setSupportTicketNumber('');
        
        // Celebration Effect
        setCelebrationMsg(MOTIVATIONAL_PHRASES[Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)]);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 5000);
      } else {
        console.error("Error updating payment status", await res.text());
      }
    } catch (e) {
      console.error("Error updating payment status", e);
    }
  };

  const [ticketFilter, setTicketFilter] = useState<'Todos' | 'Abierto' | 'Cerrado'>('Todos');

  const filteredTickets = tickets.filter(t => {
    if (ticketFilter === 'Todos') return true;
    return t.estado === ticketFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pagada': case 'enviado': case 'cerrado': case 'distribuidor': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'pendiente': case 'abierto': case 'revendedor': case 'empresas': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'en progreso': case 'taller': case 'independiente': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'alta': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      case 'media': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'baja': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-xtreme-cyan/30 border-t-xtreme-cyan rounded-full animate-spin" />
          <p className="text-xs font-black tracking-widest uppercase animate-pulse">Iniciando Panel de Control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden text-slate-300 font-sans selection:bg-xtreme-cyan/30">
      {/* Futuristic Header Banner */}
      <div className="bg-slate-900/50 border-b border-slate-800 px-6 py-2 flex items-center justify-between shrink-0 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Terminal de Cliente</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-white tracking-tighter truncate max-w-[200px]">
                {clienteData.nombre}
              </h1>
              {classificationTag}
            </div>
          </div>
          
          <div className="h-6 w-px bg-slate-800" />
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Clasificación</span>
              <select 
                value={clienteData.clasificacion} 
                onChange={(e) => handleSave({ clasificacion: e.target.value as any })}
                className={`text-[9px] font-black px-1.5 py-0.5 rounded border bg-transparent outline-none cursor-pointer hover:bg-slate-800 transition-colors ${getStatusColor(clienteData.clasificacion || 'Independiente')}`}
              >
                <option value="Taller" className="bg-slate-900">Taller</option>
                <option value="Independiente" className="bg-slate-900">Independiente</option>
                <option value="Empresas" className="bg-slate-900">Empresas</option>
                <option value="Revendedor" className="bg-slate-900">Revendedor</option>
                <option value="Distribuidor" className="bg-slate-900">Distribuidor</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end mr-2">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Balance</span>
            <span className="text-base font-black text-emerald-400 tracking-tighter">${totalPagado.toLocaleString()}</span>
          </div>
          <button 
            onClick={() => setIsLinkModalOpen(true)}
            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition-all border border-slate-700 group"
          >
            <LinkIcon className="w-3 h-3 text-xtreme-cyan" /> Vincular
          </button>
          
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all border ${isEditing ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-xtreme-cyan/10 text-xtreme-cyan border-xtreme-cyan/30 hover:bg-xtreme-cyan/20'}`}
            >
              {isEditing ? <CheckCircle2 className="w-3 h-3" /> : <Edit2 className="w-3 h-3" />}
              {isEditing ? 'Guardar' : 'Editar'}
            </button>
            
            {/* Plantillas Icon - Eye-catching but compact */}
            <button 
              onClick={() => onOpenApp?.('templates')}
              className="flex items-center justify-center px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xtreme-cyan hover:bg-xtreme-cyan/20 hover:border-xtreme-cyan/50 hover:shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all shrink-0 group"
              title="Plantillas de Archivos"
            >
              <FileText className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex p-4 gap-4">
        
        {/* Main Content Area (2/3) */}
        <div className="flex-[2] flex flex-col gap-4 min-w-0 overflow-y-auto no-scrollbar pb-4 pr-2">
          
          {/* Cotizaciones Widget */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl backdrop-blur-sm shrink-0">
            <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-[0.15em]">Historial de Cotizaciones</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  Pendiente: ${totalPendiente.toLocaleString()}
                </div>
                <button 
                  onClick={() => setShowHistoricalModal(true)}
                  className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20 hover:bg-emerald-400/20 transition-colors"
                  title="Agregar historial de compra"
                >
                  <Plus className="w-3 h-3" /> Historial
                </button>
                <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                  <button onClick={() => onOpenApp?.('cotizaciones')} className="p-1 hover:text-xtreme-cyan transition-colors">
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar max-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
                  <tr className="border-b border-slate-800">
                    <th className="px-5 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">Folio</th>
                    <th className="px-5 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">Descripción</th>
                    <th className="px-5 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Monto</th>
                    <th className="px-5 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Estado</th>
                    <th className="px-5 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {cotizaciones.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-slate-600 text-xs italic">No se encontraron registros de cotización.</td>
                    </tr>
                  ) : (
                    cotizaciones.map(cot => (
                      <tr key={cot.id} className="group hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-white tracking-tight">{cot.folio}</span>
                              {cot.isExpired && (
                                <span className="text-[7px] font-black text-rose-500 bg-rose-500/10 px-1 rounded border border-rose-500/20 animate-pulse">EXPIRADA</span>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-500 font-bold">{cot.fecha}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col">
                            <div className="text-xs text-slate-400 truncate max-w-[200px]">{cot.desc}</div>
                            {cot.detalles?.envio?.laptopBarcode && (
                              <div className="flex items-center gap-2 mt-1.5">
                                <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                  <ScanLine className="w-3 h-3 text-emerald-400" />
                                  <span className="text-[10px] font-black font-mono text-emerald-400 uppercase tracking-wider">{cot.detalles.envio.laptopBarcode}</span>
                                </div>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(cot.detalles.envio.laptopBarcode);
                                    setAppSuccess?.("Código copiado");
                                  }}
                                  className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/20 transition-all active:scale-90"
                                  title="Copiar Código"
                                >
                                  <LinkIcon size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="text-xs font-black text-slate-200">${cot.monto.toLocaleString()}</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full border font-black tracking-widest uppercase ${getStatusColor(cot.estado)}`}>
                            {cot.estado}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {cot.estado === 'Pendiente' && (
                              <button 
                                onClick={() => {
                                  setSelectedCot(cot);
                                  setPaymentDate(new Date().toISOString().split('T')[0]);
                                  setShowPaymentModal(true);
                                }}
                                className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 px-3 py-1 rounded transition-all border border-emerald-500/20"
                              >
                                Pagar
                              </button>
                            )}
                            {cot.estado === 'Pagada' && (
                              <div className="flex gap-2">
                                {cot.detalles?.is_historical ? (
                                  <span className="flex items-center gap-1 px-2 py-1 rounded border text-[8px] font-black uppercase tracking-tighter bg-slate-800/50 border-slate-700/50 text-slate-500">
                                    <History size={10} />
                                    Histórico
                                  </span>
                                ) : (
                                  <>
                                    <label className="relative cursor-pointer group/upload">
                                      <input 
                                        type="file" 
                                        className="hidden" 
                                        accept=".pdf"
                                        onChange={(e) => handleFileUpload(e, cot.id, 'label')}
                                        disabled={isUploading === `${cot.id}-label`}
                                      />
                                      <div className={`flex items-center gap-1 px-2 py-1 rounded border text-[8px] font-black uppercase tracking-tighter transition-all ${
                                        cot.detalles?.shipping_label_url 
                                          ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' 
                                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-blue-500/50 hover:text-blue-400'
                                      }`}>
                                        {isUploading === `${cot.id}-label` ? (
                                          <Loader2 size={10} className="animate-spin" />
                                        ) : cot.detalles?.shipping_label_url ? (
                                          <FileCheck size={10} />
                                        ) : (
                                          <Upload size={10} />
                                        )}
                                        {cot.detalles?.shipping_label_url ? 'Etiqueta OK' : 'Subir Etiqueta'}
                                      </div>
                                    </label>

                                    {cot.detalles?.constancia_url ? (
                                      <div className="flex items-center gap-1">
                                        <button 
                                          onClick={() => openS3File(cot.detalles.constancia_url)}
                                          className="flex items-center gap-1 px-2 py-1 rounded border text-[8px] font-black uppercase tracking-tighter transition-all bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30"
                                        >
                                          <FileCheck size={10} />
                                          Constancia OK
                                        </button>
                                        <button
                                          onClick={() => handleDeleteConstancia(cot.id)}
                                          disabled={isUploading === `${cot.id}-delete-constancia`}
                                          className="p-1 rounded border text-[8px] font-black uppercase tracking-tighter transition-all bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                                          title="Borrar Constancia"
                                        >
                                          {isUploading === `${cot.id}-delete-constancia` ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                                        </button>
                                      </div>
                                    ) : (
                                      <label className="relative cursor-pointer group/upload">
                                        <input 
                                          type="file" 
                                          className="hidden" 
                                          accept=".pdf,.xml,.jpg,.png"
                                          onChange={(e) => handleFileUpload(e, cot.id, 'constancia')}
                                          disabled={isUploading === `${cot.id}-constancia`}
                                        />
                                        <div className="flex items-center gap-1 px-2 py-1 rounded border text-[8px] font-black uppercase tracking-tighter transition-all bg-slate-800 border-slate-700 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400">
                                          {isUploading === `${cot.id}-constancia` ? (
                                            <Loader2 size={10} className="animate-spin" />
                                          ) : (
                                            <Upload size={10} />
                                          )}
                                          Subir Constancia
                                        </div>
                                      </label>
                                    )}

                                    {cot.detalles?.all_invoice_urls && cot.detalles.all_invoice_urls.length > 0 ? (
                                      <div className="flex gap-1">
                                        {cot.detalles.all_invoice_urls.map((url: string, idx: number) => (
                                          <button 
                                            key={idx}
                                            onClick={() => openS3File(url)}
                                            className="flex items-center gap-1 px-2 py-1 rounded border text-[8px] font-black uppercase tracking-tighter transition-all bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30"
                                            title={`Ver Factura ${url.split('.').pop()?.toUpperCase()}`}
                                          >
                                            <FileText size={10} />
                                            {url.split('.').pop()?.toUpperCase()}
                                          </button>
                                        ))}
                                      </div>
                                    ) : cot.detalles?.invoice_url ? (
                                      <button 
                                        onClick={() => openS3File(cot.detalles.invoice_url)}
                                        className="flex items-center gap-1 px-2 py-1 rounded border text-[8px] font-black uppercase tracking-tighter transition-all bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30"
                                        title="Ver Factura"
                                      >
                                        <FileText size={10} />
                                        Factura
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setSelectedCotIdForFacturacion(cot.id);
                                          setIsFacturacionModalOpen(true);
                                        }}
                                        className={`flex items-center gap-1 px-2 py-1 rounded border text-[8px] font-black uppercase tracking-tighter transition-all ${
                                          cot.detalles?.requiere_factura 
                                            ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' 
                                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-purple-500/50 hover:text-purple-400'
                                        }`}
                                      >
                                        <Receipt size={10} />
                                        {cot.detalles?.requiere_factura ? 'Requiere Factura' : 'Facturación'}
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Grid: Tickets & Envios */}
          <div className="grid grid-cols-2 gap-4 min-h-[300px] shrink-0">
            
            {/* Tickets Widget */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-xl">
              <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-black text-white uppercase tracking-[0.15em]">Soporte Técnico</h3>
                </div>
                <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                  <button 
                    onClick={handleOpenTicketModal}
                    className="p-1 hover:text-indigo-400 transition-colors mr-1 bg-indigo-500/10 rounded"
                    title="Nuevo Ticket"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button onClick={() => onOpenApp?.('tickets')} className="p-1 hover:text-indigo-400 transition-colors mr-1">
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  {(['Todos', 'Abierto', 'Cerrado'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setTicketFilter(f)}
                      className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded transition-all ${ticketFilter === f ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-2">
                {filteredTickets.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-600 text-[10px] italic">Sin tickets en esta categoría.</div>
                ) : (
                  filteredTickets.map(ticket => (
                    <div key={ticket.id} className="p-3 bg-slate-800/30 border border-slate-800/50 rounded-xl hover:border-indigo-500/30 transition-all group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-white truncate pr-2 group-hover:text-indigo-300 transition-colors">{ticket.titulo}</span>
                          <span className="text-[8px] text-slate-500 font-bold">ID: {ticket.id}</span>
                        </div>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded border font-black tracking-tighter uppercase ${getStatusColor(ticket.estado)}`}>
                          {ticket.estado}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest ${getPriorityColor(ticket.prioridad)}`}>
                          {ticket.prioridad}
                        </span>
                        <div className="flex flex-col items-end">
                          <span className="text-[7px] text-slate-500 font-bold uppercase">Creado: {ticket.fecha}</span>
                          {ticket.fecha_cierre && (
                            <span className="text-[7px] text-emerald-500 font-bold uppercase">Cerrado: {ticket.fecha_cierre}</span>
                          )}
                        </div>
                      </div>

                      {ticket.estado !== 'Cerrado' ? (
                        <button 
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowCloseTicketModal(true);
                          }}
                          className="w-full py-1.5 text-[8px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-all border border-indigo-500/20"
                        >
                          Cerrar Ticket
                        </button>
                      ) : (
                        <div className="p-2 bg-slate-950/50 rounded-lg border border-slate-800/50">
                          <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block mb-1">Solución:</span>
                          <p className="text-[9px] text-slate-400 italic leading-tight">{ticket.solucion}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Envios Widget */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-xl">
              <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-black text-white uppercase tracking-[0.15em]">Logística y Envíos</h3>
                </div>
                <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                  <button onClick={() => onOpenApp?.('envios')} className="p-1 hover:text-blue-400 transition-colors">
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-2">
                {(() => {
                  // Merge actual envios with pending shipments from paid quotes
                  const pendingFromQuotes = cotizaciones
                    .filter(c => c.estado === 'Pagada' && !c.detalles?.is_historical && (!c.detalles?.envio || c.detalles.envio.estado !== 'Enviado'))
                    .map(c => ({
                      id: `pending-${c.id}`,
                      folio: c.folio,
                      estado: 'Pendiente' as const,
                      fecha: c.fecha,
                      isFromQuote: true,
                      paqueteria: c.detalles?.envio?.paqueteria,
                      guia: c.detalles?.envio?.guia,
                      laptopBarcode: c.detalles?.envio?.laptopBarcode
                    }));

                  const allEnvios = [...envios, ...pendingFromQuotes];
                  
                  if (allEnvios.length === 0) {
                    return <div className="h-full flex items-center justify-center text-slate-600 text-[10px] italic">Sin envíos registrados.</div>;
                  }

                  return allEnvios.map(envio => (
                    <div key={envio.id} className="p-3 bg-slate-800/30 border border-slate-800/50 rounded-xl hover:border-blue-500/30 transition-all relative overflow-hidden group">
                      {envio.estado === 'Pendiente' && (
                        <div className="absolute top-0 right-0 p-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse" title="Pendiente de envío" />
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Folio: {envio.folio}</span>
                            {envio.estado === 'Pendiente' && (
                              <span className="text-[7px] font-black text-rose-500 bg-rose-500/10 px-1 rounded border border-rose-500/20 animate-pulse">PENDIENTE</span>
                            )}
                            {envio.laptopBarcode && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <div className="flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                  <ScanLine className="w-2.5 h-2.5 text-emerald-400" />
                                  <span className="text-[9px] font-black font-mono text-emerald-400 uppercase tracking-wider">{envio.laptopBarcode}</span>
                                </div>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(envio.laptopBarcode);
                                    setAppSuccess?.("Código copiado");
                                  }}
                                  className="p-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/20 transition-all active:scale-90"
                                  title="Copiar Código"
                                >
                                  <LinkIcon size={10} />
                                </button>
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-500 font-bold">{envio.paqueteria || 'Por asignar'}</span>
                        </div>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded border font-black tracking-tighter uppercase ${getStatusColor(envio.estado)}`}>
                          {envio.estado}
                        </span>
                      </div>
                      {envio.guia ? (
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/50">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] font-mono text-blue-400 tracking-tighter">GUÍA: {envio.guia}</span>
                          </div>
                          <span className="text-[9px] text-slate-500 font-bold">{envio.fecha}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/50">
                          <div className="text-[9px] text-slate-600 italic">Esperando asignación de guía...</div>
                          <span className="text-[9px] text-slate-500 font-bold">{envio.fecha}</span>
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar (1/3) */}
        <div className="w-[340px] flex flex-col gap-4 overflow-y-auto no-scrollbar pb-10 shrink-0">
          
          {/* Advanced Analytics Section - Optimized for Space */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl shrink-0">
            <div className="p-3 space-y-3">
              {/* Interest Level Chart - Main Visual */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-0.5">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-xtreme-cyan" />
                    <span className="text-[8px] font-black text-white uppercase tracking-[0.15em]">Nivel de Interés</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusInfo && (
                      <span className="text-[7px] font-black text-slate-500 uppercase tracking-tighter">
                        {statusInfo.type === 'payment' 
                          ? `${statusInfo.days}d desde pago` 
                          : `${statusInfo.days}d desde cot.`}
                      </span>
                    )}
                    <span className={`text-[7px] font-black px-2 py-0.5 rounded-full border ${
                      calculatedStatus === 'Caliente' ? 'text-rose-400 border-rose-400/20 bg-rose-400/5' :
                      calculatedStatus === 'Seguimiento' ? 'text-amber-400 border-amber-400/20 bg-amber-400/5' :
                      calculatedStatus === 'Garantía y Recompra' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' :
                      calculatedStatus === 'Cliente sin Garantía' ? 'text-slate-400 border-slate-400/20 bg-slate-400/5' :
                      calculatedStatus === 'Tibio' ? 'text-amber-400 border-amber-400/20 bg-amber-400/5' :
                      'text-blue-400 border-blue-400/20 bg-blue-400/5'
                    }`}>
                      {calculatedStatus === 'Caliente' ? 'INTENSIDAD ALTA' : 'INTENSIDAD MEDIA'}
                    </span>
                  </div>
                </div>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { name: 'Lun', val: 4 },
                      { name: 'Mar', val: 7 },
                      { name: 'Mie', val: 5 },
                      { name: 'Jue', val: 12 },
                      { name: 'Vie', val: 8 },
                      { name: 'Sab', val: 15 },
                      { name: 'Dom', val: 10 },
                    ]}>
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={
                            calculatedStatus === 'Caliente' ? '#f43f5e' :
                            calculatedStatus === 'Seguimiento' ? '#d97706' :
                            calculatedStatus === 'Garantía y Recompra' ? '#10b981' :
                            calculatedStatus === 'Cliente sin Garantía' ? '#475569' :
                            calculatedStatus === 'Tibio' ? '#f59e0b' :
                            '#3b82f6'
                          } stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={
                            calculatedStatus === 'Caliente' ? '#f43f5e' :
                            calculatedStatus === 'Seguimiento' ? '#d97706' :
                            calculatedStatus === 'Garantía y Recompra' ? '#10b981' :
                            calculatedStatus === 'Cliente sin Garantía' ? '#475569' :
                            calculatedStatus === 'Tibio' ? '#f59e0b' :
                            '#3b82f6'
                          } stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="val" 
                        stroke={
                          calculatedStatus === 'Caliente' ? '#f43f5e' :
                          calculatedStatus === 'Seguimiento' ? '#d97706' :
                          calculatedStatus === 'Garantía y Recompra' ? '#10b981' :
                          calculatedStatus === 'Cliente sin Garantía' ? '#475569' :
                          calculatedStatus === 'Tibio' ? '#f59e0b' :
                          '#3b82f6'
                        } 
                        fillOpacity={1} 
                        fill="url(#colorVal)" 
                        strokeWidth={2} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Key Dates - Restored & Prominent */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/30">
                <div className="bg-slate-950/30 border border-slate-800/50 p-1.5 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Calendar className="w-2.5 h-2.5 text-slate-500" />
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Primer Contacto</span>
                  </div>
                  <div className="text-[10px] font-black text-white">12 ENE 2024</div>
                </div>
                <div className="bg-slate-950/30 border border-slate-800/50 p-1.5 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Zap className={`w-2.5 h-2.5 ${
                      calculatedStatus === 'Caliente' ? 'text-rose-400' :
                      calculatedStatus === 'Seguimiento' ? 'text-amber-400' :
                      calculatedStatus === 'Garantía y Recompra' ? 'text-emerald-400' :
                      calculatedStatus === 'Cliente sin Garantía' ? 'text-slate-400' :
                      calculatedStatus === 'Tibio' ? 'text-amber-400' :
                      'text-blue-400'
                    }`} />
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Score Compra</span>
                  </div>
                  <div className={`text-[10px] font-black ${
                    calculatedStatus === 'Caliente' ? 'text-rose-400' :
                    calculatedStatus === 'Seguimiento' ? 'text-amber-400' :
                    calculatedStatus === 'Garantía y Recompra' ? 'text-emerald-400' :
                    calculatedStatus === 'Cliente sin Garantía' ? 'text-slate-400' :
                    calculatedStatus === 'Tibio' ? 'text-amber-400' :
                    'text-blue-400'
                  }`}>84%</div>
                </div>
              </div>

              {/* Ciclo del Cliente Timeline - NOW AT BOTTOM */}
              <div className="space-y-4 pt-4 mt-2 border-t border-slate-800/50">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-xtreme-cyan" />
                    <span className="text-white">Ciclo de Vida del Cliente</span>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-400/80 uppercase tracking-widest bg-emerald-400/10 px-2 py-0.5 rounded-full">Inteligente</span>
                </div>
                
                <div className="relative h-6 flex items-center px-2">
                  <div className="absolute left-2 right-2 h-[2px] bg-slate-800 rounded-full" />
                  <div 
                    className={`absolute left-2 h-[2px] rounded-full transition-all duration-1000 ${
                      calculatedStatus === 'Frío' ? 'w-[8.33%]' :
                      calculatedStatus === 'Tibio' ? 'w-[25%]' :
                      calculatedStatus === 'Caliente' ? 'w-[41.66%]' :
                      calculatedStatus === 'Seguimiento' ? 'w-[58.33%]' :
                      calculatedStatus === 'Garantía y Recompra' ? 'w-[75%]' :
                      'w-[91.66%]'
                    } ${
                      calculatedStatus === 'Caliente' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' :
                      calculatedStatus === 'Seguimiento' ? 'bg-amber-600 shadow-[0_0_10px_rgba(217,119,6,0.5)]' :
                      calculatedStatus === 'Garantía y Recompra' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                      calculatedStatus === 'Cliente sin Garantía' ? 'bg-slate-500 shadow-[0_0_10px_rgba(100,116,139,0.5)]' :
                      calculatedStatus === 'Tibio' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' :
                      'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                    }`}
                  />
                  <div className="absolute inset-0 flex justify-between items-center px-2">
                    {[
                      { id: 'Frío', color: 'bg-blue-500' },
                      { id: 'Tibio', color: 'bg-amber-500' },
                      { id: 'Caliente', color: 'bg-rose-500' },
                      { id: 'Seguimiento', color: 'bg-amber-600' },
                      { id: 'Garantía y Recompra', color: 'bg-emerald-500' },
                      { id: 'Cliente sin Garantía', color: 'bg-slate-500' }
                    ].map((step) => {
                      const isActive = calculatedStatus === step.id;
                      return (
                        <div key={step.id} className="relative flex flex-col items-center flex-1 group">
                          <div className={`w-3 h-3 rounded-full border-2 border-slate-900 transition-all duration-500 z-10 ${
                            isActive ? `${step.color} scale-150 shadow-[0_0_12px_rgba(255,255,255,0.4)]` : 'bg-slate-700'
                          }`} />
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-between px-1 mt-2">
                   {[
                     { label: 'Frío', id: 'Frío' },
                     { label: 'Tibio', id: 'Tibio' },
                     { label: 'Caliente', id: 'Caliente' },
                     { label: 'Seguim.', id: 'Seguimiento' },
                     { label: 'Garantía', id: 'Garantía y Recompra' },
                     { label: 'Sin Gtía', id: 'Cliente sin Garantía' }
                   ].map((step) => (
                     <span key={step.id} className={`text-[8px] font-black uppercase tracking-widest w-12 text-center leading-[1.2] transition-colors duration-300 ${
                       calculatedStatus === step.id ? 'text-white' : 'text-slate-500'
                     }`}>
                       {step.label}
                     </span>
                   ))}
                </div>

                {/* Loyalty & Retention Timeline - NEW */}
                {paidCount > 0 && (
                  <div className="space-y-4 pt-6 mt-4 border-t border-slate-800/50 animate-in fade-in slide-in-from-bottom-2 duration-700">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span className="text-white">Fidelización y Reventa</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-black text-amber-400/80 uppercase tracking-widest bg-amber-400/10 px-2 py-0.5 rounded-full">
                          {paidCount} {paidCount === 1 ? 'Compra' : 'Compras'}
                        </span>
                      </div>
                    </div>

                    <div className="relative h-6 flex items-center px-2">
                      <div className="absolute left-2 right-2 h-[2px] bg-slate-800 rounded-full" />
                      <div 
                        className="absolute left-2 h-[2px] bg-gradient-to-r from-amber-500 to-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                        style={{ width: `${Math.min(100, (loyaltyStep / 5) * 100)}%` }}
                      />
                      <div className="absolute inset-0 flex justify-between items-center px-2">
                        {[1, 2, 3, 4, 5].map((step) => {
                          const isActive = loyaltyStep >= step;
                          const isCurrent = loyaltyStep === step;
                          return (
                            <div key={step} className="relative flex flex-col items-center flex-1">
                              <div className={`w-3 h-3 rounded-full border-2 border-slate-900 transition-all duration-500 z-10 ${
                                isCurrent ? 'bg-amber-400 scale-150 shadow-[0_0_12px_rgba(251,191,36,0.6)]' : 
                                isActive ? 'bg-amber-600' : 'bg-slate-700'
                              }`} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex justify-between px-1 mt-2">
                       {[
                         { label: 'Conversión', id: 1 },
                         { label: 'Post-Venta', id: 2 },
                         { label: 'Reventa', id: 3 },
                         { label: 'Fidelizado', id: 4 },
                         { label: 'Embajador', id: 5 }
                       ].map((step) => (
                         <span key={step.id} className={`text-[8px] font-black uppercase tracking-widest w-12 text-center leading-[1.2] transition-colors duration-300 ${
                           loyaltyStep === step.id ? 'text-amber-400' : 
                           loyaltyStep > step.id ? 'text-amber-600' : 'text-slate-500'
                         }`}>
                           {step.label}
                         </span>
                       ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Specific Info */}
              {calculatedStatus === 'Garantía y Recompra' && statusInfo?.type === 'payment' && (
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-2 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Garantía Activa</span>
                  </div>
                  <span className="text-[9px] font-black text-white">{statusInfo.remaining}d restantes</span>
                </div>
              )}

              {calculatedStatus === 'Seguimiento' && statusInfo?.type === 'quote' && (
                <div className="bg-amber-500/5 border border-amber-500/10 p-2 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                    <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Cot. Vencida</span>
                  </div>
                  <span className="text-[9px] font-black text-white">Hace {statusInfo.days}d</span>
                </div>
              )}
            </div>
          </div>

          {/* Team Chat Section - NOW SECOND */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl h-[380px] shrink-0">
            <div className="px-5 py-2.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-xtreme-cyan" />
                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.15em]">Canal Interno</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Activo</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/30 no-scrollbar">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3 opacity-40">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-center px-6">Inicia el registro de actividad para este cliente</p>
                </div>
              ) : (
                chatMessages.map(msg => (
                  <div key={msg.id} className="flex flex-col group/msg">
                    <div className="flex items-center justify-between mb-1.5 px-1">
                      <span className="text-[9px] font-black text-xtreme-cyan uppercase tracking-wider">{msg.user}</span>
                      <span className="text-[8px] text-slate-600 font-bold">{msg.timestamp}</span>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-2xl rounded-tl-none shadow-sm text-xs text-slate-300 leading-relaxed group-hover/msg:border-slate-600 transition-colors">
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/50">
              <div className="flex gap-2 bg-slate-900 border border-slate-700 rounded-xl p-1 focus-within:border-xtreme-cyan/50 transition-all">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Mensaje de equipo..."
                  className="flex-1 text-xs px-3 py-2 bg-transparent focus:outline-none text-white"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-xtreme-cyan text-slate-950 p-2 rounded-lg hover:bg-white disabled:opacity-30 transition-all shadow-lg shadow-xtreme-cyan/10"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Client Details Card - NOW THIRD */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl relative overflow-hidden shrink-0">
            {/* Decorative Grid Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#xtreme-cyan_1px,transparent_1px)] [background-size:16px_16px]" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                  paidCount >= 5 ? 'from-indigo-500 to-purple-600 shadow-indigo-500/40' :
                  paidCount >= 3 ? 'from-amber-400 to-orange-600 shadow-amber-500/40' :
                  'from-xtreme-cyan to-blue-600 shadow-xtreme-cyan/20'
                } flex items-center justify-center shadow-lg border border-white/10 shrink-0 relative transition-all duration-500`}>
                  {paidCount >= 5 ? (
                    <Zap className="w-6 h-6 text-white animate-pulse" />
                  ) : paidCount >= 3 ? (
                    <Trophy className="w-6 h-6 text-white" />
                  ) : (
                    <User className="w-6 h-6 text-slate-950" />
                  )}
                  {paidCount >= 3 && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-slate-900 flex items-center justify-center shadow-lg"
                    >
                      <Star className="w-2 h-2 text-white fill-white" />
                    </motion.div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="space-y-1.5">
                      <input 
                        type="text" 
                        value={clienteData.nombre}
                        onChange={(e) => setClienteData({...clienteData, nombre: e.target.value})}
                        className="text-xs font-black text-white border-b border-xtreme-cyan focus:outline-none bg-transparent w-full uppercase tracking-tight"
                        placeholder="Nombre completo"
                      />
                      <input 
                        type="text" 
                        value={clienteData.xtreme_id}
                        onChange={(e) => setClienteData({...clienteData, xtreme_id: e.target.value})}
                        className="text-[9px] font-black text-xtreme-cyan border-b border-slate-700 focus:outline-none bg-transparent w-full tracking-[0.2em] uppercase"
                        placeholder="Xtreme ID"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-black text-white uppercase tracking-tight leading-tight truncate">{clienteData.nombre}</h2>
                        {paidCount >= 3 && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30">
                            <Trophy className="w-2.5 h-2.5 text-amber-400" />
                            <span className="text-[7px] font-black text-amber-400 uppercase tracking-widest">Fidelizado</span>
                          </div>
                        )}
                        {paidCount >= 5 && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 ml-1">
                            <Zap className="w-2.5 h-2.5 text-indigo-400" />
                            <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest">Embajador</span>
                          </div>
                        )}
                      </div>
                      <div className="text-[9px] font-black text-xtreme-cyan tracking-[0.2em] uppercase mt-0.5">
                        {clienteData.xtreme_id || 'SIN ID ASIGNADO'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-start gap-3 group/item">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 group-hover/item:border-xtreme-cyan/50 transition-colors">
                    <Mail className="w-3.5 h-3.5 text-slate-400 group-hover/item:text-xtreme-cyan transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Correo</span>
                    {isEditing ? (
                      <input type="email" value={clienteData.email} onChange={(e) => setClienteData({...clienteData, email: e.target.value})} className="w-full text-[10px] bg-slate-800 border border-slate-700 rounded p-1 focus:border-xtreme-cyan outline-none text-white" />
                    ) : (
                      <div className="text-[10px] text-slate-300 truncate font-bold">{clienteData.email}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 group/item">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 group-hover/item:border-xtreme-cyan/50 transition-colors">
                    <Phone className="w-3.5 h-3.5 text-slate-400 group-hover/item:text-xtreme-cyan transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Teléfono</span>
                    {isEditing ? (
                      <input type="text" value={clienteData.telefono} onChange={(e) => setClienteData({...clienteData, telefono: e.target.value})} className="w-full text-[10px] bg-slate-800 border border-slate-700 rounded p-1 focus:border-xtreme-cyan outline-none text-white" />
                    ) : (
                      <div className="text-[10px] text-slate-300 font-bold">{clienteData.telefono}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 group/item">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 group-hover/item:border-xtreme-cyan/50 transition-colors">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 group-hover/item:text-xtreme-cyan transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Ubicación</span>
                    {isEditing ? (
                      <textarea value={clienteData.direccion} onChange={(e) => setClienteData({...clienteData, direccion: e.target.value})} className="w-full text-[10px] bg-slate-800 border border-slate-700 rounded p-1 focus:border-xtreme-cyan outline-none text-white resize-none" rows={2} />
                    ) : (
                      <div className="text-[10px] text-slate-300 leading-tight font-medium line-clamp-2">{clienteData.direccion}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 group/item">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 group-hover/item:border-xtreme-cyan/50 transition-colors">
                    <FileText className="w-3.5 h-3.5 text-slate-400 group-hover/item:text-xtreme-cyan transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">RFC</span>
                    {isEditing ? (
                      <input type="text" value={clienteData.rfc} onChange={(e) => setClienteData({...clienteData, rfc: e.target.value})} className="w-full text-[10px] bg-slate-800 border border-slate-700 rounded p-1 focus:border-xtreme-cyan outline-none text-white uppercase" />
                    ) : (
                      <div className="text-[10px] text-xtreme-cyan font-black tracking-widest">{clienteData.rfc}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 group/item">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 group-hover/item:border-xtreme-cyan/50 transition-colors">
                    <Tag className="w-3.5 h-3.5 text-slate-400 group-hover/item:text-xtreme-cyan transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Clasificación</span>
                    {isEditing ? (
                      <select 
                        value={clienteData.clasificacion} 
                        onChange={(e) => setClienteData({...clienteData, clasificacion: e.target.value as any})} 
                        className="w-full text-[10px] bg-slate-800 border border-slate-700 rounded p-1 focus:border-xtreme-cyan outline-none text-white appearance-none cursor-pointer"
                      >
                        <option value="Taller">Taller</option>
                        <option value="Independiente">Independiente</option>
                        <option value="Empresas">Empresas</option>
                        <option value="Revendedor">Revendedor</option>
                        <option value="Distribuidor">Distribuidor</option>
                      </select>
                    ) : (
                      <div className="text-[10px] text-slate-300 font-bold">{clienteData.clasificacion || 'Sin Clasificar'}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Celebration Overlay */}
      {/* Hidden PDF Template */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        {currentTicketData && (
          <div id="ticket-pdf-template">
            <TicketTemplate ref={ticketPdfRef} data={currentTicketData} />
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCelebration && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
          >
            <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[2px]" />
            <motion.div 
              initial={{ scale: 0.5, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="relative bg-slate-900 border-2 border-emerald-500/50 p-8 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.3)] text-center space-y-4 max-w-sm mx-4"
            >
              <div className="flex justify-center gap-3">
                <motion.div animate={{ rotate: [0, 20, -20, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>
                  <Trophy className="w-12 h-12 text-yellow-400" />
                </motion.div>
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                  <PartyPopper className="w-12 h-12 text-emerald-400" />
                </motion.div>
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">¡VENTA CERRADA!</h2>
              <p className="text-emerald-400 font-bold text-sm italic">"{celebrationMsg}"</p>
              <div className="flex justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -10, 0], opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                  >
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Facturación */}
      {isFacturacionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <h3 className="font-black text-white uppercase tracking-widest flex items-center gap-3">
                <Receipt className="w-4 h-4 text-purple-400" /> Confirmar Facturación
              </h3>
              <button onClick={() => setIsFacturacionModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-sm text-slate-300 leading-relaxed font-medium">
                ¿Quieres confirmar que este cliente necesita factura para esta cotización?
              </p>
            </div>
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsFacturacionModalOpen(false)}
                className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  if (!selectedCotIdForFacturacion) return;
                  try {
                    const cot = cotizaciones.find(c => c.id === selectedCotIdForFacturacion);
                    if (cot) {
                      const updatedDetalles = {
                        ...(cot.detalles || {}),
                        requiere_factura: true
                      };
                      const res = await fetch(`${DB_CONFIG.url}/cotizaciones?id=eq.${selectedCotIdForFacturacion}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ detalles: updatedDetalles })
                      });
                      if (res.ok) {
                        setCotizaciones(prev => prev.map(c => c.id === selectedCotIdForFacturacion ? { ...c, detalles: updatedDetalles } : c));
                      }
                    }
                  } catch (e) {
                    console.error('Error updating facturacion:', e);
                  }
                  setIsFacturacionModalOpen(false);
                  setSelectedCotIdForFacturacion(null);
                }}
                className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-white bg-purple-500 hover:bg-purple-600 rounded-xl transition-all shadow-lg shadow-purple-500/20"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Vincular Teléfono */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <h3 className="font-black text-white uppercase tracking-widest flex items-center gap-3">
                <LinkIcon className="w-4 h-4 text-xtreme-cyan" /> Vincular Identidad
              </h3>
              <button onClick={() => setIsLinkModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">Número de Terminal</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-600 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    value={linkPhoneInput}
                    onChange={(e) => setLinkPhoneInput(e.target.value)}
                    placeholder="+52 81 0000 0000"
                    className="w-full pl-11 pr-4 py-3 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-xtreme-cyan text-white placeholder:text-slate-700"
                    autoFocus
                  />
                </div>
              </div>

              <div className="bg-xtreme-cyan/5 border border-xtreme-cyan/20 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-xtreme-cyan shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  Esta acción fusionará los registros de <strong className="text-white">Chatwoot</strong> y el historial de actividad de este número con el perfil central de <strong className="text-white">{clienteData.nombre}</strong>.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsLinkModalOpen(false)}
                className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleLinkPhone}
                disabled={!linkPhoneInput.trim() || isSearching}
                className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-950 bg-xtreme-cyan hover:bg-white disabled:opacity-30 rounded-xl transition-all shadow-lg shadow-xtreme-cyan/20"
              >
                {isSearching ? 'Procesando...' : 'Confirmar Vínculo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[150] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_50px_-12px_rgba(16,185,129,0.2)] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-emerald-400" /> Confirmar Liquidación
              </h3>
              <button 
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedCot(null);
                }}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Fecha de Pago</label>
                  <input 
                    type="date" 
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-white text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Método</label>
                  <select 
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    disabled={isWarrantyPayment}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-white text-sm disabled:opacity-30"
                  >
                    <option value="Transferencia">Transferencia</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Pago por Garantía</span>
                  </div>
                  <button 
                    onClick={() => setIsWarrantyPayment(!isWarrantyPayment)}
                    className={`w-10 h-5 rounded-full transition-all relative ${isWarrantyPayment ? 'bg-emerald-500' : 'bg-slate-800'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isWarrantyPayment ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                {isWarrantyPayment && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                    <label className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">Número de Ticket de Soporte</label>
                    <input 
                      type="text" 
                      value={supportTicketNumber}
                      onChange={(e) => setSupportTicketNumber(e.target.value)}
                      placeholder="Ej. TKT-2024-001"
                      className="w-full px-4 py-2 bg-slate-950 border border-emerald-500/30 rounded-xl focus:outline-none focus:border-emerald-500 text-white text-xs placeholder:text-slate-700"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Notas del Agente</label>
                <textarea 
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Detalles adicionales del pago..."
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-white text-xs h-20 resize-none placeholder:text-slate-700"
                />
              </div>
            </div>
            
            <div className="px-6 py-5 border-t border-slate-800 bg-slate-950/50 flex gap-3">
              <button 
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedCot(null);
                }}
                className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmPayment}
                className="flex-1 py-3 bg-emerald-500 text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-emerald-500/20"
              >
                Confirmar Pago
              </button>
            </div>
          </div>
        </div>
      )}
      {/* New Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 z-[150] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 relative">
            {isCreatingTicket && (
              <div className="absolute inset-0 z-[160] bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 border-4 border-xtreme-cyan/20 border-t-xtreme-cyan rounded-full animate-spin mb-4" />
                <h4 className="text-white font-black uppercase tracking-widest mb-2">Creando Ticket</h4>
                <p className="text-xtreme-cyan text-[10px] font-bold animate-pulse">{creationProgress}</p>
              </div>
            )}

            <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                <Plus className="w-5 h-5 text-indigo-400" /> Nuevo Ticket de Soporte
              </h3>
              <button onClick={() => setShowTicketModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-2xl mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ID de Ticket</span>
                  <span className="text-xs font-mono font-bold text-indigo-400">
                    {nextTicketId ? `#${nextTicketId}` : 'Cargando...'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Xtreme ID</span>
                  {fetchedXtremeIds.length > 1 ? (
                    <select
                      value={selectedXtremeId}
                      onChange={(e) => {
                        setSelectedXtremeId(e.target.value);
                        setNewTicket(prev => ({ ...prev, xtreme_id: e.target.value }));
                      }}
                      className="bg-[#1a1b20] text-indigo-400 font-mono font-bold text-xs border border-[#2a2b32] rounded px-2 py-1 outline-none"
                    >
                      {fetchedXtremeIds.map((id, idx) => (
                        <option key={idx} value={id}>{id}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs font-mono font-bold text-indigo-400">
                      {fetchedXtremeIds.length === 1 ? fetchedXtremeIds[0] : 'No encontrado'}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Asunto / Título</label>
                <input 
                  type="text" 
                  value={newTicket.titulo}
                  onChange={(e) => setNewTicket({...newTicket, titulo: e.target.value})}
                  placeholder="Ej. Problema con motor de arranque"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Prioridad</label>
                  <select 
                    value={newTicket.prioridad}
                    onChange={(e) => setNewTicket({...newTicket, prioridad: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-white text-sm"
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Equipo / Modelo</label>
                  <input 
                    type="text" 
                    value={newTicket.equipo}
                    onChange={(e) => setNewTicket({...newTicket, equipo: e.target.value})}
                    placeholder="Ej. Xtreme 250"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-white text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Notas Iniciales</label>
                <textarea 
                  value={newTicket.notas}
                  onChange={(e) => setNewTicket({...newTicket, notas: e.target.value})}
                  placeholder="Describe el problema..."
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-white text-xs h-24 resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-5 border-t border-slate-800 bg-slate-950/50 flex gap-3">
              <button 
                onClick={() => setShowTicketModal(false)} 
                disabled={isCreatingTicket}
                className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors disabled:opacity-30"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreateTicket} 
                disabled={isCreatingTicket || !newTicket.titulo.trim()}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-30"
              >
                {isCreatingTicket ? 'Procesando...' : 'Crear Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Ticket Modal */}
      {showCloseTicketModal && (
        <div className="fixed inset-0 z-[150] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Cerrar Ticket
              </h3>
              <button onClick={() => setShowCloseTicketModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  Para cerrar el ticket <strong className="text-white">#{selectedTicket?.id}</strong>, por favor describe la solución aplicada. Esta información será visible para el cliente y el equipo técnico.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Anotaciones para el cliente</label>
                  <textarea 
                    value={ticketSolution}
                    onChange={(e) => setTicketSolution(e.target.value)}
                    placeholder="Describe las anotaciones para el cliente..."
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-white text-xs h-24 resize-none"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Anotaciones internas para el equipo de xtreme diagnostics</label>
                  <textarea 
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Anotaciones internas (solo visibles para el equipo)..."
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-white text-xs h-24 resize-none"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-5 border-t border-slate-800 bg-slate-950/50 flex gap-3">
              <button onClick={() => setShowCloseTicketModal(false)} className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Cancelar</button>
              <button 
                onClick={handleCloseTicket} 
                disabled={!ticketSolution.trim()}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-30"
              >
                Finalizar y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Integrated Error Modal */}
      {appError && (
        <div className="fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <AlertCircle className="text-red-500" size={32} />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Error</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
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

      {/* Integrated Success Modal */}
      {appSuccess && (
        <div className="fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <CheckCircle2 className="text-emerald-500" size={32} />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Éxito</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                {appSuccess}
              </p>
              <button 
                onClick={() => setAppSuccess(null)}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historical Purchase Confirmation Modal */}
      {showHistoricalModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1a1b20] rounded-2xl w-full max-w-md border border-[#2a2b32] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <History className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Agregar Historial de Compra</h2>
              <p className="text-sm text-slate-400 mb-4">
                Esta función es exclusivamente para registrar compras antiguas de clientes que adquirieron productos antes de que existiera este sistema.
              </p>
              <ul className="text-sm text-slate-300 space-y-2 mb-6 list-disc pl-5">
                <li>Marcará al contacto como "Cliente".</li>
                <li>Quedará registrado en su historial como una compra pagada y entregada.</li>
                <li><strong>NO</strong> generará envíos pendientes.</li>
                <li><strong>NO</strong> generará facturación.</li>
                <li><strong>NO</strong> generará comisiones.</li>
              </ul>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowHistoricalModal(false)}
                  className="px-4 py-2 rounded-xl font-bold text-sm text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowHistoricalModal(false);
                    setShowHistoricalForm(true);
                  }}
                  className="px-4 py-2 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historical Purchase Form Modal */}
      {showHistoricalForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1a1b20] rounded-2xl w-full max-w-2xl border border-[#2a2b32] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#2a2b32] flex justify-between items-center bg-[#1f2026]">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-400" />
                Registro de Compra Histórica
              </h2>
              <button onClick={() => setShowHistoricalForm(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">¿Cuándo compró?</label>
                <input 
                  type="date" 
                  value={historicalDate}
                  onChange={(e) => setHistoricalDate(e.target.value)}
                  className="w-full bg-[#14151a] border border-[#2a2b32] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">¿Qué compró?</label>
                  <button 
                    onClick={() => setHistoricalItems([...historicalItems, { name: '', price: 0, quantity: 1 }])}
                    className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 uppercase tracking-widest"
                  >
                    <Plus size={12} /> Añadir
                  </button>
                </div>
                
                <div className="space-y-4">
                  {historicalItems.map((item, index) => (
                    <div key={index} className="bg-[#14151a] rounded-xl border border-[#2a2b32] p-3 sm:p-5 relative group">
                      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button 
                          onClick={() => {
                            const newItems = [...historicalItems];
                            newItems.splice(index, 1);
                            setHistoricalItems(newItems);
                          }}
                          className="text-red-400 hover:text-red-300 p-1.5 bg-red-400/10 rounded-md"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 sm:pr-10 relative">
                        <div className="sm:col-span-12">
                          <label className="block text-[9px] font-mono text-slate-500 mb-1">NOMBRE DEL EQUIPO / SERVICIO</label>
                          <HistoricalProductSelector 
                            item={item} 
                            index={index}
                            products={catalogProducts} 
                            loadingProducts={loadingCatalog} 
                            updateItem={(idx, field, value) => {
                              const newItems = [...historicalItems];
                              (newItems[idx] as any)[field] = value;
                              setHistoricalItems(newItems);
                            }} 
                          />
                          {item.name.startsWith('Personalizado') && (
                            <input 
                              type="text" 
                              value={item.name.replace('Personalizado: ', '')}
                              onChange={(e) => {
                                const newItems = [...historicalItems];
                                newItems[index].name = 'Personalizado: ' + e.target.value;
                                setHistoricalItems(newItems);
                              }}
                              placeholder="Escribe el concepto personalizado..."
                              className="w-full mt-3 bg-transparent border-b border-emerald-700/50 py-1.5 text-sm sm:text-base font-bold text-emerald-300 outline-none focus:border-emerald-500 transition-colors" 
                            />
                          )}
                        </div>
                        
                        <div className="sm:col-span-6">
                          <label className="block text-[9px] font-mono text-slate-500 mb-1">PRECIO UNITARIO</label>
                          <input 
                            type="number" 
                            value={item.price}
                            onChange={(e) => {
                              const newItems = [...historicalItems];
                              newItems[index].price = parseFloat(e.target.value) || 0;
                              setHistoricalItems(newItems);
                            }}
                            className="w-full bg-transparent border-b border-[#2a2b32] py-1.5 text-xs sm:text-sm font-mono text-emerald-400 font-bold outline-none focus:border-emerald-500 transition-colors" 
                          />
                        </div>
                        
                        <div className="sm:col-span-6">
                          <label className="block text-[9px] font-mono text-slate-500 mb-1">CANTIDAD</label>
                          <input 
                            type="number" 
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...historicalItems];
                              newItems[index].quantity = parseInt(e.target.value) || 1;
                              setHistoricalItems(newItems);
                            }}
                            className="w-full bg-transparent border-b border-[#2a2b32] py-1.5 text-xs sm:text-sm font-mono text-white outline-none focus:border-emerald-500 transition-colors" 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {historicalItems.length === 0 && (
                    <div className="text-center py-6 text-slate-500 text-sm border border-dashed border-[#2a2b32] rounded-xl">
                      No hay productos agregados. Haz clic en "Añadir" para comenzar.
                    </div>
                  )}
                </div>
              </div>
                
                {historicalItems.length > 0 && (
                  <div className="mt-4 flex justify-end items-center gap-4 bg-[#14151a] p-4 rounded-xl border border-[#2a2b32]">
                    <span className="text-sm text-slate-400 font-bold uppercase">Total Histórico:</span>
                    <span className="text-xl font-black text-emerald-400">${historicalTotal.toLocaleString()}</span>
                  </div>
                )}
              </div>

            <div className="p-4 border-t border-[#2a2b32] flex justify-end gap-3 bg-[#1f2026]">
              <button
                onClick={() => setShowHistoricalForm(false)}
                className="px-4 py-2 rounded-xl font-bold text-sm text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveHistorical}
                disabled={isUploading === 'historical' || !historicalDate || historicalItems.length === 0}
                className="px-6 py-2 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUploading === 'historical' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /> Guardar Registro</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
