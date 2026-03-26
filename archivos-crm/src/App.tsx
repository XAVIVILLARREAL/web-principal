import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FolderOpen, Wand2, Search, Plus, Filter, 
  Trash2, Edit2, ChevronLeft, ChevronRight, FileText, 
  Image as ImageIcon, Video, Music, CheckCircle, 
  AlertCircle, Layout, User, Star, Package, 
  ChevronDown, X, Layers, Paperclip, Send, Loader2,
  Box, Archive, Sparkles, SlidersHorizontal, Zap,
  ArrowUp, ArrowDown, GripVertical, Bolt, Type,
  Sun, BadgeCheck, BarChart2, TrendingUp, Activity, MessageSquare, PieChart, MousePointerClick, UserMinus, MessageSquareText, Database, Save
} from 'lucide-react';

// --- CONFIGURACIÓN ---
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw_rBwKmUzVCkdVGF_0cZvAFHza2sxHig07FjnDclzgd4_FpsX5vPT4yVlsRkqtZ0Ejxg/exec";

const STOP_WORDS = new Set(['el','la','los','las','un','una','unos','unas','y','o','pero','si','no','en','a','de','para','con','por','su','sus','es','son','al','del','que','se','me','te','le','nos','os','les','mi','tu','como','más','mas','muy','mucho','poco','todo','nada','este','esta','estos','estas','ese','esa','esos','esas','aquel','aquella','aquellos','aquellas','hola','buenas','tardes','días','noches','gracias','favor']);

const removeAccents = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const extractKeywords = (t: string) => {
  if (!t) return [];
  return removeAccents(t.toLowerCase())
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
};

