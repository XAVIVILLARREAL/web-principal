import React, { useState, useEffect } from 'react';
import { openS3File, s3Client, S3_CONFIG, getPresignedS3Url } from '../../lib/s3Utils';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { 
  Truck, Package, CheckCircle2, Upload, Search, FileText,
  MapPin, Calendar, CreditCard, AlertCircle, BarChart3, Clock,
  Camera, CheckSquare, ShieldCheck, ChevronRight, LifeBuoy, Loader2, ScanLine, ExternalLink
} from 'lucide-react';
import { BarcodeScanner } from './components/BarcodeScanner';

const DB_CONFIG = {
  url: "https://api-datos.xtremediagnostics.com"
};

const GAS_API_URL = "https://script.google.com/macros/s/AKfycbxwHAlr9dfMoyW9Iej_CQ1Uf3IzNjL65hAegH8OQNrCp08awUXA8Nw9x_XowFcBMpTT/exec";

interface Cotizacion {
  id: number;
  contact_id: string;
  folio: string;
  monto: number;
  agente: string;
  created_at: string;
  detalles: any;
}

export default function EnviosApp({ username }: { username?: string }) {
  const [paidSales, setPaidSales] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Cotizacion | null>(null);

  const [productPhotoUrl, setProductPhotoUrl] = useState<string | null>(null);
  const [labelPhotoUrl, setLabelPhotoUrl] = useState<string | null>(null);
  const [barcodePhotoUrl, setBarcodePhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUrls = async () => {
      if (selectedSale?.detalles?.envio) {
        if (selectedSale.detalles.envio.productPhotoUrl) {
          setProductPhotoUrl(await getPresignedS3Url(selectedSale.detalles.envio.productPhotoUrl));
        } else {
          setProductPhotoUrl(null);
        }
        if (selectedSale.detalles.envio.labelPhotoUrl) {
          setLabelPhotoUrl(await getPresignedS3Url(selectedSale.detalles.envio.labelPhotoUrl));
        } else {
          setLabelPhotoUrl(null);
        }
        if (selectedSale.detalles.envio.barcodePhotoUrl) {
          setBarcodePhotoUrl(await getPresignedS3Url(selectedSale.detalles.envio.barcodePhotoUrl));
        } else {
          setBarcodePhotoUrl(null);
        }
      } else {
        setProductPhotoUrl(null);
        setLabelPhotoUrl(null);
        setBarcodePhotoUrl(null);
      }
    };
    fetchUrls();
  }, [selectedSale]);

  // Form state
  const [shippingMethod, setShippingMethod] = useState<'Paquetería' | 'Recolección Local'>('Paquetería');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [hardDrive, setHardDrive] = useState('');
  const [laptopBarcodes, setLaptopBarcodes] = useState<string[]>([]);
  const [scannerIndex, setScannerIndex] = useState<number | null>(null);
  
  // Checklist
  const [chkManual, setChkManual] = useState(false);
  const [chkCharger, setChkCharger] = useState(false);
  const [chkBox, setChkBox] = useState(false);

  // Photos (simulated as boolean for UI completeness, in a real app these would be File objects or URLs)
  const [productPhoto, setProductPhoto] = useState<File | null>(null);
  const [clientTickets, setClientTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'sent'>('pending');
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    if (selectedSale) {
      fetchClientTickets(selectedSale.contact_id);
      setShowMobileDetails(true);
    }
  }, [selectedSale]);

  const fetchClientTickets = async (clientId: string) => {
    setLoadingTickets(true);
    try {
      const res = await fetch(`${DB_CONFIG.url}/tickets?cliente_id=eq.${clientId}&order=created_at.desc`);
      if (res.ok) {
        const data = await res.json();
        setClientTickets(data);
      }
    } catch (e) {
      console.error('Error fetching client tickets:', e);
    } finally {
      setLoadingTickets(false);
    }
  };
  const [labelPhoto, setLabelPhoto] = useState<File | null>(null);
  const [barcodePhoto, setBarcodePhoto] = useState<File | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [appSuccess, setAppSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchPaidSales();
  }, []);

  const fetchPaidSales = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${DB_CONFIG.url}/cotizaciones?select=id,contact_id,created_at,detalles,monto,agente,folio,datos_cliente&order=created_at.desc&limit=500`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Only paid quotes and not historical
          const paid = data.filter(s => s.detalles?.isPaid && !s.detalles?.is_historical);
          setPaidSales(paid);
        }
      }
    } catch (error) {
      console.error("Error fetching paid sales:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = paidSales.filter(sale => {
    // Tab filter
    const isShipped = sale.detalles?.envio?.estado === 'Enviado';
    if (activeTab === 'pending' && isShipped) return false;
    if (activeTab === 'sent' && !isShipped) return false;

    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (sale.detalles?.folio || '').toLowerCase().includes(searchLower) ||
      (sale.agente || '').toLowerCase().includes(searchLower) ||
      (sale.datos_cliente?.name || '').toLowerCase().includes(searchLower) ||
      (sale.datos_cliente?.phone || '').toLowerCase().includes(searchLower) ||
      (sale.detalles?.envio?.xtremeId || '').toLowerCase().includes(searchLower) ||
      (sale.detalles?.envio?.laptopBarcodes || []).some((b: string) => (b || '').toLowerCase().includes(searchLower)) ||
      (sale.detalles?.envio?.laptopBarcode || '').toLowerCase().includes(searchLower) ||
      (sale.detalles?.items || []).some((item: any) => (item.name || '').toLowerCase().includes(searchLower));

    if (!matchesSearch) return false;

    // Date filter
    if (dateFilter !== 'all') {
      const dateToCompare = activeTab === 'sent' && sale.detalles?.envio?.fechaEnvio 
        ? sale.detalles.envio.fechaEnvio 
        : sale.created_at;
      
      const saleDate = new Date(dateToCompare);
      const now = new Date();
      if (dateFilter === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (saleDate < oneWeekAgo) return false;
      } else if (dateFilter === 'month') {
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (saleDate < oneMonthAgo) return false;
      }
    }

    return true;
  });

  // Metrics
  const shippedSales = paidSales.filter(s => s.detalles?.envio?.estado === 'Enviado');
  const pendingShipping = paidSales.filter(s => s.detalles?.envio?.estado !== 'Enviado');

  const getLaptopsCount = (saleToCheck?: Cotizacion) => {
    const sale = saleToCheck || selectedSale;
    if (!sale?.detalles?.items) return 0;
    return sale.detalles.items.reduce((acc: number, item: any) => {
      if (item.name && item.name.toLowerCase().startsWith('laptop')) {
        return acc + (item.qty || item.quantity || 1);
      }
      return acc;
    }, 0);
  };

  const handleSelectSale = (sale: Cotizacion) => {
    setSelectedSale(sale);
    setShippingMethod(sale.detalles?.envio?.metodo || 'Paquetería');
    setTrackingNumber(sale.detalles?.envio?.guia != null ? String(sale.detalles.envio.guia) : '');
    setPaymentMethod(sale.detalles?.paymentMethod || 'Transferencia');
    setHardDrive(sale.detalles?.envio?.hardDrive != null ? String(sale.detalles.envio.hardDrive) : '');
    setChkManual(sale.detalles?.envio?.chkManual || false);
    setChkCharger(sale.detalles?.envio?.chkCharger || false);
    setChkBox(sale.detalles?.envio?.chkBox || false);
    
    let barcodes: string[] = [];
    if (sale.detalles?.envio?.laptopBarcodes && Array.isArray(sale.detalles.envio.laptopBarcodes)) {
      barcodes = [...sale.detalles.envio.laptopBarcodes];
    } else if (sale.detalles?.envio?.laptopBarcode) {
      barcodes = [String(sale.detalles.envio.laptopBarcode)];
    } else if (sale.detalles?.envio?.xtremeId) {
      barcodes = [String(sale.detalles.envio.xtremeId)];
    }
    
    const laptopCount = getLaptopsCount(sale);
    if (barcodes.length < laptopCount) {
      barcodes = [...barcodes, ...Array(laptopCount - barcodes.length).fill('')];
    } else if (barcodes.length > laptopCount && laptopCount > 0) {
      barcodes = barcodes.slice(0, laptopCount);
    }
    setLaptopBarcodes(barcodes);

    setProductPhoto(null);
    setLabelPhoto(null);
    setBarcodePhoto(null);
  };

  const hasLaptop = () => {
    return getLaptopsCount() > 0;
  };

  const hasLaptopOrHardDrive = () => {
    if (!selectedSale?.detalles?.items) return false;
    return selectedSale.detalles.items.some((item: any) => {
      const name = item.name?.toLowerCase() || '';
      return name.startsWith('laptop') || name.startsWith('disco duro');
    });
  };

  const handleSaveShipping = async () => {
    if (!selectedSale) return;
    
    const isLaptopIncluded = hasLaptop();

    const needsHardDrive = hasLaptopOrHardDrive();
    if (needsHardDrive && !hardDrive) {
      setAppError("El campo Disco Duro es obligatorio para esta venta.");
      return;
    }

    if (isLaptopIncluded && laptopBarcodes.some(b => !String(b).trim())) {
      setAppError("Todos los Códigos de Barras de las Laptops son obligatorios.");
      return;
    }

    // All fields are now mandatory as requested
    if (!paymentMethod) {
      setAppError("El Método de Pago Confirmado es obligatorio.");
      return;
    }
    if (shippingMethod === 'Paquetería' && !String(trackingNumber).trim()) {
      setAppError("El Número de Guía es obligatorio para envíos por paquetería.");
      return;
    }
    if (!productPhoto || !labelPhoto || !barcodePhoto) {
      setAppError("Todas las fotografías (Producto, Guía y Código de Barras) son obligatorias.");
      return;
    }
    if (!chkManual || !chkCharger || !chkBox) {
      setAppError("Debes marcar todas las opciones del Checklist de Envío.");
      return;
    }

    setIsSaving(true);
    setAppSuccess("Subiendo evidencia fotográfica...");

    let productPhotoUrl = '';
    let labelPhotoUrl = '';
    let barcodePhotoUrl = '';

    try {
      const uploadFile = async (file: File, type: string) => {
        const fileExtension = file.name.split('.').pop();
        const safeFolio = selectedSale.folio?.replace(/[^a-zA-Z0-9]/g, '_') || 'Envio';
        const fileName = `envios/${safeFolio}/${type}_${Date.now()}.${fileExtension}`;
        
        const fileBuffer = await file.arrayBuffer();
        await s3Client.send(new PutObjectCommand({
          Bucket: S3_CONFIG.bucket,
          Key: fileName,
          Body: new Uint8Array(fileBuffer),
          ContentType: file.type,
          ACL: 'public-read'
        }));
        
        return `${S3_CONFIG.endpoint}/${S3_CONFIG.bucket}/${fileName}`;
      };

      if (productPhoto) productPhotoUrl = await uploadFile(productPhoto, 'producto');
      if (labelPhoto) labelPhotoUrl = await uploadFile(labelPhoto, 'guia');
      if (barcodePhoto) barcodePhotoUrl = await uploadFile(barcodePhoto, 'codigo_barras');
    } catch (error) {
      console.error("Error uploading photos:", error);
      setAppError("Error al subir la evidencia fotográfica.");
      setIsSaving(false);
      return;
    }

    setAppSuccess("Actualizando inventario...");
    // Simulate Google Sheets Inventory Reduction
    await reduceInventoryInGoogleSheets(selectedSale);

    const updatedDetalles = {
      ...selectedSale.detalles,
      envio: {
        metodo: shippingMethod,
        guia: trackingNumber,
        paymentMethod,
        xtremeId: laptopBarcodes[0] || '',
        hardDrive,
        laptopBarcode: laptopBarcodes[0] || '',
        laptopBarcodes,
        chkManual,
        chkCharger,
        chkBox,
        productPhotoName: productPhoto?.name || '',
        productPhotoUrl,
        labelPhotoName: labelPhoto?.name || '',
        labelPhotoUrl,
        barcodePhotoName: barcodePhoto?.name || '',
        barcodePhotoUrl,
        fechaEnvio: new Date().toISOString(),
        estado: 'Enviado'
      }
    };

    try {
      const res = await fetch(`${DB_CONFIG.url}/cotizaciones?id=eq.${selectedSale.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ detalles: updatedDetalles })
      });

      if (res.ok) {
        setPaidSales(prev => prev.map(s => 
          s.id === selectedSale.id ? { ...s, detalles: updatedDetalles } : s
        ));
        setSelectedSale(null);
        setAppSuccess("Envío registrado e inventario actualizado correctamente.");
      } else {
        setAppError("Error al guardar la información de envío.");
      }
    } catch (e) {
      console.error("Error saving shipping info", e);
      setAppError("Error al guardar la información de envío.");
    } finally {
      setIsSaving(false);
    }
  };

  const reduceInventoryInGoogleSheets = async (sale: Cotizacion) => {
    console.log("Iniciando reducción de inventario en Google Sheets...");
    
    const items = sale.detalles?.items || [];
    // Usamos un mapa para sumar las cantidades de productos con el mismo nombre
    const itemsMap = new Map<string, { item: string, name: string, qty: number, barcode?: string }>();
    
    const addItemToReduce = (name: string, qty: number, barcode?: string) => {
      const key = name.toLowerCase().trim();
      if (!key) return;
      
      if (itemsMap.has(key)) {
        const existing = itemsMap.get(key)!;
        existing.qty += qty;
        if (barcode && !existing.barcode?.includes(barcode)) {
          existing.barcode = existing.barcode ? `${existing.barcode}, ${barcode}` : barcode;
        }
      } else {
        itemsMap.set(key, { item: name, name: name, qty, barcode });
      }
    };

    for (const item of items) {
      const itemName = (item.name || '').trim();
      const qty = item.qty || 1;
      if (!itemName) continue;
      
      // Add the main item
      let finalName = itemName;
      if (itemName.toLowerCase().startsWith('disco duro')) {
        finalName = hardDrive || itemName;
      }

      let barcodeToPass = undefined;
      if (finalName.toLowerCase().startsWith('laptop')) {
        barcodeToPass = laptopBarcodes.join(', ');
      }
      
      addItemToReduce(finalName, qty, barcodeToPass);
      
      // If it's a laptop, also reduce the components selected in the form
      if (itemName.toLowerCase().startsWith('laptop')) {
        // Reduce the selected hard drive
        if (hardDrive) {
          addItemToReduce(hardDrive, qty);
        }
        
        // Accessories based on the laptop brand/model
        const laptopLower = itemName.toLowerCase();
        let chargerName = '';
        let caddyName = '';

        if (laptopLower.includes('panasonic') || laptopLower.includes('cf-31') || laptopLower.includes('cf-30')) {
          chargerName = 'Cargador Panasonic Toughbook';
          caddyName = 'Caddy disco duro Pansonic Toughbook CF-31, CF-30';
        } else if (laptopLower.includes('dell') || laptopLower.includes('rugged')) {
          chargerName = 'Cargador Dell punta grande';
          caddyName = 'Caddy disco duro Dell Rugged 5414, 5404, 7404, 7414';
        } else if (laptopLower.includes('getac') || laptopLower.includes('b-300') || laptopLower.includes('b300')) {
          chargerName = 'Cargador Toshiba / GETAC';
          caddyName = 'Caddy disco duro Getac B-300';
        }

        // Only reduce if checked in checklist
        if (chargerName && chkCharger) {
          addItemToReduce(chargerName, qty);
        }
        if (caddyName) {
          addItemToReduce(caddyName, qty);
        }
      }
    }

    const itemsToReduce = Array.from(itemsMap.values());
    console.log("Items a reducir:", itemsToReduce);

    try {
      const res = await fetch(GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
          action: 'reduceInventory', 
          items: itemsToReduce,
          folio: sale.detalles?.folio || sale.folio,
          laptopBarcode: laptopBarcodes.join(', ')
        })
      });
      const data = await res.json();
      console.log("Respuesta de Apps Script (Inventario):", data);
    } catch (error) {
      console.error("Error al reducir inventario en Apps Script:", error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  if (loading && paidSales.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0f1014]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0f1014] text-slate-300 font-sans overflow-hidden">
      
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-[#1f2026] flex flex-col sm:flex-row sm:items-center justify-between shrink-0 bg-[#15161a] gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
            <Truck className="text-blue-400 w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">XtremeOS <span className="text-blue-400">Envíos</span></h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest">Logística y Despacho</p>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Buscar por folio o agente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#1f2026] border border-[#2a2b32] text-white text-sm focus:bg-[#1a1b20] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg transition-all outline-none"
          />
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {scannerIndex !== null && (
        <BarcodeScanner 
          onScan={(text) => {
            const newBarcodes = [...laptopBarcodes];
            newBarcodes[scannerIndex] = text;
            setLaptopBarcodes(newBarcodes);
            setScannerIndex(null);
          }}
          onClose={() => setScannerIndex(null)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row max-w-7xl mx-auto w-full p-4 md:p-6 gap-6">
        
        {/* List of Paid Quotes */}
        <div className={`w-full md:w-1/3 flex-col bg-[#15161a] rounded-2xl border border-[#1f2026] overflow-hidden shrink-0 h-full md:h-auto ${showMobileDetails ? 'hidden md:flex' : 'flex'}`}>
          <div className="px-5 py-4 border-b border-[#1f2026] bg-[#1a1b20] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                <Package className="text-blue-400 w-4 h-4" />
                Control de Envíos
              </h3>
              <div className="flex bg-[#0f1014] p-1 rounded-lg border border-[#2a2b32]">
                <button 
                  onClick={() => setActiveTab('pending')}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${activeTab === 'pending' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Pendientes
                </button>
                <button 
                  onClick={() => setActiveTab('sent')}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${activeTab === 'sent' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Enviados
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Buscar cliente, folio, equipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#0f1014] border border-[#2a2b32] text-white rounded-xl text-xs outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
              <div className="flex gap-2">
                {(['all', 'week', 'month'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setDateFilter(f)}
                    className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-tighter rounded-lg border transition-all ${
                      dateFilter === f 
                        ? 'bg-slate-800 border-slate-700 text-white' 
                        : 'bg-transparent border-transparent text-slate-500 hover:text-slate-400'
                    }`}
                  >
                    {f === 'all' ? 'Todo' : f === 'week' ? 'Semana' : 'Mes'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredSales.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 bg-[#1a1b20] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#2a2b32]">
                  <Search className="w-6 h-6 text-slate-700" />
                </div>
                <h4 className="text-white font-bold text-sm mb-1">Sin resultados</h4>
                <p className="text-slate-500 text-xs">No se encontraron ventas {activeTab === 'pending' ? 'pendientes' : 'enviadas'} con estos filtros.</p>
              </div>
            ) : (
              filteredSales.map(sale => {
                const isShipped = sale.detalles?.envio?.estado === 'Enviado';
                return (
                  <div 
                    key={sale.id} 
                    onClick={() => handleSelectSale(sale)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedSale?.id === sale.id 
                        ? 'bg-blue-500/10 border-blue-500/30' 
                        : 'bg-[#1a1b20] border-[#2a2b32] hover:border-[#3a3b42]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm">{sale.detalles?.folio || 'S/F'}</span>
                        <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">{sale.datos_cliente?.name || 'S/N'}</span>
                      </div>
                      {isShipped ? (
                        <span className="text-[9px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-bold uppercase tracking-wider border border-emerald-500/20">
                          Enviado
                        </span>
                      ) : (
                        <span className="text-[9px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-bold uppercase tracking-wider border border-amber-500/20">
                          Pendiente
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-between mt-2 pt-2 border-t border-[#1f2026]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {sale.detalles?.paymentDate ? new Date(sale.detalles.paymentDate).toLocaleDateString('es-MX') : 'Sin fecha'}
                      </span>
                      <span className="text-slate-300 font-black">${(sale.monto || sale.detalles?.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Shipping Details Form */}
        <div className={`flex-1 bg-[#15161a] rounded-2xl border border-[#1f2026] overflow-hidden flex-col h-full md:h-auto ${!showMobileDetails ? 'hidden md:flex' : 'flex'}`}>
          {selectedSale ? (
            <div className="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar">
              <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 pb-6 border-b border-[#1f2026] gap-4">
                <div className="flex-1 w-full relative">
                  <button 
                    onClick={() => setShowMobileDetails(false)}
                    className="md:hidden absolute -top-2 -left-2 p-2 text-slate-400 hover:text-white bg-[#1a1b20] rounded-full border border-[#2a2b32] z-10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <h2 className="text-xl md:text-2xl font-black text-white mb-4 pl-8 md:pl-0">
                    Despacho: {selectedSale.detalles?.folio || 'S/F'}
                  </h2>
                  
                  {/* Client Info */}
                  <div className="mb-4 bg-[#1a1b20] p-4 rounded-xl border border-[#2a2b32]">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Datos del Cliente</h3>
                    <p className="text-lg md:text-xl font-black text-white">{selectedSale.datos_cliente?.name || 'Cliente sin nombre'}</p>
                    <p className="text-sm font-medium text-slate-400">{selectedSale.datos_cliente?.phone || 'Sin teléfono'}</p>
                  </div>

                  {/* Purchased Items */}
                  <div className="mb-4">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Conceptos Comprados</h3>
                    <div className="space-y-2">
                      {selectedSale.detalles?.items?.map((item: any, idx: number) => (
                        <div key={idx} className="bg-[#1a1b20] p-3 rounded-xl border border-[#2a2b32] flex justify-between items-center gap-2">
                          <span className="text-sm font-bold text-white leading-tight">{item.name}</span>
                          <span className="text-xs font-black text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md shrink-0">x{item.qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1 bg-[#1a1b20] px-2 py-1 rounded-md border border-[#2a2b32]"><CreditCard className="w-3 h-3" /> {selectedSale.detalles?.paymentMethod || 'Transferencia'}</span>
                    <span className="flex items-center gap-1 bg-[#1a1b20] px-2 py-1 rounded-md border border-[#2a2b32]"><Calendar className="w-3 h-3" /> {selectedSale.detalles?.paymentDate ? new Date(selectedSale.detalles.paymentDate).toLocaleDateString('es-MX') : 'N/A'}</span>
                    <span className="flex items-center gap-1 bg-[#1a1b20] px-2 py-1 rounded-md border border-[#2a2b32]"><Package className="w-3 h-3" /> {selectedSale.detalles?.items?.length || 0} Artículos</span>
                  </div>
                </div>
                <div className="flex flex-col gap-4 shrink-0 w-full md:w-auto">
                  <div className="text-left md:text-right bg-[#1a1b20] p-4 rounded-xl border border-[#2a2b32]">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Monto Pagado</div>
                    <div className="text-2xl font-black text-emerald-400">${(selectedSale.monto || selectedSale.detalles?.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                  </div>

                  {/* Archivos Adjuntos (Etiqueta y Factura) */}
                  {(selectedSale.detalles?.shipping_label_url || selectedSale.detalles?.invoice_url || (selectedSale.detalles?.all_invoice_urls && selectedSale.detalles.all_invoice_urls.length > 0)) && (
                    <div className="bg-[#1a1b20] p-4 rounded-xl border border-[#2a2b32]">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                        <FileText className="text-blue-400 w-3 h-3" />
                        Documentación
                      </h3>
                      <div className="flex flex-col gap-2">
                        {selectedSale.detalles?.shipping_label_url && (
                          <button 
                            onClick={() => openS3File(selectedSale.detalles.shipping_label_url)}
                            className="flex items-center gap-3 p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-lg hover:bg-blue-500/10 transition-colors group text-left w-full"
                          >
                            <div className="w-7 h-7 rounded-md bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform shrink-0">
                              <FileText size={14} />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-tighter truncate">Etiqueta de Envío</span>
                              <span className="text-[8px] text-slate-500 uppercase font-black">Ver PDF</span>
                            </div>
                          </button>
                        )}
                        {selectedSale.detalles?.all_invoice_urls && selectedSale.detalles.all_invoice_urls.length > 0 ? (
                          selectedSale.detalles.all_invoice_urls.map((url: string, idx: number) => (
                            <button 
                              key={idx}
                              onClick={() => openS3File(url)}
                              className="flex items-center gap-3 p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/10 transition-colors group text-left w-full"
                            >
                              <div className="w-7 h-7 rounded-md bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform shrink-0">
                                <FileText size={14} />
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-tighter truncate">Factura {url.split('.').pop()?.toUpperCase()}</span>
                                <span className="text-[8px] text-slate-500 uppercase font-black">Ver Documento</span>
                              </div>
                            </button>
                          ))
                        ) : selectedSale.detalles?.invoice_url && (
                          <button 
                            onClick={() => openS3File(selectedSale.detalles.invoice_url)}
                            className="flex items-center gap-3 p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/10 transition-colors group text-left w-full"
                          >
                            <div className="w-7 h-7 rounded-md bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform shrink-0">
                              <FileText size={14} />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-tighter truncate">Factura / XML</span>
                              <span className="text-[8px] text-slate-500 uppercase font-black">Ver Documento</span>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-8">
                {/* Section 1: Payment & Hardware Details */}
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Método de Pago Confirmado <span className="text-red-400 ml-1">*</span></label>
                    <select 
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      disabled={activeTab === 'sent'}
                      className={`w-full px-4 py-2.5 bg-[#1a1b20] border text-white rounded-xl focus:ring-1 outline-none text-sm transition-colors ${!paymentMethod ? 'border-red-500/50 focus:ring-red-500' : 'border-[#2a2b32] focus:ring-blue-500 focus:border-blue-500'} ${activeTab === 'sent' ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Terminal Punto de Venta">Terminal Punto de Venta</option>
                      <option value="Mercado Libre">Mercado Libre</option>
                    </select>
                  </div>

                  {hasLaptopOrHardDrive() && (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Capacidad de Disco Duro <span className="text-red-400 ml-1">*Obligatorio</span>
                      </label>
                      <select 
                        value={hardDrive}
                        onChange={(e) => setHardDrive(e.target.value)}
                        disabled={activeTab === 'sent'}
                        className={`w-full px-4 py-2.5 bg-[#1a1b20] border text-white rounded-xl focus:ring-1 outline-none text-sm transition-colors ${!hardDrive ? 'border-red-500/50 focus:ring-red-500' : 'border-[#2a2b32] focus:ring-blue-500 focus:border-blue-500'} ${activeTab === 'sent' ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        <option value="">Seleccionar capacidad...</option>
                        <option value="Disco duro 120GB">Disco duro 120GB</option>
                        <option value="Disco duro 250GB">Disco duro 250GB</option>
                        <option value="Disco duro 512GB">Disco duro 512GB</option>
                        <option value="Disco duro 1TB">Disco duro 1TB</option>
                        <option value="Disco duro 2TB">Disco duro 2TB</option>
                      </select>
                    </div>
                  )}

                  {hasLaptop() && (
                    <div className="space-y-4">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-400" />
                        Códigos de Barras de Laptops ({getLaptopsCount()}) <span className="text-red-400 ml-1">*Obligatorio</span>
                      </label>
                      {laptopBarcodes.map((barcode, index) => (
                        <div key={index} className="relative">
                          <input 
                            type="text" 
                            value={barcode}
                            onChange={(e) => {
                              const newBarcodes = [...laptopBarcodes];
                              newBarcodes[index] = e.target.value;
                              setLaptopBarcodes(newBarcodes);
                            }}
                            disabled={activeTab === 'sent'}
                            placeholder={`Escanea el código de barras de la laptop ${index + 1}...`}
                            className={`w-full px-4 py-2.5 pr-12 bg-[#1a1b20] border text-white rounded-xl focus:ring-1 outline-none text-sm transition-colors font-mono ${!barcode.trim() ? 'border-red-500/50 focus:ring-red-500' : 'border-[#2a2b32] focus:ring-blue-500 focus:border-blue-500'} ${activeTab === 'sent' ? 'opacity-70 cursor-not-allowed' : ''}`}
                          />
                          {activeTab === 'pending' && (
                            <button
                              type="button"
                              onClick={() => setScannerIndex(index)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                              title="Escanear con cámara"
                            >
                              <ScanLine className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 2: Photos */}
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4 uppercase tracking-wider border-b border-[#1f2026] pb-2">
                    <Camera className="text-blue-400 w-4 h-4" />
                    Evidencia Fotográfica <span className="text-red-400 ml-1 text-xs">*Obligatorio</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Product Photo */}
                    {activeTab === 'sent' && productPhotoUrl ? (
                      <div 
                        onClick={() => window.open(productPhotoUrl, '_blank')}
                        className="border border-[#2a2b32] rounded-xl overflow-hidden cursor-pointer hover:border-blue-500 transition-colors relative group h-32"
                      >
                        <img src={productPhotoUrl} alt="Foto del Producto" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-xs font-bold flex items-center gap-1"><ExternalLink className="w-4 h-4" /> Ver Foto</span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1 text-center text-[10px] text-white font-medium">
                          Foto del Producto
                        </div>
                      </div>
                    ) : (
                      <label className={`border border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-[#1a1b20] transition-colors cursor-pointer relative overflow-hidden group ${!productPhoto && !selectedSale.detalles?.envio?.productPhotoName ? 'border-red-500/50' : 'border-[#2a2b32]'}`}>
                        {(productPhoto || selectedSale.detalles?.envio?.productPhotoName) ? (
                          <div className="absolute inset-0 bg-[#1a1b20] flex flex-col items-center justify-center pointer-events-none">
                            <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                            <span className="text-xs text-emerald-400 font-medium truncate px-2 w-full">{productPhoto?.name || selectedSale.detalles.envio.productPhotoName}</span>
                          </div>
                        ) : (
                          <>
                            <div className={`w-10 h-10 bg-[#1f2026] rounded-full flex items-center justify-center mb-2 transition-colors ${!productPhoto ? 'text-red-400 group-hover:text-red-300' : 'text-slate-400 group-hover:text-blue-400'}`}>
                              <Package className="w-5 h-5" />
                            </div>
                            <p className={`font-bold text-xs mb-1 ${!productPhoto ? 'text-red-400' : 'text-slate-300'}`}>Foto del Producto</p>
                            <p className="text-[10px] text-slate-500">Obligatorio</p>
                          </>
                        )}
                        {activeTab === 'pending' && <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setProductPhoto)} className="hidden" />}
                      </label>
                    )}

                    {/* Label Photo */}
                    {activeTab === 'sent' && labelPhotoUrl ? (
                      <div 
                        onClick={() => window.open(labelPhotoUrl, '_blank')}
                        className="border border-[#2a2b32] rounded-xl overflow-hidden cursor-pointer hover:border-blue-500 transition-colors relative group h-32"
                      >
                        <img src={labelPhotoUrl} alt="Hoja / Ticket Envío" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-xs font-bold flex items-center gap-1"><ExternalLink className="w-4 h-4" /> Ver Foto</span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1 text-center text-[10px] text-white font-medium">
                          Hoja / Ticket Envío
                        </div>
                      </div>
                    ) : (
                      <label className={`border border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-[#1a1b20] transition-colors cursor-pointer relative overflow-hidden group ${!labelPhoto && !selectedSale.detalles?.envio?.labelPhotoName ? 'border-red-500/50' : 'border-[#2a2b32]'}`}>
                        {(labelPhoto || selectedSale.detalles?.envio?.labelPhotoName) ? (
                          <div className="absolute inset-0 bg-[#1a1b20] flex flex-col items-center justify-center pointer-events-none">
                            <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                            <span className="text-xs text-emerald-400 font-medium truncate px-2 w-full">{labelPhoto?.name || selectedSale.detalles.envio.labelPhotoName}</span>
                          </div>
                        ) : (
                          <>
                            <div className={`w-10 h-10 bg-[#1f2026] rounded-full flex items-center justify-center mb-2 transition-colors ${!labelPhoto ? 'text-red-400 group-hover:text-red-300' : 'text-slate-400 group-hover:text-blue-400'}`}>
                              <FileText className="w-5 h-5" />
                            </div>
                            <p className={`font-bold text-xs mb-1 ${!labelPhoto ? 'text-red-400' : 'text-slate-300'}`}>Hoja / Ticket Envío</p>
                            <p className="text-[10px] text-slate-500">Obligatorio</p>
                          </>
                        )}
                        {activeTab === 'pending' && <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setLabelPhoto)} className="hidden" />}
                      </label>
                    )}

                    {/* Barcode Photo */}
                    {activeTab === 'sent' && barcodePhotoUrl ? (
                      <div 
                        onClick={() => window.open(barcodePhotoUrl, '_blank')}
                        className="border border-[#2a2b32] rounded-xl overflow-hidden cursor-pointer hover:border-blue-500 transition-colors relative group h-32"
                      >
                        <img src={barcodePhotoUrl} alt="Código de Barras" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-xs font-bold flex items-center gap-1"><ExternalLink className="w-4 h-4" /> Ver Foto</span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1 text-center text-[10px] text-white font-medium">
                          Código de Barras
                        </div>
                      </div>
                    ) : (
                      <label className={`border border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-[#1a1b20] transition-colors cursor-pointer relative overflow-hidden group ${!barcodePhoto && !selectedSale.detalles?.envio?.barcodePhotoName ? 'border-red-500/50' : 'border-[#2a2b32]'}`}>
                        {(barcodePhoto || selectedSale.detalles?.envio?.barcodePhotoName) ? (
                          <div className="absolute inset-0 bg-[#1a1b20] flex flex-col items-center justify-center pointer-events-none">
                            <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                            <span className="text-xs text-emerald-400 font-medium truncate px-2 w-full">{barcodePhoto?.name || selectedSale.detalles.envio.barcodePhotoName}</span>
                          </div>
                        ) : (
                          <>
                            <div className={`w-10 h-10 bg-[#1f2026] rounded-full flex items-center justify-center mb-2 transition-colors ${!barcodePhoto ? 'text-red-400 group-hover:text-red-300' : 'text-slate-400 group-hover:text-blue-400'}`}>
                              <BarChart3 className="w-5 h-5" />
                            </div>
                            <p className={`font-bold text-xs mb-1 ${!barcodePhoto ? 'text-red-400' : 'text-slate-300'}`}>Código de Barras</p>
                            <p className="text-[10px] text-slate-500">Obligatorio</p>
                          </>
                        )}
                        {activeTab === 'pending' && <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setBarcodePhoto)} className="hidden" />}
                      </label>
                    )}
                  </div>
                </div>

                {/* Section 3: Checklist */}
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4 uppercase tracking-wider border-b border-[#1f2026] pb-2">
                    <CheckSquare className="text-blue-400 w-4 h-4" />
                    Checklist de Envío <span className="text-red-400 ml-1 text-xs">*Obligatorio</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${chkManual ? 'bg-blue-500/10 border-blue-500/30' : 'bg-[#1a1b20] border-red-500/50 hover:border-red-500/80'}`}>
                      <input type="checkbox" checked={chkManual} onChange={(e) => setChkManual(e.target.checked)} disabled={activeTab === 'sent'} className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500 bg-[#1f2026] border-[#2a2b32]" />
                      <span className={`text-sm font-medium ${chkManual ? 'text-blue-400' : 'text-red-400'}`}>Manual Impreso</span>
                    </label>
                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${chkCharger ? 'bg-blue-500/10 border-blue-500/30' : 'bg-[#1a1b20] border-red-500/50 hover:border-red-500/80'}`}>
                      <input type="checkbox" checked={chkCharger} onChange={(e) => setChkCharger(e.target.checked)} disabled={activeTab === 'sent'} className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500 bg-[#1f2026] border-[#2a2b32]" />
                      <span className={`text-sm font-medium ${chkCharger ? 'text-blue-400' : 'text-red-400'}`}>Cargador</span>
                    </label>
                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${chkBox ? 'bg-blue-500/10 border-blue-500/30' : 'bg-[#1a1b20] border-red-500/50 hover:border-red-500/80'}`}>
                      <input type="checkbox" checked={chkBox} onChange={(e) => setChkBox(e.target.checked)} disabled={activeTab === 'sent'} className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500 bg-[#1f2026] border-[#2a2b32]" />
                      <span className={`text-sm font-medium ${chkBox ? 'text-blue-400' : 'text-red-400'}`}>Caja Original/Empaque</span>
                    </label>
                  </div>
                </div>

                {/* Section 4: Shipping Method */}
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4 uppercase tracking-wider border-b border-[#1f2026] pb-2">
                    <Truck className="text-blue-400 w-4 h-4" />
                    Datos de Paquetería <span className="text-red-400 ml-1 text-xs">*Obligatorio</span>
                  </h3>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex gap-3 w-full md:w-1/2">
                      <label className={`relative flex-1 p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-center gap-2 ${shippingMethod === 'Paquetería' ? 'border-blue-500/50 bg-blue-500/10' : !shippingMethod ? 'border-red-500/50 bg-[#1a1b20]' : 'border-[#2a2b32] bg-[#1a1b20] hover:border-[#3a3b42]'}`}>
                        <input type="radio" name="shippingMethod" value="Paquetería" checked={shippingMethod === 'Paquetería'} onChange={() => setShippingMethod('Paquetería')} disabled={activeTab === 'sent'} className="hidden" />
                        <Truck className={`w-4 h-4 ${shippingMethod === 'Paquetería' ? 'text-blue-400' : !shippingMethod ? 'text-red-400' : 'text-slate-500'}`} />
                        <div className={`text-sm font-bold ${shippingMethod === 'Paquetería' ? 'text-blue-400' : !shippingMethod ? 'text-red-400' : 'text-slate-400'}`}>Paquetería</div>
                      </label>
                      <label className={`relative flex-1 p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-center gap-2 ${shippingMethod === 'Recolección Local' ? 'border-blue-500/50 bg-blue-500/10' : !shippingMethod ? 'border-red-500/50 bg-[#1a1b20]' : 'border-[#2a2b32] bg-[#1a1b20] hover:border-[#3a3b42]'}`}>
                        <input type="radio" name="shippingMethod" value="Recolección Local" checked={shippingMethod === 'Recolección Local'} onChange={() => setShippingMethod('Recolección Local')} disabled={activeTab === 'sent'} className="hidden" />
                        <MapPin className={`w-4 h-4 ${shippingMethod === 'Recolección Local' ? 'text-blue-400' : !shippingMethod ? 'text-red-400' : 'text-slate-500'}`} />
                        <div className={`text-sm font-bold ${shippingMethod === 'Recolección Local' ? 'text-blue-400' : !shippingMethod ? 'text-red-400' : 'text-slate-400'}`}>Local</div>
                      </label>
                    </div>

                    {shippingMethod === 'Paquetería' && (
                      <div className="w-full md:w-1/2">
                        <input 
                          type="text" 
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          disabled={activeTab === 'sent'}
                          placeholder="Número de Guía (Ej. 1Z999...)"
                          className={`w-full px-4 py-3 bg-[#1a1b20] border text-white rounded-xl focus:ring-1 outline-none text-sm transition-colors ${!String(trackingNumber).trim() ? 'border-red-500/50 focus:ring-red-500' : 'border-[#2a2b32] focus:ring-blue-500 focus:border-blue-500'}`}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Resumen de Tickets de Soporte */}
                <div className="pt-4 border-t border-[#1f2026]">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4 uppercase tracking-wider">
                    <LifeBuoy className="text-orange-400 w-4 h-4" />
                    Historial de Soporte del Cliente
                  </h3>
                  {loadingTickets ? (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Loader2 size={12} className="animate-spin" /> Cargando tickets...
                    </div>
                  ) : clientTickets.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {clientTickets.map((ticket) => (
                        <div key={ticket.id} className="p-3 bg-[#1a1b20] border border-[#2a2b32] rounded-xl flex flex-col gap-1">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-slate-500">#{ticket.id}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                              ticket.estado === 'Abierto' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                            }`}>
                              {ticket.estado}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-white truncate">{ticket.titulo}</p>
                          <p className="text-[10px] text-slate-500">{new Date(ticket.created_at).toLocaleDateString('es-MX')}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No se encontraron tickets de soporte para este cliente.</p>
                  )}
                </div>

              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
              <div className="w-16 h-16 bg-[#1a1b20] rounded-full flex items-center justify-center mb-4 border border-[#2a2b32]">
                <Package className="w-8 h-8 text-slate-600" />
              </div>
              <p className="font-bold text-lg text-slate-400 mb-1">Selecciona una venta</p>
              <p className="text-sm text-center max-w-xs">Elige una venta pagada del panel izquierdo para gestionar su envío y actualizar el inventario.</p>
            </div>
          )}
          
          {/* Footer Actions */}
          {selectedSale && activeTab === 'pending' && (
            <div className="p-4 border-t border-[#1f2026] bg-[#15161a] shrink-0 flex justify-end">
              <button 
                onClick={handleSaveShipping}
                disabled={isSaving}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-500/20 text-sm"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Confirmar Envío y Descontar Inventario
                  </>
                )}
              </button>
            </div>
          )}
          {selectedSale && activeTab === 'sent' && (
            <div className="p-4 border-t border-[#1f2026] bg-[#15161a] shrink-0 flex justify-between items-center">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-widest">
                <CheckCircle2 className="w-4 h-4" />
                Envío Completado el {selectedSale.detalles?.envio?.fechaEnvio ? new Date(selectedSale.detalles.envio.fechaEnvio).toLocaleDateString('es-MX') : 'N/A'}
              </div>
              <button 
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#1a1b20] border border-[#2a2b32] text-white rounded-xl font-bold hover:bg-[#2a2b32] transition-all flex items-center gap-2 text-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                Imprimir Registro
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Integrated Error Modal */}
      {appError && (
        <div className="fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#1a1b20] border border-red-500/30 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
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
          <div className="bg-[#1a1b20] border border-emerald-500/30 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
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
    </div>
  );
}
