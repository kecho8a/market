import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { Producto } from '../types/store';
import { Carrot, Salad, Milk, Beef, Coffee, Apple, ShieldCheck, Zap, Filter, ArrowRight, Eye, ShoppingCart, Landmark, Check, Bell, Sparkles, Flame, MessageSquare, Search, RefreshCcw, Smartphone, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { SEOHead } from '../components/SEOHead';
import { BentoGrid } from '../components/BentoGrid';
import { ProductCard } from '../components/ProductCard';

interface HomeProps {
  setTab: (tab: 'home' | 'catalog' | 'cart' | 'admin' | 'profile') => void;
  setSelectedCategory: (category: string) => void;
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedEngine: string;
  setSelectedEngine: (engine: string) => void;
  onViewProductDetails: (part: Producto) => void;
  globalSearch: string;
  setGlobalSearch: (term: string) => void;
  navigateToCatalog: (filters?: { category?: string; brand?: string; model?: string; year?: string; engine?: string }) => void;
  deferredPrompt?: any;
  onInstallClick?: () => void;
}

export const Home: React.FC<HomeProps> = ({ 
  setTab, setSelectedCategory, 
  selectedBrand, setSelectedBrand, 
  selectedModel, setSelectedModel, 
  selectedYear, setSelectedYear,
  selectedEngine, setSelectedEngine,
  onViewProductDetails, globalSearch, setGlobalSearch,
  navigateToCatalog,
  deferredPrompt,
  onInstallClick
}) => {
  const { parts, config, addToCart, currentUser, requestPart } = useApp();
  const [activeBanner, setActiveBanner] = useState(0);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [suggestions, setSuggestions] = useState<Producto[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Countdown Timer para la "Oferta del Día"
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();
      
      if (diff > 0) {
        setTimeLeft({
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60)
        });
      }
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
       if (Notification.permission === 'default') {
         const timer = setTimeout(() => setShowNotificationPrompt(true), 1500);
         return () => clearTimeout(timer);
       }
    }
  }, []);

  const handleRequestPermissionHome = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        if (res === 'granted') {
          new Notification('Notificaciones Habilitadas', {
            body: 'Ahora recibiras alertas en tiempo real de tus pedidos y promociones de Marketo.',
            icon: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=100',
            tag: 'welcome-marketo'
          });
        }
        setShowNotificationPrompt(false);
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBanner(prev => (prev + 1) % config.banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [config.banners.length]);

  const CATEGORIES = useMemo(() => {
    return (config.categories || []).map(catName => {
      const nameLower = catName.toLowerCase();
      let icon = Carrot;
      if (nameLower.includes('lácteo') || nameLower.includes('queso') || nameLower.includes('leche')) {
        icon = Milk;
      } else if (nameLower.includes('carne') || nameLower.includes('ave') || nameLower.includes('pollo') || nameLower.includes('res') || nameLower.includes('cerdo')) {
        icon = Beef;
      } else if (nameLower.includes('charcu') || nameLower.includes('jamon') || nameLower.includes('embutido') || nameLower.includes('salchicha')) {
        icon = Salad;
      } else if (nameLower.includes('fruta') || nameLower.includes('verdu') || nameLower.includes('fresco') || nameLower.includes('vegetal')) {
        icon = Carrot;
      } else if (nameLower.includes('pan') || nameLower.includes('paste') || nameLower.includes('reposte') || nameLower.includes('tortas')) {
        icon = Coffee;
      } else if (nameLower.includes('bebida') || nameLower.includes('jugo') || nameLower.includes('refresco') || nameLower.includes('agua')) {
        icon = Coffee;
      } else if (nameLower.includes('snack') || nameLower.includes('dulce') || nameLower.includes('chucher') || nameLower.includes('galleta') || nameLower.includes('chocolate')) {
        icon = Apple;
      }
      return {
        name: catName,
        label: catName,
        icon,
        color: 'text-violet-600 border-violet-200 bg-violet-50/50 hover:bg-violet-100/50'
      };
    });
  }, [config.categories]);

  const activeParts = useMemo(() => parts.filter(p => p.activo !== false), [parts]);
  const brands = useMemo(() => Array.from(new Set(activeParts.filter(p => p.seccion).map(p => p.seccion))), [activeParts]);
  const models = useMemo(() => Array.from(new Set(activeParts.filter(p => (!selectedBrand || p.seccion === selectedBrand) && p.subseccion).map(p => p.subseccion))), [activeParts, selectedBrand]);
  const yearsRange = useMemo(() => { // Mantenido por compatibilidad de tipos, pero con años actuales
    const years: number[] = [];
    for (let yr = 1998; yr <= 2026; yr++) years.push(yr);
    return years.reverse();
  }, []);

  // Preferencias de dieta o tipos de producto (Reemplaza lógica de motores automotrices)
  const dietaryPreferences = useMemo(() => {
    if (!selectedBrand || !selectedModel) return [];
    
    const list = activeParts
      .filter(p => p.seccion === selectedBrand && p.subseccion === selectedModel)
      .flatMap(p => {
        const matches: string[] = [];
        const combined = `${p.nombre} ${p.detalle_adicional || ''} ${p.descripcion || ''}`.toLowerCase();
        
        const keywords = [
          'sin gluten', 'organico', 'keto', 'vegano', 'artesanal', 'importado', 'nacional', 'light', 'integral'
        ];
        keywords.forEach(kw => {
          if (combined.includes(kw)) {
             let display = kw.toUpperCase();
             matches.push(display);
          }
        });
        return matches;
      });
    
    return Array.from(new Set(list)).sort();
  }, [activeParts, selectedBrand, selectedModel]);

  const navigateToCatalogWithEngine = () => {
    navigateToCatalog({ 
      brand: selectedBrand, 
      model: selectedModel, 
      year: selectedYear,
      engine: selectedEngine // Mapeado internamente a preferencia
    });
  };

  const promoParts = parts.filter(p => p.es_promo && p.stock > 0 && p.activo !== false);
  const newParts = parts.filter(p => p.es_nuevo && p.stock > 0 && p.activo !== false);
  const bestsellerParts = parts.filter(p => p.es_mas_vendido && p.stock > 0 && p.activo !== false);

  const dailyDeal = useMemo(() => promoParts[0], [promoParts]);

  useEffect(() => {
    if (globalSearch.trim().length > 1) {
      const filtered = parts
        .filter(p => 
          p.activo !== false && 
          (p.nombre.toLowerCase().includes(globalSearch.toLowerCase()) || 
           p.descripcion.toLowerCase().includes(globalSearch.toLowerCase()) ||
           p.categoria.toLowerCase().includes(globalSearch.toLowerCase()) ||
           p.seccion.toLowerCase().includes(globalSearch.toLowerCase()) ||
           p.subseccion.toLowerCase().includes(globalSearch.toLowerCase()))
        )
        .slice(0, 6);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [globalSearch, parts]);

  const handleCategoryClick = (catName: string) => {
    navigateToCatalog({ category: catName });
  };

  const handleAddDailyDeal = () => {
    if (dailyDeal) {
      addToCart(dailyDeal);
      if (typeof (window as any).confetti === 'function') {
        (window as any).confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#7c3aed', '#f59e0b', '#ef4444', '#ffffff'],
          shapes: ['star', 'circle']
        });
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* AVISO DE TIENDA CERRADA */}
      {!config.esta_abierta && (
        <div className="sticky top-4 z-[60] mx-1">
          <div className="bg-rose-600 text-white p-4 rounded-2xl shadow-xl flex items-center gap-4 border border-rose-500 animate-in slide-in-from-top-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase">Hoy no trabajamos</h4>
              <p className="text-xs text-white/90">Estamos tomando un descanso. Puedes ver el catálogo, pero el procesamiento de pedidos está pausado.</p>
            </div>
          </div>
        </div>
      )}
      <SEOHead title="Supermercado Express Marketo en Valencia" type="home" />
      <h1 className="sr-only">Supermercado Premium en Valencia con Delivery | Compra Víveres, Carnes, Quesos y Frescos en Naguanagua y San Diego</h1>

      {/* Tasa de Cambio Oficial (Solo en Home y Checkout) */}
      <div className="flex justify-end px-1 -mb-4">
        <div className="bg-violet-50 border border-violet-200 px-3 py-1 rounded-full text-[10px] font-mono font-bold text-violet-700 uppercase tracking-tighter shadow-sm animate-pulse">Tasa Oficial BCV: {config.tasa_cambio.toFixed(2)} Bs.</div>
      </div>

      {/* 1. PREMIUM ROTATING BANNER */}
      <div className="relative h-[180px] md:h-[260px] w-full bg-zinc-200 rounded-xl overflow-hidden border border-zinc-200 shadow-lg select-none">
        {config.banners.map((url, index) => (
          <div
            key={url}
            className={`absolute inset-0 transition-opacity duration-800 ${index === activeBanner ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            <img
              src={url}
              alt={`Promoción ${index + 1}`}
              className="w-full h-full object-cover opacity-85"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

            <div className="absolute left-6 bottom-6 z-20 flex flex-col items-start gap-1">
              <span className="text-[11px] uppercase font-bold tracking-wider text-white bg-violet-600/90 border border-violet-400 px-2.5 py-1 rounded">
                {config.site_nombre}
              </span>
              <h2 className="text-xl md:text-2xl font-bold font-display text-white mt-1.5 max-w-sm drop-shadow-md leading-tight">
                {config.banner_texts?.[index] || (index === 0 ? 'FRESCOS Y DELICATESSEN ORGANICOS' : index === 1 ? 'VÍVERES Y DESPENSA PREMIUM' : 'CARNES Y EMBUTIDOS SELECCIONADOS')}
              </h2>
              <button
                type="button"
                onClick={() => setTab('catalog')}
                className="mt-3 bg-violet-600 hover:bg-violet-700 text-white text-[12px] font-bold px-4 py-2 rounded-lg transition-all shadow-md uppercase tracking-wider flex items-center gap-1.5 cursor-pointer animate-pulse"
              >
                Explorar Catálogo
              </button>
            </div>
          </div>
        ))}

        <div className="absolute right-4 bottom-4 z-25 flex gap-1.5">
          {config.banners.map((_, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setActiveBanner(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${i === activeBanner ? 'bg-violet-600 w-4' : 'bg-white/40'}`}
            />
          ))}
        </div>
      </div>

      {/* 2. DYNAMIC TEXT BUBBLES CATEGORIES CAROUSEL */}
      <div className="w-full flex flex-col gap-2.5 mt-1 px-1">
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth no-scrollbar select-none">
          {CATEGORIES.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.name);
                  setTab('catalog');
                }}
                className="shrink-0 snap-start flex items-center gap-2 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-150 rounded-full px-4.5 py-2.5 text-xs font-bold transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer animate-fade-in"
              >
                <IconComponent size={13} className="text-violet-600 shrink-0" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>


      {showNotificationPrompt && (
        <div id="home-notification-invite" className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-zinc-200 rounded-xl bg-gradient-to-r from-zinc-50 to-zinc-100/30 text-xs gap-3 animate-fade-in shadow-xs">
          <div className="flex gap-2.5 items-start sm:items-center">
            <span className="p-2 rounded-lg bg-violet-50 text-violet-600 shrink-0 text-base">
              <Bell size={16} />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-zinc-900 text-xs">Activar Notificaciones en Vivo</span>
              <span className="text-[11px] text-zinc-500 leading-normal">Recibe alertas en tiempo real de tus pedidos (En camino, Preparación) y promociones exclusivas.</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 md:justify-end">
            <button
              type="button"
              onClick={() => setShowNotificationPrompt(false)}
              className="text-zinc-400 hover:text-zinc-650 transition-colors uppercase font-mono font-bold text-[10px] px-2 py-1.5 cursor-pointer font-sans"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleRequestPermissionHome}
              className="bg-violet-600 hover:bg-violet-700 text-white font-extrabold max-sm:w-full font-display uppercase tracking-wider px-4 py-2 rounded-lg text-[11px] transition-all cursor-pointer shadow-xs active:scale-95"
            >
              Habilitar
            </button>
          </div>
        </div>
      )}

      {promoParts.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[19px] font-bold text-slate-900 flex items-center gap-2">
              <Zap className="text-violet-600" size={20} /> Ofertas de Locura
            </h3>
            <button
              type="button"
              onClick={() => { setSelectedCategory(''); setTab('catalog'); }}
              className="text-[13px] font-semibold text-violet-650 hover:text-violet-750 cursor-pointer"
            >
              Ver todo
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 px-4 -mx-4 snap-x snap-mandatory scroll-smooth no-scrollbar">
            {promoParts.map((part) => (
              <ProductCard key={part.id} part={part} config={config} onViewProductDetails={onViewProductDetails} addToCart={addToCart} isOffer={true} />
            ))}
          </div>
        </div>
      )}

      {newParts.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[19px] font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="text-violet-500" size={20} /> Recién Ingresados
            </h3>
            <button
              type="button"
              onClick={() => { setSelectedCategory(''); setTab('catalog'); }}
              className="text-[13px] font-semibold text-violet-650 hover:text-violet-750 cursor-pointer"
            >
              Ver todo
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 px-4 -mx-4 snap-x snap-mandatory scroll-smooth no-scrollbar">
            {newParts.map((part) => (
              <ProductCard key={part.id} part={part} config={config} onViewProductDetails={onViewProductDetails} addToCart={addToCart} />
            ))}
          </div>
        </div>
      )}

      {bestsellerParts.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[19px] font-bold text-slate-900 flex items-center gap-2">
              <Flame className="text-violet-600" size={20} /> Alimentos Más Solicitados
            </h3>
            <button
              type="button"
              onClick={() => { setSelectedCategory(''); setTab('catalog'); }}
              className="text-[13px] font-semibold text-violet-650 hover:text-violet-750 cursor-pointer"
            >
              Ver todo
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 px-4 -mx-4 snap-x snap-mandatory scroll-smooth no-scrollbar">
            {bestsellerParts.map((part) => (
              <ProductCard key={part.id} part={part} config={config} onViewProductDetails={onViewProductDetails} addToCart={addToCart} />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 p-5 border border-violet-100 rounded-2xl bg-violet-50/30 shadow-sm relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <h3 className="text-[18px] font-bold text-violet-900 flex items-center gap-2">
          <MessageSquare size={20} className="text-violet-600" /> ¿Buscas un Producto Especial?
        </h3>
        <p className="text-[13px] text-violet-800/80 leading-relaxed font-medium">Explícanos qué ingrediente, corte o vívere necesitas y nuestro equipo te ayudará a conseguir el artículo exacto.</p>
        <div className="flex flex-col gap-3 z-10">
          <input 
            type="text"
            id="req-phone"
            defaultValue={currentUser?.telefono || ''}
            className="w-full text-xs p-3.5 border border-violet-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white text-[13px]" 
            placeholder="Tu número telefónico (Ej: +584120001122)"
          />
          <textarea 
            className="w-full text-xs p-3.5 border border-violet-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white text-[13px]" 
            placeholder="Ej: Busco Harina Pan de trigo, cortes de carne especiales, etc..."
            id="req-desc"
            rows={3}
          />
          <button 
            onClick={() => {
              const desc = (document.getElementById('req-desc') as HTMLTextAreaElement).value;
              const phone = (document.getElementById('req-phone') as HTMLInputElement).value;
              if (desc && phone) {
                requestPart(currentUser?.nombre || 'Invitado/Cliente No Registrado', phone, desc);
                (document.getElementById('req-desc') as HTMLTextAreaElement).value = '';
                alert('¡Solicitud enviada! Nuestro equipo te contactará.');
              } else {
                alert('Por favor, ingresa tu teléfono y la descripción del producto.');
              }
            }}
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-3.5 font-bold text-xs cursor-pointer shadow-md shadow-violet-200 transition-all active:scale-[0.98] text-[13px]"
          >
            Enviar Solicitud de Pedido Especial
          </button>
        </div>
        <a 
          href={`https://wa.me/${config.telefono_soporte.replace(/[^0-9]/g, '')}`}
          target="_blank"
          className="text-center text-xs font-semibold text-violet-800 underline mt-1 cursor-pointer hover:text-violet-650 text-[13px]"
        >
          O contactar vía WhatsApp
        </a>
      </div>

      <BentoGrid />

      {/* PWA INSTALLATION BANNER - MOVILIZADO AL FINAL CON FONDO TEMÁTICO */}
      <div className="w-full bg-zinc-900 text-white rounded-2xl p-6 shadow-2xl relative overflow-hidden min-h-[240px] flex flex-col justify-center border border-zinc-800 select-none bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center">
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-transparent z-0"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <span className="text-[10px] uppercase font-black tracking-widest bg-violet-600 text-white px-2 py-0.5 rounded shadow-sm">Marketo App</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-300">Instalación Express</span>
            </div>
            <h3 className="text-2xl font-black font-display mt-2 leading-tight max-w-xs">Tu mercado siempre a un toque de distancia</h3>
            <p className="text-[12px] text-zinc-200 leading-relaxed mt-2 max-w-sm font-medium">
              Instala nuestra app y recibe notificaciones en tiempo real, seguimiento de delivery con mapa y ofertas exclusivas para Valencia.
            </p>
          </div>
          
          <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
            {deferredPrompt ? (
              <button
                type="button"
                onClick={onInstallClick}
                className="bg-white hover:bg-zinc-100 text-zinc-900 font-black font-display uppercase tracking-wider px-8 py-4 rounded-xl text-[11px] transition-all cursor-pointer shadow-xl active:scale-95 flex items-center justify-center gap-2"
              >
                <Smartphone size={16} /> <span>Descargar Aplicación</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
                  if (isiOS) {
                    alert("Para instalar en iPhone: 1. Abre Safari. 2. Presiona 'Compartir'. 3. Selecciona 'Agregar a inicio'.");
                  } else {
                    alert("Para instalar en Android: 1. Abre Chrome. 2. Presiona los 3 puntos. 3. Selecciona 'Instalar aplicación'.");
                  }
                }}
                className="bg-violet-600 hover:bg-violet-500 text-white border border-violet-400/30 font-bold font-display uppercase tracking-wider px-6 py-3 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>¿Cómo instalar en mi móvil?</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-8 border-t border-zinc-200 pt-8 pb-4 px-1 text-zinc-650">
        <h2 className="text-sm font-black font-display text-zinc-900 uppercase tracking-widest mb-3">
          Víveres y Delicatessen a Domicilio en Valencia, San Diego y Naguanagua
        </h2>
        <p className="text-xs leading-relaxed text-zinc-500 mb-3 font-sans">
          ¿Buscando víveres y productos frescos en Valencia, San Diego o Naguanagua? <strong>Marketo</strong> es tu mejor opción de supermercado premium con delivery directo a tu puerta o local comercial. Somos especialistas en ofrecer el catálogo más selecto de lácteos, quesos finos, carnes premium, despensa importada, vegetales orgánicos y licores. Si no encuentras algún producto específico en nuestro sitio, ¡lo conseguimos para ti y te lo entregamos de inmediato!
        </p>
        <p className="text-xs leading-relaxed text-zinc-500 mb-4 font-sans">
          Nuestra logística de <strong>Delivery Express</strong> cubre las zonas de El Viñedo, Prebo, Las Acacias, Los Nísperos, Guaparo, Tazajal, Mañongo y Flor Amarillo. Despachamos con empaques térmicos especializados para garantizar la frescura y conservación de cada producto. Aceptamos pagos en dólares (USD), Zelle y bolívares (Bs) a tasa oficial BCV, brindando transparencia y comodidad en cada entrega a domicilio en el estado Carabobo.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[10px] font-mono border-t border-zinc-100 pt-4 text-zinc-400">
          <div>
            <h3 className="font-bold text-zinc-700 uppercase mb-1">Víveres Frescos Valencia</h3>
            <p>Quesos importados, cortes premium, frutas frescas, víveres finos con delivery express.</p>
          </div>
          <div>
            <h3 className="font-bold text-zinc-700 uppercase mb-1">Delivery Naguanagua</h3>
            <p>Despacho a domicilio de supermercado en Tazajal, Mañongo y todo Naguanagua con cadena de frío garantizada.</p>
          </div>
          <div>
            <h3 className="font-bold text-zinc-700 uppercase mb-1">Supermercado San Diego</h3>
            <p>Conseguimos cualquier ingrediente premium, embutidos y licores selectos y te los llevamos a San Diego hoy mismo.</p>
          </div>
          <div>
            <h3 className="font-bold text-zinc-700 uppercase mb-1">Seguimiento de Delivery</h3>
            <p>Monitoreo en vivo de tu delivery express de supermercado en Valencia, Prebo, Las Acacias y Naguanagua.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
