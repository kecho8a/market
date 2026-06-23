import React, { useState } from 'react';
import { Home, Grid, ShoppingCart, Menu, X, Landmark, PhoneCall, MapPin, Sparkles, ShieldAlert, BadgeInfo, User } from 'lucide-react';
import { useApp } from '../store/AppContext';

interface NavigationProps {
  currentTab: 'home' | 'catalog' | 'cart' | 'admin' | 'profile';
  setTab: (tab: 'home' | 'catalog' | 'cart' | 'admin' | 'profile') => void;
  onOpenScanner: () => void;
  onTriggerAdminLogin: () => void;
  drawerOpen: boolean;
  setDrawerOpen: (value: boolean) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  setTab,
  onOpenScanner,
  onTriggerAdminLogin,
  drawerOpen,
  setDrawerOpen
}) => {
  const { cart, config, isAdminAuthenticated, logoutAdmin, currentUser, notifications } = useApp();

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Unread notification count for active user (general + user-targeted)
  const unreadCount = currentUser 
    ? notifications.filter(n => (!n.leida && (n.tipo === 'todos' || (n.tipo === 'personal' && n.destinatario_telefono?.trim() === currentUser.telefono.trim())))).length
    : 0;

  return (
    <>
      {/* 1. FIXED BOTTOM NAVIGATION BAR WITH GLASS backdrop-blur */}
      <nav id="bottom-bar" className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white/75 backdrop-blur-md border-t border-zinc-200 px-4 flex items-center justify-between md:max-w-md md:mx-auto md:rounded-t-2xl md:border-x border-zinc-200 shadow-2xl lg:hidden">
        {/* IOS Drawer Trigger Icon */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-zinc-500 hover:text-violet-600 transition-colors relative"
        >
          <Menu size={20} />
          <span className="text-[10px] mt-0.5 font-display font-medium">Menú</span>
        </button>

        {/* Inicio */}
        <button
          type="button"
          onClick={() => setTab('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors relative ${currentTab === 'home' ? 'text-violet-650 font-semibold' : 'text-zinc-500'}`}
        >
          {currentTab === 'home' && (
            <span className="absolute -top-1 w-5 h-[2px] rounded-full" style={{ backgroundColor: config.theme_color || '#0f5d34' }} />
          )}
          <Home size={20} />
          <span className="text-[10px] mt-0.5 font-display font-medium">Inicio</span>
        </button>

        {isAdminAuthenticated && (
          <button
            type="button"
            onClick={() => setTab('admin')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors relative ${currentTab === 'admin' ? 'font-semibold' : ''}`}
            style={{ color: currentTab === 'admin' ? (config.theme_color || '#0f5d34') : undefined }}
          >
            <ShieldAlert size={20} />
            <span className="text-[10px] mt-0.5 font-display font-medium">Admin</span>
          </button>
        )}

        {/* Categorías (Catálogo) */}
        <button
          type="button"
          onClick={() => setTab('catalog')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors relative ${currentTab === 'catalog' ? 'font-semibold' : 'text-zinc-500'}`}
          style={currentTab === 'catalog' ? { color: config.theme_color || '#0f5d34' } : undefined}
        >
          {currentTab === 'catalog' && (
            <span className="absolute -top-1 w-5 h-[2px] rounded-full" style={{ backgroundColor: config.theme_color || '#0f5d34' }} />
          )}
          <Grid size={20} />
          <span className="text-[10px] mt-0.5 font-display font-medium">Pasillos</span>
        </button>

        {/* Carrito */}
        <button
          type="button"
          onClick={() => setTab('cart')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors relative ${currentTab === 'cart' ? 'font-semibold' : 'text-zinc-500'}`}
          style={currentTab === 'cart' ? { color: config.theme_color || '#0f5d34' } : undefined}
        >
          {currentTab === 'cart' && (
            <span className="absolute -top-1 w-5 h-[2px] rounded-full" style={{ backgroundColor: config.theme_color || '#0f5d34' }} />
          )}
          <div className="relative">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 text-white font-mono font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-bounce" style={{ backgroundColor: config.theme_color || '#0f5d34' }}>
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 font-display font-medium">Carrito</span>
        </button>

        {/* Mi Cuenta (User Profile Panel) */}
        <button
          type="button"
          onClick={() => setTab('profile')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors relative ${currentTab === 'profile' ? 'font-semibold' : 'text-zinc-500'}`}
          style={currentTab === 'profile' ? { color: config.theme_color || '#0f5d34' } : undefined}
        >
          {currentTab === 'profile' && (
            <span className="absolute -top-1 w-5 h-[2px] rounded-full" style={{ backgroundColor: config.theme_color || '#0f5d34' }} />
          )}
          <div className="relative">
            <User size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 w-2.5 h-2.5 rounded-full border border-white animate-ping" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 font-display font-medium">
            {currentUser ? 'Perfil' : 'Ingresar'}
          </span>
        </button>
      </nav>

      {/* 2. iOS-TYPE DRAWER PANEL EMERGING SMOOTHLY */}
      <div 
        className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Backdrop overlay */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />

        {/* Sliding Drawer Container */}
        <aside 
          className={`absolute top-0 bottom-0 left-0 w-[290px] bg-white border-r border-zinc-200 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out z-10 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {/* Top content block */}
          <div className="overflow-y-auto max-h-[85vh] no-scrollbar text-zinc-900">
            {/* Drawer Header */}
            <div className="p-4 bg-gradient-to-r from-zinc-50 to-zinc-100/40 border-b border-zinc-200 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="font-display font-bold text-lg text-zinc-900 tracking-tight flex items-center gap-1.5">
                  {config.site_nombre}
                </span>
                <span className="text-[9px] text-violet-600 font-mono tracking-wider font-bold">Valencia - Carabobo</span>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="text-zinc-500 hover:text-zinc-950 bg-zinc-100 p-1 rounded-xl transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Navigation links inside drawer */}
            <div className="p-3 flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider px-3 py-1 block">NAVEGAR</span>
              
              <button
                type="button"
                onClick={() => { setTab('home'); setDrawerOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-2 text-xs rounded-lg font-semibold transition-all cursor-pointer ${currentTab === 'home' ? 'bg-violet-50 text-violet-650 font-bold' : 'text-zinc-750 hover:bg-zinc-100'}`}
              >
                <Home size={15} /> Inicio tienda
              </button>

              <button
                type="button"
                onClick={() => { setTab('catalog'); setDrawerOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-2 text-xs rounded-lg font-semibold transition-all cursor-pointer ${currentTab === 'catalog' ? 'bg-violet-50 text-violet-650 font-bold' : 'text-zinc-750 hover:bg-zinc-100'}`}
              >
                <Grid size={15} /> Pasillos del Súper
              </button>

              <button
                type="button"
                onClick={() => { setTab('cart'); setDrawerOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-2 text-xs rounded-lg font-semibold transition-all cursor-pointer ${currentTab === 'cart' ? 'bg-violet-50 text-violet-650 font-bold' : 'text-zinc-750 hover:bg-zinc-100'}`}
              >
                <ShoppingCart size={15} /> Carrito de compras
              </button>

              <button
                type="button"
                onClick={() => { setTab('profile'); setDrawerOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-2 text-xs rounded-lg font-semibold transition-all cursor-pointer ${currentTab === 'profile' ? 'bg-violet-50 text-violet-650 font-bold' : 'text-zinc-750 hover:bg-zinc-100'}`}
              >
                <User size={15} /> Mi Cuenta / Perfil
              </button>
            </div>

            {/* Features shortcuts */}
            <div className="p-3 border-t border-zinc-200 flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider px-3 py-1 block">ACCIONES RÁPIDAS</span>
              
              <button
                type="button"
                onClick={() => { onOpenScanner(); setDrawerOpen(false); }}
                className="flex items-center gap-3 w-full px-3 py-2 text-xs text-zinc-750 hover:bg-zinc-100 rounded-lg font-semibold transition-all cursor-pointer"
              >
                Escáner de Código SKU
              </button>

              <a
                href={`https://wa.me/${config.telefono_soporte.replace(/[+ ]/g, '')}`}
                target="_blank"
                referrerPolicy="no-referrer"
                className="flex items-center gap-3 w-full px-3 py-2 text-xs text-zinc-800 hover:bg-violet-50 hover:text-violet-600 rounded-lg font-semibold transition-all"
              >
                <PhoneCall size={15} className="text-violet-600" /> Contactar WhatsApp Directo
              </a>
            </div>

            {/* Store Information segment */}
            <div className="p-4 border-t border-zinc-200 flex flex-col gap-3">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">NUESTRA SEDE</span>
              
              <div className="flex gap-2 text-xs text-zinc-700 leading-relaxed">
                <MapPin size={15} className="text-red-500 shrink-0 mt-0.5" />
                <p>{config.direccion_fisica}</p>
              </div>
            </div>
          </div>

          {/* Bottom administrative login button lock */}
          <div className="p-4 border-t border-zinc-200 bg-zinc-50">
            {isAdminAuthenticated ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                  <span className="text-[11px] text-zinc-500 font-mono">Sesión Admin Activa</span>
                </div>
                <button
                  type="button"
                  onClick={() => { logoutAdmin(); setDrawerOpen(false); setTab('home'); }}
                  className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 text-xs py-2 rounded-lg font-semibold transition-all font-mono cursor-pointer"
                >
                  Cerrar Sesión Admin
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setDrawerOpen(false); onTriggerAdminLogin(); }}
                className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-850 border border-zinc-200 text-xs py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all font-mono cursor-pointer"
              >
                <ShieldAlert size={14} className="text-yellow-600" />
                Acceso Administrativo
              </button>
            )}
            <div className="text-[9px] text-zinc-400 font-mono text-center mt-2">
              {config.site_nombre || 'App'} v1.0.1
            </div>
          </div>
        </aside>
      </div>
    </>
  );
};
