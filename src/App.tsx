import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { Checkout } from './pages/Checkout';
import { Admin } from './pages/Admin';
import { UserProfile } from './pages/UserProfile';
import { Navigation } from './components/Navigation';
import { BarcodeScanner } from './components/BarcodeScanner';
import { AutoPart } from './types/store';
import { PushNotificationModal } from './components/PushNotificationModal';
import { 
  X, ShoppingCart, Landmark, ShieldCheck, Tag, Info, AlertOctagon, 
  HelpCircle, Eye, Share2, ClipboardCheck, ChevronLeft, ChevronRight,
  Menu, Sparkles, Bell, User, Cpu, ShoppingBag, MapPin, ShieldAlert, RefreshCw,
  Search, ArrowRight
} from 'lucide-react';
import { SEOHead } from './components/SEOHead';

function AppContent() {
  const { cart, config, addToCart, isAdminAuthenticated, authenticateAdmin, logoutAdmin, currentUser, notifications, displayCurrency, toggleCurrency } = useApp();

  // Route/Tab controllers
  const [tab, setTab] = useState<'home' | 'catalog' | 'cart' | 'admin' | 'profile'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedEngine, setSelectedEngine] = useState<string>('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Custom Overlays & Modals
  const [selectedProductDetails, setSelectedProductDetails] = useState<AutoPart | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedCode, setScannedCode] = useState<string>('');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [headerSearchInput, setHeaderSearchInput] = useState<string>('');

  useEffect(() => {
    setHeaderSearchInput(globalSearch);
  }, [globalSearch]);

  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminUserInput, setAdminUserInput] = useState('');
  const [microModalQuantity, setMicroModalQuantity] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const resetAllFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setSelectedModel('');
    setSelectedYear('');
    setSelectedEngine('');
    setGlobalSearch('');
  };

  // Auto reset image index on active detail change
  useEffect(() => {
    setActiveImageIdx(0);
    setMicroModalQuantity(1);
  }, [selectedProductDetails]);
  
  // Authentication trigger helper
  const handleAdminVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = authenticateAdmin(adminUserInput, adminPasswordInput);
    if (success) {
      setTab('admin');
      setIsAdminLoginOpen(false);
      setAdminPasswordInput('');
      setAdminUserInput('');
    } else {
      alert('Credenciales incorrectas');
    }
  };

  // Scan Success helper transfer
  const handleScanCompleted = (code: string) => {
    setScannedCode(code);
    setIsScannerOpen(false);
    setTab('catalog'); // Navigate to catalog immediately to filter
  };

  const handleShareProduct = (part: AutoPart) => {
    const text = `🍏 *${part.nombre}* en *Marketo* • Código SKU: *${part.codigo}* por un precio de *$${part.precio_usd.toFixed(2)} USD*. ¡Pídelo directo al delivery express de Marketo!`;
    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noreferrer');
  };

  const handleHeaderSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalSearch(headerSearchInput);
    setTab('catalog');
  };

  // Header / Navigation helpers
  const navigateToCatalog = (filters?: { category?: string; brand?: string; model?: string; year?: string; engine?: string }) => {
    if (filters) {
      if (filters.category !== undefined) setSelectedCategory(filters.category);
      if (filters.brand !== undefined) setSelectedBrand(filters.brand);
      if (filters.model !== undefined) setSelectedModel(filters.model);
      if (filters.year !== undefined) setSelectedYear(filters.year);
      if (filters.engine !== undefined) setSelectedEngine(filters.engine);
    }
    setTab('catalog');
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 w-full flex justify-center">
      <SEOHead />
      <PushNotificationModal />

      {/* Main Grid Wrapper: Full screen width on PC and mobile viewports */}
      <div className="w-full bg-white flex flex-col lg:flex-row min-h-screen relative">
         {/* A. COLLAPSIBLE LEFT SIDEBAR - Dynamic on Desktop/PC and Mobile */}
        {drawerOpen && (
          <aside className="hidden lg:flex w-[290px] bg-zinc-50 border-r border-zinc-200 flex-col justify-between shrink-0 sticky top-0 h-screen overflow-y-auto no-scrollbar select-none animate-fade-in">
            <div className="flex flex-col">
              {/* Logo e Identidad Visual with X Close Button */}
              <div className="px-5 py-4 border-b border-zinc-200 bg-white flex justify-between items-center select-none">
                <div 
                  onClick={() => { setTab('home'); resetAllFilters(); }}
                  className="flex items-center gap-2.5 cursor-pointer group flex-1 min-w-0"
                >
                  {config.logo_url ? (
                    <img src={config.logo_url} alt={config.site_nombre} className="w-10 h-10 object-contain rounded" />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-150 flex items-center justify-center text-violet-600 shadow-sm shadow-violet-500/15 group-hover:bg-violet-650 group-hover:text-white transition-all shrink-0">
                      <ShoppingBag size={18} className="group-hover:rotate-12 transition-transform duration-300" />
                    </div>
                  )}
                  <div className="flex flex-col truncate">
                    <h1 className="text-sm font-extrabold tracking-tight text-zinc-900 font-display leading-tight line-clamp-1">
                      <span className="text-zinc-900 group-hover:text-violet-600 transition-colors duration-150">{config.site_nombre}</span>
                    </h1>
                    <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-[0.22em] font-mono leading-none mt-1">
                      Premium Supermarket
                    </span>
                  </div>
                </div>

                {/* Close Button X for Desktop/PC */}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="text-zinc-400 hover:text-violet-600 p-1.5 rounded-lg hover:bg-violet-50 border border-transparent hover:border-violet-100 transition-all cursor-pointer flex items-center justify-center shrink-0"
                  title="Colapsar Menú"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Panel de Moneda Preferida */}
              <div className="p-4 border-b border-zinc-250 bg-violet-50/20 text-xs">
                <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider block mb-2 font-mono">Moneda de Visualización</span>
                <button
                  type="button"
                  onClick={toggleCurrency}
                  className="w-full flex items-center justify-between text-zinc-650 font-mono gap-1 bg-white border border-zinc-200 px-3 py-1.5 rounded-lg hover:border-violet-300 transition-colors cursor-pointer active:scale-95 shadow-sm"
                >
                  <div className="flex items-center gap-2 font-bold text-zinc-800">
                    <RefreshCw size={13} className="text-violet-600" /> 
                    {displayCurrency === 'USD' ? 'Dólares (USD)' : 'Bolívares (Bs.)'}
                  </div>
                  <span className="text-[9px] text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded uppercase">Cambiar</span>
                </button>
              </div>

              {/* Listado de Secciones de Navegación Estática */}
              <div className="p-3.5 flex flex-col gap-1.5 pt-4">
                <span className="text-[9px] uppercase font-black text-zinc-400 tracking-wider px-3 py-1 font-mono">Secciones</span>
                
                <button
                  type="button"
                  onClick={() => setTab('home')}
                  style={tab === 'home' ? { backgroundColor: config.theme_color || '#7c3aed' } : {}}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 text-xs rounded-xl font-bold transition-all cursor-pointer ${tab === 'home' ? 'text-white shadow-md shadow-violet-500/10' : 'text-zinc-750 hover:bg-zinc-200/50'}`}
                >
                  Inicio tienda
                </button>

                <button
                  type="button"
                  onClick={() => navigateToCatalog()}
                  style={tab === 'catalog' ? { backgroundColor: config.theme_color || '#7c3aed' } : {}}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 text-xs rounded-xl font-bold transition-all cursor-pointer ${tab === 'catalog' ? 'text-white shadow-md shadow-violet-500/10' : 'text-zinc-750 hover:bg-zinc-200/50'}`}
                >
                  Pasillos del Súper
                </button>

                <button
                  type="button"
                  onClick={() => setTab('cart')}
                  style={tab === 'cart' ? { backgroundColor: config.theme_color || '#7c3aed' } : {}}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 text-xs rounded-xl font-bold transition-all cursor-pointer ${tab === 'cart' ? 'text-white shadow-md shadow-violet-500/10' : 'text-zinc-750 hover:bg-zinc-200/50'}`}
                >
                  Carrito de compras
                  {cart.length > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono">
                      {cart.reduce((acc, ci) => acc + ci.quantity, 0)}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setTab('profile')}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 text-xs rounded-xl font-bold transition-all cursor-pointer ${tab === 'profile' ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10' : 'text-zinc-750 hover:bg-zinc-200/50'}`}
                >
                  Mi Cuenta / Perfil
                </button>
              </div>

              {/* Accesos Rápidos de Utilidad */}
              <div className="p-3.5 border-t border-zinc-200 flex flex-col gap-1 pt-4">
                <span className="text-[9px] uppercase font-black text-zinc-400 tracking-wider px-3 py-1 font-mono">Enlaces rápidos</span>
                
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-xs text-zinc-750 hover:bg-zinc-200/50 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Escáner de Código SKU
                </button>

                <a
                  href={`https://wa.me/${config.telefono_soporte.replace(/[+ ]/g, '')}`}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-xs text-violet-600 hover:bg-violet-600/5 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Soporte en WhatsApp
                </a>
              </div>

              {/* Sede Física */}
              <div className="p-4 border-t border-zinc-200 flex flex-col gap-2 bg-zinc-100/20 text-xs">
                <span className="text-[9px] uppercase font-black text-zinc-400 tracking-wider font-mono">Nuestra Sede</span>
                <div className="flex gap-2 text-zinc-650 leading-relaxed font-sans mt-0.5 font-medium">
                  <MapPin size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-snug">{config.direccion_fisica}</p>
                </div>
              </div>
            </div>

            {/* Estado de la Sesión Administrativa */}
            <div className="p-4 border-t border-zinc-200 bg-zinc-100/50 flex flex-col gap-3">
              {isAdminAuthenticated ? (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setTab('admin')}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white text-[11px] py-2 px-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-violet-500/15 cursor-pointer animate-pulse"
                  >
                    Panel de Admin
                  </button>
                  <button
                     type="button"
                     onClick={() => { logoutAdmin(); setTab('home'); }}
                     className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 text-[10px] py-1.5 rounded-lg font-semibold transition-all font-mono cursor-pointer"
                  >
                    Salir de Admin
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAdminLoginOpen(true)}
                  className="w-full bg-zinc-200/70 hover:bg-zinc-200 text-zinc-850 border border-zinc-300 text-[10px] py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all font-mono cursor-pointer"
                >
                  <ShieldAlert size={12} className="text-yellow-600" />
                  Acceso Admin
                </button>
              )}
              <div className="text-[9px] text-zinc-400 font-mono text-center select-none">
                Marketo v1.0.1 DESKTOP
              </div>
            </div>
          </aside>
        )}

        {/* B. RIGHT VIEWS PANE - Adapts fluidly, takes remaining screen size */}
        <div className="flex-1 flex flex-col min-h-screen relative pb-20 lg:pb-8 overflow-x-hidden">
          <SEOHead />

          {/* 1. PREMIUM HEADER SYSTEM - Woolworths Inspired */}
          <div className="sticky top-0 z-40 flex flex-col w-full select-none shadow-sm">
            {/* A. Top Woolworths Green Bar */}
            <div className="bg-violet-600 text-white py-2.5 px-4 flex items-center justify-between gap-3 border-b border-violet-700">
              {/* Menu Trigger & Brand Logo */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(!drawerOpen)}
                  className="p-1.5 text-white hover:bg-violet-750 rounded-lg transition-all cursor-pointer flex items-center justify-center active:scale-95"
                  title="Toggle Menú"
                >
                  <Menu size={20} />
                </button>
                <div 
                  onClick={() => { setTab('home'); resetAllFilters(); }}
                  className="flex items-center gap-2 cursor-pointer group select-none shrink-0"
                >
                  {config.logo_url ? (
                    <img src={config.logo_url} alt={config.site_nombre} className="w-8 h-8 object-contain rounded" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white transition-all">
                      <ShoppingBag size={18} />
                    </div>
                  )}
                  <span className="text-base font-extrabold tracking-tight text-white font-display hidden sm:inline-block">
                    {config.site_nombre}
                  </span>
                </div>
              </div>

              {/* Central Search Bar */}
              <form onSubmit={handleHeaderSearchSubmit} className="flex-1 max-w-lg relative flex items-center">
                <input
                  type="text"
                  value={headerSearchInput}
                  onChange={(e) => setHeaderSearchInput(e.target.value)}
                  placeholder="Buscar productos, marcas o ingredientes..."
                  className="w-full bg-white text-zinc-900 placeholder-zinc-400 rounded-lg pl-3.5 pr-10 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 shadow-inner font-sans border-0"
                />
                <button
                  type="submit"
                  className="absolute right-0.5 top-0.5 bottom-0.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors cursor-pointer flex items-center justify-center"
                >
                  <Search size={14} />
                </button>
              </form>

              {/* User Avatar & Cart summary */}
              <div className="flex items-center gap-2 shrink-0">
                {isAdminAuthenticated && (
                  <button
                    type="button"
                    onClick={() => setTab('admin')}
                    className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 transition-all border font-mono text-[11px] cursor-pointer active:scale-95 bg-amber-500 hover:bg-amber-600 text-white font-bold border-amber-600 shadow-sm"
                    title="Panel de Administración"
                  >
                    <ShieldAlert size={13} />
                    <span className="hidden md:inline">Panel Admin</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setTab('profile')}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border font-mono text-xs cursor-pointer active:scale-95 ${
                    currentUser 
                      ? 'bg-white/20 text-white border-white/30 font-bold' 
                      : 'bg-white/10 text-white/80 border-transparent hover:bg-white/20'
                  }`}
                  title={currentUser ? `Hola, ${currentUser.nombre}` : "Mi cuenta"}
                >
                  {currentUser ? (
                    <span className="uppercase text-[10px] font-black">{currentUser.nombre.charAt(0)}</span>
                  ) : (
                    <User size={14} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setTab('cart')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all shadow-md active:scale-95 cursor-pointer text-xs font-mono"
                >
                  <ShoppingCart size={15} />
                  <span className="hidden sm:inline text-[11px]">Carrito</span>
                  <span className="bg-black/15 px-1.5 py-0.5 rounded text-[10px] font-bold">
                    {cart.reduce((acc, ci) => acc + ci.quantity, 0)}
                  </span>
                  <span className="border-l border-white/20 pl-1.5 hidden md:inline text-[11px]">
                    {displayCurrency === 'USD' 
                      ? `$${cart.reduce((acc, ci) => acc + (ci.item.precio_usd * ci.quantity), 0).toFixed(2)}` 
                      : `${(cart.reduce((acc, ci) => acc + (ci.item.precio_usd * ci.quantity), 0) * config.tasa_cambio).toFixed(2)} Bs`}
                  </span>
                </button>
              </div>
            </div>

            {/* B. Secondary Navigation Row */}
            <div className="bg-white border-b border-zinc-200 py-2 px-4 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(!drawerOpen)}
                  className="text-zinc-700 hover:text-violet-600 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Menu size={14} /> Explorar pasillos
                </button>
                <div className="h-4 w-px bg-zinc-200"></div>
                <button
                  type="button"
                  onClick={() => setTab('home')}
                  className={`text-xs font-bold transition-colors cursor-pointer ${tab === 'home' ? 'text-violet-600' : 'text-zinc-500 hover:text-zinc-800'}`}
                >
                  Inicio
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedCategory(''); setTab('catalog'); }}
                  className={`text-xs font-bold transition-colors cursor-pointer ${tab === 'catalog' ? 'text-violet-600' : 'text-zinc-500 hover:text-zinc-800'}`}
                >
                  Productos
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('catalog'); }}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
                >
                  Ofertas
                </button>
                {isAdminAuthenticated && (
                  <>
                    <div className="h-4 w-px bg-zinc-200"></div>
                    <button
                      type="button"
                      onClick={() => setTab('admin')}
                      className={`text-xs font-bold transition-colors cursor-pointer ${tab === 'admin' ? 'text-violet-600' : 'text-zinc-500 hover:text-zinc-800'}`}
                    >
                      Panel Admin
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-zinc-500 shrink-0 text-xs font-medium">
                <MapPin size={12} className="text-violet-600" />
                <span>Valencia • Sede Las Acacias</span>
              </div>
            </div>
          </div>

      {/* 2. BODY PAGES VIEW DELEGATOR */}
      <main className="flex-1 px-4 pt-4 overflow-y-auto">
        {tab === 'home' && (
          <Home
            setTab={setTab}
            setSelectedCategory={setSelectedCategory}
            selectedBrand={selectedBrand}
            setSelectedBrand={setSelectedBrand}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            selectedEngine={selectedEngine}
            setSelectedEngine={setSelectedEngine}
            onViewProductDetails={setSelectedProductDetails}
            globalSearch={globalSearch}
            setGlobalSearch={setGlobalSearch}
            navigateToCatalog={navigateToCatalog}
          />
        )}

        {tab === 'catalog' && (
          <Catalog
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedBrand={selectedBrand}
            setSelectedBrand={setSelectedBrand}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            selectedEngine={selectedEngine}
            setSelectedEngine={setSelectedEngine}
            onViewProductDetails={setSelectedProductDetails}
            onOpenScanner={() => setIsScannerOpen(true)}
            passedSearchCode={scannedCode}
            clearPassedSearchCode={() => setScannedCode('')}
            passedSearchTerm={globalSearch}
            clearPassedSearchTerm={() => setGlobalSearch('')}
            resetGlobalFilters={resetAllFilters}
          />
        )}

        {tab === 'cart' && (
          <Checkout setTab={setTab} />
        )}

        {tab === 'admin' && (
          <Admin
            onOpenScanner={() => setIsScannerOpen(true)}
            scannedResultCode={scannedCode}
            clearScannedResultCode={() => setScannedCode('')}
            setTab={setTab}
          />
        )}

        {tab === 'profile' && (
          <UserProfile setTab={setTab} />
        )}

        {/* Global Footer with Tasa BCV */}
        <div className="w-full text-center py-6 mt-auto border-t border-zinc-200 bg-white">
          <p className="text-[10px] text-zinc-500 font-mono mb-1 tracking-widest uppercase font-bold">Tasa Cambiaria BCV</p>
          <p className="text-sm font-black text-zinc-800 font-mono tracking-tight">1 USD = {config.tasa_cambio.toFixed(2)} Bs.</p>
        </div>
      </main>

      {/* 3. MOBILE FIXED NAVIGATION CONTROLLERS */}
      <Navigation
        currentTab={tab}
        setTab={setTab}
        onOpenScanner={() => setIsScannerOpen(true)}
        onTriggerAdminLogin={() => setIsAdminLoginOpen(true)}
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
      />

      {/* --------------------------------------------------------------------------------
      A. MICRO-MODAL DETALLES DEL PRODUCTO (PREMIUM TRANSITIONAL WINDOW)
      -------------------------------------------------------------------------------- */}
      {selectedProductDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          {/* SEO Head dynamic inject during detail open */}
          <SEOHead 
            type="product" 
            product={selectedProductDetails} 
          />
          
          <div 
            className="w-full max-w-sm lg:max-w-3xl bg-white border border-zinc-200 rounded-xl p-5 relative shadow-2xl flex flex-col lg:flex-row gap-5 max-h-[90vh] lg:max-h-[85vh] overflow-y-auto lg:overflow-hidden no-scrollbar text-zinc-900"
          >
            {/* Slide Close Button */}
            <button
              type="button"
              onClick={() => { setSelectedProductDetails(null); setMicroModalQuantity(1); }}
              className="absolute top-3.5 right-3.5 text-zinc-500 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 p-1.5 rounded-lg transition-all z-10"
            >
              <X size={15} />
            </button>

            {/* COLUMN 1: Visual representation Media Slider (Left Side on Desktop) */}
            <div className="flex flex-col gap-3.5 w-full lg:w-[45%] shrink-0 justify-center">
              {/* Product Banner Slide image */}
              <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100 shrink-0 select-none group">
                <img 
                  src={selectedProductDetails.imagen_urls[activeImageIdx] || selectedProductDetails.imagen_urls[0]} 
                  alt={selectedProductDetails.nombre} 
                  className="w-full h-full object-cover transition-all duration-300" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 left-2 flex gap-1 text-[8px] font-bold font-mono z-10">
                  {selectedProductDetails.stock === 0 ? (
                    <span className="bg-red-500 text-white px-2 py-0.5 rounded-md uppercase shadow-md">
                      Agotado
                    </span>
                  ) : selectedProductDetails.stock < 5 ? (
                    <span className="bg-orange-500 text-white px-2 py-0.5 rounded-md uppercase shadow-md animate-pulse">
                      Stock Bajo ({selectedProductDetails.stock})
                    </span>
                  ) : (
                    <span className="bg-emerald-500/10 border border-emerald-400 text-emerald-600 px-2 py-0.5 rounded-md uppercase">
                      Disponible
                    </span>
                  )}
                </div>

                {/* Pagination Indicator / Count */}
                {selectedProductDetails.imagen_urls && selectedProductDetails.imagen_urls.length > 1 && (
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[9px] font-mono px-2 py-0.5 rounded-full z-10">
                    {activeImageIdx + 1} / {selectedProductDetails.imagen_urls.length}
                  </div>
                )}

                {/* Navigation Arrows */}
                {selectedProductDetails.imagen_urls && selectedProductDetails.imagen_urls.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveImageIdx(prev => (prev === 0 ? selectedProductDetails.imagen_urls.length - 1 : prev - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/85 hover:bg-white text-zinc-800 p-1.5 rounded-full shadow-md z-10 transition-transform active:scale-95 cursor-pointer flex items-center justify-center border border-zinc-200"
                      title="Imagen anterior"
                    >
                      <ChevronLeft size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveImageIdx(prev => (prev === selectedProductDetails.imagen_urls.length - 1 ? 0 : prev + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/85 hover:bg-white text-zinc-800 p-1.5 rounded-full shadow-md z-10 transition-transform active:scale-95 cursor-pointer flex items-center justify-center border border-zinc-200"
                      title="Siguiente imagen"
                    >
                      <ChevronRight size={13} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail selectors for multiple images */}
              {selectedProductDetails.imagen_urls && selectedProductDetails.imagen_urls.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto py-0.5 max-w-full justify-center shrink-0 no-scrollbar">
                  {selectedProductDetails.imagen_urls.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseEnter={() => setActiveImageIdx(idx)}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`w-10 h-10 rounded-md overflow-hidden bg-zinc-100 border transition-all cursor-pointer shrink-0 ${
                        activeImageIdx === idx ? 'border-[#3b82f6] scale-105 ring-2 ring-[#3b82f6]/20' : 'border-zinc-200 opacity-60 hover:opacity-100 hover:border-zinc-300'
                      }`}
                    >
                      <img src={url} alt={`${selectedProductDetails.nombre} - ${idx}`} className="w-full h-full object-cover pointer-events-none" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* COLUMN 2: Descriptive Information (Right Side on Desktop/PC) */}
            <div className="flex flex-col gap-3.5 flex-1 lg:max-h-[75vh] lg:overflow-y-auto lg:no-scrollbar lg:pr-1.5 pt-4 lg:pt-0">
              {/* Ficha Information Details */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-2">
                    <span className="text-[10px] text-blue-600 font-black tracking-widest uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {selectedProductDetails.marca_repuesto}
                    </span>
                    <span className={`text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded border ${
                      selectedProductDetails.condicion === 'Nacional' || selectedProductDetails.condicion === 'Nuevo'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {selectedProductDetails.condicion}
                    </span>
                    {selectedProductDetails.delivery_gratis && (
                      <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded border bg-indigo-50 text-indigo-600 border-indigo-100 animate-pulse">
                        Delivery Gratis
                      </span>
                    )}
                    {selectedProductDetails.stock > 0 && selectedProductDetails.stock < 5 && (
                      <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded border bg-orange-50 text-orange-600 border-orange-100 animate-pulse">
                        Stock Bajo
                      </span>
                    )}
                    {selectedProductDetails.stock === 0 && (
                      <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded border bg-red-50 text-red-600 border-red-100">
                        Agotado
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase">
                    {selectedProductDetails.categoria}
                  </span>
                </div>
                <h3 className="text-sm font-bold font-display text-zinc-900 leading-snug">{selectedProductDetails.nombre}</h3>
                <div className="text-[10px] text-emerald-600 font-mono">Código SKU: <strong>{selectedProductDetails.codigo}</strong></div>
              </div>

              {/* Vehicle Ranges Compatibilities */}
              <div className="p-3 border border-zinc-200 rounded-lg bg-zinc-50 text-xs flex flex-col gap-1 font-mono">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Ubicación y Conservación</span>
                <div className="text-zinc-900 mt-1 font-sans">
                  📍 {selectedProductDetails.marca_carro} ➔ {selectedProductDetails.modelo_carro}
                </div>
                {selectedProductDetails.compatibilidad_detalle && (
                  <div className="text-[10px] text-zinc-500 leading-tight border-t border-zinc-200 pt-1.5 mt-1">
                    💡 <strong>Detalles:</strong> {selectedProductDetails.compatibilidad_detalle}
                  </div>
                )}
              </div>

              {/* Description Details text */}
              <div className="text-xs text-zinc-650 leading-relaxed max-w-sm">
                {selectedProductDetails.descripcion}
              </div>

              {/* Price Calculations Multicurrency */}
              <div className="p-3.5 border border-emerald-250 bg-emerald-50/30 rounded-lg flex items-center justify-between">
                <span className="text-xs text-zinc-500">Precio Unitario:</span>
                <div className="text-right">
                  <div className="text-md font-bold font-mono text-emerald-600">${selectedProductDetails.precio_usd.toFixed(2)}</div>
                  <div className="text-xs font-mono text-emerald-700 font-bold">{(selectedProductDetails.precio_usd * config.tasa_cambio).toFixed(2)} Bs</div>
                </div>
              </div>

              {/* Cart add section with local stepper quantity selector */}
              {selectedProductDetails.stock > 0 && (
                <div className="flex items-center gap-3 mt-1 justify-between shrink-0">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] text-zinc-500 block">Cantidad</span>
                    <div className="flex items-center border border-zinc-200 rounded-lg bg-zinc-50 h-9">
                      <button
                        type="button"
                        onClick={() => setMicroModalQuantity(prev => Math.max(1, prev - 1))}
                        className="w-8 h-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-all text-xs outline-none"
                      >
                        -
                      </button>
                      <span className="text-xs px-2.5 text-zinc-900 font-mono font-semibold">{microModalQuantity}</span>
                      <button
                        type="button"
                        onClick={() => setMicroModalQuantity(prev => Math.min(selectedProductDetails.stock, prev + 1))}
                        className="w-8 h-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-all text-xs outline-none"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Add triggering button */}
                  <button
                    type="button"
                    onClick={() => {
                      addToCart(selectedProductDetails, microModalQuantity);
                      setSelectedProductDetails(null);
                      setMicroModalQuantity(1);
                    }}
                    className="flex-1 h-12 bg-zinc-950 hover:bg-zinc-850 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all self-end cursor-pointer shadow-lg active:scale-95"
                  >
                    <ShoppingCart size={13} />
                    Añadir al Carrito
                  </button>
                </div>
              )}

              {/* Technical share trigger icon */}
              <button
                type="button"
                onClick={() => handleShareProduct(selectedProductDetails)}
                className="text-[10px] font-mono text-zinc-500 hover:text-emerald-600 flex items-center justify-center gap-1 mt-2.5 transition-colors cursor-pointer"
              >
                <Share2 size={11} /> Compartir producto por WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------------------
      B. BARCODE CAMERA VIEWFINDER MODAL
      -------------------------------------------------------------------------------- */}
      {isScannerOpen && (
        <BarcodeScanner
          onScanSuccess={handleScanCompleted}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      {/* --------------------------------------------------------------------------------
      C. ADMINISTRATIVE SECURITY PORTAL LOGIN MODAL
      -------------------------------------------------------------------------------- */}
      {isAdminLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-sm bg-white border border-zinc-200 rounded-lg p-5 relative shadow-2xl flex flex-col gap-4 text-zinc-900">
            <button
              type="button"
              onClick={() => setIsAdminLoginOpen(false)}
              className="absolute top-3.5 right-3.5 text-zinc-500 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 p-1 rounded-lg"
            >
              <X size={14} />
            </button>

            <div className="text-center flex flex-col items-center">
              <span className="text-2xl p-2 bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 rounded-2xl mb-2">🔑</span>
              <h4 className="text-sm font-bold font-display text-zinc-800 uppercase tracking-wider">Acceso Administrativo Sólido</h4>
              <p className="text-[10px] text-zinc-500 mt-1 leading-normal max-w-[240px]">Para editar el inventario, cambiar la tasa del Bolívar ó ver ingresos de ventas, ingrese la contraseña.</p>
            </div>

            <form onSubmit={handleAdminVerifySubmit} className="flex flex-col gap-3.5 text-xs text-zinc-900">
              <div className="flex flex-col gap-1.5">
                <span>Teléfono *</span>
                <input
                  type="text"
                  required
                  value={adminUserInput}
                  onChange={(e) => setAdminUserInput(e.target.value)}
                  placeholder="Ingrese teléfono..."
                  className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-center text-sm tracking-wider font-mono text-blue-600 font-bold"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span>Contraseña *</span>
                <input
                  type="password"
                  required
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="Ingrese clave..."
                  className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-center text-sm tracking-wider font-mono text-blue-600 font-bold"
                />
              </div>


              {/* Login Action */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAdminLoginOpen(false)}
                  className="bg-zinc-100 hover:bg-zinc-200 py-2 rounded-lg text-zinc-800 border border-zinc-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold font-display tracking-wide uppercase cursor-pointer"
                >
                  INGRESAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
