import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FolderOpen, Wand2, Search, Plus, Filter, 
  Trash2, Edit2, ChevronLeft, ChevronRight, FileText, 
  Image as ImageIcon, Video, Music, CheckCircle, 
  AlertCircle, Layout, User, Star, Package, 
  ChevronDown, X, Layers, Paperclip, Send, Loader2,
  Box, Archive, Sparkles, SlidersHorizontal, Zap,
  ArrowUp, ArrowDown, GripVertical, Bolt, Type,
  Sun, BadgeCheck, BarChart2, TrendingUp, Activity, MessageSquare, PieChart, MousePointerClick, UserMinus, MessageSquareText
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, getDoc, collection, onSnapshot 
} from 'firebase/firestore';

// --- CONFIGURACIÓN ---
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw_rBwKmUzVCkdVGF_0cZvAFHza2sxHig07FjnDclzgd4_FpsX5vPT4yVlsRkqtZ0Ejxg/exec";

// Safe Firebase initialization for preview environment
const firebaseConfig = typeof window !== 'undefined' && (window as any).__firebase_config 
  ? JSON.parse((window as any).__firebase_config) 
  : { apiKey: "mock", projectId: "mock", authDomain: "mock" };

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.warn("Firebase init failed (expected in preview without config):", e);
}

