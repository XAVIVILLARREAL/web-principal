import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Key, AlertTriangle, Power, Menu, Home, ChevronRight, 
  ExternalLink, TrendingUp, ShieldCheck, Boxes, Briefcase, 
  Cloud, LayoutDashboard, Headset, Bot, Zap, Loader2, Sparkles, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CotizacionesApp from './apps/Cotizaciones/CotizacionesApp';
import TicketsSoporteApp from './apps/TicketsSoporte/TicketsSoporteApp';
import ClienteResumenApp from './apps/ClienteResumen/ClienteResumenApp';
import VentasApp from './apps/Ventas/VentasApp';
import EnviosApp from './apps/Envios/EnviosApp';
import FacturacionRapidaApp from './apps/FacturacionRapida/FacturacionRapidaApp';
import PlantillasApp from './apps/Plantillas/PlantillasApp';

// ============================================================================
// CONFIGURACIÓN DE APPS SCRIPT
// ============================================================================
const GAS_API_URL = "https://script.google.com/macros/s/AKfycby2xpSsLyJ9PUoH_XX_j7UtHxeUdOB-Ouy97rib9wjri72BqlBj7L87jR3ArvlhkF1B/exec";

// ============================================================================
// TIPOS
// ============================================================================
interface AppDef {
  name: string;
  url: string;
  category: string;
  isNative?: boolean;
  id?: string;
  iconClass?: string;
}

interface Session {
  username: string;
  photoUrl: string;
  sessionExpiry: number;
}

// ============================================================================
// COMPONENTES DE UI
// ============================================================================

const BootScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return 100;
        }
        return p + 2;
      });
    }, 20);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#020203] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,51,204,0.15),_transparent_70%)]" />
      <div className="relative z-10 flex flex-col items-center gap-10">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-xtreme-cyan/20 border-t-xtreme-cyan animate-spin duration-[3s]" />
          <div className="absolute inset-2 rounded-full border border-xtreme-blue/20 border-b-xtreme-blue animate-[spin_2s_linear_infinite_reverse]" />
          <div className="text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-white via-xtreme-cyan to-xtreme-blue drop-shadow-[0_0_20px_rgba(0,240,255,0.5)] animate-pulse font-tech">
            X
          </div>
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold italic tracking-wide text-white uppercase font-tech" style={{ textShadow: "0 0 10px rgba(0,0,0,0.5)" }}>
            XTREME <span className="text-xtreme-cyan">DIAGNOSTICS</span>
          </h1>
          <div className="flex items-center justify-center gap-3">
            <div className="h-[1px] w-12 bg-gray-700" />
            <p className="text-xs tracking-[0.5em] text-gray-400 uppercase font-hud">System Initialization</p>
            <div className="h-[1px] w-12 bg-gray-700" />
          </div>
        </div>
        <div className="w-80 h-1 bg-gray-900 rounded-full overflow-hidden relative shadow-lg border border-white/5">
          <div className="h-full bg-gradient-to-r from-xtreme-blue via-xtreme-cyan to-white shadow-[0_0_15px_rgba(0,240,255,0.8)]" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-xtreme-cyan font-mono text-sm tracking-widest">{progress}%</div>
      </div>
    </div>
  );
};

