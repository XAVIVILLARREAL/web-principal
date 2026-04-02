import React, { useState, useEffect } from 'react';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getPresignedS3Url, openS3File } from '../../lib/s3Utils';
import { 
  TrendingUp, DollarSign, Users, Calendar, 
  BarChart3, PieChart, Activity, ArrowUpRight,
  Package, FileText, CheckCircle2, Clock, CreditCard,
  LayoutDashboard, List, CheckSquare, Settings, ChevronLeft, ChevronRight,
  ShieldAlert, ShieldCheck, Plus, Upload, AlertTriangle, AlertCircle, Trash2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DB_CONFIG = {
  url: "https://api-datos.xtremediagnostics.com"
};

const S3_CONFIG = {
  endpoint: 'https://s3.xtremediagnostics.com',
  bucket: 'cotizaciones-xtreme',
  accessKey: 'PMVOF73TI5D7H0HQ0PX3',
  secretKey: 'GyQgYLdOu8jp2KzAl58vy92EqTPS7DA+0KpiUz2l'
};

const CW_CONFIG = {
  url: "https://crm.xtremediagnostics.com",
  token: "EQN2pbRUuBrjdwEmM7PYyjY6"
};

interface Cotizacion {
  id: number;
  contact_id: string;
  folio: string;
  monto: number;
  agente: string;
  created_at: string;
  detalles: any;
  s3_path?: string;
  datos_cliente?: any;
  telefono_cliente?: string;
  conceptos?: any[];
  estado?: string;
}

interface CommissionRule {
  id: string;
  name: string;
  type: 'agent' | 'concept' | 'amount';
  condition: string;
  percentage: number;
}

export default function VentasApp({ username }: { username?: string }) {
  const [sales, setSales] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tabs: pagadas, dashboard, generadas, comisiones
  const [activeTab, setActiveTab] = useState<'pagadas' | 'dashboard' | 'generadas' | 'comisiones'>('pagadas');
  const [invoiceFilter, setInvoiceFilter] = useState<'todas' | 'facturadas' | 'pendientes'>('todas');
  
  // Time filtering
  const [timeFilterType, setTimeFilterType] = useState<'week' | 'month'>('week');
  const [currentDateOffset, setCurrentDateOffset] = useState(0);
  
  // CEO Mode
  const [isCEO, setIsCEO] = useState(username?.toLowerCase() === 'ceo' || username?.toLowerCase() === 'admin');

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCot, setSelectedCot] = useState<Cotizacion | null>(null);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Transferencia');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Commission Rules State
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([
    { id: '1', name: 'Comisión Valeria', type: 'agent', condition: 'valeria', percentage: 1.4 },
    { id: '2', name: 'Comisión Base', type: 'amount', condition: '0', percentage: 0 }
  ]);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      // Fetch a smaller limit to prevent payload too large errors
      const res = await fetch(`${DB_CONFIG.url}/cotizaciones?select=id,contact_id,created_at,detalles,monto,agente,datos_cliente,conceptos,folio,estado,s3_path&order=created_at.desc&limit=500`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setSales(data);
        }
      }
    } catch (error) {
      console.error("Error fetching sales:", error);
    } finally {
      setLoading(false);
    }
  };

  // Date Filtering Logic
  const getFilterDates = () => {
    const now = new Date();
    if (timeFilterType === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const startOfWeek = new Date(now.setDate(diff));
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(startOfWeek.getDate() + (currentDateOffset * 7));
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      return { start: startOfWeek, end: endOfWeek };
    } else {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth() + currentDateOffset, 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + currentDateOffset + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      return { start: startOfMonth, end: endOfMonth };
    }
  };

  const { start: filterStart, end: filterEnd } = getFilterDates();

  const paidSalesAll = sales.filter(s => (s.detalles?.isPaid || s.estado === 'Pagada' || s.estado === 'Facturada') && !s.detalles?.is_historical);
  const pendingSalesAll = sales.filter(s => !(s.detalles?.isPaid || s.estado === 'Pagada' || s.estado === 'Facturada') && !s.detalles?.is_historical);

  const paidSales = paidSalesAll.filter(s => {
    const date = new Date(s.detalles?.paymentDate || s.created_at);
    return date >= filterStart && date <= filterEnd;
  });

  const pendingSales = pendingSalesAll.filter(s => {
    const date = new Date(s.created_at);
    return date >= filterStart && date <= filterEnd;
  });

  const filteredSales = [...paidSales, ...pendingSales].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const filteredPaidSales = paidSales.filter(s => {
    if (invoiceFilter === 'todas') return true;
    if (invoiceFilter === 'facturadas') return !!s.detalles?.invoice_url;
    if (invoiceFilter === 'pendientes') return s.detalles?.requiere_factura && !s.detalles?.invoice_url;
    return true;
  });

  // Metrics
  const totalRevenue = paidSales.reduce((acc, curr) => acc + (curr.monto || curr.detalles?.total || 0), 0);
  const totalPending = pendingSales.reduce((acc, curr) => acc + (curr.monto || curr.detalles?.total || 0), 0);
  
  // Agent Sales
  const agentSales = paidSales.reduce((acc: any, curr) => {
    const agent = curr.agente || curr.detalles?.vendedor || 'Desconocido';
    if (!acc[agent]) acc[agent] = { count: 0, total: 0, commission: 0 };
    acc[agent].count += 1;
    const total = curr.monto || curr.detalles?.total || 0;
    acc[agent].total += total;

    // Calculate commission for this sale
    let saleCommission = 0;
    const items = curr.detalles?.items || [];
    
    // Find matching rule (first match wins)
    const rule = commissionRules.find(r => {
      if (r.type === 'agent') return agent.toLowerCase().includes(r.condition.toLowerCase());
      if (r.type === 'amount') return total >= parseFloat(r.condition || '0');
      if (r.type === 'concept') return items.some((i: any) => i.nombre?.toLowerCase().includes(r.condition.toLowerCase()));
      return false;
    });

    if (rule) {
      saleCommission = total * (rule.percentage / 100);
    }

    acc[agent].commission += saleCommission;

    return acc;
  }, {});

  const chartData = React.useMemo(() => {
    const data: Record<string, number> = {};
    const sortedSales = [...paidSales].sort((a, b) => {
      const dateA = new Date(a.detalles?.paymentDate || a.created_at).getTime();
      const dateB = new Date(b.detalles?.paymentDate || b.created_at).getTime();
      return dateA - dateB;
    });

    sortedSales.forEach(sale => {
      const date = new Date(sale.detalles?.paymentDate || sale.created_at);
      const key = date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
      if (!data[key]) data[key] = 0;
      data[key] += (sale.monto || sale.detalles?.total || 0);
    });

    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [paidSales]);

  const topAgent = Object.entries(agentSales as Record<string, any>).sort((a: any, b: any) => b[1].total - a[1].total)[0] as [string, any] | undefined;
  const pendingInvoices = paidSales.filter(s => s.detalles?.requiere_factura && !s.detalles?.invoice_url).length;
  const pendingConstancias = paidSales.filter(s => !s.detalles?.constancia_url).length;
  const conversionRate = paidSales.length > 0 ? (paidSales.length / (paidSales.length + pendingSales.length)) * 100 : 0;

  const handleConfirmPayment = async () => {
    if (!selectedCot) return;
    
    const updatedDetalles = {
      ...selectedCot.detalles,
      isPaid: true,
      paymentDate,
      paymentMethod,
      paymentNotes
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
        setSales(prev => prev.map(c => 
          c.id === selectedCot.id ? { ...c, detalles: updatedDetalles } : c
        ));
        setShowPaymentModal(false);
        setSelectedCot(null);
      } else {
        setAppError({
          title: 'Error de Actualización',
          message: 'No se pudo actualizar el estado de pago en el servidor.'
        });
      }
    } catch (e) {
      setAppError({
        title: 'Error de Conexión',
        message: 'Hubo un problema al conectar con el servidor para actualizar el pago.'
      });
    }
  };

  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [appError, setAppError] = useState<{title: string, message: string} | null>(null);
  const [appConfirm, setAppConfirm] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null);

  const handleDeleteConstancia = async (cotId: string) => {
    const sale = sales.find(s => s.id.toString() === cotId);
    if (!sale) return;

    setAppConfirm({
      title: 'Borrar Constancia',
      message: '¿Estás seguro de que deseas borrar la constancia fiscal? Esto reiniciará el proceso de facturación para esta cotización.',
      onConfirm: async () => {
        setIsUploading(`${cotId}-delete-constancia`);
        try {
          const updatedDetalles = { ...sale.detalles };
          delete updatedDetalles.constancia_url;
          
          // Optionally, we can also reset requiere_factura if needed, but usually we just want to remove the file.
          // updatedDetalles.requiere_factura = false; 

          const res = await fetch(`${DB_CONFIG.url}/cotizaciones?id=eq.${cotId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ detalles: updatedDetalles })
          });

          if (res.ok) {
            setSales(prev => prev.map(s => s.id.toString() === cotId ? { ...s, detalles: updatedDetalles } : s));
          } else {
            throw new Error('Error al actualizar base de datos');
          }
        } catch (error) {
          console.error('Error deleting constancia:', error);
          setAppError({
            title: 'Error',
            message: 'No se pudo borrar la constancia. Inténtalo de nuevo.'
          });
        } finally {
          setIsUploading(null);
          setAppConfirm(null);
        }
      }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, cotId: string, type: 'constancia' | 'invoice') => {
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
      const sale = sales.find(s => s.id.toString() === cotId);
      const safeName = (sale?.datos_cliente?.name || sale?.detalles?.cliente?.nombre || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_');
      const safePhone = (sale?.datos_cliente?.phone || sale?.telefono_cliente || 'SinTelefono').replace(/[^a-zA-Z0-9]/g, '');
      
      const fileName = type === 'constancia' 
        ? `clientes/${safePhone}_${safeName}/constancias/constancia_${Date.now()}.${fileExtension}`
        : `clientes/${safePhone}_${safeName}/facturas/factura_${Date.now()}.${fileExtension}`;
      
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

      if (sale) {
        const updatedDetalles = {
          ...(sale.detalles || {})
        };
        
        if (type === 'invoice') updatedDetalles.invoice_url = fileUrl;
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
          setSales(prev => prev.map(s => s.id.toString() === cotId ? { ...s, detalles: updatedDetalles } : s));

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

                  const clientName = sale.datos_cliente?.name || sale.detalles?.cliente?.nombre || 'Cliente Desconocido';
                  const clientPhone = sale.datos_cliente?.phone || sale.telefono_cliente || 'Sin teléfono';
                  const appUrl = window.location.href.split('?')[0].replace(/\/$/, '');
                  const fastInvoiceLink = `${appUrl}/?factura_rapida=${sale.id}`;
                  const messageContent = `Hola, un cliente requiere factura.\nCliente: ${clientName}\nTeléfono: ${clientPhone}\nCotización: ${sale.detalles?.folio || 'S/N'}\n\n👉 Sube la factura aquí: ${fastInvoiceLink}`;
                  
                  const formData = new FormData();
                  formData.append('content', messageContent);
                  formData.append('message_type', 'incoming');
                  formData.append('private', 'false');
                  
                  // Attach constancia
                  formData.append('attachments[]', file, file.name);

                  // Fetch and attach cotizacion
                  if (sale.s3_path) {
                    try {
                      const cotUrl = `${S3_CONFIG.endpoint}/${S3_CONFIG.bucket}/${sale.s3_path}`;
                      const presignedUrl = await getPresignedS3Url(cotUrl);
                      const cotRes = await fetch(presignedUrl);
                      if (cotRes.ok) {
                        const cotBlob = await cotRes.blob();
                        formData.append('attachments[]', cotBlob, `Cotizacion_${sale.detalles?.folio || 'S_N'}.pdf`);
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
            } catch (cwError) {
              console.error('Error enviando notificación a Chatwoot:', cwError);
            }
          } else if (type === 'invoice') {
            try {
              const clientPhone = sale.datos_cliente?.phone || sale.telefono_cliente;
              if (clientPhone) {
                // Formatear teléfono para Chatwoot si es necesario, asumiendo que ya tiene el formato correcto o agregando + si falta
                const formattedPhone = clientPhone.startsWith('+') ? clientPhone : `+${clientPhone}`;
                const searchRes = await fetch(`${CW_CONFIG.url}/api/v1/accounts/1/contacts/search?q=${encodeURIComponent(formattedPhone)}`, {
                  headers: { 'api-access-token': CW_CONFIG.token }
                });
                const searchData = await searchRes.json();
                let clientId = null;
                if (searchData.payload && searchData.payload.length > 0) {
                  clientId = searchData.payload[0].id;
                }

                if (clientId) {
                  const convRes = await fetch(`${CW_CONFIG.url}/api/v1/accounts/1/contacts/${clientId}/conversations`, {
                    headers: { 'api-access-token': CW_CONFIG.token }
                  });
                  const convData = await convRes.json();
                  let clientConvId = null;
                  if (convData.payload && convData.payload.length > 0) {
                    clientConvId = convData.payload[0].id;
                  }

                  if (clientConvId) {
                    const sendWithRetry = async (payload: any, attempt = 1): Promise<any> => {
                      try {
                        const res = await fetch(`${CW_CONFIG.url}/api/v1/accounts/1/conversations/${clientConvId}/messages`, {
                          method: 'POST',
                          headers: { 
                            'Content-Type': 'application/json',
                            'api-access-token': CW_CONFIG.token 
                          },
                          body: JSON.stringify(payload)
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
                          return sendWithRetry(payload, attempt + 1);
                        }
                        throw e;
                      }
                    };

                    const messageContent = `Hola, te compartimos la factura de tu compra correspondiente a la cotización ${sale.detalles?.folio || 'S/N'}.\n\nFactura: ${fileUrl}`;
                    
                    await sendWithRetry({
                      content: messageContent,
                      message_type: 'outgoing',
                      private: false
                    });
                  }
                }
              }
            } catch (cwError) {
              console.error('Error enviando factura al cliente por Chatwoot:', cwError);
            }
          }
        } else {
          setAppError({
            title: 'Error de Base de Datos',
            message: 'No se pudo actualizar el registro de la cotización. Por favor intente de nuevo.'
          });
        }
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setAppError({
        title: 'Error de Carga',
        message: `Hubo un problema al subir el archivo a la nube: ${error.message || 'Error desconocido'}. Verifique su conexión.`
      });
    } finally {
      setIsUploading(null);
    }
  };

  const handleMarkAccountingReceived = async (cot: Cotizacion) => {
    setAppConfirm({
      title: "Confirmar Recepción",
      message: "¿Confirmar que contabilidad (Roxana) ya recibió este pago?",
      onConfirm: async () => {
        const updatedDetalles = {
          ...cot.detalles,
          pagoRecibidoContabilidad: true,
          fechaRecibidoContabilidad: new Date().toISOString()
        };

        try {
          const res = await fetch(`${DB_CONFIG.url}/cotizaciones?id=eq.${cot.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ detalles: updatedDetalles })
          });

          if (res.ok) {
            setSales(prev => prev.map(c => 
              c.id === cot.id ? { ...c, detalles: updatedDetalles } : c
            ));
          } else {
            setAppError({
              title: 'Error de Actualización',
              message: 'No se pudo marcar como recibido en el servidor.'
            });
          }
        } catch (e) {
          setAppError({
            title: 'Error de Conexión',
            message: 'Hubo un problema al conectar con el servidor.'
          });
        }
      }
    });
  };

  const formatDateLabel = () => {
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    if (timeFilterType === 'week') {
      return `${filterStart.toLocaleDateString('es-MX', opts)} - ${filterEnd.toLocaleDateString('es-MX', opts)}`;
    } else {
      return filterStart.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).toUpperCase();
    }
  };

  if (loading && sales.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0f1014]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0f1014] text-slate-300 font-sans overflow-hidden relative">
      
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-[#1f2026] flex items-center justify-between shrink-0 bg-[#15161a]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
            <TrendingUp className="text-purple-400 w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">XtremeOS <span className="text-purple-400">Ventas</span></h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest">Sistema de Control</p>
          </div>
        </div>

        {/* Date Controls */}
        <div className="flex items-center gap-4">
          <div className="flex bg-[#1f2026] rounded-lg p-1 border border-[#2a2b32]">
            <button 
              onClick={() => { setTimeFilterType('week'); setCurrentDateOffset(0); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${timeFilterType === 'week' ? 'bg-[#2a2b32] text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              SEMANA
            </button>
            <button 
              onClick={() => { setTimeFilterType('month'); setCurrentDateOffset(0); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${timeFilterType === 'month' ? 'bg-[#2a2b32] text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              MES
            </button>
          </div>

          <div className="flex items-center gap-2 bg-[#1f2026] rounded-lg p-1 border border-[#2a2b32]">
            <button onClick={() => setCurrentDateOffset(prev => prev - 1)} className="p-1.5 hover:bg-[#2a2b32] rounded-md text-slate-400 hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-white min-w-[120px] text-center">
              {formatDateLabel()}
            </span>
            <button onClick={() => setCurrentDateOffset(prev => prev + 1)} className="p-1.5 hover:bg-[#2a2b32] rounded-md text-slate-400 hover:text-white transition-colors" disabled={currentDateOffset >= 0}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        <div className="max-w-6xl mx-auto">
          
          {/* TAB: PAGADAS (DEFAULT) */}
          {activeTab === 'pagadas' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-400 w-5 h-5" />
                    Cotizaciones Pagadas
                  </h2>
                  <div className="flex bg-[#1a1b20] rounded-lg p-1 border border-[#2a2b30]">
                    <button
                      onClick={() => setInvoiceFilter('todas')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${invoiceFilter === 'todas' ? 'bg-[#2a2b30] text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Todas
                    </button>
                    <button
                      onClick={() => setInvoiceFilter('pendientes')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${invoiceFilter === 'pendientes' ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Pendientes Factura
                    </button>
                    <button
                      onClick={() => setInvoiceFilter('facturadas')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${invoiceFilter === 'facturadas' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Facturadas
                    </button>
                  </div>
                </div>
                <div className="text-sm text-slate-400">
                  Total: <span className="text-white font-bold">${totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="bg-[#15161a] border border-[#1f2026] rounded-2xl overflow-x-auto overflow-y-hidden">
                <table className="w-full text-left text-sm min-w-[800px]">
                  <thead className="bg-[#1a1b20] text-xs uppercase text-slate-500 font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Folio / Cliente</th>
                      <th className="px-4 py-3">Conceptos</th>
                      <th className="px-4 py-3">Fecha Pago</th>
                      <th className="px-4 py-3">Agente</th>
                      <th className="px-4 py-3 text-right">Monto</th>
                      <th className="px-4 py-3 text-center">Constancia</th>
                      <th className="px-4 py-3 text-center">Factura</th>
                      <th className="px-4 py-3 text-center">Estatus Contable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f2026]">
                    {filteredPaidSales.length === 0 ? (
                      <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-500">No hay cotizaciones pagadas en este periodo.</td></tr>
                    ) : (
                      filteredPaidSales.map(sale => {
                        const isPendingConstancia = sale.detalles?.requiere_factura && !sale.detalles?.constancia_url;
                        const isPendingInvoice = sale.detalles?.requiere_factura && !sale.detalles?.invoice_url;
                        const rowHighlight = isPendingInvoice ? 'border-l-4 border-l-red-500 shadow-[inset_0_0_15px_rgba(239,68,68,0.5)] bg-red-500/10' : (isPendingConstancia ? 'border-l-2 border-l-amber-500 bg-amber-500/5' : '');
                        
                        return (
                        <tr key={sale.id} className={`hover:bg-[#1a1b20] transition-colors ${rowHighlight}`}>
                          <td className="px-4 py-3">
                            <div className="font-bold text-white flex items-center gap-2">
                              {sale.s3_path ? (
                                <button onClick={() => openS3File(`${S3_CONFIG.endpoint}/${S3_CONFIG.bucket}/${sale.s3_path}`)} className="hover:text-xtreme-cyan transition-colors text-left" title="Ver Cotización">
                                  {sale.detalles?.folio || 'S/F'}
                                </button>
                              ) : (
                                <span>{sale.detalles?.folio || 'S/F'}</span>
                              )}
                              {isPendingInvoice && <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,1)]" title="Pendiente de Factura"></span>}
                              {!isPendingInvoice && isPendingConstancia && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" title="Pendiente de Constancia"></span>}
                            </div>
                            <div className="text-xs text-slate-300">{sale.datos_cliente?.name || sale.detalles?.cliente?.nombre || 'Cliente Desconocido'}</div>
                            <div className="text-[10px] text-slate-500">{sale.datos_cliente?.phone || sale.telefono_cliente || 'Sin teléfono'}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs text-slate-400 max-w-[200px] truncate" title={sale.conceptos?.map((c: any) => c.nombre).join(', ')}>
                              {sale.conceptos?.map((c: any) => c.nombre).join(', ') || 'Sin conceptos'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-slate-300">{sale.detalles?.paymentDate ? new Date(sale.detalles.paymentDate).toLocaleDateString('es-MX') : '-'}</div>
                            <div className="text-[10px] text-slate-500">{sale.detalles?.paymentMethod}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-300">{sale.agente || sale.detalles?.vendedor || 'Sin Agente'}</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-400">
                            ${(sale.monto || sale.detalles?.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {sale.detalles?.constancia_url ? (
                                <div className="flex items-center gap-1">
                                  <button 
                                    onClick={() => openS3File(sale.detalles.constancia_url)}
                                    className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                                    title="Ver Constancia"
                                  >
                                    <FileText size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteConstancia(sale.id.toString())}
                                    disabled={isUploading === `${sale.id}-delete-constancia`}
                                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                    title="Borrar Constancia"
                                  >
                                    {isUploading === `${sale.id}-delete-constancia` ? <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={14} />}
                                  </button>
                                </div>
                              ) : (
                                <label className="cursor-pointer p-1.5 rounded-lg bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 transition-colors" title="Subir Constancia">
                                  {isUploading === `${sale.id}-constancia` ? <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Upload size={14} />}
                                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e, sale.id.toString(), 'constancia')} />
                                </label>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {sale.detalles?.all_invoice_urls && sale.detalles.all_invoice_urls.length > 0 ? (
                                sale.detalles.all_invoice_urls.map((url: string, idx: number) => (
                                  <button 
                                    key={idx}
                                    onClick={() => openS3File(url)}
                                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                    title={`Ver Factura ${url.split('.').pop()?.toUpperCase()}`}
                                  >
                                    <FileText size={14} />
                                  </button>
                                ))
                              ) : sale.detalles?.invoice_url ? (
                                <button 
                                  onClick={() => openS3File(sale.detalles.invoice_url)}
                                  className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                  title="Ver Factura"
                                >
                                  <FileText size={14} />
                                </button>
                              ) : (
                                <label className="cursor-pointer p-1.5 rounded-lg bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 transition-colors" title="Subir Factura">
                                  {isUploading === `${sale.id}-invoice` ? <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Upload size={14} />}
                                  <input type="file" className="hidden" accept=".pdf,.xml,.zip" onChange={(e) => handleFileUpload(e, sale.id.toString(), 'invoice')} />
                                </label>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {sale.detalles?.pagoRecibidoContabilidad ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                                <ShieldCheck className="w-3 h-3" /> Recibido
                              </span>
                            ) : (
                              isCEO ? (
                                <button 
                                  onClick={() => handleMarkAccountingReceived(sale)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition-colors border border-amber-500/20"
                                >
                                  Marcar Recibido
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                                  Pendiente
                                </span>
                              )
                            )}
                          </td>
                        </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 tracking-tighter uppercase">
                    Dashboard General
                  </h2>
                  <p className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase mt-1">
                    Centro de Inteligencia Logística y Financiera
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Live Data</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Items</p>
                    <p className="text-xl font-black text-white leading-none">{paidSales.length + pendingSales.length}</p>
                  </div>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <div className="bg-[#0f1015] border border-[#1f2026] rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Ingresos Totales</p>
                  <h3 className="text-xl font-black text-white tracking-tight">${totalRevenue.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</h3>
                  <div className="w-12 h-0.5 bg-purple-500 mt-3"></div>
                </div>

                <div className="bg-[#0f1015] border border-[#1f2026] rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Ticket Promedio</p>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    ${paidSales.length > 0 ? (totalRevenue / paidSales.length).toLocaleString('es-MX', { maximumFractionDigits: 0 }) : '0'}
                  </h3>
                  <p className="text-[9px] text-blue-400 mt-2">MXN por orden</p>
                </div>

                <div className="bg-[#0f1015] border border-[#1f2026] rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Tasa de Cierre</p>
                  <h3 className="text-xl font-black text-white tracking-tight">{conversionRate.toFixed(1)}%</h3>
                  <p className="text-[9px] text-emerald-400 mt-2">{paidSales.length} Concretadas</p>
                </div>

                <div className="bg-[#0f1015] border border-[#1f2026] rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Top Agente</p>
                  <h3 className="text-sm font-black text-white tracking-tight truncate" title={topAgent ? topAgent[0] : 'N/A'}>
                    {topAgent ? topAgent[0] : 'N/A'}
                  </h3>
                  <p className="text-[9px] text-cyan-400 mt-2 truncate">${topAgent ? topAgent[1].total.toLocaleString('es-MX', { maximumFractionDigits: 0 }) : '0'}</p>
                </div>

                <div className="bg-[#0f1015] border border-[#1f2026] rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Constancias Pend.</p>
                  <h3 className="text-xl font-black text-white tracking-tight">{pendingConstancias}</h3>
                  <p className="text-[9px] text-amber-400 mt-2">Por subir</p>
                </div>

                <div className="bg-[#0f1015] border border-amber-500/30 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <p className="text-[9px] font-black text-amber-500/70 uppercase tracking-widest mb-2">Facturas Pend.</p>
                  <h3 className="text-xl font-black text-amber-400 tracking-tight">{pendingInvoices}</h3>
                  <p className="text-[9px] text-amber-500/70 mt-2">Requieren atención</p>
                </div>

                <div className="bg-[#1a1015] border border-red-500/30 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <p className="text-[9px] font-black text-red-500/70 uppercase tracking-widest mb-2">Cot. Pendientes</p>
                  <h3 className="text-xl font-black text-red-400 tracking-tight">{pendingSales.length}</h3>
                  <p className="text-[9px] text-red-500/70 mt-2">Sin concretar</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Main Chart */}
                <div className="lg:col-span-2 bg-[#0f1015] border border-[#1f2026] rounded-2xl p-5">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                    <Activity className="w-4 h-4 text-purple-400" />
                    Flujo de Ingresos
                  </h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2026" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#475569" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                          dy={10}
                        />
                        <YAxis 
                          stroke="#475569" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                          tickFormatter={(value) => `$${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#15161a', borderColor: '#2a2b32', borderRadius: '8px', fontSize: '12px' }}
                          itemStyle={{ color: '#a855f7', fontWeight: 'bold' }}
                          formatter={(value: number) => [`$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Ingresos']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#a855f7" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorRevenue)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Side List */}
                <div className="bg-[#0f1015] border border-[#1f2026] rounded-2xl p-5 flex flex-col">
                  <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4" />
                    Alertas de Facturación
                  </h3>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                    {paidSales.filter(s => s.detalles?.requiere_factura && !s.detalles?.invoice_url).slice(0, 5).map(sale => (
                      <div key={sale.id} className="bg-[#15161a] border border-[#1f2026] rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-white truncate max-w-[150px]">
                            {sale.datos_cliente?.name || sale.detalles?.cliente?.nombre || 'Cliente Desconocido'}
                          </p>
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">
                            {sale.detalles?.folio || 'S/F'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
                            Pendiente
                          </span>
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                    {paidSales.filter(s => s.detalles?.requiere_factura && !s.detalles?.invoice_url).length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-slate-500 py-10">
                        <CheckCircle2 className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-xs font-medium">Todo al día</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: GENERADAS */}
          {activeTab === 'generadas' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                <List className="text-blue-400 w-5 h-5" />
                Todas las Cotizaciones Generadas
              </h2>

              <div className="bg-[#15161a] border border-[#1f2026] rounded-2xl overflow-x-auto overflow-y-hidden">
                <table className="w-full text-left text-sm min-w-[600px]">
                  <thead className="bg-[#1a1b20] text-xs uppercase text-slate-500 font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Folio / Fecha</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Agente</th>
                      <th className="px-4 py-3 text-right">Monto</th>
                      <th className="px-4 py-3 text-center">Estatus</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f2026]">
                    {filteredSales.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No hay cotizaciones en este periodo.</td></tr>
                    ) : (
                      filteredSales.map(sale => {
                        const isPaid = sale.detalles?.isPaid || sale.estado === 'Pagada' || sale.estado === 'Facturada';
                        return (
                          <tr key={sale.id} className="hover:bg-[#1a1b20] transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-bold text-white">{sale.detalles?.folio || 'S/F'}</div>
                              <div className="text-xs text-slate-500">{new Date(sale.created_at).toLocaleDateString('es-MX')}</div>
                            </td>
                            <td className="px-4 py-3 text-slate-300">{sale.detalles?.cliente?.nombre || 'Desconocido'}</td>
                            <td className="px-4 py-3 text-slate-300">{sale.agente || sale.detalles?.vendedor || 'Sin Agente'}</td>
                            <td className="px-4 py-3 text-right font-bold text-white">
                              ${(sale.monto || sale.detalles?.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {isPaid ? (
                                <span className="inline-flex px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Pagada</span>
                              ) : (
                                <span className="inline-flex px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider">Pendiente</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {!isPaid && (
                                <button 
                                  onClick={() => {
                                    setSelectedCot(sale);
                                    setPaymentDate(new Date().toISOString().split('T')[0]);
                                    setPaymentMethod('Transferencia');
                                    setPaymentNotes('');
                                    setShowPaymentModal(true);
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-bold transition-colors border border-blue-500/20"
                                >
                                  Marcar Pagada
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: COMISIONES (CEO ONLY) */}
          {activeTab === 'comisiones' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {!isCEO ? (
                <div className="bg-[#15161a] border border-red-500/20 rounded-2xl p-12 text-center">
                  <ShieldAlert className="w-12 h-12 text-red-500/50 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-white mb-2">Acceso Restringido</h2>
                  <p className="text-slate-400">Esta sección es exclusiva para el CEO.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <DollarSign className="text-amber-400 w-5 h-5" />
                      Comisiones por Agente
                    </h2>
                    <button 
                      onClick={() => setShowRuleModal(true)}
                      className="bg-[#1f2026] hover:bg-[#2a2b32] text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all border border-[#2a2b32] text-sm"
                    >
                      <Settings className="w-4 h-4" />
                      Reglas de Comisión
                    </button>
                  </div>
                  <div className="bg-[#15161a] border border-[#1f2026] rounded-2xl overflow-x-auto overflow-y-hidden">
                    <table className="w-full text-left text-sm min-w-[600px]">
                      <thead className="bg-[#1a1b20] text-xs uppercase text-slate-500 font-bold tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Agente</th>
                          <th className="px-4 py-3 text-center">Ventas Cerradas</th>
                          <th className="px-4 py-3 text-right">Total Vendido</th>
                          <th className="px-4 py-3 text-right text-amber-400">Comisión Estimada</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1f2026]">
                        {Object.entries(agentSales).length === 0 ? (
                          <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">No hay ventas en este periodo.</td></tr>
                        ) : (
                          Object.entries(agentSales).sort((a: any, b: any) => b[1].total - a[1].total).map(([agent, data]: any) => {
                            const commissionAmount = data.commission || 0;
                            const effectiveRate = data.total > 0 ? (commissionAmount / data.total) * 100 : 0;
                            
                            return (
                              <tr key={agent} className="hover:bg-[#1a1b20] transition-colors">
                                <td className="px-4 py-3 font-bold text-white">{agent}</td>
                                <td className="px-4 py-3 text-center text-slate-300">{data.count}</td>
                                <td className="px-4 py-3 text-right text-slate-300">${data.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                <td className="px-4 py-3 text-right font-black text-amber-400">
                                  ${commissionAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                  <span className="text-[10px] text-slate-500 block font-normal">({effectiveRate.toFixed(1)}% prom.)</span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Floating Bottom Navigation */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#1a1b20]/90 backdrop-blur-md border border-[#2a2b32] p-2 rounded-2xl flex items-center gap-2 shadow-2xl">
        <button 
          onClick={() => setActiveTab('pagadas')}
          className={`flex flex-col items-center justify-center w-24 h-16 rounded-xl transition-all ${activeTab === 'pagadas' ? 'bg-[#2a2b32] text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-[#1f2026]'}`}
        >
          <CheckSquare className={`w-5 h-5 mb-1 ${activeTab === 'pagadas' ? 'text-emerald-400' : ''}`} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Pagadas</span>
        </button>
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center w-24 h-16 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-[#2a2b32] text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-[#1f2026]'}`}
        >
          <LayoutDashboard className={`w-5 h-5 mb-1 ${activeTab === 'dashboard' ? 'text-purple-400' : ''}`} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Tablero</span>
        </button>
        <button 
          onClick={() => setActiveTab('generadas')}
          className={`flex flex-col items-center justify-center w-24 h-16 rounded-xl transition-all ${activeTab === 'generadas' ? 'bg-[#2a2b32] text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-[#1f2026]'}`}
        >
          <List className={`w-5 h-5 mb-1 ${activeTab === 'generadas' ? 'text-blue-400' : ''}`} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Generadas</span>
        </button>
        {isCEO && (
          <button 
            onClick={() => setActiveTab('comisiones')}
            className={`flex flex-col items-center justify-center w-24 h-16 rounded-xl transition-all ${activeTab === 'comisiones' ? 'bg-[#2a2b32] text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-[#1f2026]'}`}
          >
            <DollarSign className={`w-5 h-5 mb-1 ${activeTab === 'comisiones' ? 'text-amber-400' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Comisiones</span>
          </button>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#15161a] border border-[#2a2b32] rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard className="text-blue-400" /> Confirmar Pago
            </h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fecha de Pago</label>
                <input 
                  type="date" 
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1b20] border border-[#2a2b32] text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Método de Pago</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1b20] border border-[#2a2b32] text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="Transferencia">Transferencia</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                  <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notas Especiales</label>
                <textarea 
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Ej. Pago recibido en sucursal..."
                  className="w-full px-4 py-3 bg-[#1a1b20] border border-[#2a2b32] text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-24 resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedCot(null);
                }}
                className="flex-1 py-3 px-4 bg-[#1a1b20] text-slate-300 border border-[#2a2b32] rounded-xl font-bold hover:bg-[#1f2026] transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmPayment}
                className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 hover:shadow-lg transition-all"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Commission Rules Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#15161a] border border-[#2a2b32] rounded-2xl w-full max-w-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings className="text-blue-400" /> Reglas de Comisión
              </h3>
              <button 
                onClick={() => {
                  setEditingRule({ id: Date.now().toString(), name: '', type: 'agent', condition: '', percentage: 0 });
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold transition-all text-sm"
              >
                <Plus className="w-4 h-4" /> Nueva Regla
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {editingRule && (
                <div className="bg-[#1a1b20] border border-blue-500/30 rounded-xl p-4 mb-6">
                  <h4 className="text-sm font-bold text-white mb-4">{commissionRules.find(r => r.id === editingRule.id) ? 'Editar Regla' : 'Nueva Regla'}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nombre de la Regla</label>
                      <input 
                        type="text" 
                        value={editingRule.name}
                        onChange={e => setEditingRule({...editingRule, name: e.target.value})}
                        className="w-full bg-[#15161a] border border-[#2a2b32] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                        placeholder="Ej. Comisión Valeria"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tipo de Regla</label>
                      <select 
                        value={editingRule.type}
                        onChange={e => setEditingRule({...editingRule, type: e.target.value as any})}
                        className="w-full bg-[#15161a] border border-[#2a2b32] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                      >
                        <option value="agent">Por Agente</option>
                        <option value="concept">Por Concepto (Producto)</option>
                        <option value="amount">Por Cantidad (Monto Mínimo)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Condición</label>
                      <input 
                        type="text" 
                        value={editingRule.condition}
                        onChange={e => setEditingRule({...editingRule, condition: e.target.value})}
                        className="w-full bg-[#15161a] border border-[#2a2b32] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                        placeholder={editingRule.type === 'amount' ? 'Ej. 10000' : 'Ej. Valeria o Laptop'}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Porcentaje (%)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={editingRule.percentage}
                        onChange={e => setEditingRule({...editingRule, percentage: parseFloat(e.target.value) || 0})}
                        className="w-full bg-[#15161a] border border-[#2a2b32] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                        placeholder="Ej. 1.4"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                    <button 
                      onClick={() => setEditingRule(null)}
                      className="px-4 py-2 rounded-lg font-bold text-sm text-slate-400 hover:text-white hover:bg-[#2a2b32] transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => {
                        if (commissionRules.find(r => r.id === editingRule.id)) {
                          setCommissionRules(prev => prev.map(r => r.id === editingRule.id ? editingRule : r));
                        } else {
                          setCommissionRules(prev => [...prev, editingRule]);
                        }
                        setEditingRule(null);
                      }}
                      className="px-4 py-2 rounded-lg font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                    >
                      Guardar Regla
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {commissionRules.map(rule => (
                  <div key={rule.id} className="bg-[#1a1b20] border border-[#2a2b32] rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{rule.name}</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        {rule.type === 'agent' && `Agente contiene: "${rule.condition}"`}
                        {rule.type === 'concept' && `Concepto contiene: "${rule.condition}"`}
                        {rule.type === 'amount' && `Monto >= $${rule.condition}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-black text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 text-sm">
                        {rule.percentage}%
                      </span>
                      <button 
                        onClick={() => setEditingRule(rule)}
                        className="text-slate-500 hover:text-blue-400 transition-colors"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => setCommissionRules(prev => prev.filter(r => r.id !== rule.id))}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
                {commissionRules.length === 0 && (
                  <p className="text-center text-slate-500 py-8">No hay reglas de comisión configuradas.</p>
                )}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[#2a2b32] flex justify-end shrink-0">
              <button 
                onClick={() => setShowRuleModal(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-[#2a2b32] hover:bg-[#32333a] text-white transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Integrated Error Modal */}
      {appError && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#15161a] border border-red-500/30 rounded-2xl w-full max-w-md p-6 shadow-[0_0_50px_rgba(239,68,68,0.1)] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
                <AlertTriangle className="text-red-500 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">{appError.title}</h3>
                <p className="text-[10px] font-black text-red-500/70 uppercase tracking-widest">Alerta del Sistema</p>
              </div>
            </div>
            
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              {appError.message}
            </p>
            
            <button 
              onClick={() => setAppError(null)}
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-500/20 active:scale-95"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Integrated Confirmation Modal */}
      {appConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#15161a] border border-cyan-500/30 rounded-2xl w-full max-w-md p-6 shadow-[0_0_50px_rgba(6,182,212,0.1)] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20">
                <AlertCircle className="text-cyan-500 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">{appConfirm.title}</h3>
                <p className="text-[10px] font-black text-cyan-500/70 uppercase tracking-widest">Confirmación Requerida</p>
              </div>
            </div>
            
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              {appConfirm.message}
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setAppConfirm(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all active:scale-95"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  appConfirm.onConfirm();
                  setAppConfirm(null);
                }}
                className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
