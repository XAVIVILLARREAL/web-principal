import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Filter, Clock, CheckCircle2, AlertCircle, MoreVertical, User, Phone, LifeBuoy, X, CheckCircle, Calendar, MessageSquare, ShieldCheck, Loader2, Truck } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { TicketTemplate, TicketData } from './components/TicketTemplate';

interface Ticket {
  id: string;
  cliente_id: string;
  cliente_nombre?: string;
  titulo: string;
  estado: 'Abierto' | 'En Progreso' | 'Cerrado';
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Urgente';
  fecha_creacion: string;
  fecha_cierre?: string;
  solucion?: string;
  agente_asignado: string;
  notas?: string;
  xtremeId?: string;
}

const DB_CONFIG = {
  url: 'https://api-datos.xtremediagnostics.com'
};

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

export default function TicketsSoporteApp({ session, contactIdProp, conversationIdProp }: { session?: any, contactIdProp?: string, conversationIdProp?: string }) {
  const [contactId, setContactId] = useState<string | null>(contactIdProp || null);
  const [convId, setConvId] = useState<string | null>(conversationIdProp || null);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'Filtered' | 'Global'>('Filtered');
  const [isLoading, setIsLoading] = useState(true);
  const [currentClient, setCurrentClient] = useState<{ id: string, nombre: string, telefono: string, xtremeId?: string } | null>(null);
  
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketSolution, setTicketSolution] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [clientShipments, setClientShipments] = useState<any[]>([]);
  const [loadingShipments, setLoadingShipments] = useState(false);

  useEffect(() => {
    if (selectedTicket) {
      fetchClientShipments(selectedTicket.cliente_id);
    }
  }, [selectedTicket]);

  const fetchClientShipments = async (clientId: string) => {
    setLoadingShipments(true);
    try {
      const res = await fetch(`${DB_CONFIG.url}/envios?cliente_id=eq.${clientId}&order=created_at.desc`);
      if (res.ok) {
        const data = await res.json();
        setClientShipments(data);
      }
    } catch (e) {
      console.error('Error fetching client shipments:', e);
    } finally {
      setLoadingShipments(false);
    }
  };

  const [formData, setFormData] = useState({
    titulo: '',
    prioridad: 'Media' as any,
    notas: '',
    xtremeId: '',
    agente_asignado: session?.user?.email?.split('@')[0] || 'Agente'
  });

  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState('');
  const [currentTicketData, setCurrentTicketData] = useState<TicketData | null>(null);
  const [appError, setAppError] = useState<string | null>(null);
  const ticketTemplateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contactIdProp) setContactId(contactIdProp);
    if (conversationIdProp) setConvId(conversationIdProp);
  }, [contactIdProp, conversationIdProp]);

  useEffect(() => {
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
            return;
          }
        }
        
        if (data && data.event === 'appContext') {
          const ctx = data.data;
          if (ctx.conversation && ctx.conversation.id) {
            setConvId(ctx.conversation.id.toString());
          }
          if (ctx.contact && ctx.contact.id) {
            setContactId(ctx.contact.id.toString());
          }
        }
        
        if (data && data.type === 'chatwoot_context') {
          if (data.conversation_id) setConvId(data.conversation_id.toString());
          if (data.contact_id) setContactId(data.contact_id.toString());
        }
        
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

  useEffect(() => {
    const fetchContextAndTickets = async () => {
      setIsLoading(true);
      
      let cid = contactId || new URLSearchParams(window.location.search).get('contact_id') || window.XTREME_URL_PARAMS?.contact_id;
      let currentConvId = convId || new URLSearchParams(window.location.search).get('conversation_id') || window.XTREME_URL_PARAMS?.conversation_id;

      if (!currentConvId) {
        const match = document.referrer.match(/conversations\/(\d+)/);
        if (match) currentConvId = match[1];
      }

      if (!currentConvId) {
        try {
          if (window.parent !== window && window.parent.location.href) {
            const match = window.parent.location.href.match(/conversations\/(\d+)/);
            if (match) currentConvId = match[1];
          }
        } catch (e) {}
      }

      if (!cid && currentConvId) {
        try {
          const res = await fetch(`${CW_CONFIG.url}/api/v1/accounts/1/conversations/${currentConvId}`, {
            headers: { 
              'api-access-token': CW_CONFIG.token
            }
          });
          const data = await res.json();
          if (data.meta?.sender?.id) {
            cid = data.meta.sender.id.toString();
            setContactId(cid);
          } else if (data.contact_id) {
            cid = data.contact_id.toString();
            setContactId(cid);
          }
        } catch (e) {}
      }

      if (cid) {
        try {
          const res = await fetch(`${CW_CONFIG.url}/api/v1/accounts/1/contacts/${cid}`, {
            headers: { 
              'api-access-token': CW_CONFIG.token
            }
          });
          const data = await res.json();
          if (data.payload) {
            // Intentar obtener Xtreme ID de la base de datos
            let xtremeId = data.payload.custom_attributes?.xtreme_id || '';
            try {
              const resQuotes = await fetch(`${DB_CONFIG.url}/cotizaciones?contact_id=eq.${cid}&order=created_at.desc`);
              const quotes = await resQuotes.json();
              if (Array.isArray(quotes)) {
                for (const q of quotes) {
                  if (q.detalles?.xtreme_id) {
                    xtremeId = q.detalles.xtreme_id;
                    break;
                  }
                  if (q.detalles?.envio?.laptopBarcode) {
                    xtremeId = q.detalles.envio.laptopBarcode;
                    break;
                  }
                  if (q.detalles?.envio?.xtremeId) {
                    xtremeId = q.detalles.envio.xtremeId;
                    break;
                  }
                  const itemWithXtremeId = q.detalles?.items?.find((i: any) => i.xtreme_id || (i.description && i.description.includes('Xtreme ID:')));
                  if (itemWithXtremeId) {
                    if (itemWithXtremeId.xtreme_id) {
                      xtremeId = itemWithXtremeId.xtreme_id;
                    } else {
                      const match = itemWithXtremeId.description.match(/Xtreme ID:\s*([^\s,.]+)/);
                      if (match) xtremeId = match[1];
                    }
                    if (xtremeId) break;
                  }
                }
              }
            } catch (e) {}

            setCurrentClient({
              id: cid,
              nombre: data.payload.name || 'Desconocido',
              telefono: data.payload.phone_number || 'S/N',
              xtremeId: xtremeId
            });
            
            if (xtremeId) {
              setFormData(prev => ({ ...prev, xtremeId: xtremeId }));
            }
          }
        } catch (e) {}
      }

      await fetchTickets();
      setIsLoading(false);
    };

    fetchContextAndTickets();
  }, [contactId, convId]);

  const fetchTickets = async () => {
    try {
      const res = await fetch(`${DB_CONFIG.url}/tickets_soporte?order=created_at.desc`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setTickets(data.map((t: any) => ({
          id: t.id.toString(),
          cliente_id: t.cliente_id,
          titulo: t.titulo,
          estado: t.estado,
          prioridad: t.prioridad,
          fecha_creacion: new Date(t.created_at).toLocaleDateString('es-MX'),
          fecha_cierre: t.fecha_cierre ? new Date(t.fecha_cierre).toLocaleDateString('es-MX') : undefined,
          solucion: t.solucion,
          agente_asignado: t.agente_asignado || 'Sin asignar',
          notas: t.notas,
          xtremeId: t.xtreme_id
        })));
      }
    } catch (e) {
      console.error('Error fetching tickets:', e);
    }
  };

  const [nextTicketId, setNextTicketId] = useState<number | null>(null);
  const [fetchedXtremeIds, setFetchedXtremeIds] = useState<string[]>([]);
  const [selectedXtremeId, setSelectedXtremeId] = useState<string>('');

  const handleOpenNewModal = async () => {
    setShowNewModal(true);
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
    if (currentClient) {
      try {
        let xtremeIds: string[] = [];
        
        // 1. Check clientes table
        const resCliente = await fetch(`${DB_CONFIG.url}/clientes?contact_id=eq.${currentClient.id}`);
        if (resCliente.ok) {
          const data = await resCliente.json();
          if (data && data.length > 0 && data[0].xtreme_id) {
            xtremeIds.push(data[0].xtreme_id);
          }
        }
        
        // 2. Check quotes
        const resQuotes = await fetch(`${DB_CONFIG.url}/cotizaciones?contact_id=eq.${currentClient.id}&order=created_at.desc`);
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
          const resClient = await fetch(`${CW_CONFIG.url}/api/v1/accounts/1/contacts/${currentClient.id}`, {
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
          setFormData(prev => ({ ...prev, xtremeId: xtremeIds[0] }));
        } else {
          setFormData(prev => ({ ...prev, xtremeId: '' }));
        }
      } catch (e) {
        console.error('Error fetching Xtreme ID', e);
      }
    }
  };

  const handleCreate = async () => {
    if (!formData.titulo.trim()) {
      setAppError('Por favor, ingresa un asunto o título para el ticket.');
      return;
    }
    if (!currentClient) {
      setAppError('Error: No se ha detectado un cliente activo. Por favor, asegúrate de que el CRM ha cargado los datos del contacto.');
      return;
    }
    setIsCreating(true);
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

      // 2. Obtener datos de garantía del cliente
      setCreationProgress('Verificando garantía...');
      
      const resQuotes = await fetch(`${DB_CONFIG.url}/cotizaciones?contact_id=eq.${currentClient.id}&order=created_at.desc`);
      const quotes = await resQuotes.json();
      const now = new Date();
      const paidQuotes = Array.isArray(quotes) ? quotes.filter((c: any) => c.detalles?.isPaid && c.detalles?.paymentDate) : [];
      
      const resClient = await fetch(`${CW_CONFIG.url}/api/v1/accounts/1/contacts/${currentClient.id}`, {
        headers: { 
          'api-access-token': CW_CONFIG.token
        }
      });
      const clientData = await resClient.json();
      
      let xtremeId = formData.xtremeId || 'N/A';
      
      let isUnderWarranty = false;
      if (paidQuotes.length > 0) {
        const lastPayment = new Date(paidQuotes[0].detalles.paymentDate);
        const diffMonths = (now.getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
        if (diffMonths <= 3) isUnderWarranty = true;
      }

      // 4. Crear el Ticket en la DB
      setCreationProgress('Guardando ticket en base de datos...');
      const ticketPayload = {
        id: nextId,
        cliente_id: currentClient.id,
        contact_id: currentClient.id,
        titulo: formData.titulo,
        prioridad: formData.prioridad,
        estado: 'Abierto',
        notas: formData.notas,
        xtreme_id: xtremeId,
        agente_asignado: formData.agente_asignado,
        created_at: new Date().toISOString()
      };

      const resTicket = await fetch(`${DB_CONFIG.url}/tickets_soporte`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(ticketPayload)
      });

      if (!resTicket.ok) {
        const errText = await resTicket.text();
        throw new Error(`Error al crear el ticket en DB (${resTicket.status}): ${errText}`);
      }
      
      const createdTicketData = await resTicket.json();
      const actualTicketId = createdTicketData[0]?.id || nextId;

      // 5. Generar Cotización Automática
      setCreationProgress('Generando cotización automática...');
      const resLastFolio = await fetch(`${DB_CONFIG.url}/cotizaciones?select=detalles&order=created_at.desc&limit=1`);
      const lastFolioData = await resLastFolio.json();
      const year = new Date().getFullYear();
      let nextFolio = `XT-${year}-001`;
      if (lastFolioData && lastFolioData.length > 0 && lastFolioData[0].detalles?.folio) {
        const lastFolio = lastFolioData[0].detalles.folio;
        const parts = lastFolio.split('-');
        if (parts.length === 3 && parts[1] === year.toString()) {
          const nextNum = parseInt(parts[2], 10) + 1;
          nextFolio = `XT-${year}-${nextNum.toString().padStart(3, '0')}`;
        }
      }

      const cotPayload = {
        contact_id: currentClient.id,
        monto: isUnderWarranty ? 0 : 500, // Concepto de asistencia remota si no hay garantía
        agente: formData.agente_asignado,
        created_at: new Date().toISOString(),
        detalles: {
          folio: nextFolio,
          fechaEmision: new Date().toLocaleDateString('es-MX'),
          validoHasta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('es-MX'),
          cliente: {
            name: currentClient.nombre,
            phone: currentClient.telefono,
            email: clientData.payload?.email || ''
          },
          items: [
            {
              id: '1',
              name: isUnderWarranty ? 'Garantía de Soporte Técnico' : 'Asistencia Remota',
              description: `Soporte técnico para equipo Xtreme ID: ${xtremeId}. Ticket #${nextId}`,
              qty: 1,
              unitPrice: isUnderWarranty ? 0 : 500
            }
          ],
          total: isUnderWarranty ? 0 : 500,
          isPaid: isUnderWarranty,
          paymentDate: isUnderWarranty ? new Date().toISOString() : null,
          supportTicket: nextId.toString(),
          warranty: isUnderWarranty ? 'Pagado por garantía' : 'Servicio estándar'
        }
      };

      await fetch(`${DB_CONFIG.url}/cotizaciones`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cotPayload)
      });

      // 6. Generar PDF del Ticket
      setCreationProgress('Generando PDF de soporte...');
      try {
        const ticketData: TicketData = {
          id: actualTicketId.toString(),
          fecha: new Date().toLocaleDateString('es-MX'),
          cliente: {
            name: currentClient.nombre,
            email: clientData.payload?.email || 'S/N',
            phone: currentClient.telefono,
            xtreme_id: xtremeId
          },
          titulo: formData.titulo,
          prioridad: formData.prioridad,
          notas: formData.notas,
          tecnico: formData.agente_asignado,
          isUnderWarranty: isUnderWarranty
        };

        setCurrentTicketData(ticketData);

        // Wait for re-render
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Render hidden template for PDF
        const element = document.getElementById('ticket-pdf-template');
        if (element) {
          const opt = {
            margin: 0,
            filename: `Ticket_Soporte_${nextId}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'in' as const, format: [5.5, 8.5] as [number, number], orientation: 'landscape' as const }
          };

          // Use html2pdf with proper error handling
          let pdfBlob;
          try {
            pdfBlob = await html2pdf().from(element).set(opt).output('blob');
          } catch (pdfErr) {
            console.error('Error generating PDF with html2pdf:', pdfErr);
            throw new Error('No se pudo generar el PDF del ticket. Verifique la conexión o intente de nuevo.');
          }
          
          if (!pdfBlob) throw new Error('El PDF generado está vacío.');

          // 7. Subir a S3
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

          const pdfKey = `tickets/Ticket_${actualTicketId}_${Date.now()}.pdf`;
          const pdfBuffer = await pdfBlob.arrayBuffer();
          await s3Client.send(new PutObjectCommand({
            Bucket: S3_CONFIG.bucket,
            Key: pdfKey,
            Body: new Uint8Array(pdfBuffer),
            ContentType: 'application/pdf',
            ACL: 'public-read'
          }));

          // 8. Enviar a Chatwoot
          setCreationProgress('Enviando ficha al cliente...');
          let currentConvId = convId || new URLSearchParams(window.location.search).get('conversation_id') || window.XTREME_URL_PARAMS?.conversation_id;
          
          if (!currentConvId) {
            const match = document.referrer.match(/conversations\/(\d+)/);
            if (match) currentConvId = match[1];
          }

          if (!currentConvId) {
            try {
              if (window.parent !== window && window.parent.location.href) {
                const match = window.parent.location.href.match(/conversations\/(\d+)/);
                if (match) currentConvId = match[1];
              }
            } catch (e) {}
          }
          
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
                  throw new Error(`Error al enviar a Chatwoot: ${e.message || 'Desconocido'}`);
                }
              }
            };

            // 1. Enviar solo el texto
            const messageText = `✅ *Ticket de Soporte Asignado*

Se ha asignado un ticket de seguimiento para soporte técnico y un agente especializado para ayudarte. Por favor, danos oportunidad de que se libere un técnico para atenderte de la mejor manera.

⚠️ *IMPORTANTE:* Antes de eso, ¿podrías enviarnos fotos del problema, mensaje o error que aparece en la pantalla? Esto nos permitirá darte una solución mucho más rápida.

*Detalles del Ticket:*
🎫 Folio: #${nextId}
📌 Asunto: ${formData.titulo}
👤 Agente: ${formData.agente_asignado}

_Puedes enviarnos las fotos por aquí mismo o por WhatsApp de favor._`;

            const textData = new FormData();
            textData.append('content', messageText);
            textData.append('message_type', 'outgoing');
            textData.append('private', 'false');
            await sendWithRetry(textData);

            // 2. Enviar PDF (sin texto adicional)
            const pdfData = new FormData();
            pdfData.append('message_type', 'outgoing');
            pdfData.append('private', 'false');
            pdfData.append('attachments[]', new File([pdfBlob], `Ticket_Soporte_${nextId}.pdf`, { type: 'application/pdf' }));
            await sendWithRetry(pdfData);
          }
        } else {
          throw new Error('No se encontró el elemento del template para generar el PDF.');
        }
      } catch (pdfError: any) {
        console.error('Error in PDF/S3/Chatwoot flow:', pdfError);
        setAppError('El ticket se creó en la base de datos, pero hubo un problema al generar o enviar el PDF: ' + pdfError.message);
      }

      await fetchTickets();
      setShowNewModal(false);
      setFormData({ titulo: '', prioridad: 'Media', notas: '', xtremeId: '', agente_asignado: session?.user?.email?.split('@')[0] || 'Agente' });
      setCreationProgress('¡Ticket creado con éxito!');
      setTimeout(() => setIsCreating(false), 2000);

    } catch (e: any) {
      console.error('Error in handleCreate:', e);
      setAppError('Error al crear el ticket: ' + e.message);
      setIsCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedTicket || !formData.titulo.trim()) return;

    try {
      const res = await fetch(`${DB_CONFIG.url}/tickets?id=eq.${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          titulo: formData.titulo,
          prioridad: formData.prioridad,
          notas: formData.notas,
          xtreme_id: formData.xtremeId,
          agente_asignado: formData.agente_asignado
        })
      });

      if (res.ok) {
        await fetchTickets();
        setShowEditModal(false);
        setSelectedTicket(null);
      }
    } catch (e) {}
  };

  const handleClose = async () => {
    if (!selectedTicket || !ticketSolution.trim()) return;

    try {
      const res = await fetch(`${DB_CONFIG.url}/tickets?id=eq.${selectedTicket.id}`, {
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
        await fetchTickets();
        setShowCloseModal(false);
        setSelectedTicket(null);
        setTicketSolution('');
        setInternalNotes('');

        // Notify Chatwoot
        let currentConvId = convId || new URLSearchParams(window.location.search).get('conversation_id') || window.XTREME_URL_PARAMS?.conversation_id;
        if (!currentConvId) {
          const match = document.referrer.match(/conversations\/(\d+)/);
          if (match) currentConvId = match[1];
        }
        if (!currentConvId) {
          try {
            if (window.parent !== window && window.parent.location.href) {
              const match = window.parent.location.href.match(/conversations\/(\d+)/);
              if (match) currentConvId = match[1];
            }
          } catch (e) {}
        }

        if (currentConvId && currentConvId !== '0' && currentConvId !== 'null' && currentConvId !== 'undefined') {
          const sendWithRetry = async (formData: FormData, attempt = 1): Promise<any> => {
            try {
              const resCw = await fetch(`${CW_CONFIG.url}/api/v1/accounts/1/conversations/${currentConvId}/messages`, {
                method: 'POST',
                headers: { 
                  'api-access-token': CW_CONFIG.token
                },
                body: formData
              });
              if (!resCw.ok) throw new Error(`HTTP ${resCw.status}`);
              return await resCw.json();
            } catch (e: any) {
              if (attempt < 3) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return sendWithRetry(formData, attempt + 1);
              }
            }
          };

          const textData = new FormData();
          textData.append('content', `El ticket de soporte #${selectedTicket.id} ha sido cerrado.\n\nAnotaciones: ${ticketSolution}`);
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
    } catch (e) {}
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.id.includes(searchTerm) || 
                          (t.xtremeId && t.xtremeId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (view === 'Filtered') {
      return matchesSearch && t.cliente_id === currentClient?.id;
    }
    return matchesSearch;
  });

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Abierto': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'En Progreso': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Cerrado': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'Urgente': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'Alta': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'Media': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'Baja': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0f1014] text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-xs font-black tracking-widest uppercase animate-pulse">Cargando Sistema de Soporte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0f1014] text-slate-300 font-sans selection:bg-blue-500/30 relative overflow-hidden">
      {/* Error Modal */}
      {appError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1c23] border border-red-500/30 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Error del Sistema</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                {appError}
              </p>
              <button 
                onClick={() => setAppError(null)}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-600/20 uppercase tracking-widest text-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />

      {/* Context Banner */}
      <div className="relative z-10 bg-[#15161a]/80 backdrop-blur-md border-b border-[#1f2026] px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-bold text-blue-400 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
            <User className="w-3.5 h-3.5" /> Contexto Activo:
          </span>
          {currentClient ? (
            <>
              <span className="text-white font-medium">{currentClient.nombre}</span>
              <span className="text-slate-500 flex items-center gap-1.5 border-l border-[#2a2b32] pl-4">
                <Phone className="w-3.5 h-3.5" /> {currentClient.telefono}
              </span>
            </>
          ) : (
            <span className="text-slate-500 italic">Sin cliente seleccionado</span>
          )}
        </div>
        <div className="flex bg-[#1a1b20] rounded-lg p-1 border border-[#2a2b32]">
          <button 
            onClick={() => setView('Filtered')}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${view === 'Filtered' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Mis Tickets
          </button>
          <button 
            onClick={() => setView('Global')}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${view === 'Global' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Todos los Tickets
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 px-8 py-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/10">
            <LifeBuoy className="text-blue-400 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">XtremeOS <span className="text-blue-400">Soporte</span></h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Gestión de Tickets Técnicos</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isCreating && (
            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl">
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{creationProgress}</span>
            </div>
          )}
          <button 
            onClick={handleOpenNewModal}
            disabled={isCreating}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-blue-500/20 border border-blue-400/50 text-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo Ticket
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="relative z-10 px-8 py-2 flex items-center gap-4 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Buscar por ID, título o Xtreme ID..." 
            className="w-full pl-11 pr-4 py-2.5 bg-[#15161a] border border-[#1f2026] rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm text-white placeholder-slate-600 shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-auto px-8 pb-8 mt-4">
        <div className="bg-[#15161a] border border-[#1f2026] rounded-2xl shadow-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1a1b20] border-b border-[#1f2026] text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                <th className="px-6 py-4">ID Ticket</th>
                <th className="px-6 py-4">Asunto</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Prioridad</th>
                <th className="px-6 py-4">Fechas</th>
                <th className="px-6 py-4">Agente</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2026]">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-[#1a1b20]/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold text-white">#{ticket.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-200">{ticket.titulo}</div>
                    {ticket.xtremeId && (
                      <div className="text-[10px] text-blue-400 mt-1 font-mono bg-blue-500/10 inline-block px-1.5 py-0.5 rounded border border-blue-500/20">
                        Xtreme ID: {ticket.xtremeId}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(ticket.estado)}`}>
                      {ticket.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getPriorityColor(ticket.prioridad)}`}>
                      {ticket.prioridad}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[10px] text-slate-400">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>Creado: {ticket.fecha_creacion}</span>
                      </div>
                      {ticket.fecha_cierre && (
                        <div className="flex items-center gap-1.5 text-emerald-500">
                          <CheckCircle className="w-3 h-3" />
                          <span>Cerrado: {ticket.fecha_cierre}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-300 font-medium">
                    {ticket.agente_asignado}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setFormData({
                            titulo: ticket.titulo,
                            prioridad: ticket.prioridad,
                            notas: ticket.notas || '',
                            xtremeId: ticket.xtremeId || '',
                            agente_asignado: ticket.agente_asignado
                          });
                          setShowEditModal(true);
                        }}
                        className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {ticket.estado !== 'Cerrado' && (
                        <button 
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowCloseModal(true);
                          }}
                          className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
                        >
                          Cerrar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-40">
                      <LifeBuoy className="w-12 h-12 text-slate-700" />
                      <p className="text-sm font-bold uppercase tracking-widest text-slate-600">No se encontraron tickets</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#15161a] border border-[#1f2026] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-[#1f2026] bg-[#0f1014]/50 flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                <Plus className="w-5 h-5 text-blue-400" /> Nuevo Ticket
              </h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ID de Ticket</span>
                  <span className="text-xs font-mono font-bold text-blue-400">
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
                        setFormData(prev => ({ ...prev, xtremeId: e.target.value }));
                      }}
                      className="bg-[#1a1b20] text-blue-400 font-mono font-bold text-xs border border-[#2a2b32] rounded px-2 py-1 outline-none"
                    >
                      {fetchedXtremeIds.map((id, idx) => (
                        <option key={idx} value={id}>{id}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs font-mono font-bold text-blue-400">
                      {fetchedXtremeIds.length === 1 ? fetchedXtremeIds[0] : 'No encontrado'}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Asunto / Título</label>
                <input 
                  type="text" 
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  className="w-full px-4 py-2.5 bg-[#0f1014] border border-[#1f2026] rounded-xl focus:outline-none focus:border-blue-500 text-white text-sm"
                  placeholder="Ej. Problema con motor de arranque"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Prioridad</label>
                  <select 
                    value={formData.prioridad}
                    onChange={(e) => setFormData({...formData, prioridad: e.target.value as any})}
                    className="w-full px-4 py-2.5 bg-[#0f1014] border border-[#1f2026] rounded-xl focus:outline-none focus:border-blue-500 text-white text-sm"
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Xtreme ID (Manual)</label>
                  <input 
                    type="text" 
                    value={formData.xtremeId}
                    onChange={(e) => setFormData({...formData, xtremeId: e.target.value})}
                    className="w-full px-4 py-2.5 bg-[#0f1014] border border-[#1f2026] rounded-xl focus:outline-none focus:border-blue-500 text-white text-sm"
                    placeholder="Solo si no está en DB"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Notas</label>
                <textarea 
                  value={formData.notas}
                  onChange={(e) => setFormData({...formData, notas: e.target.value})}
                  className="w-full px-4 py-3 bg-[#0f1014] border border-[#1f2026] rounded-xl focus:outline-none focus:border-blue-500 text-white text-xs h-24 resize-none"
                  placeholder="Detalles del problema..."
                />
              </div>
            </div>
            <div className="px-6 py-5 border-t border-[#1f2026] bg-[#0f1014]/50 flex gap-3">
              <button onClick={() => setShowNewModal(false)} className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Cancelar</button>
              <button onClick={handleCreate} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">Crear Ticket</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#15161a] border border-[#1f2026] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-[#1f2026] bg-[#0f1014]/50 flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                <MoreVertical className="w-5 h-5 text-blue-400" /> Editar Ticket
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Asunto / Título</label>
                <input 
                  type="text" 
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  className="w-full px-4 py-2.5 bg-[#0f1014] border border-[#1f2026] rounded-xl focus:outline-none focus:border-blue-500 text-white text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Prioridad</label>
                  <select 
                    value={formData.prioridad}
                    onChange={(e) => setFormData({...formData, prioridad: e.target.value as any})}
                    className="w-full px-4 py-2.5 bg-[#0f1014] border border-[#1f2026] rounded-xl focus:outline-none focus:border-blue-500 text-white text-sm"
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Agente</label>
                  <input 
                    type="text" 
                    value={formData.agente_asignado}
                    onChange={(e) => setFormData({...formData, agente_asignado: e.target.value})}
                    className="w-full px-4 py-2.5 bg-[#0f1014] border border-[#1f2026] rounded-xl focus:outline-none focus:border-blue-500 text-white text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Notas</label>
                <textarea 
                  value={formData.notas}
                  onChange={(e) => setFormData({...formData, notas: e.target.value})}
                  className="w-full px-4 py-3 bg-[#0f1014] border border-[#1f2026] rounded-xl focus:outline-none focus:border-blue-500 text-white text-xs h-24 resize-none"
                />
              </div>

              {/* Resumen de Envíos del Cliente */}
              <div className="pt-4 border-t border-[#1f2026]">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Truck size={14} /> Historial de Envíos del Cliente
                </h4>
                {loadingShipments ? (
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <Loader2 size={12} className="animate-spin" /> Cargando envíos...
                  </div>
                ) : clientShipments.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {clientShipments.map((envio: any) => (
                      <div key={envio.id} className="p-2 bg-[#0f1014] border border-[#1f2026] rounded-lg flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-bold text-white">{envio.paqueteria} - {envio.guia}</p>
                          <p className="text-[9px] text-slate-500">{new Date(envio.created_at).toLocaleDateString('es-MX')}</p>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                          envio.estado === 'Entregado' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-cyan-500/10 text-cyan-500'
                        }`}>
                          {envio.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 italic">No se encontraron envíos previos para este cliente.</p>
                )}
              </div>
            </div>
            <div className="px-6 py-5 border-t border-[#1f2026] bg-[#0f1014]/50 flex gap-3">
              <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Cancelar</button>
              <button onClick={handleUpdate} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* Close Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#15161a] border border-[#1f2026] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-[#1f2026] bg-[#0f1014]/50 flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Cerrar Ticket
              </h3>
              <button onClick={() => setShowCloseModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  Para cerrar el ticket <strong className="text-white">#{selectedTicket?.id}</strong>, por favor describe la solución aplicada.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Anotaciones para el cliente</label>
                  <textarea 
                    value={ticketSolution}
                    onChange={(e) => setTicketSolution(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0f1014] border border-[#1f2026] rounded-xl focus:outline-none focus:border-emerald-500 text-white text-xs h-24 resize-none"
                    placeholder="Describe las anotaciones para el cliente..."
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Anotaciones internas para el equipo de xtreme diagnostics</label>
                  <textarea 
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0f1014] border border-[#1f2026] rounded-xl focus:outline-none focus:border-emerald-500 text-white text-xs h-24 resize-none"
                    placeholder="Anotaciones internas (solo visibles para el equipo)..."
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-5 border-t border-[#1f2026] bg-[#0f1014]/50 flex gap-3">
              <button onClick={() => setShowCloseModal(false)} className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Cancelar</button>
              <button 
                onClick={handleClose} 
                disabled={!ticketSolution.trim()}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-30"
              >
                Finalizar y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Hidden PDF Template */}
      <div className="fixed -left-[2000px] top-0">
        <div id="ticket-pdf-template">
          {currentTicketData && (
            <TicketTemplate 
              ref={ticketTemplateRef}
              data={currentTicketData} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