const appId = typeof window !== 'undefined' && (window as any).__app_id ? (window as any).__app_id : 'xtreme-drive-pro-v8';

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
    <div className="hidden md:flex w-[260px] bg-[#efeae2] flex-col shrink-0 relative border-l border-slate-300/50 h-full shadow-inner">
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
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('templates');
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
  const [lastCustomerMsg, setLastCustomerMsg] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [tplForm, setTplForm] = useState({ name: '', owner: 'Agente', category: 'General', blocks: [{ text: '', fileId: '', thumbnail: '', fileType: 'none' }] });
  const [hoverPreview, setHoverPreview] = useState<{url: string, x: number, y: number} | null>(null);

  const [chatwootStats, setChatwootStats] = useState<{
    totalSends: number;
    avgResponseRate: number;
    templateStats: Record<string, { uses: number, responses: number, agents: Record<string, number> }>;
    agentStats: Record<string, number>;
    ghostingRate: number;
    topKeywords: {word: string, count: number}[];
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // --- PERSISTENCIA FIREBASE ---
  useEffect(() => {
    const initAuth = async () => {
      if (!auth) return;
      try {
        const token = typeof window !== 'undefined' && (window as any).__initial_auth_token;
        if (token) {
          await signInWithCustomToken(auth, token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.warn("Auth init failed:", e);
      }
    };
    initAuth();
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u);
        if (u) loadUserPrefs(u.uid);
      });
      return () => unsubscribe();
    }
  }, []);

  const loadUserPrefs = async (uid: string) => {
    if (!db) return;
    try {
      const prefRef = doc(db, 'artifacts', appId, 'users', uid, 'settings', 'filters');
      const snap = await getDoc(prefRef);
      if (snap.exists()) setActiveFilters(prev => ({ ...prev, ...snap.data() }));
    } catch (e) {}
  };

  useEffect(() => {
    if (user && db) {
      const prefRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'filters');
      setDoc(prefRef, activeFilters).catch(() => {});
    }
  }, [activeFilters, user]);

  // --- LÓGICA CHATWOOT (CACHÉ) ---
  useEffect(() => {
    const handlePostMessage = (event: MessageEvent) => {
      try {
        let data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.event === "appContext") {
          const newConvId = data.data?.conversation?.id || data.data?.id;
          const newAccId = data.data?.conversation?.account_id || data.data?.account?.id;
          
          const contact = data.data?.conversation?.meta?.sender || data.data?.contact || {};
          const assignee = data.data?.conversation?.meta?.assignee || data.data?.current_user || {};
          const inbox = data.data?.conversation?.inbox || {};
          
          setContext({ 
            accountId: newAccId, 
            conversationId: newConvId,
            contactName: contact.name || 'Cliente',
            contactEmail: contact.email || '',
            contactPhone: contact.phone_number || '',
            agentName: assignee.name || 'Agente',
            inboxName: inbox.name || 'nuestro equipo',
            accessToken: data.data?.current_user?.access_token || '',
            chatwootUrl: event.origin && event.origin !== 'null' ? event.origin : ''
          });

          const messages = data.data?.conversation?.messages;
          if (messages?.length > 0) {
            const last = messages[messages.length - 1];
            if (last.message_type === 1 && last.content.trim().startsWith('.')) {
              handleAutoCommand(last.content.trim());
            }
            if (last.message_type === 0) setLastCustomerMsg(last.content.toLowerCase());
          }
        }
      } catch (e) {}
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
    if (!context.conversationId) {
      showToast("Error", "Abre un chat activo primero", false);
      return;
    }
    setSendingState('sending');
    try {
      const rawBlocks = isSingleFile ? [{ fileId: tplOrItem.id, text: '' }] : tplOrItem.blocks;
      
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
      
      let retries = 3;
      let success = false;
      let lastError = null;

      while (retries > 0 && !success) {
        try {
          // Usamos GET en lugar de POST para evitar bloqueos de CORS en iframes
          const url = new URL(SCRIPT_URL);
          url.searchParams.append('action', 'sendBlocks');
          url.searchParams.append('data', JSON.stringify(payload));
          
          const res = await fetch(url.toString(), { 
            method: 'GET'
          });
          const data = await res.json();
          
          if (data.success) {
            success = true;
          } else {
            lastError = new Error(data.error || "Error en respuesta del servidor");
            retries--;
            if (retries > 0) await new Promise(r => setTimeout(r, 1500));
          }
        } catch (err) {
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
      showToast("Error", errorMsg.substring(0, 100), false);
      console.error("Error detallado al enviar:", e);
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
      
      {/* HEADER MORADO ORIGINAL */}
      <header className="glass-header z-50 shrink-0 border-b border-slate-200/60 px-5 pt-6 pb-0 shadow-sm relative overflow-visible">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-2xl shadow-xl shadow-purple-200">
               <Archive className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-purple-700 to-indigo-500 bg-clip-text text-transparent uppercase tracking-tighter">Xtreme Drive</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Constructor Multimedia Pro</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* EL RAYO DE LA IA */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-[9px] font-black uppercase tracking-tighter transition-all duration-500 ${smartRecommendation ? 'bg-amber-100 border-amber-300 text-amber-600 shadow-lg animate-pulse' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
              <Zap size={14} fill={smartRecommendation ? "currentColor" : "none"} className={smartRecommendation ? "animate-wiggle" : ""} />
              {smartRecommendation ? 'IA Recomendando' : 'IA Activa'}
            </div>
          </div>
        </div>

        {/* TABS Y BUSCADOR */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-200">
            <div className="flex gap-8">
              {['drive', 'templates', 'dashboard'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-black transition-all relative uppercase tracking-tighter ${activeTab === tab ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <div className="flex items-center gap-2">
                    {tab === 'drive' ? <FolderOpen size={16} /> : tab === 'templates' ? <Layers size={16} /> : <BarChart2 size={16} />}
                    {tab === 'drive' ? 'Drive' : tab === 'templates' ? 'Plantillas' : 'Estadísticas'}
                  </div>
                  {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-purple-600 rounded-t-full animate-pop" />}
                </button>
              ))}
            </div>
            
            {(activeTab === 'templates' || activeTab === 'dashboard') && (
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${showFilters ? 'bg-purple-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}
              >
                <SlidersHorizontal size={14} strokeWidth={3} />
                Panel Filtros
                {(activeFilters.owner !== 'todos' || activeFilters.category !== 'todas' || activeFilters.type !== 'todos') && (
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse border-2 border-white" />
                )}
              </button>
            )}
          </div>

          <div className="relative group flex gap-2 pb-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder={activeTab === 'drive' ? "Buscar archivos..." : activeTab === 'dashboard' ? "Buscar en estadísticas..." : "Filtrar secuencias..."}
                className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-11 pr-4 text-sm outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 transition-all shadow-sm font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {activeTab === 'templates' && (
              <button 
                onClick={() => { setEditingTemplateId(null); setTplForm({ name: '', owner: 'Agente', category: 'General', blocks: [{ text: '', fileId: '', thumbnail: '', fileType: 'none' }] }); setIsModalOpen(true); }}
                className="bg-purple-600 text-white p-3 rounded-2xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 active:scale-95 flex-shrink-0"
              >
                <Plus size={20} strokeWidth={3} />
              </button>
            )}
          </div>
        </div>

        {/* PANEL DE FILTROS AVANZADOS (Desplegable) */}
        {showFilters && (activeTab === 'templates' || activeTab === 'dashboard') && (
          <div className="absolute top-full left-5 right-5 mt-2 p-5 bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl flex flex-wrap gap-6 animate-fade-in z-[100] border-t-purple-500 border-t-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-bold"><User size={12}/> Autor</label>
              <select className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none" value={activeFilters.owner} onChange={(e) => setActiveFilters({...activeFilters, owner: e.target.value})}>
                {ownersList.map(o => <option key={o} value={o}>{String(o).toUpperCase()}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-bold"><Sparkles size={12}/> Categoría</label>
              <select className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none" value={activeFilters.category} onChange={(e) => setActiveFilters({...activeFilters, category: e.target.value})}>
                {categoriesList.map(c => <option key={c} value={c}>{String(c).toUpperCase()}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-bold"><Layers size={12}/> Formato</label>
              <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-xl">
                {['todos', 'texto', 'multimedia'].map(t => (
                  <button key={t} onClick={() => setActiveFilters({...activeFilters, type: t})} className={`px-4 py-1.5 rounded-lg text-[9px] font-black transition-all uppercase ${activeFilters.type === t ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-bold"><SlidersHorizontal size={12}/> Orden</label>
              <select className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none" value={activeFilters.sortBy} onChange={(e) => setActiveFilters({...activeFilters, sortBy: e.target.value})}>
                <option value="uses">USOS</option>
                <option value="stars">ESTRELLAS</option>
                <option value="category">A-Z</option>
              </select>
            </div>
          </div>
        )}
      </header>

      {/* CUERPO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-5 relative" id="mainScroll">
        
        {/* DROPZONE MORADA (RESTAURADA) */}
        {activeTab === 'templates' && (
          <div className="sticky top-0 z-40 mb-6 group">
            <div 
              onDragOver={(e) => { e.preventDefault(); setSendingState('hovering'); }}
              onDragLeave={(e) => { setSendingState('idle'); }}
              onDrop={(e) => { 
                e.preventDefault();
                const id = e.dataTransfer.getData('text');
                const tpl = templates.find(t => t.id === id);
                if (tpl) executeSendBlocks(tpl);
              }}
              className={`w-full h-20 rounded-[2.5rem] flex flex-col items-center justify-center transition-all duration-500 relative overflow-hidden shadow-2xl transform origin-center
                ${sendingState === 'idle' ? 'bg-gradient-to-r from-purple-600 to-purple-900 text-white' : ''}
                ${sendingState === 'hovering' ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white scale-[1.04] shadow-orange-300' : ''}
                ${sendingState === 'sending' || sendingState === 'success' ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-inner' : ''}
              `}
            >
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: 'radial-gradient(#fff 2px, transparent 2px)', backgroundSize: '18px 18px'}} />
              
              {sendingState === 'idle' && (
                <div className="flex items-center gap-4 z-10 animate-fade-in font-black uppercase tracking-widest text-[11px] pointer-events-none">
                   <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30 shadow-inner">
                      <Send size={20} className="animate-bounce-subtle text-white" />
                   </div>
                   <span>Arrastra secuencia aquí para inyectar</span>
                </div>
              )}

              {sendingState === 'hovering' && (
                <div className="flex items-center gap-4 z-10 animate-pop font-black uppercase tracking-widest text-xs pointer-events-none">
                   <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center border border-white/50 shadow-2xl">
                      <Box size={26} className="animate-wiggle text-white" />
                   </div>
                   <span>¡Suéltalo ahora!</span>
                </div>
              )}

              {sendingState === 'sending' && (
                <div className="flex items-center gap-4 z-10 animate-fade-in font-black uppercase tracking-widest text-[11px] pointer-events-none">
                   <Loader2 size={24} className="animate-spin text-white" />
                   <span>Procesando secuencia...</span>
                </div>
              )}

              {sendingState === 'success' && (
                <div className="flex items-center gap-4 z-10 animate-pop text-white font-black uppercase tracking-widest text-[11px] pointer-events-none">
                   <CheckCircle size={32} className="animate-bounce" />
                   <span>¡Enviado con éxito!</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* IA RECOMENDACIÓN */}
        {smartRecommendation && activeTab === 'templates' && (
          <div className="mb-6 p-4 bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200 rounded-[2.5rem] flex items-center justify-between shadow-xl animate-fade-in-up border-l-amber-500 border-l-4">
            <div className="flex items-center gap-4 min-w-0">
               <div className="w-12 h-12 rounded-3xl bg-amber-500 flex items-center justify-center text-white shadow-xl flex-shrink-0">
                  <Star fill="currentColor" strokeWidth={0} />
               </div>
               <div className="min-w-0">
                  <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest leading-none flex items-center gap-1.5">
                    <Sparkles size={12} />
                    Sugerido: "{smartRecommendation.word}"
                  </h4>
                  <p className="text-[14px] text-slate-800 font-bold uppercase tracking-tighter mt-1.5 truncate">{smartRecommendation.tpl.name}</p>
               </div>
            </div>
            <button onClick={() => executeSendBlocks(smartRecommendation.tpl)} className="bg-amber-600 hover:bg-purple-600 text-white px-6 py-2.5 rounded-[1.5rem] text-[10px] font-black transition-all shadow-lg active:scale-95 uppercase tracking-widest ml-3 flex-shrink-0">Enviar</button>
          </div>
        )}

        {/* VISTA DRIVE */}
        {activeTab === 'drive' && (
          <div className="flex flex-col gap-4 animate-fade-in">
             <div className="flex items-center gap-3 px-1">
              {folderHistory.length > 0 && (
                <button onClick={goBack} className="w-10 h-10 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-purple-600 hover:bg-purple-600 hover:text-white transition-all">
                  <ChevronLeft size={20} strokeWidth={3} />
                </button>
              )}
              <h2 className="text-sm font-black text-slate-800 truncate uppercase tracking-tighter">{currentFolder.name}</h2>
            </div>
            
            {loading ? (
               <div className="grid grid-cols-1 gap-3">
                  {[1,2,3,4].map(i => <div key={i} className="h-14 bg-white rounded-[1.5rem] border border-slate-100 animate-pulse" />)}
               </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredDriveItems.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => item.isFolder && openFolder(item)}
                    onMouseEnter={(e) => !item.isFolder && setHoverPreview({ url: item.thumbnail, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setHoverPreview(null)}
                    onMouseMove={(e) => !item.isFolder && setHoverPreview(prev => prev ? {...prev, x: e.clientX, y: e.clientY} : null)}
                    className="bg-white border border-slate-200/70 rounded-[1.5rem] p-3 flex items-center justify-between group hover:shadow-2xl hover:border-purple-400 transition-all cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${item.isFolder ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                        {item.isFolder ? <FolderOpen strokeWidth={2.5} /> : renderFileIcon(item.type)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[14px] font-bold text-slate-800 truncate group-hover:text-purple-600 transition-colors">{item.name}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.isFolder ? 'Carpeta' : item.type}</span>
                      </div>
                    </div>
                    {!item.isFolder && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); executeSendBlocks(item, true); }}
                        className="w-11 h-11 rounded-full bg-slate-100 text-slate-400 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-all shadow-md active:scale-90"
                      >
                        <Send size={18} strokeWidth={3} />
                      </button>
                    )}
                    {item.isFolder && <ChevronRight className="text-slate-300 group-hover:translate-x-1 transition-transform" size={18} strokeWidth={3} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VISTA PLANTILLAS (3 COLUMNAS - COMPACTAS) */}
        {activeTab === 'templates' && (
          <div className="grid grid-cols-3 gap-4 animate-fade-in pb-20">
            {filteredTemplates.map((tpl, idx) => {
              const stars = calculateDynamicStars(tpl.useCount);
              const firstBlock = tpl.blocks[0];

              return (
                <div 
                  key={tpl.id}
                  draggable
                  onDragStart={(e) => { 
                    e.dataTransfer.setData('text', tpl.id);
                    const ghost = document.createElement('div');
                    ghost.className = "fixed -top-[300px] left-0 bg-white border-2 border-orange-500 p-4 rounded-[2.5rem] shadow-2xl flex items-center gap-3 font-black text-xs z-[9999] ring-12 ring-orange-500/10";
                    ghost.innerHTML = `<div class="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600"><svg class="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg></div><div class="flex flex-col"><span class="text-orange-600 uppercase tracking-tighter leading-none font-black">ENVIANDO</span><span class="text-[9px] text-slate-400 truncate max-w-[120px] font-bold">${tpl.name}</span></div>`;
                    document.body.appendChild(ghost);
                    e.dataTransfer.setDragImage(ghost, 70, 30);
                    setTimeout(() => ghost.remove(), 100);
                  }}
                  className="template-card bg-white border border-slate-200/80 rounded-[1.5rem] flex flex-row h-[140px] overflow-hidden shadow-sm hover:shadow-2xl hover:border-purple-400 transition-all group animate-fade-in-up"
                  style={{ animationDelay: `${(idx % 9) * 30}ms` }}
                >
                  <div className="h-full w-[65%] shrink-0 bg-slate-100 relative flex items-center justify-center overflow-hidden border-r border-slate-50 cursor-pointer"
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
                      <img src={firstBlock.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <Archive size={32} className="text-purple-100" strokeWidth={1} />
                    )}
                    
                    {firstBlock?.fileType === 'video' && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center">
                        <video muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity" src={`https://drive.google.com/uc?export=download&id=${firstBlock.fileId}`} />
                        <div className="w-9 h-9 bg-black/50 rounded-full flex items-center justify-center text-white z-20 group-hover:hidden shadow-lg"><Video size={18} /></div>
                      </div>
                    )}
                    {firstBlock?.fileType === 'audio' && (
                       <div className="absolute inset-0 z-10 flex items-center justify-center">
                        <audio loop className="hidden" src={`https://drive.google.com/uc?export=download&id=${firstBlock.fileId}`} />
                        <div className="w-9 h-9 bg-black/50 rounded-full flex items-center justify-center text-white z-20 group-hover:bg-purple-600 transition-colors shadow-lg"><Music size={18} /></div>
                      </div>
                    )}

                    <div className="absolute top-2 right-2 z-30 flex items-center gap-1 bg-amber-50/90 backdrop-blur-sm border border-amber-300 rounded px-1.5 py-0.5 shadow-sm">
                      <Star size={8} className="text-amber-500 fill-amber-500" />
                      <span className="text-[9px] font-black text-amber-700 leading-none">{stars}</span>
                    </div>

                    <div className="absolute top-2 left-2 z-30 flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-[-5px] group-hover:translate-x-0">
                      <button onClick={(e) => { e.stopPropagation(); setEditingTemplateId(tpl.id); setTplForm(tpl); setIsModalOpen(true); }} className="w-6 h-6 bg-white/90 backdrop-blur-md rounded-md shadow-lg flex items-center justify-center text-purple-600 hover:bg-purple-600 hover:text-white border border-slate-200 transition-all"><Edit2 size={12} strokeWidth={3} /></button>
                      <button onClick={(e) => { e.stopPropagation(); deleteTemplate(tpl.id); }} className="w-6 h-6 bg-white/90 backdrop-blur-md rounded-md shadow-lg flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white border border-slate-200 transition-all"><Trash2 size={12} strokeWidth={3} /></button>
                    </div>

                    {tpl.blocks.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[7px] font-black px-1.5 py-0.5 rounded backdrop-blur-sm flex items-center gap-1 shadow-xl border border-white/10">
                        <Layers size={8} />
                        {tpl.blocks.length}
                      </div>
                    )}
                  </div>

                  <div className="p-2 flex flex-col flex-1 bg-white min-w-0 justify-between">
                    <div>
                      <div className="flex flex-col mb-1 gap-0.5">
                        <div className="flex justify-between items-start gap-1">
                          <h3 className="text-[14px] font-black text-slate-800 line-clamp-2 group-hover:text-purple-600 uppercase tracking-tighter transition-colors leading-tight">{tpl.name}</h3>
                        </div>
                        <span className="px-1 py-0.5 bg-indigo-50 text-purple-700 text-[6px] font-black rounded border border-indigo-100 whitespace-nowrap uppercase tracking-wider w-fit">{tpl.category}</span>
                      </div>
                      
                      <p className="text-[8px] text-slate-500 leading-tight line-clamp-2 italic font-medium break-words mb-1">
                        {firstBlock?.text || "Secuencia multimedia inteligente."}
                      </p>

                      <div className="flex gap-0.5 flex-wrap">
                        {tpl.blocks.map((b: any, idx: number) => {
                          let Icon = FileText;
                          if (b.fileType === 'video') Icon = Video;
                          else if (b.fileType === 'audio') Icon = Music;
                          else if (b.fileType === 'image') Icon = ImageIcon;
                          else if (!b.fileId) Icon = Type;
                          
                          return (
                            <div key={idx} className="w-3.5 h-3.5 rounded bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-200" title={`Bloque ${idx+1}`}>
                              <Icon size={6} strokeWidth={3} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => executeSendBlocks(tpl)}
                      className="mt-1 w-full bg-slate-50 hover:bg-purple-600 text-slate-500 hover:text-white font-black py-1 text-[8px] uppercase rounded-md transition-all flex items-center justify-center gap-1 group/btn border border-slate-200 hover:border-purple-600 active:scale-95 shrink-0"
                    >
                      <span>ENVIAR</span>
                      <Send size={8} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" strokeWidth={3} />
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
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              <div className="relative z-10 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                    <Activity size={32} />
                    Rendimiento de Plantillas
                  </h2>
                  <button 
                    onClick={fetchChatwootStats}
                    disabled={statsLoading}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {statsLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                    Sincronizar Chatwoot
                  </button>
                </div>
                <p className="text-purple-100 font-medium text-sm">Analiza qué secuencias generan mayor impacto y qué agentes las utilizan más (Datos reales de Chatwoot).</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 flex flex-col gap-1">
                  <span className="text-purple-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Layers size={14}/> Total Plantillas</span>
                  <span className="text-4xl font-black tracking-tighter">{filteredTemplates.length}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 flex flex-col gap-1">
                  <span className="text-purple-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Send size={14}/> Envíos Totales</span>
                  <span className="text-4xl font-black tracking-tighter">
                    {chatwootStats ? chatwootStats.totalSends : filteredTemplates.reduce((acc, t) => acc + (t.useCount || 0), 0)}
                  </span>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 flex flex-col gap-1">
                  <span className="text-purple-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><MousePointerClick size={14}/> Tasa Promedio</span>
                  <span className="text-4xl font-black tracking-tighter">
                    {chatwootStats ? chatwootStats.avgResponseRate : (filteredTemplates.length > 0 ? Math.round(filteredTemplates.reduce((acc, t) => acc + ((t.useCount || 0) > 0 ? Math.min(100, 20 + (t.useCount * 5)) : 0), 0) / filteredTemplates.length) : 0)}%
                  </span>
                </div>
              </div>
              
              {/* NUEVAS MÉTRICAS: GHOSTING Y KEYWORDS */}
              {chatwootStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 flex flex-col gap-1">
                    <span className="text-rose-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><UserMinus size={14}/> Tasa de Abandono</span>
                    <span className="text-4xl font-black tracking-tighter text-rose-100">{chatwootStats.ghostingRate}%</span>
                    <span className="text-[9px] text-white/50 uppercase tracking-widest mt-1">Sin respuesta al agente</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 flex flex-col gap-2 md:col-span-2">
                    <span className="text-indigo-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><MessageSquareText size={14}/> Top Palabras Clave (Clientes)</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {chatwootStats.topKeywords.length > 0 ? (
                        chatwootStats.topKeywords.map((kw, idx) => (
                          <div key={idx} className="flex items-center bg-white/10 text-white px-2.5 py-1 rounded-lg text-xs font-bold border border-white/20">
                            <span>{kw.word}</span>
                            <span className="ml-1.5 bg-white/20 text-white text-[9px] px-1.5 py-0.5 rounded-md">
                              {kw.count}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-white/50">No hay suficientes datos.</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* TOP PLANTILLAS */}
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter mb-6 flex items-center gap-2">
                  <TrendingUp className="text-purple-600" />
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
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-200 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                            #{idx + 1}
                          </div>
                          
                          <div className="flex-1 min-w-0 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800 truncate text-sm">{tpl.name}</span>
                              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">{responseRate}% Respuesta</span>
                            </div>
                            
                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <span className="flex items-center gap-1"><Send size={12}/> {uses} envíos</span>
                              <span className="flex items-center gap-1"><Layers size={12}/> {tpl.category}</span>
                              {topAgent && <span className="flex items-center gap-1 text-purple-500"><User size={12}/> {topAgent}</span>}
                            </div>
                            
                            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" style={{ width: `${responseRate}%` }} />
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
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter mb-6 flex items-center gap-2">
                  <User className="text-indigo-600" />
                  Uso por Agente
                </h3>
                
                <div className="flex flex-col gap-3">
                  {chatwootStats && Object.keys(chatwootStats.agentStats).length > 0 ? (
                    Object.entries(chatwootStats.agentStats as Record<string, number>)
                      .sort((a, b) => b[1] - a[1])
                      .map(([agentName, count], idx) => (
                        <div key={agentName} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-sm shrink-0">
                            {agentName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col gap-1">
                            <span className="font-bold text-slate-800 truncate text-sm">{agentName}</span>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                              <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, ((count as number) / chatwootStats.totalSends) * 100)}%` }}></div>
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
      </main>

      {/* MODAL CONSTRUCTOR PRO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 z-[100] backdrop-blur-md flex flex-col justify-end animate-fade-in">
          <div className="bg-white w-full h-[94vh] rounded-t-[4rem] shadow-2xl flex flex-col overflow-hidden animate-fade-in-up border-t-8 border-purple-500">
             <div className="px-12 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <div>
                 <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                   <div className="w-10 h-10 bg-purple-600 rounded-2xl flex items-center justify-center text-white"><Layout /></div>
                   {editingTemplateId ? 'Editar Secuencia' : 'Nueva Secuencia Pro'}
                 </h2>
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 ml-1">Configuración multimedia avanzada</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all shadow-2xl hover:scale-110 active:scale-90 flex-shrink-0">
                 <X size={28} strokeWidth={3} />
               </button>
             </div>

             <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
               <div className="flex-1 overflow-y-auto px-12 py-8 space-y-8 border-r border-slate-200/50 bg-slate-50/30 relative">
                 <div className="max-w-4xl mx-auto grid grid-cols-1 gap-12">
                    <div className="space-y-6">
                       <div className="p-8 bg-purple-50 rounded-[3rem] border border-purple-100 shadow-inner">
                         <label className="block text-[11px] font-black text-purple-700 mb-2 uppercase tracking-widest">Comando Rápido (.Nombre)</label>
                         <div className="relative">
                            <input 
                              className="w-full bg-white border-2 border-purple-100 rounded-2xl px-5 py-4 text-sm font-black focus:border-purple-500 transition-all outline-none shadow-sm"
                              placeholder="Ej: CatDiesel"
                              value={tplForm.name}
                              onChange={e => setTplForm({...tplForm, name: e.target.value})}
                            />
                            <Bolt className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-300 animate-pulse" size={20} />
                         </div>
                         <p className="text-[10px] text-purple-500 font-bold mt-4 leading-relaxed opacity-70 italic font-medium">Usa <b>.{tplForm.name || 'Nombre'}</b> en el chat para disparar la secuencia.</p>
                       </div>
                       <div className="grid grid-cols-2 gap-5 px-4">
                         <div className="space-y-2 text-center">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</label>
                           <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-purple-500 text-center uppercase" value={tplForm.category} onChange={e => setTplForm({...tplForm, category: e.target.value})} />
                         </div>
                         <div className="space-y-2 text-center">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Creador</label>
                           <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-purple-500 text-center uppercase" value={tplForm.owner} onChange={e => setTplForm({...tplForm, owner: e.target.value})} />
                         </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                         <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-3 font-black">
                           <Layers size={20} className="text-purple-600" />
                           Estructura de la Secuencia
                         </h4>
                         <button 
                          onClick={() => setTplForm({...tplForm, blocks: [...tplForm.blocks, { text: '', fileId: '', thumbnail: '', fileType: 'none' }]})}
                          className="text-[10px] font-black bg-purple-600 text-white px-6 py-3 rounded-2xl hover:bg-purple-700 transition-all shadow-xl shadow-purple-300 flex items-center gap-2 uppercase tracking-widest active:scale-95"
                         >
                           <Plus size={16} strokeWidth={4} /> Añadir Bloque
                         </button>
                      </div>

                      <div className="space-y-6 pb-24">
                        {tplForm.blocks.map((block, i) => (
                          <div key={i} className="p-8 bg-slate-50 border border-slate-200 rounded-[3.5rem] relative group/block shadow-sm hover:shadow-lg transition-all animate-fade-in-up">
                            <div className="flex items-center gap-4 mb-5">
                               <div className="w-10 h-10 bg-purple-600 rounded-2xl flex items-center justify-center text-white text-sm font-black shadow-xl shadow-purple-300">{i+1}</div>
                               <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest font-black">Bloque Multimedia</span>
                               
                               <div className="ml-auto flex items-center gap-2 opacity-0 group-hover/block:opacity-100 transition-all">
                                 <button 
                                   onClick={() => moveBlock(i, -1)} 
                                   disabled={i === 0}
                                   className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-purple-600 disabled:opacity-30 shadow-sm"
                                 >
                                   <ArrowUp size={16} strokeWidth={3} />
                                 </button>
                                 <button 
                                   onClick={() => moveBlock(i, 1)} 
                                   disabled={i === tplForm.blocks.length - 1}
                                   className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-purple-600 disabled:opacity-30 shadow-sm"
                                 >
                                   <ArrowDown size={16} strokeWidth={3} />
                                 </button>
                                 {tplForm.blocks.length > 1 && (
                                   <button 
                                    onClick={() => setTplForm({...tplForm, blocks: tplForm.blocks.filter((_, idx) => idx !== i)})}
                                    className="w-8 h-8 rounded-xl bg-white border border-rose-200 flex items-center justify-center text-rose-500 hover:bg-rose-50 shadow-sm ml-2"
                                   >
                                     <Trash2 size={16} strokeWidth={3} />
                                   </button>
                                 )}
                               </div>
                            </div>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                               <div className="space-y-3">
                                  <div className="flex items-center justify-between px-1 mb-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">Mensaje de Texto</label>
                                    <div className="relative">
                                      <button 
                                        onClick={() => setActiveVarMenu(activeVarMenu === i ? null : i)}
                                        className="text-[10px] bg-purple-50 text-purple-600 border border-purple-200 px-3 py-1.5 rounded-xl font-black hover:bg-purple-600 hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95 uppercase tracking-widest"
                                      >
                                        <Wand2 size={12} /> Variables <ChevronDown size={12} className={`transition-transform ${activeVarMenu === i ? 'rotate-180' : ''}`} />
                                      </button>
                                      
                                      {activeVarMenu === i && (
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in-up">
                                          <div className="p-2 bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            Insertar Etiqueta
                                          </div>
                                          <div className="flex flex-col p-1">
                                            <button onClick={() => insertVariable(i, '{{cliente}}')} className="text-left px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors flex items-center gap-2"><User size={12} className="text-blue-500"/> Nombre Cliente</button>
                                            <button onClick={() => insertVariable(i, '{{agente}}')} className="text-left px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors flex items-center gap-2"><BadgeCheck size={12} className="text-purple-500"/> Tu Nombre</button>
                                            <button onClick={() => insertVariable(i, '{{saludo}}')} className="text-left px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-amber-50 hover:text-amber-600 rounded-lg transition-colors flex items-center gap-2"><Sun size={12} className="text-amber-500"/> Saludo (Hora MX)</button>
                                            <button onClick={() => insertVariable(i, '{{dia}}')} className="text-left px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors flex items-center gap-2"><span>📅</span> Día Semana</button>
                                            <button onClick={() => insertVariable(i, '{{canal}}')} className="text-left px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors flex items-center gap-2"><span>💬</span> Canal / Inbox</button>
                                            <div className="h-px bg-slate-100 my-1 mx-2"></div>
                                            <button onClick={() => insertVariable(i, '{{email}}')} className="text-left px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"><span>📧</span> Email Cliente</button>
                                            <button onClick={() => insertVariable(i, '{{telefono}}')} className="text-left px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"><span>📱</span> Teléfono Cliente</button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <textarea 
                                    className="w-full bg-white border border-slate-200 rounded-3xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-500 shadow-inner resize-none"
                                    rows={5}
                                    placeholder="Escribe el mensaje..."
                                    value={block.text}
                                    onChange={e => {
                                      const newBlocks = [...tplForm.blocks];
                                      newBlocks[i].text = e.target.value;
                                      setTplForm({...tplForm, blocks: newBlocks});
                                    }}
                                  />
                               </div>
                               <div className="space-y-3">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 font-bold">Elemento de Drive</label>
                                  <div className="relative">
                                    <Paperclip className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <select 
                                      className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-6 py-4 text-[11px] font-bold outline-none focus:border-purple-500 shadow-inner appearance-none truncate cursor-pointer"
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
                                      <option value="">(Sin archivo adjunto)</option>
                                      {flatFilesCache.map(f => (
                                        <option key={f.id} value={f.id} data-thumb={f.thumbnail} data-type={f.type}>
                                          [{f.type.toUpperCase()}] {f.name}
                                        </option>
                                      ))}
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                                  </div>
                                  {block.thumbnail && (
                                    <div className="mt-4 w-full h-32 rounded-[2.5rem] overflow-hidden border border-white shadow-2xl relative group/preview">
                                       <img src={block.thumbnail} className="w-full h-full object-cover transition-transform group-hover/preview:scale-110" />
                                       <div className="absolute inset-0 bg-purple-600/10 group-hover/preview:bg-transparent transition-colors" />
                                    </div>
                                  )}
                               </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                 </div>
               </div>
               <WAPreview blocks={tplForm.blocks} context={context} />
             </div>

             <div className="px-12 py-10 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-6">
               <button onClick={() => setIsModalOpen(false)} className="px-10 py-4 rounded-2xl text-[12px] font-black text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest font-black">Cerrar</button>
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
                 className="bg-purple-600 text-white px-12 py-5 rounded-[2rem] text-[12px] font-black shadow-2xl shadow-purple-400/40 hover:bg-purple-700 hover:scale-105 transition-all uppercase tracking-widest active:scale-95"
               >
                 {editingTemplateId ? 'Actualizar Cambios' : 'Guardar Secuencia'}
               </button>
             </div>
          </div>
        </div>
      )}

      {/* TOAST PREMIUM (Notificaciones) */}
      {toast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-5 px-8 py-6 bg-slate-900/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-slate-700/50 animate-pop">
           <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${toast.ok ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'}`}>
              {toast.ok ? <CheckCircle size={28} strokeWidth={3}/> : <AlertCircle size={28} strokeWidth={3}/>}
           </div>
           <div>
              <h4 className="text-sm font-black text-white uppercase tracking-tighter leading-none">{toast.title}</h4>
              <p className="text-[11px] text-slate-400 font-bold uppercase mt-1.5 tracking-widest">{toast.msg}</p>
           </div>
        </div>
      )}

      {/* VISTA PREVIA FLOTANTE (DRIVE) */}
      {hoverPreview && hoverPreview.url && (
        <div 
          className="fixed z-[150] pointer-events-none bg-white p-1 rounded-[3rem] shadow-2xl border-8 border-white overflow-hidden animate-fade-in"
          style={{ top: hoverPreview.y + 25, left: hoverPreview.x + 25, width: 340, height: 260 }}
        >
          <div className="w-full h-full bg-slate-100 flex items-center justify-center relative rounded-[2.5rem] overflow-hidden">
             <Loader2 className="animate-spin text-slate-300 absolute" size={32} />
             <img src={hoverPreview.url} className="w-full h-full object-cover relative z-10" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-20" />
          </div>
        </div>
      )}

    </div>
  );
}

const renderFileIcon = (type: string) => {
  switch(type) {
    case 'pdf': return <FileText className="w-7 h-7 text-rose-500" strokeWidth={3} />;
    case 'image': return <ImageIcon className="w-7 h-7 text-sky-500" strokeWidth={3} />;
    case 'video': return <Video className="w-7 h-7 text-violet-500" strokeWidth={3} />;
    case 'audio': return <Music className="w-7 h-7 text-fuchsia-500" strokeWidth={3} />;
    default: return <FileText className="w-7 h-7 text-slate-300" strokeWidth={3} />;
  }
};
