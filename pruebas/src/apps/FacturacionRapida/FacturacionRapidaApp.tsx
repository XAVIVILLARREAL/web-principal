import React, { useState, useEffect } from 'react';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload, FileText, CheckCircle2, AlertTriangle, Loader2, Receipt, ExternalLink, X, FileCode } from 'lucide-react';

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

const s3Client = new S3Client({
  endpoint: S3_CONFIG.endpoint,
  region: "us-east-1",
  credentials: {
    accessKeyId: S3_CONFIG.accessKey,
    secretAccessKey: S3_CONFIG.secretKey
  },
  forcePathStyle: true
});

export default function FacturacionRapidaApp({ cotizacionId }: { cotizacionId: string }) {
  const [sale, setSale] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [files, setFiles] = useState<{pdf: File | null, xml: File | null}>({ pdf: null, xml: null });

  useEffect(() => {
    fetchSaleData();
  }, [cotizacionId]);

  const fetchSaleData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${DB_CONFIG.url}/cotizaciones?id=eq.${cotizacionId}`);
      if (!res.ok) throw new Error('Error al cargar la cotización');
      const data = await res.json();
      if (data && data.length > 0) {
        setSale(data[0]);
      } else {
        setError('Cotización no encontrada o ID inválido');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const newFiles = { ...files };
    Array.from(selectedFiles).forEach((file: File) => {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isXml = file.type === 'text/xml' || file.type === 'application/xml' || file.name.toLowerCase().endsWith('.xml');
      
      if (isPdf) {
        newFiles.pdf = file;
      } else if (isXml) {
        newFiles.xml = file;
      }
    });
    setFiles(newFiles);
    // Reset progress if new files are selected
    setUploadProgress(0);
    setSuccess(false);
  };

  const removeFile = (type: 'pdf' | 'xml') => {
    setFiles(prev => ({ ...prev, [type]: null }));
  };

  const handleUpload = async () => {
    if (!sale || (!files.pdf && !files.xml)) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(10);

    try {
      const clientName = sale.datos_cliente?.name || sale.detalles?.cliente?.nombre || 'Cliente';
      const clientPhone = sale.datos_cliente?.phone || sale.telefono_cliente || 'SinTelefono';
      const safeName = clientName.replace(/[^a-zA-Z0-9]/g, '_');
      const safePhone = clientPhone.replace(/[^a-zA-Z0-9]/g, '');
      
      const uploadedUrls: string[] = [];
      const timestamp = Date.now();

      // Upload PDF if exists
      if (files.pdf) {
        const pdfPath = `clientes/${safePhone}_${safeName}/facturas/factura_${timestamp}.pdf`;
        console.log('Uploading PDF to S3:', { bucket: S3_CONFIG.bucket, key: pdfPath });
        const pdfBuffer = await files.pdf.arrayBuffer();
        await s3Client.send(new PutObjectCommand({
          Bucket: S3_CONFIG.bucket,
          Key: pdfPath,
          Body: new Uint8Array(pdfBuffer),
          ContentType: 'application/pdf',
          ACL: 'public-read'
        }));
        uploadedUrls.push(`${S3_CONFIG.endpoint}/${S3_CONFIG.bucket}/${pdfPath}`);
      }
      setUploadProgress(40);

      // Upload XML if exists
      if (files.xml) {
        const xmlPath = `clientes/${safePhone}_${safeName}/facturas/factura_${timestamp}.xml`;
        console.log('Uploading XML to S3:', { bucket: S3_CONFIG.bucket, key: xmlPath });
        const xmlBuffer = await files.xml.arrayBuffer();
        await s3Client.send(new PutObjectCommand({
          Bucket: S3_CONFIG.bucket,
          Key: xmlPath,
          Body: new Uint8Array(xmlBuffer),
          ContentType: 'text/xml',
          ACL: 'public-read'
        }));
        uploadedUrls.push(`${S3_CONFIG.endpoint}/${S3_CONFIG.bucket}/${xmlPath}`);
      }
      setUploadProgress(70);

      // Update database
      const updatedDetalles = {
        ...sale.detalles,
        invoice_url: uploadedUrls[0],
        all_invoice_urls: uploadedUrls,
        requiere_factura: true,
        fecha_facturacion: new Date().toISOString(),
        facturado_por: 'Portal Rápido'
      };

      const res = await fetch(`${DB_CONFIG.url}/cotizaciones?id=eq.${sale.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          detalles: updatedDetalles,
          estado: 'Facturada' // Explicitly mark as Facturada
        })
      });

      if (!res.ok) throw new Error('Error al actualizar registro en base de datos');
      setUploadProgress(90);

      // Send to client via Chatwoot
      if (sale.contact_id) {
        try {
          const convRes = await fetch(`${CW_CONFIG.url}/api/v1/accounts/1/contacts/${sale.contact_id}/conversations`, {
            headers: { 'api-access-token': CW_CONFIG.token }
          });
          const convData = await convRes.json();
          let clientConvId = null;

          if (convData.payload && convData.payload.length > 0) {
            clientConvId = convData.payload[0].id;
          }

          if (clientConvId) {
            const sendWithRetry = async (formData: FormData, attempt = 1): Promise<any> => {
              try {
                const res = await fetch(`${CW_CONFIG.url}/api/v1/accounts/1/conversations/${clientConvId}/messages`, {
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

            const messageContent = `✅ *¡Factura Lista!*\n\nHola, te compartimos los archivos de tu factura correspondientes a la cotización *${sale.detalles?.folio || 'S/N'}*.\n\nGracias por tu preferencia. 🙏`;
            
            const formData = new FormData();
            formData.append('content', messageContent);
            formData.append('message_type', 'outgoing');
            formData.append('private', 'false');
            
            if (files.pdf) {
              formData.append('attachments[]', files.pdf, files.pdf.name);
            }
            if (files.xml) {
              formData.append('attachments[]', files.xml, files.xml.name);
            }

            await sendWithRetry(formData);
          }
        } catch (cwError) {
          console.error("Error sending Chatwoot message:", cwError);
        }
      }

      setUploadProgress(100);
      setSuccess(true);
      setSale({ ...sale, detalles: updatedDetalles });
    } catch (err: any) {
      setError(err.message || 'Error crítico durante la subida');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020305] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Receipt className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <p className="text-purple-400 font-mono tracking-[0.3em] uppercase text-xs animate-pulse">Iniciando Enlace Seguro...</p>
        </div>
      </div>
    );
  }

  if (error && !sale) {
    return (
      <div className="min-h-screen bg-[#020305] flex items-center justify-center p-4">
        <div className="bg-[#0a0c10] border border-red-500/30 p-8 rounded-2xl max-w-md w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.1)]">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-white mb-3 uppercase tracking-tighter">Acceso Denegado</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-xs font-bold uppercase tracking-widest transition-all"
          >
            Reintentar Conexión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020305] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(168,85,247,0.08),_transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:30px_30px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] pointer-events-none" />
      
      <div className="bg-[#0a0c10] border border-white/10 p-8 rounded-3xl max-w-lg w-full shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative z-10 overflow-hidden">
        {/* Top Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-cyan-500 to-purple-600"></div>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/30">
              <Receipt className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Facturación</h1>
              <p className="text-[10px] font-bold text-purple-400/70 uppercase tracking-widest mt-1">Portal de Enlace Rápido</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Status</span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-1 justify-end">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              Encriptado
            </span>
          </div>
        </div>

        {sale && (
          <div className="bg-[#15161a] border border-white/5 rounded-2xl p-6 mb-8 relative group">
            <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <FileText className="w-12 h-12 text-white" />
            </div>
            
            <div className="grid grid-cols-2 gap-6 relative z-10">
              <div className="col-span-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Cliente Receptor</span>
                <span className="text-lg font-bold text-white leading-tight">{sale.datos_cliente?.name || sale.detalles?.cliente?.nombre || 'Desconocido'}</span>
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Folio Interno</span>
                <span className="text-sm font-black text-purple-400 font-mono">{sale.detalles?.folio || 'S/F'}</span>
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Monto Total</span>
                <span className="text-sm font-black text-emerald-400 font-mono">
                  ${(sale.monto || sale.detalles?.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        )}

        {sale && (
          <>
            {success ? (
              <div className="text-center py-10 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500/30 relative">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-20"></div>
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tighter italic">¡Misión Cumplida!</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-8 px-4">
                  La factura ha sido procesada, guardada en la nube y enviada al cliente automáticamente. Todo el flujo se ha completado con éxito.
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => window.close()}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-[0_10px_20px_rgba(16,185,129,0.2)] active:scale-95"
                  >
                    Cerrar Portal
                  </button>
                  <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Puedes cerrar esta pestaña ahora</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* File Selection Area */}
                <div className="grid grid-cols-2 gap-4">
                  {/* PDF Upload */}
                  <div className="relative">
                    <input 
                      type="file" 
                      id="pdf-upload"
                      className="hidden" 
                      accept=".pdf" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFiles(prev => ({ ...prev, pdf: e.target.files![0] }));
                          setUploadProgress(0);
                          setSuccess(false);
                        }
                      }}
                      disabled={isUploading}
                    />
                    <label 
                      htmlFor="pdf-upload"
                      className={`
                        flex flex-col items-center justify-center w-full h-32 
                        border-2 border-dashed rounded-3xl cursor-pointer 
                        transition-all duration-300 group relative overflow-hidden
                        ${isUploading 
                          ? 'border-purple-500/30 bg-purple-500/5 pointer-events-none' 
                          : files.pdf
                            ? 'border-purple-500/50 bg-purple-500/10'
                            : 'border-white/10 hover:border-purple-500/50 hover:bg-purple-500/5 bg-[#15161a]'}
                      `}
                    >
                      {files.pdf ? (
                        <div className="flex flex-col items-center text-center px-4 z-10">
                          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center mb-2">
                            <CheckCircle2 className="w-5 h-5 text-purple-400" />
                          </div>
                          <p className="text-xs font-bold text-white truncate max-w-[120px]">{files.pdf.name}</p>
                          <button 
                            onClick={(e) => { e.preventDefault(); removeFile('pdf'); }}
                            className="mt-2 text-[10px] text-red-400 hover:text-red-300 uppercase tracking-widest font-black"
                          >
                            Quitar
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center px-4 z-10">
                          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 group-hover:bg-purple-500/10 transition-all border border-white/5 group-hover:border-purple-500/30">
                            <FileText className="w-5 h-5 text-slate-400 group-hover:text-purple-400 transition-colors" />
                          </div>
                          <p className="text-xs font-black text-white mb-1 uppercase tracking-tight">Subir PDF</p>
                          <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-bold">Requerido</p>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* XML Upload */}
                  <div className="relative">
                    <input 
                      type="file" 
                      id="xml-upload"
                      className="hidden" 
                      accept=".xml" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFiles(prev => ({ ...prev, xml: e.target.files![0] }));
                          setUploadProgress(0);
                          setSuccess(false);
                        }
                      }}
                      disabled={isUploading}
                    />
                    <label 
                      htmlFor="xml-upload"
                      className={`
                        flex flex-col items-center justify-center w-full h-32 
                        border-2 border-dashed rounded-3xl cursor-pointer 
                        transition-all duration-300 group relative overflow-hidden
                        ${isUploading 
                          ? 'border-cyan-500/30 bg-cyan-500/5 pointer-events-none' 
                          : files.xml
                            ? 'border-cyan-500/50 bg-cyan-500/10'
                            : 'border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 bg-[#15161a]'}
                      `}
                    >
                      {files.xml ? (
                        <div className="flex flex-col items-center text-center px-4 z-10">
                          <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-2">
                            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                          </div>
                          <p className="text-xs font-bold text-white truncate max-w-[120px]">{files.xml.name}</p>
                          <button 
                            onClick={(e) => { e.preventDefault(); removeFile('xml'); }}
                            className="mt-2 text-[10px] text-red-400 hover:text-red-300 uppercase tracking-widest font-black"
                          >
                            Quitar
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center px-4 z-10">
                          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 group-hover:bg-cyan-500/10 transition-all border border-white/5 group-hover:border-cyan-500/30">
                            <FileCode className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                          </div>
                          <p className="text-xs font-black text-white mb-1 uppercase tracking-tight">Subir XML</p>
                          <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-bold">Requerido</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {isUploading && (
                  <div className="flex flex-col items-center justify-center py-4 animate-in fade-in duration-300">
                    <div className="w-16 h-16 relative mb-3">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle className="text-white/5 stroke-current" strokeWidth="6" fill="transparent" r="44" cx="50" cy="50" />
                        <circle 
                          className="text-purple-500 stroke-current transition-all duration-500" 
                          strokeWidth="6" 
                          strokeDasharray={276.46}
                          strokeDashoffset={276.46 - (276.46 * uploadProgress) / 100}
                          strokeLinecap="round" 
                          fill="transparent" 
                          r="44" cx="50" cy="50" 
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-black text-white">{uploadProgress}%</span>
                      </div>
                    </div>
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] animate-pulse">Sincronizando con la Nube...</p>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 animate-in shake-in duration-300">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-400 leading-relaxed font-bold">{error}</p>
                  </div>
                )}

                <button 
                  onClick={handleUpload}
                  disabled={isUploading || (!files.pdf && !files.xml)}
                  className={`
                    w-full py-5 rounded-2xl text-xs font-black uppercase tracking-[0.3em] transition-all relative overflow-hidden group
                    ${isUploading || (!files.pdf && !files.xml)
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-white text-black hover:bg-purple-500 hover:text-white shadow-[0_20px_40px_rgba(168,85,247,0.2)] active:scale-[0.98]'}
                  `}
                >
                  <span className="relative z-10">
                    {isUploading ? 'Procesando Módulo...' : 'Finalizar y Notificar Cliente'}
                  </span>
                  {!isUploading && files.pdf && files.xml && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