const WAPreview = ({ blocks, context }: { blocks: any[], context: any }) => {
  const getGreeting = () => {
    const mxTime = new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" });
    const hour = new Date(mxTime).getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getDayOfWeek = () => {
    const mxTime = new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" });
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return days[new Date(mxTime).getDay()];
  };

  const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

  return (
    <div className="flex w-full lg:w-[260px] bg-[#efeae2] flex-col shrink-0 relative border-l border-slate-300/50 h-[400px] lg:h-full shadow-inner rounded-2xl lg:rounded-none overflow-hidden">
      {/* WA Header */}
      <div className="bg-[#075e54] text-white px-3 py-2 flex items-center gap-2 shadow-md z-10 shrink-0">
        <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden">
          <User className="text-slate-400 text-lg mt-1" size={16} />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-xs leading-tight">Vista Previa</span>
          <span className="text-[9px] text-green-100">en línea</span>
        </div>
      </div>
      
      {/* WA Chat Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: "200px"}}></div>
      
      {/* WA Messages Container */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1 z-10">
        {blocks.map((block, i) => {
          let text = block.text || '';
          text = text.replace(/{{cliente}}/gi, context.contactName || "Juan Pérez")
                     .replace(/{{email}}/gi, context.contactEmail || "juan@ejemplo.com")
                     .replace(/{{telefono}}/gi, context.contactPhone || "+52 55 1234 5678")
                     .replace(/{{agente}}/gi, context.agentName || "Agente Demo")
                     .replace(/{{canal}}/gi, context.inboxName || "WhatsApp")
                     .replace(/{{saludo}}/gi, getGreeting())
                     .replace(/{{dia}}/gi, getDayOfWeek());

          if (!block.fileId && !text.trim()) return null;

          return (
            <div key={i} className="wa-bubble wa-bubble-out animate-fade-in-up text-[11px]">
              {block.fileId && (
                <div className="mb-1">
                  {block.fileType === 'image' || block.fileType === 'video' ? (
                    <div className="w-full h-24 bg-slate-200 rounded flex items-center justify-center overflow-hidden relative">
                      <img src={block.thumbnail} className="w-full h-full object-cover opacity-80" />
                      {block.fileType === 'video' && <Video className="absolute text-white drop-shadow-md" size={24} />}
                    </div>
                  ) : block.fileType === 'audio' ? (
                    <div className="w-full bg-slate-100 rounded p-1.5 flex items-center gap-1.5">
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white shrink-0">
                        <Music size={10} />
                      </div>
                      <div className="flex-1 h-1 bg-slate-300 rounded-full">
                        <div className="w-1/3 h-full bg-purple-500 rounded-full"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full bg-slate-100 rounded p-1.5 flex items-center gap-1.5 border border-slate-200">
                      <FileText className="text-rose-500 shrink-0" size={14} />
                      <span className="text-[10px] font-bold truncate">Archivo adjunto</span>
                    </div>
                  )}
                </div>
              )}
              {text && <div className="whitespace-pre-wrap leading-snug">{text}</div>}
              <span className="wa-time text-[9px]">{timeStr} <CheckCircle size={8} className="inline text-blue-400 ml-0.5" /></span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function App() {
  // --- ESTADOS ---
  const [activeTab, setActiveTab] = useState('templates');
  const [draggedTemplate, setDraggedTemplate] = useState<any | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [driveItems, setDriveItems] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [flatFilesCache, setFlatFilesCache] = useState<any[]>([]);
  const [folderHistory, setFolderHistory] = useState<any[]>([]);
  const [currentFolder, setCurrentFolder] = useState({ id: null as string | null, name: 'Directorio Raíz' });
  
  const [loading, setLoading] = useState(true);
  const [sendingState, setSendingState] = useState('idle'); 
  const [toast, setToast] = useState<{title: string, msg: string, ok: boolean} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [activeFilters, setActiveFilters] = useState({
    owner: 'todos',
    category: 'todas',
    type: 'todos',
    sortBy: 'uses'
  });

  const [context, setContext] = useState({ 
    accountId: null as string | null, 
    conversationId: null as string | null,
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    agentName: '',
    inboxName: '',
    accessToken: '',
    chatwootUrl: ''
  });
  const [rawContextData, setRawContextData] = useState<any>(null);
  const [lastCustomerMsg, setLastCustomerMsg] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounter = useRef(0);
  const [ceoApprovedIds, setCeoApprovedIds] = useState<Set<string>>(new Set());
  const [passPrompt, setPassPrompt] = useState<string | null>(null);
  const [passValue, setPassValue] = useState('');

  const syncApprovalsToCloud = async (newApproved: Set<string>) => {
    const arr = Array.from(newApproved);
    localStorage.setItem('ceo_approved_ids', JSON.stringify(arr));
    try {
      const formData = new URLSearchParams();
      formData.append('action', 'saveApprovals');
      formData.append('data', JSON.stringify(arr));
      await fetch(SCRIPT_URL, { method: 'POST', body: formData, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    } catch (e) {
      console.error("Error saving approvals to cloud", e);
    }
  };

  const handleCEOApproval = (id: string) => {
    if (passValue === "Javi1220") {
      const newApproved = new Set<string>(ceoApprovedIds);
      if (newApproved.has(id)) {
        newApproved.delete(id);
      } else {
        newApproved.add(id);
      }
      setCeoApprovedIds(newApproved);
      
      // Persistir en la nube (Apps Script) y localmente
      syncApprovalsToCloud(newApproved);
      
      showToast("Seguridad", "Estado de aprobación actualizado", true);
      setPassPrompt(null);
      setPassValue('');
    } else {
      showToast("Error", "Clave de CEO incorrecta", false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const tplId = e.dataTransfer.getData('text');
    const tpl = templates.find(t => t.id === tplId);
    if (tpl) {
      executeSendBlocks(tpl);
    }
  };
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [tplForm, setTplForm] = useState({ name: '', owner: 'Agente', category: 'General', blocks: [{ text: '', fileId: '', thumbnail: '', fileType: 'none' }] });
  const [hoverPreview, setHoverPreview] = useState<{url: string, x: number, y: number} | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [chatwootStats, setChatwootStats] = useState<{
    totalSends: number;
    avgResponseRate: number;
    templateStats: Record<string, { uses: number, responses: number, agents: Record<string, number> }>;
    agentStats: Record<string, number>;
    ghostingRate: number;
    topKeywords: {word: string, count: number}[];
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // --- PERSISTENCIA NUBE (APPS SCRIPT) ---
  const fetchSettingsData = async () => {
    try {
      const res = await fetch(`${SCRIPT_URL}?action=getSettings`);
      const data = await res.json();
      if (data.success) {
        if (data.approvals) {
          setCeoApprovedIds(new Set<string>(data.approvals));
          localStorage.setItem('ceo_approved_ids', JSON.stringify(data.approvals));
        }
        if (data.filters) {
          setActiveFilters(prev => ({ ...prev, ...data.filters }));
          localStorage.setItem('user_filters', JSON.stringify(data.filters));
        }
      }
    } catch (e) {
      console.error("Error fetching settings from cloud", e);
    }
  };

  useEffect(() => {
    // Cargar desde caché local primero para UI instantánea
    const localApprovals = localStorage.getItem('ceo_approved_ids');
    if (localApprovals) {
      try { setCeoApprovedIds(new Set<string>(JSON.parse(localApprovals))); } catch (e) {}
    }
    const localFilters = localStorage.getItem('user_filters');
    if (localFilters) {
      try { setActiveFilters(prev => ({ ...prev, ...JSON.parse(localFilters) })); } catch (e) {}
    }
    
    // Luego sincronizar con la nube
    fetchSettingsData();
  }, []);

  const syncFiltersToCloud = async (filters: any) => {
    localStorage.setItem('user_filters', JSON.stringify(filters));
    try {
      const formData = new URLSearchParams();
      formData.append('action', 'saveFilters');
      formData.append('data', JSON.stringify(filters));
      await fetch(SCRIPT_URL, { method: 'POST', body: formData, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    } catch (e) {
      console.error("Error saving filters to cloud", e);
    }
  };

  // Sincronizar filtros cuando cambian (con debounce simple para no saturar)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      syncFiltersToCloud(activeFilters);
    }, 1000);
    return () => clearTimeout(timer);
  }, [activeFilters]);

  // --- LÓGICA CHATWOOT (CACHÉ) ---
  useEffect(() => {
    const handlePostMessage = (event: MessageEvent) => {
      try {
        let data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        // Ignorar mensajes que no son de Chatwoot
        if (!data || (typeof data !== 'object')) return;

        // Solo loguear eventos relevantes para no saturar
        if (data.event === "appContext") {
          console.log("[DEBUG] appContext recibido de:", event.origin);
          console.log("[DEBUG] Estructura de data:", JSON.stringify(data, null, 2));
          
          const newConvId = data.data?.conversation?.id || data.data?.id;
          const newAccId = data.data?.conversation?.account_id || data.data?.account?.id;
          
          const contact = data.data?.conversation?.meta?.sender || data.data?.contact || {};
          const assignee = data.data?.conversation?.meta?.assignee || data.data?.current_user || {};
          const inbox = data.data?.conversation?.inbox || {};
          
          // Búsqueda exhaustiva del token
          let token = data.token || 
                        data.data?.token || 
                        data.data?.current_user?.access_token || 
                        data.data?.accessToken || 
                        data.data?.current_user?.token || 
                        data.data?.current_user?.api_access_token ||
                        data.data?.api_access_token || '';
          
          if (!token) {
            const urlParams = new URLSearchParams(window.location.search);
            token = urlParams.get('token') || urlParams.get('access_token') || '';
          }
          
          if (token) {
            console.log("[DEBUG] Token detectado exitosamente");
          } else {
            console.warn("[DEBUG] Token NO encontrado. Intentando buscar en todas las propiedades...");
            // Búsqueda recursiva simple para el detective
            const findToken = (obj: any): string | null => {
              if (!obj || typeof obj !== 'object') return null;
              for (const key in obj) {
                if (key.toLowerCase().includes('token') && typeof obj[key] === 'string' && obj[key].length > 10) return obj[key];
                const found = findToken(obj[key]);
                if (found) return found;
              }
              return null;
            };
            token = findToken(data) || '';
            if (token) console.log("[DEBUG] Token encontrado mediante búsqueda recursiva");
          }

          setRawContextData(data);

          setContext({ 
            accountId: newAccId, 
            conversationId: newConvId,
            contactName: contact.name || 'Cliente',
            contactEmail: contact.email || '',
            contactPhone: contact.phone_number || '',
            agentName: assignee.name || 'Agente',
            inboxName: inbox.name || 'nuestro equipo',
            accessToken: token,
            chatwootUrl: event.origin && event.origin !== 'null' ? event.origin : 'https://crm.xtremediagnostics.com'
          });

          const messages = data.data?.conversation?.messages;
          if (messages?.length > 0) {
            const last = messages[messages.length - 1];
            if (last.message_type === 1 && last.content?.trim().startsWith('.')) {
              handleAutoCommand(last.content.trim());
            }
            if (last.message_type === 0 && last.content) setLastCustomerMsg(last.content.toLowerCase());
          }
        }
      } catch (e) {
        console.error("[DEBUG] Error procesando postMessage:", e);
      }
    };
    window.addEventListener("message", handlePostMessage);
    return () => window.removeEventListener("message", handlePostMessage);
  }, [templates]);

  // --- CARGA DE DATOS ---
  useEffect(() => {
    // Load from cache first for instant UI
    const cached = localStorage.getItem('xtreme_templates_cache');
    if (cached) {
      try { setTemplates(JSON.parse(cached)); } catch(e) {}
    }
    fetchTemplatesData();
    fetchDriveData(null, "Directorio Raíz");
  }, []);

  const fetchTemplatesData = async () => {
    try {
      const res = await fetch(`${SCRIPT_URL}?action=getTemplates`);
      const data = await res.json();
      if (data.success) {
        const parsed = (data.templates || []).map((t: any) => ({
          ...t,
          useCount: t.useCount || 0,
          blocks: t.blocks || [{ text: t.text || '', fileId: t.fileId || '', fileType: t.fileType || 'none', thumbnail: t.thumbnail || '' }]
        }));
        setTemplates(parsed);
        localStorage.setItem('xtreme_templates_cache', JSON.stringify(parsed));
      }
    } catch (e) {}
  };

  const fetchDriveData = async (folderId: string | null, folderName: string) => {
    setLoading(true);
    try {
      let url = `${SCRIPT_URL}?action=getFiles`;
      if (folderId) url += `&folderId=${folderId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setDriveItems(data.items);
        setCurrentFolder({ id: folderId, name: folderName || 'Drive Raíz' });
        setFlatFilesCache(prev => {
          const newFiles = data.items.filter((i: any) => !i.isFolder);
          const map = new Map([...prev, ...newFiles].map(f => [f.id, f]));
          return Array.from(map.values());
        });
      }
    } catch (e) {}
    setLoading(false);
  };

  const fetchChatwootStats = async () => {
    if (!context.accessToken || !context.accountId || !context.chatwootUrl) {
      showToast("Error", "Faltan credenciales de Chatwoot (Token/URL)", false);
      return;
    }
    
    setStatsLoading(true);
    try {
      const res = await fetch(`${context.chatwootUrl}/api/v1/accounts/${context.accountId}/conversations?status=all`, {
        headers: { api_access_token: context.accessToken }
      });
      const data = await res.json();
      
      // Filtrar conversaciones de los últimos 100 días
      const hundredDaysAgo = Math.floor(Date.now() / 1000) - (100 * 24 * 60 * 60);
      const conversations = (data.data?.payload || []).filter((c: any) => c.timestamp > hundredDaysAgo);
      
      let templateStats: Record<string, { uses: number, responses: number, agents: Record<string, number> }> = {};
      let agentStats: Record<string, number> = {};
      let totalSends = 0;
      let totalResponses = 0;
      let ghostedCount = 0;
      let repliedConversationsCount = 0;
      let wordCounts: Record<string, number> = {};
      const stopWords = new Set(['para', 'como', 'pero', 'este', 'esta', 'hola', 'buenas', 'tardes', 'dias', 'gracias', 'quiero', 'necesito', 'favor', 'porque', 'cuando', 'donde', 'quien', 'solo', 'tiene', 'tienen', 'buen', 'día', 'dia', 'estoy', 'puedo', 'hacer', 'sobre', 'muchas', 'nada', 'todo', 'bien', 'algo', 'pues', 'bueno', 'hasta', 'desde', 'muy', 'más', 'mas', 'qué', 'que', 'con', 'por', 'del', 'los', 'las', 'una', 'uno', 'unos', 'unas', 'son', 'sus', 'nos', 'eso', 'esto', 'aquí', 'aqui', 'así', 'asi', 'ustedes', 'usted', 'nosotros', 'ellos', 'ellas', 'mis', 'tus', 'sus', 'te', 'me', 'se', 'le', 'les', 'lo', 'la', 'saludos', 'buenos']);

      templates.forEach(t => {
        templateStats[t.id] = { uses: 0, responses: 0, agents: {} };
      });

      const fetchMessagesPromises = conversations.map((c: any) => 
        fetch(`${context.chatwootUrl}/api/v1/accounts/${context.accountId}/conversations/${c.id}/messages`, {
          headers: { api_access_token: context.accessToken }
        }).then(r => r.json()).catch(() => null)
      );
      
      const messagesResults = await Promise.all(fetchMessagesPromises);
      
      messagesResults.forEach((msgData) => {
        if (!msgData || !msgData.payload) return;
        const messages = msgData.payload.sort((a: any, b: any) => a.created_at - b.created_at);
        
        // Ghosting Analysis
        const chatMessages = messages.filter((m: any) => m.message_type === 0 || m.message_type === 1);
        if (chatMessages.length > 0) {
          const hasAgentReply = chatMessages.some((m: any) => m.message_type === 1);
          if (hasAgentReply) {
            repliedConversationsCount++;
            const lastMessage = chatMessages[chatMessages.length - 1];
            if (lastMessage.message_type === 1) {
              ghostedCount++;
            }
          }
        }

        // Keywords Analysis
        const clientMessages = messages.filter((m: any) => m.message_type === 0 && m.content);
        clientMessages.forEach((m: any) => {
          const text = m.content.toLowerCase().replace(/[^\w\sáéíóúñü]/gi, '');
          const words = text.split(/\s+/);
          words.forEach((w: string) => {
            if (w.length > 3 && !stopWords.has(w)) {
              wordCounts[w] = (wordCounts[w] || 0) + 1;
            }
          });
        });

        for (let i = 0; i < messages.length; i++) {
          const msg = messages[i];
          if (msg.message_type === 1) { // Outgoing (Agent)
            // Check if this message matches any template
            const matchedTemplate = templates.find(t => {
              const firstTextBlock = t.blocks.find((b: any) => b.text && b.text.trim().length > 0);
              if (!firstTextBlock) return false;
              
              // Remove variables for matching
              const cleanTpl = firstTextBlock.text.replace(/{{.*?}}/g, '').trim().substring(0, 40);
              return msg.content && msg.content.includes(cleanTpl);
            });
            
            if (matchedTemplate) {
              const tId = matchedTemplate.id;
              const agentName = msg.sender?.name || 'Desconocido';
              
              templateStats[tId].uses += 1;
              templateStats[tId].agents[agentName] = (templateStats[tId].agents[agentName] || 0) + 1;
              agentStats[agentName] = (agentStats[agentName] || 0) + 1;
              totalSends += 1;
              
              // Check if there is a subsequent customer message
              const hasReply = messages.slice(i + 1).some((m: any) => m.message_type === 0);
              if (hasReply) {
                templateStats[tId].responses += 1;
                totalResponses += 1;
              }
            }
          }
        }
      });
      
      const sortedKeywords = Object.entries(wordCounts)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);

      setChatwootStats({
        totalSends,
        avgResponseRate: totalSends > 0 ? Math.round((totalResponses / totalSends) * 100) : 0,
        templateStats,
        agentStats,
        ghostingRate: repliedConversationsCount > 0 ? Math.round((ghostedCount / repliedConversationsCount) * 100) : 0,
        topKeywords: sortedKeywords
      });
      showToast("Éxito", "Estadísticas actualizadas desde Chatwoot", true);
    } catch (error) {
      console.error("Error fetching Chatwoot data:", error);
      showToast("Error", "No se pudieron obtener datos de Chatwoot", false);
    }
    setStatsLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'dashboard' && !chatwootStats && context.accessToken) {
      fetchChatwootStats();
    }
  }, [activeTab, context.accessToken]);

  const syncTemplatesToCloud = async (newTemplates: any[]) => {
    localStorage.setItem('xtreme_templates_cache', JSON.stringify(newTemplates));
    const formData = new URLSearchParams();
    formData.append('action', 'saveTemplates');
    formData.append('data', JSON.stringify(newTemplates));
    await fetch(SCRIPT_URL, { method: 'POST', body: formData, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  };

  // --- ACCIONES ---
  const handleAutoCommand = (text: string) => {
    const cmdName = text.substring(1).trim().toLowerCase();
    const tpl = templates.find(t => t.name.toLowerCase() === cmdName);
    if (tpl) {
      showToast("Comando", `Iniciando secuencia "${tpl.name}"`, true);
      executeSendBlocks(tpl);
    }
  };

  const executeSendBlocks = async (tplOrItem: any, isSingleFile = false) => {
    if (!ceoApprovedIds.has(tplOrItem.id)) {
      showToast("Seguridad", "Aprobación requerida. Contactar a Javier.", false);
      return;
    }
    if (!context.conversationId) {
      showToast("Error", "Abre un chat activo primero", false);
      console.error("[DEBUG] Error: conversationId no encontrado en el contexto.");
      return;
    }
    
    // Si falta el token, avisamos pero intentamos enviar de todos modos 
    // porque el script tiene un API_TOKEN de respaldo
    if (!context.accessToken) {
      console.warn("[DEBUG] Token de Chatwoot faltante, se usará el token maestro del script.");
    }

    setSendingState('sending');
    try {
      const rawBlocks = isSingleFile ? [{ fileId: tplOrItem.id, text: '' }] : tplOrItem.blocks;
      
      console.log("[DEBUG] Preparando envío para:", tplOrItem.name || "Archivo Individual");
      console.log("[DEBUG] Bloques originales:", rawBlocks);
      const getGreeting = () => {
        // Obtener la hora actual en la zona horaria de México (Ciudad de México)
        const mxTime = new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" });
        const hour = new Date(mxTime).getHours();
        
        if (hour < 12) return 'Buenos días';
        if (hour < 19) return 'Buenas tardes';
        return 'Buenas noches';
      };

      const getDayOfWeek = () => {
        const mxTime = new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" });
        const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        return days[new Date(mxTime).getDay()];
      };

      const processedBlocks = rawBlocks.map((b: any) => ({
        ...b,
        text: (b.text || '')
          .replace(/{{cliente}}/gi, context.contactName || 'Cliente')
          .replace(/{{email}}/gi, context.contactEmail || 'tu correo')
          .replace(/{{telefono}}/gi, context.contactPhone || 'tu número')
          .replace(/{{agente}}/gi, context.agentName || 'Agente')
          .replace(/{{canal}}/gi, context.inboxName || 'nuestro canal')
          .replace(/{{saludo}}/gi, getGreeting())
          .replace(/{{dia}}/gi, getDayOfWeek())
      }));

      const payload = { 
        accId: context.accountId, 
        convId: context.conversationId, 
        blocks: processedBlocks,
        accessToken: context.accessToken,
        chatwootUrl: context.chatwootUrl
      };
      
      console.log("[DEBUG] Enviando payload:", payload);
      
      let retries = 3;
      let success = false;
      let lastError = null;

      while (retries > 0 && !success) {
        try {
          console.log(`[DEBUG] Intento ${4 - retries} de 3...`);
          // Usamos GET en lugar de POST para evitar bloqueos de CORS en iframes
          const url = new URL(SCRIPT_URL);
          url.searchParams.append('action', 'sendBlocks');
          url.searchParams.append('data', JSON.stringify(payload));
          
          const res = await fetch(url.toString(), { 
            method: 'GET'
          });
          
          if (!res.ok) {
            throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
          }

          const data = await res.json();
          console.log("[DEBUG] Respuesta del servidor:", data);
          
          if (data.success) {
            success = true;
          } else {
            lastError = new Error(data.error || "Error en respuesta del servidor");
            console.warn("[DEBUG] Error del servidor:", data.error);
            retries--;
            if (retries > 0) await new Promise(r => setTimeout(r, 1500));
          }
        } catch (err: any) {
          console.error("[DEBUG] Error en fetch/parse:", err);
          lastError = err;
          retries--;
          if (retries > 0) await new Promise(r => setTimeout(r, 1500));
        }
      }
      
      if (success) {
        setSendingState('success');
        if (!isSingleFile) {
          const updated = templates.map(t => t.id === tplOrItem.id ? { ...t, useCount: t.useCount + 1 } : t);
          setTemplates(updated);
          syncTemplatesToCloud(updated);
        }
        setTimeout(() => setSendingState('idle'), 3000);
      } else {
        throw lastError || new Error("Fallo tras múltiples intentos");
      }
    } catch (e: any) {
      setSendingState('idle');
      const errorMsg = e?.message || "Fallo al enviar. Intenta de nuevo.";
      console.error("Error detallado al enviar:", e);
      
      // Mostrar mensaje más detallado si es posible
      const detailedMsg = e?.message ? `Error: ${e.message}` : "Error desconocido al transmitir";
      showToast("Error de Envío", detailedMsg.substring(0, 150), false);
    }
  };

  const deleteTemplate = (id: string) => {
    if(!confirm("¿Borrar secuencia permanentemente?")) return;
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    syncTemplatesToCloud(updated);
    showToast("Borrado", "Plantilla eliminada", true);
  };

  const showToast = (title: string, msg: string, ok: boolean) => {
    setToast({ title, msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const openFolder = (folder: any) => {
    setFolderHistory([...folderHistory, { id: currentFolder.id, name: currentFolder.name }]);
    fetchDriveData(folder.id, folder.name);
  };

  const goBack = () => {
    if (folderHistory.length === 0) return;
    const history = [...folderHistory];
    const prev = history.pop();
    setFolderHistory(history);
    fetchDriveData(prev.id, prev.name);
  };

  const [activeVarMenu, setActiveVarMenu] = useState<number | null>(null);

  const insertVariable = (index: number, variable: string) => {
    const newBlocks = [...tplForm.blocks];
    const currentText = newBlocks[index].text || '';
    const space = currentText.length > 0 && !currentText.endsWith(' ') ? ' ' : '';
    newBlocks[index].text = currentText + space + variable + ' ';
    setTplForm({...tplForm, blocks: newBlocks});
    setActiveVarMenu(null); // Cerrar menú después de insertar
  };

  const moveBlock = (index: number, direction: number) => {
    const newBlocks = [...tplForm.blocks];
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < newBlocks.length) {
      [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
      setTplForm({...tplForm, blocks: newBlocks});
    }
  };

  // --- FILTROS ---
  const ownersList = useMemo(() => ['todos', ...new Set(templates.map(t => t.owner).filter(Boolean))], [templates]);
  const categoriesList = useMemo(() => ['todas', ...new Set(templates.map(t => t.category).filter(Boolean))], [templates]);

  const filteredDriveItems = useMemo(() => {
    if (activeTab !== 'drive' || !searchQuery) return driveItems;
    const q = searchQuery.toLowerCase();
    return driveItems.filter(item => item.name.toLowerCase().includes(q));
  }, [driveItems, searchQuery, activeTab]);

  const filteredTemplates = useMemo(() => {
    let result = templates.filter(t => {
      const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.blocks.some((b: any) => b.text.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchOwner = activeFilters.owner === 'todos' || t.owner === activeFilters.owner;
      const matchCategory = activeFilters.category === 'todas' || t.category === activeFilters.category;
      let matchType = true;
      if (activeFilters.type === 'texto') matchType = t.blocks.every((b: any) => !b.fileId);
      if (activeFilters.type === 'multimedia') matchType = t.blocks.some((b: any) => b.fileId);
      return matchSearch && matchOwner && matchCategory && matchType;
    });

    if (activeFilters.sortBy === 'uses') result.sort((a, b) => b.useCount - a.useCount);
    if (activeFilters.sortBy === 'stars') result.sort((a, b) => calculateDynamicStars(b.useCount) - calculateDynamicStars(a.useCount));
    if (activeFilters.sortBy === 'category') result.sort((a, b) => a.category.localeCompare(b.category));
    return result;
  }, [templates, searchQuery, activeFilters]);

  const calculateDynamicStars = (count: number) => {
    if (count > 50) return 5;
    if (count > 20) return 4;
    if (count > 10) return 3;
    if (count > 5) return 2;
    return count > 0 ? 1 : 0;
  };

  // IA RECOMENDACIONES AVANZADAS
  const smartRecommendation = useMemo(() => {
    if (!lastCustomerMsg || templates.length === 0) return null;
    const ck = extractKeywords(lastCustomerMsg);
    if (ck.length === 0) return null;
    let best = null; let max = 0; let matched = "";
    templates.forEach(t => {
      let score = 0;
      const nw = extractKeywords(t.name);
      const cw = extractKeywords(t.category);
      ck.forEach(k => {
        if (nw.includes(k)) { score += 3; matched = k; }
        if (cw.includes(k)) { score += 2; matched = k; }
      });
      if (score > max) { max = score; best = t; }
    });
    return max > 0 ? { tpl: best, word: matched } : null;
  }, [lastCustomerMsg, templates]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* TECH HEADER */}
      <header className="tech-border bg-white z-50 shrink-0 px-4 py-2 shadow-sm relative">
        {/* COMPACT TABS */}
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex gap-6">
            {[
              { id: 'drive', label: 'Drive', icon: FolderOpen },
              { id: 'templates', label: 'Plantillas', icon: Layers },
              { id: 'dashboard', label: 'Estadísticas', icon: BarChart2 },
              { id: 'debug', label: 'Pruebas', icon: Bolt }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-2 text-[11px] font-bold uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-tech-cyan' : 'text-tech-muted hover:text-tech-ink'}`}
              >
                <tab.icon size={14} />
                <span>{tab.label}</span>
                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 shadow-[0_0_8px_rgba(0,242,255,0.5)]" style={{ background: 'var(--color-tech-gradient-vibrant)' }} />}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tech-muted" size={14} />
              <input 
                type="text" 
                placeholder="Buscar en el sistema..."
                className="bg-slate-50 border border-tech-line rounded-md py-1.5 pl-9 pr-4 text-xs outline-none focus:border-tech-cyan transition-all w-48 lg:w-64 font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-md border transition-all ${showFilters ? 'bg-tech-accent text-white border-tech-accent' : 'bg-white border-tech-line text-tech-muted hover:border-tech-cyan'}`}
            >
              <SlidersHorizontal size={14} />
            </button>
            {activeTab === 'templates' && (
              <button 
                onClick={() => { setEditingTemplateId(null); setTplForm({ name: '', owner: 'Agente', category: 'General', blocks: [{ text: '', fileId: '', thumbnail: '', fileType: 'none' }] }); setIsModalOpen(true); }}
                className="text-slate-900 p-2 rounded-md hover:opacity-90 transition-all shadow-md flex items-center gap-1 px-3"
                style={{ background: 'var(--color-tech-gradient-vibrant)' }}
              >
                <Plus size={16} strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Nueva</span>
              </button>
            )}
          </div>
        </div>

        {/* PANEL DE FILTROS AVANZADOS (Desplegable) */}
        {showFilters && (activeTab === 'templates' || activeTab === 'dashboard') && (
          <div className="absolute top-full left-4 right-4 mt-2 p-4 bg-white tech-border rounded-lg shadow-xl flex flex-wrap gap-6 animate-fade-in z-[100]">
            <div className="flex flex-col gap-1.5">
              <label className="tech-header flex items-center gap-1.5"><User size={10}/> Autor</label>
              <select className="tech-input py-1 px-2 rounded min-w-[120px]" value={activeFilters.owner} onChange={(e) => setActiveFilters({...activeFilters, owner: e.target.value})}>
                {ownersList.map(o => <option key={o} value={o}>{String(o).toUpperCase()}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="tech-header flex items-center gap-1.5"><Sparkles size={10}/> Categoría</label>
              <select className="tech-input py-1 px-2 rounded min-w-[120px]" value={activeFilters.category} onChange={(e) => setActiveFilters({...activeFilters, category: e.target.value})}>
                {categoriesList.map(c => <option key={c} value={c}>{String(c).toUpperCase()}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="tech-header flex items-center gap-1.5"><Layers size={10}/> Formato</label>
              <div className="flex gap-1 bg-slate-50 p-1 rounded border border-tech-line">
                {['todos', 'texto', 'multimedia'].map(t => (
                  <button key={t} onClick={() => setActiveFilters({...activeFilters, type: t})} className={`px-3 py-1 rounded text-[9px] font-mono font-bold transition-all uppercase ${activeFilters.type === t ? 'bg-tech-accent text-tech-cyan' : 'text-tech-muted hover:text-tech-ink'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="tech-header flex items-center gap-1.5"><SlidersHorizontal size={10}/> Orden</label>
              <select className="tech-input py-1 px-2 rounded min-w-[100px]" value={activeFilters.sortBy} onChange={(e) => setActiveFilters({...activeFilters, sortBy: e.target.value})}>
                <option value="uses">USOS</option>
                <option value="stars">ESTRELLAS</option>
                <option value="category">A-Z</option>
              </select>
            </div>
          </div>
        )}
      </header>

      {/* CUERPO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-2 sm:p-5 relative" id="mainScroll">
        
        {/* COMPACT IA RECOMENDACIÓN */}
        {smartRecommendation && activeTab === 'templates' && (
          <div className="mb-4 p-3 bg-white border-l-4 border-l-tech-cyan tech-border rounded-md flex items-center justify-between shadow-sm animate-fade-in-up">
            <div className="flex items-center gap-3 min-w-0">
               <div className="w-8 h-8 rounded-md bg-tech-accent flex items-center justify-center text-tech-cyan shadow-sm flex-shrink-0">
                  <Zap fill="currentColor" size={16} />
               </div>
               <div className="min-w-0">
                  <h4 className="tech-header text-tech-cyan leading-none flex items-center gap-1.5">
                    IA Sugerencia: "{smartRecommendation.word}"
                  </h4>
                  <p className="text-xs font-bold text-tech-ink mt-1 truncate">{smartRecommendation.tpl.name}</p>
               </div>
            </div>
            <button 
              onClick={() => executeSendBlocks(smartRecommendation.tpl)} 
              className="text-white px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-sm active:scale-95"
              style={{ background: 'var(--color-tech-gradient-green)' }}
            >
              Ejecutar
            </button>
          </div>
        )}

        {/* VISTA DRIVE */}
        {activeTab === 'drive' && (
          <div className="flex flex-col gap-4 animate-fade-in">
             <div className="flex items-center gap-3 px-1">
              {folderHistory.length > 0 && (
                <button onClick={goBack} className="w-8 h-8 rounded bg-white tech-border flex items-center justify-center text-tech-cyan hover:bg-tech-accent transition-all shadow-sm">
                  <ChevronLeft size={16} strokeWidth={3} />
                </button>
              )}
              <h2 className="tech-header text-tech-ink text-xs">{currentFolder.name}</h2>
            </div>
            
            {loading ? (
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                  {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-white tech-border rounded-lg animate-pulse" />)}
               </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                {filteredDriveItems.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => item.isFolder && openFolder(item)}
                    onMouseEnter={(e) => !item.isFolder && setHoverPreview({ url: item.thumbnail, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setHoverPreview(null)}
                    onMouseMove={(e) => !item.isFolder && setHoverPreview(prev => prev ? {...prev, x: e.clientX, y: e.clientY} : null)}
                    className="tech-card rounded-lg p-3 flex flex-col items-center gap-3 group cursor-pointer relative"
                  >
                    <div className={`w-14 h-14 rounded-lg flex items-center justify-center shrink-0 shadow-inner overflow-hidden ${item.isFolder ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-tech-muted'}`}>
                      {item.isFolder ? (
                        <FolderOpen size={28} strokeWidth={2} />
                      ) : item.thumbnail ? (
                        <img src={item.thumbnail} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        renderFileIcon(item.type)
                      )}
                    </div>
                    <div className="flex flex-col items-center text-center min-w-0 w-full">
                      <span className="text-[11px] font-bold text-tech-ink truncate w-full group-hover:text-tech-cyan transition-colors">{item.name}</span>
                      <span className="tech-header text-[8px] mt-1">{item.isFolder ? 'Carpeta' : item.type}</span>
                    </div>
                    
                    {!item.isFolder && (
                      <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={(e) => { e.stopPropagation(); executeSendBlocks(item, true); }}
                          className={`w-7 h-7 rounded flex items-center justify-center transition-all shadow-md active:scale-90 border ${ceoApprovedIds.has(item.id) ? 'bg-tech-accent text-tech-cyan border-tech-cyan/20' : 'bg-slate-100 text-slate-400 border-slate-200'}`}
                          title={ceoApprovedIds.has(item.id) ? "Enviar" : "Requiere Aprobación"}
                        >
                          {ceoApprovedIds.has(item.id) ? <Send size={12} strokeWidth={3} /> : <BadgeCheck size={12} className="opacity-50" />}
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setPassPrompt(item.id); }}
                          className={`w-7 h-7 rounded flex items-center justify-center transition-all shadow-md border ${ceoApprovedIds.has(item.id) ? 'bg-tech-cyan text-white border-tech-cyan' : 'bg-white text-slate-400 border-slate-200 hover:text-tech-cyan'}`}
                          title="Aprobación Javier"
                        >
                          <Zap size={12} fill={ceoApprovedIds.has(item.id) ? "currentColor" : "none"} />
                        </button>
                        {item.webViewLink && (
                          <a 
                            href={item.webViewLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-tech-cyan shadow-md transition-all"
                            title="Ver Documento"
                          >
                            <MousePointerClick size={12} />
                          </a>
                        )}
                      </div>
                    )}
                    {item.isFolder && <ChevronRight className="absolute top-2 right-2 text-tech-line group-hover:text-tech-cyan group-hover:translate-x-1 transition-all" size={14} strokeWidth={3} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VISTA PLANTILLAS (CUADRICULA OPTIMIZADA) */}
        {activeTab === 'templates' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 animate-fade-in pb-48">
            {filteredTemplates.map((tpl, idx) => {
              const stars = calculateDynamicStars(tpl.useCount);
              const firstBlock = tpl.blocks[0];

              return (
                <div 
                  key={tpl.id}
                  draggable
                  onDragStart={(e) => { 
                    e.dataTransfer.setData('text', tpl.id);
                    setDraggedTemplate(tpl);
                  }}
                  onDragEnd={() => setDraggedTemplate(null)}
                  className="tech-card rounded-lg flex flex-col overflow-hidden group animate-fade-in-up"
                  style={{ animationDelay: `${(idx % 12) * 20}ms` }}
                >
                  <div className="w-full aspect-video shrink-0 bg-slate-50 relative flex items-center justify-center overflow-hidden border-b border-tech-line cursor-pointer"
                    onMouseEnter={(e) => {
                      const media = e.currentTarget.querySelector('video, audio') as HTMLMediaElement;
                      if (media) { media.currentTime = 0; media.play().catch(() => {}); }
                    }}
                    onMouseLeave={(e) => {
                      const media = e.currentTarget.querySelector('video, audio') as HTMLMediaElement;
                      if (media) { media.pause(); }
                    }}
                  >
                    {firstBlock?.thumbnail ? (
                      <img src={firstBlock.thumbnail} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
                    ) : (
                      <Archive size={24} className="text-slate-200" strokeWidth={1} />
                    )}
                    
                    {firstBlock?.fileType === 'video' && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center">
                        <video muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity" src={`https://drive.google.com/uc?export=download&id=${firstBlock.fileId}`} />
                        <div className="w-8 h-8 bg-tech-accent/80 rounded-full flex items-center justify-center text-tech-cyan z-20 group-hover:hidden shadow-lg"><Video size={14} /></div>
                      </div>
                    )}
                    {firstBlock?.fileType === 'audio' && (
                       <div className="absolute inset-0 z-10 flex items-center justify-center">
                        <audio loop className="hidden" src={`https://drive.google.com/uc?export=download&id=${firstBlock.fileId}`} />
                        <div className="w-8 h-8 bg-tech-accent/80 rounded-full flex items-center justify-center text-tech-cyan z-20 group-hover:bg-tech-cyan group-hover:text-tech-accent transition-colors shadow-lg"><Music size={14} /></div>
                      </div>
                    )}

                    <div className="absolute top-2 right-2 z-30 flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-tech-line rounded px-1.5 py-0.5 shadow-sm">
                      <Star size={8} className="text-amber-500 fill-amber-500" />
                      <span className="tech-value text-[9px] text-tech-ink">{stars}</span>
                    </div>

                    <div className="absolute top-2 left-2 z-30 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={(e) => { e.stopPropagation(); setEditingTemplateId(tpl.id); setTplForm(tpl); setIsModalOpen(true); }} className="w-7 h-7 bg-white rounded shadow-md flex items-center justify-center text-tech-muted hover:text-tech-cyan border border-tech-line transition-all"><Edit2 size={12} strokeWidth={3} /></button>
                      <button onClick={(e) => { e.stopPropagation(); deleteTemplate(tpl.id); }} className="w-7 h-7 bg-white rounded shadow-md flex items-center justify-center text-tech-muted hover:text-rose-500 border border-tech-line transition-all"><Trash2 size={12} strokeWidth={3} /></button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setPassPrompt(tpl.id); }} 
                        className={`w-7 h-7 rounded shadow-md flex items-center justify-center border transition-all ${ceoApprovedIds.has(tpl.id) ? 'bg-tech-cyan text-white border-tech-cyan' : 'bg-white text-slate-400 border-tech-line hover:text-tech-cyan'}`}
                        title="Aprobación Javier"
                      >
                        <Zap size={12} fill={ceoApprovedIds.has(tpl.id) ? "currentColor" : "none"} />
                      </button>
                    </div>

                    {tpl.blocks.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-tech-accent/90 text-tech-cyan text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm flex items-center gap-1 border border-tech-cyan/20">
                        <Layers size={10} />
                        {tpl.blocks.length}
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex flex-col flex-1 bg-white justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-xs font-bold text-tech-ink line-clamp-1 group-hover:text-tech-cyan uppercase tracking-tight transition-colors leading-tight">{tpl.name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-bold text-tech-muted uppercase tracking-widest">{tpl.category}</span>
                        <div className="flex gap-0.5">
                          {tpl.blocks.slice(0, 4).map((b: any, idx: number) => (
                            <div key={idx} className="w-1 h-1 rounded-full bg-tech-line group-hover:bg-tech-cyan/50 transition-colors" />
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => executeSendBlocks(tpl)}
                      disabled={!ceoApprovedIds.has(tpl.id)}
                      className={`w-full py-1.5 text-[9px] font-bold uppercase tracking-widest rounded shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 ${ceoApprovedIds.has(tpl.id) ? 'text-white hover:opacity-90' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                      style={ceoApprovedIds.has(tpl.id) ? { background: 'var(--color-tech-gradient-blue)' } : {}}
                    >
                      <span>{ceoApprovedIds.has(tpl.id) ? 'Transmitir' : 'Bloqueado'}</span>
                      {ceoApprovedIds.has(tpl.id) ? <Send size={10} strokeWidth={3} /> : <BadgeCheck size={10} />}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {/* VISTA DASHBOARD ESTADÍSTICAS */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-6 animate-fade-in pb-20">
            {/* TECH HEADER STATS */}
            <div className="tech-card p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-tech-cyan/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              <div className="relative z-10 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="tech-header">
                    <Activity size={20} className="text-tech-cyan" />
                    Rendimiento de Plantillas
                  </div>
                  <button 
                    onClick={fetchChatwootStats}
                    disabled={statsLoading}
                    className="text-slate-900 px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-md flex items-center gap-2"
                    style={{ background: 'var(--color-tech-gradient-vibrant)' }}
                  >
                    {statsLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                    Sincronizar Chatwoot
                  </button>
                </div>
                <p className="text-slate-500 font-medium text-sm mt-1">Analiza qué secuencias generan mayor impacto y qué agentes las utilizan más (Datos reales de Chatwoot).</p>
              </div>
              
              <div className="tech-grid mt-8">
                <div className="tech-grid-item relative group overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity" style={{ background: 'var(--color-tech-gradient-blue)' }} />
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Layers size={14}/> Total Plantillas</span>
                  <span className="tech-value" style={{ background: 'var(--color-tech-gradient-blue)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{filteredTemplates.length}</span>
                </div>
                <div className="tech-grid-item relative group overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity" style={{ background: 'var(--color-tech-gradient-green)' }} />
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Send size={14}/> Envíos Totales</span>
                  <span className="tech-value" style={{ background: 'var(--color-tech-gradient-green)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {chatwootStats ? chatwootStats.totalSends : filteredTemplates.reduce((acc, t) => acc + (t.useCount || 0), 0)}
                  </span>
                </div>
                <div className="tech-grid-item relative group overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity" style={{ background: 'var(--color-tech-gradient-vibrant)' }} />
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><MousePointerClick size={14}/> Tasa Promedio</span>
                  <span className="tech-value" style={{ background: 'var(--color-tech-gradient-vibrant)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {chatwootStats ? chatwootStats.avgResponseRate : (filteredTemplates.length > 0 ? Math.round(filteredTemplates.reduce((acc, t) => acc + ((t.useCount || 0) > 0 ? Math.min(100, 20 + (t.useCount * 5)) : 0), 0) / filteredTemplates.length) : 0)}%
                  </span>
                </div>
              </div>
              
              {/* NUEVAS MÉTRICAS: GHOSTING Y KEYWORDS */}
              {chatwootStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="tech-grid-item border-rose-100">
                    <span className="text-rose-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><UserMinus size={14}/> Tasa de Abandono</span>
                    <span className="tech-value text-rose-500">{chatwootStats.ghostingRate}%</span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">Sin respuesta al agente</span>
                  </div>
                  <div className="tech-grid-item md:col-span-2">
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><MessageSquareText size={14}/> Top Palabras Clave (Clientes)</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {chatwootStats.topKeywords.length > 0 ? (
                        chatwootStats.topKeywords.map((kw, idx) => (
                          <div key={idx} className="tech-badge flex items-center gap-1.5">
                            <span>{kw.word}</span>
                            <span className="bg-tech-ink/10 text-tech-ink text-[8px] px-1 rounded">
                              {kw.count}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">No hay suficientes datos.</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* TOP PLANTILLAS */}
              <div className="tech-card p-6">
                <h3 className="tech-header mb-6">
                  <TrendingUp size={18} className="text-tech-cyan" />
                  Top Plantillas (Eficiencia)
                </h3>
                
                <div className="flex flex-col gap-3">
                  {[...filteredTemplates]
                    .sort((a, b) => {
                      if (chatwootStats) {
                        const statA = chatwootStats.templateStats[a.id];
                        const statB = chatwootStats.templateStats[b.id];
                        const rateA = statA && statA.uses > 0 ? (statA.responses / statA.uses) : 0;
                        const rateB = statB && statB.uses > 0 ? (statB.responses / statB.uses) : 0;
                        return rateB - rateA;
                      }
                      const rateA = a.useCount > 0 ? Math.min(98, 45 + (a.useCount * 3) + (a.blocks.length * 2)) : 0;
                      const rateB = b.useCount > 0 ? Math.min(98, 45 + (b.useCount * 3) + (b.blocks.length * 2)) : 0;
                      return rateB - rateA;
                    })
                    .slice(0, 10)
                    .map((tpl, idx) => {
                      let responseRate = 0;
                      let uses = tpl.useCount || 0;
                      let topAgent = '';
                      
                      if (chatwootStats) {
                        const stat = chatwootStats.templateStats[tpl.id];
                        if (stat && stat.uses > 0) {
                          responseRate = Math.round((stat.responses / stat.uses) * 100);
                          uses = stat.uses;
                          if (Object.keys(stat.agents).length > 0) {
                            topAgent = Object.entries(stat.agents as Record<string, number>).sort((a, b) => b[1] - a[1])[0][0];
                          }
                        }
                      } else {
                        responseRate = tpl.useCount > 0 ? Math.min(98, 45 + (tpl.useCount * 3) + (tpl.blocks.length * 2)) : 0;
                      }
                      
                      return (
                        <div key={tpl.id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${idx === 0 ? 'bg-amber-50 text-amber-600' : idx === 1 ? 'bg-slate-100 text-slate-600' : idx === 2 ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                            #{idx + 1}
                          </div>
                          
                          <div className="flex-1 min-w-0 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800 truncate text-sm">{tpl.name}</span>
                              <span className="tech-badge">{responseRate}% Respuesta</span>
                            </div>
                            
                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <span className="flex items-center gap-1"><Send size={12}/> {uses} envíos</span>
                              <span className="flex items-center gap-1"><Layers size={12}/> {tpl.category}</span>
                              {topAgent && <span className="flex items-center gap-1 text-tech-cyan"><User size={12}/> {topAgent}</span>}
                            </div>
                            
                            <div className="w-full h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                              <div className="h-full bg-tech-cyan" style={{ width: `${responseRate}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  
                  {filteredTemplates.length === 0 && (
                    <div className="text-center py-10 text-slate-400 flex flex-col items-center gap-2">
                      <Archive size={32} className="opacity-20" />
                      <p className="text-sm font-medium">No hay plantillas que coincidan con los filtros.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* TOP AGENTES */}
              <div className="tech-card p-6">
                <h3 className="tech-header mb-6">
                  <User size={18} className="text-tech-cyan" />
                  Uso por Agente
                </h3>
                
                <div className="flex flex-col gap-3">
                  {chatwootStats && Object.keys(chatwootStats.agentStats).length > 0 ? (
                    Object.entries(chatwootStats.agentStats as Record<string, number>)
                      .sort((a, b) => b[1] - a[1])
                      .map(([agentName, count], idx) => (
                        <div key={agentName} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-black text-sm shrink-0">
                            {agentName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col gap-1">
                            <span className="font-bold text-slate-800 truncate text-sm">{agentName}</span>
                            <div className="w-full bg-slate-100 rounded-full h-1 mt-1">
                              <div className="bg-tech-cyan h-full rounded-full" style={{ width: `${Math.min(100, ((count as number) / chatwootStats.totalSends) * 100)}%` }}></div>
                            </div>
                          </div>
                          <div className="text-sm font-black text-slate-600">
                            {count as number} <span className="text-[10px] text-slate-400 uppercase">envíos</span>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-10 text-slate-400 flex flex-col items-center gap-2">
                      <BarChart2 size={32} className="opacity-20" />
                      <p className="text-sm font-medium">
                        {statsLoading ? "Cargando datos de agentes..." : "Sincroniza con Chatwoot para ver estadísticas de agentes."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VISTA PRUEBAS (DEBUG) */}
        {activeTab === 'debug' && (
          <div className="flex flex-col gap-6 animate-fade-in pb-20 p-6">
            <div className="tech-card p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-tech-cyan/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              <div className="relative z-10 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="tech-header">
                    <Bolt size={20} className="text-tech-cyan" />
                    Panel de Diagnóstico y Pruebas
                  </div>
                </div>
                <p className="text-slate-500 font-medium text-sm mt-1">Verifica la conexión con Chatwoot y Google Apps Script para resolver problemas de envío.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {/* ESTADO DEL CONTEXTO */}
                <div className="tech-grid-item flex flex-col gap-4">
                  <h3 className="text-xs font-black text-tech-ink uppercase tracking-widest border-b border-tech-line pb-2 flex items-center gap-2">
                    <User size={14} className="text-tech-cyan" /> Contexto de Chatwoot
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-tech-muted font-bold uppercase tracking-widest">ID Cuenta</span>
                      <span className={`font-mono ${context.accountId ? 'text-tech-ink' : 'text-rose-500'}`}>{context.accountId || 'Faltante'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-tech-muted font-bold uppercase tracking-widest">ID Conversación</span>
                      <span className={`font-mono ${context.conversationId ? 'text-tech-ink' : 'text-rose-500'}`}>{context.conversationId || 'Faltante'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-tech-muted font-bold uppercase tracking-widest">Token Acceso</span>
                      <span className={`font-mono ${context.accessToken ? 'text-tech-ink' : 'text-rose-500'}`}>{context.accessToken ? 'Presente (Oculto)' : 'Faltante'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-tech-muted font-bold uppercase tracking-widest">URL Chatwoot</span>
                      <span className={`font-mono ${context.chatwootUrl ? 'text-tech-ink' : 'text-rose-500'}`}>{context.chatwootUrl || 'Faltante'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-tech-muted font-bold uppercase tracking-widest">Agente</span>
                      <span className="font-mono text-tech-ink">{context.agentName || 'N/A'}</span>
                    </div>
                  </div>
                  {!context.conversationId && (
                    <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg text-[10px] text-rose-600 font-medium flex items-start gap-2">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <span>Para enviar plantillas, debes abrir este widget desde una conversación activa en Chatwoot.</span>
                    </div>
                  )}
                </div>

                {/* PRUEBA DE CONEXIÓN SCRIPT */}
                <div className="tech-grid-item flex flex-col gap-4">
                  <h3 className="text-xs font-black text-tech-ink uppercase tracking-widest border-b border-tech-line pb-2 flex items-center gap-2">
                    <Zap size={14} className="text-tech-cyan" /> Conectividad Backend
                  </h3>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] text-tech-muted font-bold uppercase tracking-widest">Google Apps Script URL</span>
                      <div className="bg-slate-50 p-2 rounded border border-tech-line text-[9px] font-mono break-all text-slate-500">
                        {SCRIPT_URL}
                      </div>
                    </div>
                    
                    <button 
                      onClick={async () => {
                        showToast("Prueba", "Verificando conexión...", true);
                        try {
                          const start = Date.now();
                          const res = await fetch(`${SCRIPT_URL}?action=getTemplates`);
                          const data = await res.json();
                          const end = Date.now();
                          if (data.success) {
                            showToast("Éxito", `Conexión establecida (${end - start}ms)`, true);
                          } else {
                            showToast("Error", `Script respondió con error: ${data.error}`, false);
                          }
                        } catch (e: any) {
                          showToast("Fallo Crítico", `No se pudo contactar al script: ${e.message}`, false);
                        }
                      }}
                      className="w-full py-2.5 rounded text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                      style={{ background: 'var(--color-tech-gradient-blue)' }}
                    >
                      <Activity size={14} /> Probar Conexión al Script
                    </button>

                    <div className="bg-tech-accent/20 border border-tech-cyan/20 p-3 rounded-lg text-[10px] text-tech-ink font-medium flex items-start gap-2">
                      <Sparkles size={14} className="shrink-0 mt-0.5 text-tech-cyan" />
                      <span>Si la conexión falla, verifica que el script esté publicado como "Web App" con acceso para "Anyone".</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RAW CONTEXT DATA DUMP */}
              <div className="mt-8 tech-grid-item border-amber-200">
                <div className="flex justify-between items-center border-b border-tech-line pb-2 mb-4">
                  <h3 className="text-xs font-black text-tech-ink uppercase tracking-widest flex items-center gap-2">
                    <Database size={14} className="text-amber-500" /> Datos Crudos de Chatwoot (Para Diagnóstico)
                  </h3>
                  <button 
                    onClick={() => {
                      if (rawContextData) {
                        navigator.clipboard.writeText(JSON.stringify(rawContextData, null, 2));
                        showToast("Copiado", "Datos de diagnóstico copiados al portapapeles", true);
                      }
                    }}
                    className="text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 px-3 py-1 rounded hover:bg-amber-200 transition-colors"
                  >
                    Copiar JSON
                  </button>
                </div>
                <div className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-[10px] text-amber-400 font-mono leading-relaxed">
                    {rawContextData ? JSON.stringify(rawContextData, null, 2) : 'Esperando datos de Chatwoot... (Abre un chat)'}
                  </pre>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 italic">
                  Busca aquí el campo "access_token" o similar. Si no está, Chatwoot no lo está enviando.
                </p>
              </div>

              {/* LOGS RECIENTES */}
              <div className="mt-8 tech-grid-item">
                <h3 className="text-xs font-black text-tech-ink uppercase tracking-widest border-b border-tech-line pb-2 mb-4 flex items-center gap-2">
                  <MessageSquare size={14} className="text-tech-cyan" /> Instrucciones de Depuración
                </h3>
                <div className="bg-slate-900 p-4 rounded-lg text-green-400 font-mono text-[10px] leading-relaxed">
                  <p className="mb-2 text-tech-cyan font-bold">// PASOS PARA DIAGNOSTICAR:</p>
                  <p>1. Abre la consola del navegador (F12 o Clic Derecho {'>'} Inspeccionar {'>'} Console).</p>
                  <p>2. Busca mensajes que comiencen con <span className="text-white">[DEBUG]</span>.</p>
                  <p>3. Intenta enviar una plantilla y observa el "Respuesta del servidor".</p>
                  <p>4. Si ves "HTTP Error: 401", el token de Chatwoot ha expirado.</p>
                  <p>5. Si ves "CORS Error", el script no permite peticiones desde este dominio.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* DROP ZONE BARRA DE ARRASTRE */}
      {(activeTab === 'templates' || activeTab === 'drive') && (
        <div 
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter.current++;
            if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
              setIsDraggingOver(true);
            }
          }}
          onDragOver={(e) => { 
            e.preventDefault(); 
            e.stopPropagation();
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter.current--;
            if (dragCounter.current === 0) {
              setIsDraggingOver(false);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter.current = 0;
            setIsDraggingOver(false);
            handleDrop(e);
          }}
          className={`fixed bottom-0 left-0 right-0 z-[60] transition-all duration-300 flex items-center justify-center p-4 ${isDraggingOver ? 'h-48 bg-tech-cyan/20 backdrop-blur-xl border-t-4 border-tech-cyan' : 'h-28 bg-white/90 backdrop-blur-md border-t border-tech-line shadow-[0_-10px_30px_rgba(0,0,0,0.05)]'}`}
        >
          {draggedTemplate && (
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-tech-cyan text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce pointer-events-none">
              <FileText size={20} />
              <span className="font-bold whitespace-nowrap">{draggedTemplate.name}</span>
            </div>
          )}
          <div className={`flex items-center gap-6 px-12 py-6 rounded-[2rem] border-2 border-dashed transition-all pointer-events-none ${isDraggingOver ? 'border-tech-cyan bg-tech-cyan/10 scale-105 shadow-[0_0_40px_rgba(0,242,255,0.2)]' : 'border-tech-line bg-slate-50/50'}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${isDraggingOver ? 'bg-tech-cyan text-white animate-bounce' : 'bg-tech-accent text-tech-cyan'}`}>
              <Send size={28} strokeWidth={3} />
            </div>
            <div className="flex flex-col">
              <span className={`text-lg font-black uppercase tracking-tighter transition-all ${isDraggingOver ? 'text-tech-cyan scale-110' : 'text-tech-ink'}`}>
                {isDraggingOver ? '¡Suelta para transmitir!' : 'Arrastra secuencia aquí para enviar'}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${isDraggingOver ? 'bg-tech-cyan animate-ping' : 'bg-tech-green'}`} />
                <span className="text-[11px] font-bold text-tech-muted uppercase tracking-widest opacity-70">
                  {isDraggingOver ? 'Detectando plantilla...' : 'Zona de disparo rápido // Instant Send'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONSTRUCTOR PRO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-[100] backdrop-blur-xl flex flex-col justify-end lg:justify-center lg:p-12 animate-fade-in">
          <div className="bg-white lg:bg-slate-900 w-full lg:max-w-7xl lg:mx-auto h-[96vh] lg:h-[85vh] rounded-t-3xl lg:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-fade-in-up border-t-4 lg:border-t-0 lg:border border-tech-cyan/30 lg:shadow-tech-cyan/10">
             <div className="px-4 py-4 lg:px-12 lg:py-8 border-b border-slate-100 lg:border-slate-800 flex items-center justify-between bg-white lg:bg-slate-900/50">
               <div className="flex items-center gap-2 lg:gap-4">
                 <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-tech-cyan/20" style={{ background: 'var(--color-tech-gradient-vibrant)' }}><Layout size={18} className="lg:w-7 lg:h-7" /></div>
                 <div>
                   <h2 className="text-sm lg:text-3xl font-black text-slate-800 lg:text-white uppercase tracking-tighter leading-tight">
                     {editingTemplateId ? 'Editar Plantilla' : 'Creación de plantilla'}
                   </h2>
                   <div className="flex items-center gap-2 mt-0.5 lg:mt-1.5">
                     <div className="hidden lg:block w-2 h-2 rounded-full bg-tech-green animate-pulse" />
                     <p className="text-[8px] lg:text-[11px] font-bold text-slate-400 lg:text-slate-500 uppercase tracking-widest">System v2.5 // Multimedia Advanced Config</p>
                   </div>
                 </div>
               </div>
               <div className="flex items-center gap-4">
                 <div className="hidden lg:flex flex-col items-end px-4 border-r border-slate-800">
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Session ID</span>
                   <span className="text-[11px] font-mono text-tech-cyan font-bold">#WA-{Date.now().toString().slice(-6)}</span>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 lg:w-14 lg:h-14 rounded-full bg-white lg:bg-slate-800 border border-slate-200 lg:border-slate-700 flex items-center justify-center text-slate-400 lg:text-slate-500 hover:text-rose-500 transition-all shadow-lg lg:shadow-2xl hover:scale-110 active:scale-90 shrink-0">
                   <X size={20} className="lg:w-7 lg:h-7" strokeWidth={3} />
                 </button>
               </div>
             </div>

             <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
               <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 border-r border-slate-200/50 bg-slate-50/30 relative">
                 <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                    
                    {/* COLUMNA IZQUIERDA: METADATOS */}
                    <div className="lg:col-span-4 space-y-4 sm:space-y-6">
                       <div className="p-4 sm:p-6 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm">
                         <label className="block text-[9px] sm:text-[11px] font-black text-slate-400 mb-1 sm:mb-2 uppercase tracking-widest">Comando Rápido (.Nombre)</label>
                         <div className="relative">
                            <input 
                              className="tech-input w-full px-4 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-black bg-slate-50 focus:bg-white transition-colors"
                              placeholder="Ej: CatDiesel"
                              value={tplForm.name}
                              onChange={e => setTplForm({...tplForm, name: e.target.value})}
                            />
                            <Bolt className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-tech-cyan/50 animate-pulse" size={16} />
                         </div>
                         <p className="text-[8px] sm:text-[10px] text-slate-400 font-bold mt-2 sm:mt-4 leading-relaxed opacity-70 italic font-medium">Usa <b>.{tplForm.name || 'Nombre'}</b> en el chat para disparar la secuencia.</p>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-3 sm:gap-4">
                         <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1 sm:space-y-2 text-center">
                           <label className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</label>
                           <input className="tech-input w-full px-3 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-xs font-bold text-center uppercase bg-slate-50 focus:bg-white transition-colors" value={tplForm.category} onChange={e => setTplForm({...tplForm, category: e.target.value})} />
                         </div>
                         <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1 sm:space-y-2 text-center">
                           <label className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Creador</label>
                           <input className="tech-input w-full px-3 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-xs font-bold text-center uppercase bg-slate-50 focus:bg-white transition-colors" value={tplForm.owner} onChange={e => setTplForm({...tplForm, owner: e.target.value})} />
                         </div>
                       </div>
                    </div>

                    {/* COLUMNA DERECHA: BLOQUES */}
                    <div className="lg:col-span-8 space-y-4 sm:space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3 sm:pb-4">
                         <h4 className="tech-header flex items-center gap-2 text-slate-700">
                           <Layers size={18} className="text-tech-cyan" />
                           Estructura de Bloques
                         </h4>
                         <button 
                          onClick={() => setTplForm({...tplForm, blocks: [...tplForm.blocks, { text: '', fileId: '', thumbnail: '', fileType: 'none' }]})}
                          className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-md hover:opacity-90 transition-all flex items-center gap-2"
                          style={{ background: 'var(--color-tech-gradient-vibrant)' }}
                         >
                           <Plus size={14} strokeWidth={4} /> Añadir Bloque
                         </button>
                      </div>

                      <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-24">
                        {tplForm.blocks.map((block, i) => (
                          <div key={i} className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 relative group/block shadow-sm hover:shadow-md transition-all animate-fade-in-up">
                            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5 border-b border-slate-100 pb-4">
                               <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center text-white text-xs sm:text-sm font-black shadow-md" style={{ background: 'var(--color-tech-gradient-blue)' }}>{i+1}</div>
                               <span className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest">Bloque Multimedia</span>
                               
                               <div className="ml-auto flex items-center gap-1.5 sm:gap-2 opacity-100 sm:opacity-0 group-hover/block:opacity-100 transition-all">
                                 <button 
                                   onClick={() => moveBlock(i, -1)} 
                                   disabled={i === 0}
                                   className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-tech-cyan disabled:opacity-30 shadow-sm transition-colors"
                                 >
                                   <ArrowUp size={14} strokeWidth={3} />
                                 </button>
                                 <button 
                                   onClick={() => moveBlock(i, 1)} 
                                   disabled={i === tplForm.blocks.length - 1}
                                   className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-tech-cyan disabled:opacity-30 shadow-sm transition-colors"
                                 >
                                   <ArrowDown size={14} strokeWidth={3} />
                                 </button>
                                 {tplForm.blocks.length > 1 && (
                                   <button 
                                    onClick={() => setTplForm({...tplForm, blocks: tplForm.blocks.filter((_, idx) => idx !== i)})}
                                    className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 hover:bg-rose-100 shadow-sm ml-1 sm:ml-2 transition-colors"
                                   >
                                     <Trash2 size={14} strokeWidth={3} />
                                   </button>
                                 )}
                               </div>
                            </div>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                               <div className="space-y-2 sm:space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                  <div className="flex items-center justify-between px-1 mb-1 sm:mb-2">
                                    <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">Mensaje de Texto</label>
                                    <div className="relative">
                                      <button 
                                        onClick={() => setActiveVarMenu(activeVarMenu === i ? null : i)}
                                        className="bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest hover:border-tech-cyan hover:text-tech-cyan transition-all flex items-center gap-1 shadow-sm"
                                      >
                                        <Wand2 size={10} /> Variables <ChevronDown size={10} className={`transition-transform ${activeVarMenu === i ? 'rotate-180' : ''}`} />
                                      </button>
                                      
                                      {activeVarMenu === i && (
                                        <div className="absolute right-0 top-full mt-2 w-40 sm:w-48 bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in-up">
                                          <div className="p-2 bg-slate-50 border-b border-slate-100 text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            Insertar
                                          </div>
                                          <div className="flex flex-col p-1">
                                            <button onClick={() => insertVariable(i, '{{cliente}}')} className="text-left px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors flex items-center gap-2"><User size={10} className="text-blue-500 sm:w-3 sm:h-3"/> Cliente</button>
                                            <button onClick={() => insertVariable(i, '{{agente}}')} className="text-left px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] font-bold text-slate-600 hover:bg-tech-cyan/5 hover:text-tech-cyan rounded-lg transition-colors flex items-center gap-2"><BadgeCheck size={10} className="text-tech-cyan sm:w-3 sm:h-3"/> Agente</button>
                                            <button onClick={() => insertVariable(i, '{{saludo}}')} className="text-left px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] font-bold text-slate-600 hover:bg-amber-50 hover:text-amber-600 rounded-lg transition-colors flex items-center gap-2"><Sun size={10} className="text-amber-500 sm:w-3 sm:h-3"/> Saludo</button>
                                            <button onClick={() => insertVariable(i, '{{dia}}')} className="text-left px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors flex items-center gap-2"><span className="text-[10px]">📅</span> Día</button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <textarea 
                                    className="tech-input w-full px-3 py-3 sm:px-4 sm:py-4 text-xs sm:text-sm font-medium resize-none bg-white focus:bg-white transition-colors border-slate-200"
                                    rows={4}
                                    placeholder="Escribe el mensaje aquí..."
                                    value={block.text}
                                    onChange={e => {
                                      const newBlocks = [...tplForm.blocks];
                                      newBlocks[i].text = e.target.value;
                                      setTplForm({...tplForm, blocks: newBlocks});
                                    }}
                                  />
                               </div>
                               <div className="space-y-2 sm:space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                  <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Archivo Adjunto (Drive)</label>
                                  <div className="relative">
                                    <Paperclip className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-tech-cyan" size={16} />
                                    <select 
                                      className="tech-input w-full pl-10 sm:pl-12 pr-8 py-3 sm:py-4 text-[10px] sm:text-[11px] font-bold appearance-none truncate cursor-pointer bg-white border-slate-200 hover:border-tech-cyan transition-colors"
                                      value={block.fileId}
                                      onChange={e => {
                                        const newBlocks = [...tplForm.blocks];
                                        const opt = e.target.options[e.target.selectedIndex];
                                        newBlocks[i].fileId = e.target.value;
                                        newBlocks[i].thumbnail = opt.dataset.thumb || '';
                                        newBlocks[i].fileType = opt.dataset.type || 'none';
                                        setTplForm({...tplForm, blocks: newBlocks});
                                      }}
                                    >
                                      <option value="">-- Sin archivo adjunto --</option>
                                      {flatFilesCache.map(f => (
                                        <option key={f.id} value={f.id} data-thumb={f.thumbnail} data-type={f.type}>
                                          [{f.type.toUpperCase()}] {f.name}
                                        </option>
                                      ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                  </div>
                                  {block.thumbnail && (
                                    <div className="mt-3 sm:mt-4 w-full h-28 sm:h-36 rounded-xl overflow-hidden border-2 border-white shadow-md relative group/preview">
                                       <img src={block.thumbnail} className="w-full h-full object-cover transition-transform duration-500 group-hover/preview:scale-110" />
                                       <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-end p-3">
                                         <span className="text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><CheckCircle size={12}/> Adjunto listo</span>
                                       </div>
                                    </div>
                                  )}
                               </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* VISTA PREVIA MÓVIL AL FINAL */}
                      <div className="lg:hidden mt-8 border-t border-slate-200 pt-8">
                        <div className="flex items-center gap-2 mb-4 px-1">
                          <div className="w-1.5 h-4 bg-tech-cyan rounded-full" />
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vista Previa Final</h4>
                        </div>
                        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                          <WAPreview blocks={tplForm.blocks} context={context} />
                        </div>
                      </div>
                    </div>
                 </div>
               </div>
               <div className="hidden lg:block">
                 <WAPreview blocks={tplForm.blocks} context={context} />
               </div>
             </div>

             <div className="px-4 py-4 sm:px-8 sm:py-6 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-end items-center gap-3 sm:gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] z-10">
               <button onClick={() => setIsModalOpen(false)} className="order-2 sm:order-1 px-6 py-3 sm:px-8 sm:py-3.5 rounded-xl text-[10px] sm:text-[11px] font-black text-slate-500 hover:bg-slate-100 transition-all uppercase tracking-widest">Cancelar</button>
               <button 
                 onClick={async () => {
                   if (!tplForm.name) return alert('¡Ups! Falta el nombre del comando.');
                   const normalizedName = tplForm.name.trim().toLowerCase();
                   const newTpls = [...templates];
                   
                   // Check for duplicates
                   const isDuplicate = newTpls.some(t => t.name.toLowerCase() === normalizedName && t.id !== editingTemplateId);
                   if (isDuplicate) {
                     return alert('¡Ups! Ya existe una plantilla con ese nombre. Elige otro.');
                   }

                   if (editingTemplateId) {
                     const idx = newTpls.findIndex(x => x.id === editingTemplateId);
                     newTpls[idx] = { ...tplForm, name: normalizedName, id: editingTemplateId, useCount: newTpls[idx].useCount, stars: calculateDynamicStars(newTpls[idx].useCount) };
                   } else {
                     newTpls.unshift({ ...tplForm, name: normalizedName, id: 'tpl_'+Date.now(), useCount: 0, stars: 1 });
                   }
                   setTemplates(newTpls);
                   await syncTemplatesToCloud(newTpls);
                   setIsModalOpen(false);
                   showToast("Guardado", "Secuencia actualizada correctamente", true);
                 }}
                 className="order-1 sm:order-2 px-8 py-3.5 sm:px-10 sm:py-4 rounded-xl text-[10px] sm:text-[12px] font-black uppercase tracking-widest text-slate-900 shadow-lg hover:opacity-90 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                 style={{ background: 'var(--color-tech-gradient-vibrant)' }}
               >
                 <Save size={16} /> {editingTemplateId ? 'Actualizar Cambios' : 'Guardar Plantilla'}
               </button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL PASSWORD CEO */}
      {passPrompt && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-tech-line animate-pop">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-tech-accent flex items-center justify-center text-tech-cyan shadow-lg">
                <Zap size={32} fill="currentColor" />
              </div>
              <div>
                <h3 className="text-xl font-black text-tech-ink uppercase tracking-tighter">Aprobación Javier</h3>
                <p className="text-xs font-bold text-tech-muted uppercase tracking-widest mt-1">Ingresa clave de seguridad</p>
              </div>
              <input 
                type="password"
                autoFocus
                className="tech-input w-full px-6 py-4 text-center text-lg font-black tracking-[0.5em]"
                placeholder="••••••••"
                value={passValue}
                onChange={(e) => setPassValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCEOApproval(passPrompt)}
              />
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => { setPassPrompt(null); setPassValue(''); }}
                  className="flex-1 py-3 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => handleCEOApproval(passPrompt)}
                  className="flex-1 tech-button py-3 rounded-xl text-[10px] font-black"
                >
                  Validar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST PREMIUM (Notificaciones) */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-4 px-6 py-4 bg-white tech-border rounded shadow-2xl animate-pop">
           <div className={`w-10 h-10 rounded flex items-center justify-center shadow-sm ${toast.ok ? 'bg-tech-green/10 text-tech-green border border-tech-green/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
              {toast.ok ? <CheckCircle size={20} strokeWidth={3}/> : <AlertCircle size={20} strokeWidth={3}/>}
           </div>
           <div>
              <h4 className="tech-header text-tech-ink leading-none">{toast.title}</h4>
              <p className="text-[10px] text-tech-muted font-bold mt-1 tracking-tight">{toast.msg}</p>
           </div>
        </div>
      )}

      {/* VISTA PREVIA FLOTANTE (DRIVE) */}
      {hoverPreview && hoverPreview.url && (
        <div 
          className="fixed z-[150] pointer-events-none bg-white p-1 rounded shadow-2xl tech-border overflow-hidden animate-fade-in"
          style={{ top: hoverPreview.y + 20, left: hoverPreview.x + 20, width: 300, height: 200 }}
        >
          <div className="w-full h-full bg-slate-50 flex items-center justify-center relative rounded overflow-hidden">
             <Loader2 className="animate-spin text-tech-line absolute" size={24} />
             <img src={hoverPreview.url} className="w-full h-full object-cover relative z-10" />
             <div className="absolute inset-0 bg-tech-cyan/5 z-20" />
          </div>
        </div>
      )}

    </div>
  );
}

const renderFileIcon = (type: string) => {
  switch(type) {
    case 'pdf': return <FileText className="w-7 h-7 text-rose-500" strokeWidth={2} />;
    case 'image': return <ImageIcon className="w-7 h-7 text-tech-cyan" strokeWidth={2} />;
    case 'video': return <Video className="w-7 h-7 text-tech-green" strokeWidth={2} />;
    case 'audio': return <Music className="w-7 h-7 text-tech-cyan" strokeWidth={2} />;
    default: return <FileText className="w-7 h-7 text-tech-muted" strokeWidth={2} />;
  }
};