const LoginScreen = ({ onLogin, error, isLoading }: { onLogin: (u: string, p: string) => void, error?: string, isLoading: boolean }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);

  useEffect(() => {
    const photo = localStorage.getItem('last_user_photo');
    const name = localStorage.getItem('last_user_name');
    if (photo) setLastPhoto(photo);
    if (name) setUsername(name);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020305] overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.03)_1px,transparent_1px)] bg-[length:40px_40px] opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,51,204,0.1),_transparent_60%)]" />
      <div className="relative z-10 w-full max-w-md p-8 mx-4">
        <div className="relative bg-[#0a0c10]/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-xtreme-blue via-xtreme-cyan to-xtreme-blue" />
          <div className="p-8 flex flex-col items-center">
            <div className="mb-8 relative">
              {lastPhoto ? (
                <div className="w-24 h-24 rounded-full border-2 border-xtreme-cyan shadow-[0_0_20px_rgba(0,240,255,0.3)] overflow-hidden">
                  <img src={lastPhoto} alt="User" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-xtreme-blue/20 to-transparent border border-white/10 flex items-center justify-center shadow-inner">
                  <i className="fa-solid fa-user-astronaut text-3xl text-xtreme-cyan/80" />
                </div>
              )}
              <div className="absolute -inset-4 border border-xtreme-cyan/20 rounded-full animate-spin-slow pointer-events-none border-dashed" />
            </div>
            <h2 className="text-2xl font-tech font-bold text-white mb-1 tracking-wider">SYSTEM LOGIN</h2>
            <p className="text-xs font-hud text-gray-400 tracking-[0.2em] mb-8 uppercase">Authentication Required</p>
            
            <form onSubmit={handleSubmit} className="w-full space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-hud text-xtreme-cyan uppercase tracking-widest ml-1">Usuario</label>
                <div className="relative group">
                  <i className="fa-solid fa-user absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-xtreme-cyan transition-colors" />
                  <input 
                    type="text" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)}
                    className="w-full bg-[#050608] border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-xtreme-cyan/50 focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all font-tech tracking-wide"
                    placeholder="Ingrese ID..."
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-hud text-xtreme-cyan uppercase tracking-widest ml-1">Contraseña</label>
                <div className="relative group">
                  <i className="fa-solid fa-key absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-xtreme-cyan transition-colors" />
                  <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-[#050608] border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-xtreme-cyan/50 focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all font-tech tracking-wide"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs text-center font-mono">
                  <i className="fa-solid fa-triangle-exclamation mr-2" />
                  {error}
                </div>
              )}
              
              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full py-3 rounded-lg font-bold font-tech uppercase tracking-widest transition-all duration-300 relative overflow-hidden group ${isLoading ? 'bg-gray-700 cursor-not-allowed text-gray-400' : 'bg-gradient-to-r from-xtreme-blue to-blue-600 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(0,51,204,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)]'}`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verificando...</span>
                  </div>
                ) : (
                  <span>Acceder</span>
                )}
                {!isLoading && (
                  <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 group-hover:animate-shine" />
                )}
              </button>
            </form>
          </div>
          <div className="bg-[#050608] py-3 text-center border-t border-white/5">
            <span className="text-[9px] text-gray-600 font-hud tracking-[0.4em] uppercase">Xtreme Diagnostics Secure Shell</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const TechLoading = ({ message = "Initializing" }: { message?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-[#020203] relative overflow-hidden rounded-2xl">
      {/* Hex Grid Background */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#00f0ff_1px,transparent_1px)] bg-[length:20px_20px]" />
      
      {/* Subtle Scanning Line */}
      <motion.div 
        animate={{ top: ["-10%", "110%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-xtreme-cyan/20 to-transparent z-0"
      />

      {/* Pulsing Background Rings */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 2.5, opacity: [0, 0.08, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: i * 1.5, ease: "easeOut" }}
          className="absolute w-48 h-48 border border-xtreme-cyan/10 rounded-full"
        />
      ))}
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Central Core */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Outer Ring - Dashed */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-dashed border-xtreme-cyan/30"
          />
          
          {/* Middle Ring - Dashed Reverse */}
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-4 rounded-full border border-dashed border-xtreme-blue/20"
          />
          
          {/* Inner Pulsing Core */}
          <motion.div 
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.7, 1, 0.7],
              boxShadow: [
                "0 0 15px rgba(0,240,255,0.15)",
                "0 0 35px rgba(0,240,255,0.3)",
                "0 0 15px rgba(0,240,255,0.15)"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-10 h-10 rounded-full bg-xtreme-cyan/5 flex items-center justify-center border border-xtreme-cyan/40 backdrop-blur-sm"
          >
            <Zap className="text-xtreme-cyan/60" size={20} />
          </motion.div>
          
          {/* Orbiting Particles */}
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              animate={{ rotate: 360 }}
              transition={{ duration: 5 + i * 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0"
            >
              <div 
                className="w-1 h-1 bg-xtreme-cyan/80 rounded-full absolute" 
                style={{ 
                  top: '50%', 
                  left: '-0.5px',
                  boxShadow: '0 0 8px rgba(0,240,255,0.6)'
                }} 
              />
            </motion.div>
          ))}
        </div>

        {/* Loading Text & Progress Bar */}
        <div className="mt-10 flex flex-col items-center gap-4 w-48">
          <div className="flex flex-col items-center gap-2 w-full">
            <motion.span 
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="text-[9px] font-hud tracking-[0.6em] text-xtreme-cyan/60 uppercase text-center"
            >
              {message}
            </motion.span>
            <div className="h-[1px] w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="h-full w-1/3 bg-gradient-to-r from-transparent via-xtreme-cyan/40 to-transparent"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Corner Accents */}
      <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-xtreme-cyan/10" />
      <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-xtreme-cyan/10" />
      <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-xtreme-cyan/10" />
      <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-xtreme-cyan/10" />
    </div>
  );
};

const AppIcon: React.FC<{ app: AppDef, onClick: (app: AppDef) => void, collapsed?: boolean }> = ({ app, onClick, collapsed }) => {
  const iconClass = useMemo(() => {
    if (app.iconClass) return app.iconClass;
    const name = app.name.toLowerCase();
    if (name.includes('finanza') || name.includes('pago') || name.includes('contabil')) return 'fa-solid fa-money-bill-trend-up';
    if (name.includes('rh') || name.includes('personal') || name.includes('asistencia')) return 'fa-solid fa-user-gear';
    if (name.includes('inventario') || name.includes('stock') || name.includes('compras') || name.includes('recepcion')) return 'fa-solid fa-boxes-stacked';
    if (name.includes('venta') || name.includes('marketing')) return 'fa-solid fa-handshake';
    if (name.includes('cotizaci')) return 'fa-solid fa-file-invoice-dollar';
    if (name.includes('cliente') || name.includes('crm')) return 'fa-solid fa-users-viewfinder';
    if (name.includes('doc') || name.includes('drive')) return 'fa-brands fa-google-drive';
    if (name.includes('dashboard') || name.includes('general')) return 'fa-solid fa-chart-pie';
    if (name.includes('ticket') || name.includes('soporte')) return 'fa-solid fa-life-ring';
    if (name.includes('produccion') || name.includes('calidad')) return 'fa-solid fa-microchip';
    if (name.includes('google')) return 'fa-brands fa-google';
    if (name.includes('resumen')) return 'fa-solid fa-id-card-clip';
    if (name.includes('proyectos')) return 'fa-solid fa-diagram-project';
    if (name.includes('task') || name.includes('organizacion')) return 'fa-solid fa-list-check';
    if (name.includes('envio') || name.includes('logistica')) return 'fa-solid fa-truck-fast';
    return 'fa-solid fa-rocket';
  }, [app.name, app.iconClass]);

  const styleInfo = useMemo(() => {
    const name = app.name.toLowerCase();
    if (name.includes('dashboard') || name.includes('proyectos') || name.includes('resumen') || name.includes('cotizaci')) {
      return {
        bg: 'bg-xtreme-cyan/10',
        border: 'border-xtreme-cyan/50',
        icon: 'text-xtreme-cyan',
        shadow: 'shadow-[0_0_15px_rgba(0,240,255,0.3)]',
        glow: 'group-hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] group-hover:border-xtreme-cyan',
        textShadow: 'drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]'
      };
    }
    if (name.includes('compras') || name.includes('finanza') || name.includes('rh') || name.includes('ticket')) {
      return {
        bg: 'bg-xtreme-blue/20',
        border: 'border-blue-500/50',
        icon: 'text-blue-400',
        shadow: 'shadow-[0_0_15px_rgba(0,51,204,0.4)]',
        glow: 'group-hover:shadow-[0_0_30px_rgba(0,51,204,0.7)] group-hover:border-blue-400',
        textShadow: 'drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]'
      };
    }
    return {
      bg: 'bg-white/5',
      border: 'border-gray-500/50',
      icon: 'text-gray-300',
      shadow: 'shadow-[0_0_15px_rgba(255,255,255,0.1)]',
      glow: 'group-hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] group-hover:border-gray-300',
      textShadow: 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'
    };
  }, [app.name]);

  return (
    <div 
      onClick={() => onClick(app)} 
      className={`group flex flex-col items-center transition-all duration-300 cursor-pointer select-none active:scale-95 ${collapsed ? 'gap-2 p-2' : 'gap-4 p-4 rounded-xl'}`}
      title={collapsed ? app.name : undefined}
    >
      <div className={`
        relative flex items-center justify-center rounded-2xl
        ${collapsed ? 'w-12 h-12 sm:w-14 sm:h-14' : 'w-20 h-20 sm:w-24 sm:h-24'}
        ${styleInfo.bg}
        border ${styleInfo.border}
        backdrop-blur-md ${styleInfo.shadow}
        transition-all duration-300
        ${styleInfo.glow}
        group-hover:-translate-y-1
      `}>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
        <i className={`${iconClass} ${collapsed ? 'text-xl sm:text-2xl' : 'text-3xl sm:text-4xl'} ${styleInfo.icon} ${styleInfo.textShadow} z-10 transition-transform duration-300 group-hover:scale-110 group-hover:text-white`} />
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className={`${collapsed ? 'text-[10px] mt-1' : 'text-xs sm:text-sm'} font-bold text-gray-300 text-center leading-tight tracking-widest uppercase font-hud group-hover:text-white transition-colors duration-300`}>
          {app.name}
        </span>
      </div>
    </div>
  );
};

const AppViewer = ({ currentApp, allApps, onClose, onSwitchApp, session, xtremeParams }: { currentApp: AppDef, allApps: AppDef[], onClose: () => void, onSwitchApp: (app: AppDef) => void, session: Session, xtremeParams: Record<string, string> }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsEntering(true));
  }, []);

  useEffect(() => {
    setIframeLoading(true);
    setSidebarOpen(false);
  }, [currentApp]);

  const handleIframeLoad = () => {
    setIframeLoading(false);
  };

  const getIframeUrl = (baseUrl: string) => {
    try {
      const currentUrlParams = window.XTREME_URL_PARAMS || {};
      if (Object.keys(currentUrlParams).length === 0) return baseUrl;
      
      const url = new URL(baseUrl);
      Object.keys(currentUrlParams).forEach(key => {
        if (!url.searchParams.has(key)) {
          url.searchParams.append(key, currentUrlParams[key]);
        }
      });
      return url.toString();
    } catch (e) {
      const currentUrlParams = window.XTREME_URL_PARAMS || {};
      if (Object.keys(currentUrlParams).length === 0) return baseUrl;
      const paramsString = Object.keys(currentUrlParams).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(currentUrlParams[key])}`).join('&');
      return baseUrl.includes('?') ? `${baseUrl}&${paramsString}` : `${baseUrl}?${paramsString}`;
    }
  };

  const renderNativeApp = () => {
    switch (currentApp.id) {
      case 'cotizaciones':
        return <CotizacionesApp 
          contactIdProp={xtremeParams.contact_id} 
          conversationIdProp={xtremeParams.conversation_id} 
        />;
      case 'ventas':
        return <VentasApp username={session.username} />;
      case 'envios':
        return <EnviosApp username={session.username} />;
      case 'tickets':
        return <TicketsSoporteApp 
          contactIdProp={xtremeParams.contact_id} 
          conversationIdProp={xtremeParams.conversation_id} 
        />;
      case 'plantillas':
        return <PlantillasApp 
          contactIdProp={xtremeParams.contact_id} 
          conversationIdProp={xtremeParams.conversation_id} 
        />;
      case 'crm':
        return <ClienteResumenApp 
          contactId={xtremeParams.contact_id}
          conversationId={xtremeParams.conversation_id}
          onOpenApp={(appId) => {
            const app = allApps.find(a => a.id === appId);
            if (app) onSwitchApp(app);
          }} 
        />;
      default:
        return <div className="p-8 text-white">App nativa no encontrada: {currentApp.id}</div>;
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-row bg-[#020305] window-transition ${isEntering ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} overflow-hidden bg-[#050608] border-r border-xtreme-blue/20 flex flex-col shrink-0 relative z-50 shadow-[5px_0_30px_rgba(0,0,0,0.5)] transition-all duration-300`}>
        <div className="h-12 flex items-center px-6 border-b border-xtreme-blue/20 bg-gradient-to-r from-xtreme-blue/10 to-transparent">
          <span className="text-xs text-xtreme-cyan tracking-[0.2em] font-bold font-tech uppercase">NAVIGATOR</span>
        </div>
        <div className="flex-1 overflow-y-auto py-2 no-scrollbar space-y-1">
          {allApps.map((app, idx) => {
            const isActive = app.url === currentApp.url;
            return (
              <div 
                key={idx}
                onClick={() => onSwitchApp(app)}
                className={`
                  relative h-12 flex items-center px-6 cursor-pointer group transition-all duration-200 border-l-[3px]
                  ${isActive ? 'border-xtreme-cyan bg-xtreme-blue/10 text-white' : 'border-transparent text-gray-500 hover:bg-white/5 hover:text-gray-200'}
                `}
              >
                <div className="w-6 flex justify-center shrink-0">
                  <i className={`text-sm ${isActive ? 'fa-solid fa-diamond text-xtreme-cyan' : 'fa-solid fa-angle-right'}`} />
                </div>
                <span className="ml-3 text-xs font-bold font-tech uppercase tracking-wider truncate">{app.name}</span>
                {isActive && <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,229,255,0.05)] pointer-events-none" />}
              </div>
            );
          })}
        </div>
        <button onClick={onClose} className="h-14 border-t border-white/5 flex items-center px-6 hover:bg-red-900/20 hover:text-red-400 transition-colors group text-gray-400">
          <div className="w-6 flex justify-center shrink-0">
            <i className="fa-solid fa-power-off group-hover:text-red-500 transition-colors shadow-none" />
          </div>
          <span className="ml-3 text-xs font-bold tracking-widest uppercase">Shut Down Module</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 relative bg-white flex flex-col h-full w-full overflow-hidden">
        {/* Topbar */}
        <div className="h-12 bg-[#050608] border-b border-xtreme-blue/20 flex items-center justify-between px-4 shrink-0 shadow-lg relative z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-xtreme-cyan hover:text-white transition-colors p-2 rounded hover:bg-xtreme-blue/20 border border-transparent hover:border-xtreme-cyan/30">
              <i className="fa-solid fa-bars-staggered text-lg" />
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest leading-none">Active Module</span>
              <span className="text-sm font-bold font-tech text-white uppercase tracking-wide truncate">{currentApp.name}</span>
            </div>
          </div>
          <button onClick={onClose} className="flex items-center justify-center gap-2 px-3 py-1.5 rounded bg-xtreme-cyan/10 hover:bg-xtreme-cyan/20 border border-xtreme-cyan/30 hover:border-xtreme-cyan text-xtreme-cyan hover:text-white transition-all group" title="Ir al Inicio">
            <i className="fa-solid fa-house text-sm group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline-block">Inicio</span>
          </button>
        </div>

        {/* App Content */}
        <div className="flex-1 relative w-full h-full bg-[#1e293b]">
          {currentApp.isNative ? (
            <div className="w-full h-full overflow-y-auto">
              {renderNativeApp()}
            </div>
          ) : (
            <>
              <AnimatePresence>
                {iframeLoading && (
                  <motion.div 
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 z-10"
                  >
                    <TechLoading message="Connecting Secure Channel" />
                  </motion.div>
                )}
              </AnimatePresence>
              <iframe 
                src={getIframeUrl(currentApp.url)} 
                className="w-full h-full border-0 block bg-white" 
                onLoad={handleIframeLoad}
                title="App Frame"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

declare global {
  interface Window {
    XTREME_URL_PARAMS: Record<string, string>;
  }
}

export default function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [apps, setApps] = useState<AppDef[]>([]);
  const [isAppsLoading, setIsAppsLoading] = useState(true);
  const [activeApp, setActiveApp] = useState<AppDef | null>(null);
  const [loginError, setLoginError] = useState<string | undefined>();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [time, setTime] = useState("");
  const [isPhoneCollapsed, setIsPhoneCollapsed] = useState(false);
  const [facturaRapidaId, setFacturaRapidaId] = useState<string | null>(null);
  
  // State for global context params to make apps reactive
  const [xtremeParams, setXtremeParams] = useState<Record<string, string>>(() => {
    // Initialize from global if exists, or URL
    const params = new URLSearchParams(window.location.search);
    const initial: Record<string, string> = {};
    if (params.get('contact_id')) initial.contact_id = params.get('contact_id')!;
    if (params.get('conversation_id')) initial.conversation_id = params.get('conversation_id')!;
    
    // Merge with existing global if any
    return { ...(window.XTREME_URL_PARAMS || {}), ...initial };
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const facturaId = params.get('factura_rapida');
    if (facturaId) {
      setFacturaRapidaId(facturaId);
      setIsBooting(false); // Skip boot screen for fast invoice
    }
  }, []);

  // Ref to keep track of current params for message handlers without closure issues
  const xtremeParamsRef = React.useRef(xtremeParams);
  useEffect(() => {
    xtremeParamsRef.current = xtremeParams;
    window.XTREME_URL_PARAMS = xtremeParams;
  }, [xtremeParams]);

  // Reloj
  useEffect(() => {
    const updateTime = () => setTime(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
    const timer = setInterval(updateTime, 1000);
    updateTime();
    return () => clearInterval(timer);
  }, []);

  // Restaurar sesión
  useEffect(() => {
    const stored = localStorage.getItem('xtreme_session');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.sessionExpiry > new Date().getTime()) {
          setSession(parsed);
          loadApps(parsed.username);
        } else {
          localStorage.removeItem('xtreme_session');
        }
      } catch (e) {
        localStorage.removeItem('xtreme_session');
      }
    }

    // Forward Chatwoot context to native apps and sync across tabs
    const syncChannel = new BroadcastChannel('xtreme_sync_channel');

    const handleMessage = (event: MessageEvent) => {
      try {
        let data = event.data;
        
        // Handle request for context from pop-outs
        if (data === 'request_context') {
          if (xtremeParamsRef.current.contact_id || xtremeParamsRef.current.conversation_id) {
            try {
              (event.source as Window)?.postMessage({
                type: 'chatwoot_context',
                contact_id: xtremeParamsRef.current.contact_id,
                conversation_id: xtremeParamsRef.current.conversation_id
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
        
        if (data && (data.event === 'appContext' || data.type === 'chatwoot_context')) {
          const newContactId = data.contact_id?.toString() || data.data?.contact?.id?.toString();
          const newConvId = data.conversation_id?.toString() || data.data?.conversation?.id?.toString();
          
          if (newContactId || newConvId) {
            // Broadcast to other tabs
            syncChannel.postMessage({
              type: 'sync_context',
              contact_id: newContactId,
              conversation_id: newConvId
            });

            setXtremeParams(prev => {
              const updated = {
                ...prev,
                ...(newContactId ? { contact_id: newContactId } : {}),
                ...(newConvId ? { conversation_id: newConvId } : {})
              };
              // Only update if something actually changed to avoid unnecessary re-renders
              if (JSON.stringify(prev) === JSON.stringify(updated)) return prev;
              console.log("Updated XTREME_URL_PARAMS state from message:", updated);
              return updated;
            });
          }
        }
      } catch (e) {
        console.error("Error handling message in App.tsx:", e);
      }
    };

    const handleSyncMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'sync_context') {
        const { contact_id, conversation_id } = event.data;
        setXtremeParams(prev => {
          const updated = {
            ...prev,
            ...(contact_id ? { contact_id } : {}),
            ...(conversation_id ? { conversation_id } : {})
          };
          if (JSON.stringify(prev) === JSON.stringify(updated)) return prev;
          console.log("Updated XTREME_URL_PARAMS state from sync channel:", updated);
          return updated;
        });
      }
    };

    syncChannel.addEventListener('message', handleSyncMessage);
    window.addEventListener('message', handleMessage);

    // Initial request for context
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
    // Retry after 1s and 3s to be sure
    const t1 = setTimeout(requestContext, 1000);
    const t2 = setTimeout(requestContext, 3000);

    // Polling fallback for pop-out window
    let pollingInterval: any;
    if (window.parent === window) {
      let lastSeenAt = 0;
      const CW_CONFIG = {
        url: 'https://crm.xtremediagnostics.com',
        token: 'EQN2pbRUuBrjdwEmM7PYyjY6'
      };

      pollingInterval = setInterval(async () => {
        try {
          const [resAll, resMine] = await Promise.all([
            fetch(`${CW_CONFIG.url}/api/v1/accounts/1/conversations?status=all`, { headers: { 'api-access-token': CW_CONFIG.token } }),
            fetch(`${CW_CONFIG.url}/api/v1/accounts/1/conversations?assignee_type=me&status=all`, { headers: { 'api-access-token': CW_CONFIG.token } })
          ]);
          
          if (!resAll.ok || !resMine.ok) return;

          const dataAll = await resAll.json();
          const dataMine = await resMine.json();
          
          const convs = [...(dataAll.data?.payload || []), ...(dataMine.data?.payload || [])];
          
          let maxSeen = 0;
          let activeConv: any = null;
          
          for (const c of convs) {
            if (c.agent_last_seen_at > maxSeen) {
              maxSeen = c.agent_last_seen_at;
              activeConv = c;
            }
          }
          
          if (activeConv && maxSeen > lastSeenAt) {
            const newContactId = activeConv.meta?.sender?.id?.toString();
            const newConvId = activeConv.id?.toString();
            
            if (newContactId && newConvId) {
              setXtremeParams(prev => {
                // On the first run, we just want to initialize lastSeenAt,
                // UNLESS the active conversation is already different from what we have.
                if (lastSeenAt === 0) {
                  lastSeenAt = maxSeen;
                  if (prev.conversation_id === newConvId) {
                    return prev; // Same conversation, just initialized lastSeenAt
                  }
                } else {
                  lastSeenAt = maxSeen;
                }

                const updated = {
                  ...prev,
                  contact_id: newContactId,
                  conversation_id: newConvId
                };
                if (JSON.stringify(prev) === JSON.stringify(updated)) return prev;
                console.log("Updated XTREME_URL_PARAMS state from polling:", updated);
                return updated;
              });
            }
          }
        } catch (e) {
          // Silently fail polling
        }
      }, 3000);
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      syncChannel.removeEventListener('message', handleSyncMessage);
      syncChannel.close();
      clearTimeout(t1);
      clearTimeout(t2);
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, []);

  const loadApps = async (username: string) => {
    setIsAppsLoading(true);
    try {
      const res = await fetch(GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getApps', username })
      });
      const data = await res.json();
      
      let appsList = [];
      if (Array.isArray(data)) {
        appsList = data;
      } else if (data && Array.isArray(data.apps)) {
        appsList = data.apps;
      } else {
        console.warn("Apps Script returned unexpected format:", data);
        // Do not throw error, just use empty list to avoid crashing the app
        appsList = [];
      }

      // Procesar apps de Apps Script
      const processedApps = appsList.map((app: any) => {
        if (app.name && app.name.toLowerCase().includes('cotizaci')) {
          return { ...app, isNative: true, id: 'cotizaciones' };
        }
        return app;
      });
      
      // Inyectar nuestras apps nativas siempre
      const nativeApps: AppDef[] = [
        { name: "Resumen Cliente", url: "native://crm", category: "CRM", isNative: true, id: "crm", iconClass: "fa-solid fa-id-card-clip" },
        { name: "Cotizaciones", url: "native://cotizaciones", category: "Ventas", isNative: true, id: "cotizaciones", iconClass: "fa-solid fa-file-invoice-dollar" },
        { name: "Ventas", url: "native://ventas", category: "Ventas", isNative: true, id: "ventas", iconClass: "fa-solid fa-money-bill-trend-up" },
        { name: "Envíos", url: "native://envios", category: "Logística", isNative: true, id: "envios", iconClass: "fa-solid fa-truck-fast" },
        { name: "Tickets Soporte", url: "native://tickets", category: "Soporte", isNative: true, id: "tickets", iconClass: "fa-solid fa-life-ring" },
        { name: "Plantillas", url: "native://plantillas", category: "Soporte", isNative: true, id: "plantillas", iconClass: "fa-solid fa-message" }
      ];

      // Mezclar evitando duplicados por nombre
      const finalApps = [...nativeApps];
      processedApps.forEach((pa: any) => {
        if (pa.name && !finalApps.find(na => na.name.toLowerCase() === pa.name.toLowerCase())) {
          finalApps.push(pa);
        }
      });

      setApps(finalApps);
    } catch (error) {
      console.error("Error loading apps:", error);
      // Fallback local con las 3 apps nativas
      setApps([
        { name: "Resumen Cliente", url: "native://crm", category: "CRM", isNative: true, id: "crm", iconClass: "fa-solid fa-address-card" },
        { name: "Cotizaciones", url: "native://cotizaciones", category: "Ventas", isNative: true, id: "cotizaciones", iconClass: "fa-solid fa-file-invoice-dollar" },
        { name: "Ventas", url: "native://ventas", category: "Ventas", isNative: true, id: "ventas", iconClass: "fa-solid fa-chart-line" },
        { name: "Envíos", url: "native://envios", category: "Logística", isNative: true, id: "envios", iconClass: "fa-solid fa-truck-fast" },
        { name: "Tickets Soporte", url: "native://tickets", category: "Soporte", isNative: true, id: "tickets", iconClass: "fa-solid fa-headset" },
        { name: "Plantillas", url: "native://plantillas", category: "Soporte", isNative: true, id: "plantillas", iconClass: "fa-solid fa-message" }
      ]);
    } finally {
      setIsAppsLoading(false);
    }
  };

  const handleLogin = async (u: string, p: string) => {
    setIsLoggingIn(true);
    setLoginError(undefined);

    try {
      const res = await fetch(GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'login', username: u, password: p })
      });
      const data = await res.json();

      if (data.success) {
        const expiry = new Date().getTime() + (1000 * 60 * 60 * 24 * 7); // 7 días
        const validUsername = data.username || u;
        const newSession = { username: validUsername, photoUrl: data.photoUrl || '', sessionExpiry: expiry };
        setSession(newSession);
        localStorage.setItem('xtreme_session', JSON.stringify(newSession));
        localStorage.setItem('last_user_name', validUsername);
        if (data.photoUrl) localStorage.setItem('last_user_photo', data.photoUrl);
        loadApps(validUsername);
      } else {
        setLoginError(data.message || "Credenciales incorrectas");
      }
    } catch (error) {
      setLoginError("Error de conexión con el servidor.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('xtreme_session');
    setSession(null);
    setApps([]);
    setActiveApp(null);
  };

  if (facturaRapidaId) {
    return <FacturacionRapidaApp cotizacionId={facturaRapidaId} />;
  }

  if (isBooting) {
    return <BootScreen onComplete={() => setIsBooting(false)} />;
  }

  if (!session) {
    return <LoginScreen onLogin={handleLogin} error={loginError} isLoading={isLoggingIn} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col relative text-white overflow-hidden bg-[#020203]">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.03)_1px,transparent_1px)] bg-[length:40px_40px] opacity-20 pointer-events-none" />
      
      {/* Header */}
      <header className="w-full tech-panel flex items-center justify-between px-6 z-40 shrink-0 h-24 select-none bg-gradient-to-b from-[#0a0c10] to-transparent">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 flex items-center justify-center filter drop-shadow-[0_0_15px_rgba(0,51,204,0.4)]">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <linearGradient id="gradBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0066ff" />
                  <stop offset="100%" stopColor="#002288" />
                </linearGradient>
                <linearGradient id="gradCyan" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#00f0ff" />
                  <stop offset="100%" stopColor="#0099ff" />
                </linearGradient>
              </defs>
              <path d="M 15 20 L 50 50 L 15 80 L 30 80 L 65 50 L 30 20 Z" fill="url(#gradBlue)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <path d="M 85 20 L 50 50 L 85 80 L 70 80 L 35 50 L 70 20 Z" fill="url(#gradCyan)" style={{ mixBlendMode: "screen" }} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            </svg>
          </div>
          <div className="flex flex-col justify-center leading-none mt-1">
            <div className="flex flex-col">
              <span className="text-3xl font-black italic tracking-wider text-white font-tech bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 drop-shadow-sm">XTREME</span>
              <span className="text-xl font-bold tracking-widest text-white font-tech -mt-1">DIAGNOSTICS</span>
            </div>
            <div className="h-px w-full bg-gradient-to-r from-xtreme-blue via-xtreme-cyan to-transparent my-1 opacity-50" />
            <div className="flex flex-col items-start gap-1">
              <span className="text-[10px] text-gray-400 tracking-[0.25em] font-semibold uppercase font-hud">Professional Automotive</span>
              <button 
                onClick={() => {
                  const url = new URL(window.location.href);
                  // Ensure we pass the current context to the new window initially
                  if (xtremeParams.contact_id) url.searchParams.set('contact_id', xtremeParams.contact_id);
                  if (xtremeParams.conversation_id) url.searchParams.set('conversation_id', xtremeParams.conversation_id);
                  window.open(url.toString(), '_blank', 'width=1280,height=800,menubar=no,toolbar=no,location=no,status=no');
                }}
                className="text-[9px] font-hud tracking-widest text-xtreme-blue border border-xtreme-blue/30 px-2 py-0.5 rounded hover:bg-xtreme-blue/10 hover:text-xtreme-cyan transition-colors flex items-center gap-1.5"
                title="Abrir en ventana independiente"
              >
                <i className="fa-solid fa-external-link-alt" /> POP-OUT
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="hidden md:flex flex-col items-end border-r border-white/10 pr-6">
            <span className="text-[10px] text-xtreme-cyan font-hud tracking-widest">SYSTEM_STATUS</span>
            <span className="text-xs text-emerald-400 font-bold tracking-widest uppercase flex items-center gap-2 font-hud">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_#34d399]" /> ONLINE
            </span>
          </div>
          
          <div className="hidden sm:flex items-center gap-4">
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onDoubleClick={handleLogout}
              title="Doble clic para cerrar sesión"
            >
              {session.photoUrl ? (
                <div className="w-10 h-10 rounded-full border border-xtreme-cyan/50 overflow-hidden shadow-[0_0_10px_rgba(0,240,255,0.3)] group-hover:border-red-500/50 transition-colors">
                  <img src={session.photoUrl} alt="User" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-xtreme-blue/20 to-transparent border border-white/10 flex items-center justify-center shadow-inner group-hover:border-red-500/50 transition-colors">
                  <i className="fa-solid fa-user-astronaut text-xl text-xtreme-cyan/80 group-hover:text-red-400 transition-colors" />
                </div>
              )}
              <div className="text-left flex flex-col justify-center">
                <div className="text-sm text-gray-200 font-semibold font-tech tracking-wide group-hover:text-red-400 transition-colors">{session.username}</div>
                <div className="text-[10px] text-xtreme-blue uppercase tracking-wider font-bold">Authorized Personnel</div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end pl-4">
            <span className="text-3xl font-hud font-bold text-white leading-none tracking-widest tabular-nums">{time}</span>
          </div>
        </div>
      </header>

      {/* Split View Layout */}
      <main className="flex-1 relative overflow-hidden flex flex-row w-full h-full bg-[#020203]">
        
        {/* Left Side: Mobile Phone Simulator */}
        <div className={`h-full border-r border-white/10 relative flex flex-col shrink-0 bg-[#050608] shadow-[10px_0_30px_rgba(0,0,0,0.5)] z-10 transition-all duration-300 ${isPhoneCollapsed ? 'w-24' : 'w-[380px]'}`}>
          
          {/* Collapse Toggle Button */}
          <button 
            onClick={() => setIsPhoneCollapsed(!isPhoneCollapsed)}
            className="absolute -right-4 top-1/2 -translate-y-1/2 w-4 h-16 bg-[#050608] border border-white/10 border-l-0 rounded-r-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors z-20 shadow-[5px_0_10px_rgba(0,0,0,0.3)]"
          >
            <i className={`fa-solid fa-chevron-${isPhoneCollapsed ? 'right' : 'left'} text-[10px]`} />
          </button>

          {/* Phone Header / Status Bar */}
          <div className={`h-6 w-full flex items-center ${isPhoneCollapsed ? 'justify-center' : 'justify-between px-4'} text-[10px] text-gray-500 font-hud bg-black/50 shrink-0`}>
            {!isPhoneCollapsed && <span>XTREME OS</span>}
            <div className="flex items-center gap-2">
              {!isPhoneCollapsed && <i className="fa-solid fa-signal" />}
              {!isPhoneCollapsed && <i className="fa-solid fa-wifi" />}
              <i className="fa-solid fa-battery-full" />
            </div>
          </div>

          {/* Apps Container */}
          <div className="flex-1 overflow-y-auto p-4 no-scrollbar relative">
            <AnimatePresence mode="wait">
              {isAppsLoading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  <TechLoading />
                </motion.div>
              ) : apps.length === 0 ? (
                <motion.div 
                  key="no-apps"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full text-white/30 gap-6"
                >
                  <i className="fa-solid fa-triangle-exclamation text-4xl mb-2 text-xtreme-blue opacity-50" />
                  {!isPhoneCollapsed && <span className="text-sm tracking-[0.2em] uppercase font-bold font-hud text-center">NO APPS</span>}
                </motion.div>
              ) : (
                <motion.div 
                  key="apps-grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`grid ${isPhoneCollapsed ? 'grid-cols-1 gap-4' : 'grid-cols-3 gap-4'}`}
                >
                  {apps.map((app, idx) => (
                    <AppIcon key={idx} app={app} onClick={setActiveApp} collapsed={isPhoneCollapsed} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* AI Toolbar at bottom of launcher (Pill style) */}
          {!isPhoneCollapsed && (
            <div className="h-24 flex items-center justify-center shrink-0 pb-6">
              <div className="flex items-center bg-white/5 border border-white/10 rounded-full overflow-hidden shadow-lg backdrop-blur-md">
                <button 
                  onClick={() => loadApps(session.username)}
                  className="px-4 py-3 text-gray-400 hover:text-white hover:bg-white/10 transition-colors border-r border-white/10"
                  title="Recargar Apps"
                >
                  <i className="fa-solid fa-rotate" />
                </button>
                <a href="https://gemini.google.com" target="_blank" rel="noopener noreferrer" className="px-4 py-3 text-blue-400 hover:text-blue-300 hover:bg-white/10 transition-colors border-r border-white/10" title="Gemini">
                  <Sparkles size={18} />
                </a>
                <a href="https://chat.openai.com" target="_blank" rel="noopener noreferrer" className="px-4 py-3 text-emerald-400 hover:text-emerald-300 hover:bg-white/10 transition-colors border-r border-white/10" title="ChatGPT">
                  <Bot size={18} />
                </a>
                <a href="https://chat.deepseek.com" target="_blank" rel="noopener noreferrer" className="px-4 py-3 text-blue-500 hover:text-blue-400 hover:bg-white/10 transition-colors border-r border-white/10" title="DeepSeek">
                  <i className="fa-solid fa-brain text-lg" />
                </a>
                <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" className="px-4 py-3 text-orange-400 hover:text-orange-300 hover:bg-white/10 transition-colors" title="Claude">
                  <i className="fa-solid fa-scroll text-lg" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Client Summary */}
        <div className="flex-1 h-full overflow-hidden bg-slate-50 relative">
          <ClienteResumenApp 
            session={session}
            contactId={xtremeParams.contact_id}
            conversationId={xtremeParams.conversation_id}
            onOpenApp={(appId) => {
              if (appId === 'templates') {
                setActiveApp({
                  name: "Plantillas de Archivos",
                  url: "https://www.xtremediagnostics.com/archivos-crm/",
                  category: "Herramientas",
                  id: "templates",
                  iconClass: "fa-solid fa-folder-open"
                });
                return;
              }
              const app = apps.find(a => a.id === appId);
              if (app) setActiveApp(app);
            }} 
          />
        </div>
      </main>

      {/* Full Screen Active App Overlay */}
      {activeApp && (
        <AppViewer 
          currentApp={activeApp} 
          allApps={apps} 
          onClose={() => setActiveApp(null)} 
          onSwitchApp={setActiveApp} 
          session={session}
          xtremeParams={xtremeParams}
        />
      )}
    </div>
  );
}
