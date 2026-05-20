import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../store/AppContext';
import { Bell, ShieldAlert, Sparkles, X, ChevronRight, Truck, Info, Percent } from 'lucide-react';

export const PushNotificationModal: React.FC = () => {
  const { addNotification } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [permissionType, setPermissionType] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if notifications are supported
    if (!('Notification' in window)) {
      setPermissionType('unsupported');
      return;
    }

    const currentPermission = Notification.permission as 'default' | 'granted' | 'denied';
    setPermissionType(currentPermission);

    // If permission has already been decided or user previously dismissed the custom modal
    const dismissed = localStorage.getItem('trv_push_dismissed') === 'true';

    if (currentPermission === 'default' && !dismissed) {
      // Show the beautifully animated modal after a small delay (e.g. 1.2 seconds) to let page content load
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleRequestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    try {
      const res = await Notification.requestPermission();
      setPermissionType(res as any);
      setIsOpen(false);

      if (res === 'granted') {
        // Trigger a gorgeous, helpful native welcoming notification
        new Notification('¡Notificaciones Activas! 🔔', {
          body: '¡Genial! Ahora recibirás alertas en tiempo real sobre tus pedidos y ofertas frescas de Marketo.',
          icon: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=100',
          tag: 'welcome-trv'
        });

        // Also add it inside the app database notifications
        addNotification(
          '¡Notificaciones Habilitadas! 🔔',
          'Has activado con éxito las notificaciones push en tu navegador. Recibirás actualizaciones de tus pedidos y promociones directas a tu escritorio o móvil.',
          'personal'
        );
      } else if (res === 'denied') {
        addNotification(
          'Notificaciones Bloqueadas ⚠️',
          'Has rechazado el permiso de notificaciones push de navegador. Puedes volver a activarlo en cualquier momento desde los ajustes de seguridad de tu navegador o desde tu Perfil de usuario.',
          'todos'
        );
      }
    } catch (err) {
      console.error('Error requesting push permission:', err);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    // Persist user dismissal so we don't annoy them on every hot reload or next click
    localStorage.setItem('trv_push_dismissed', 'true');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="push-gate-overlay"
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', duration: 0.45 }}
          className="w-full max-w-sm bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-col gap-4 text-zinc-900"
        >
          {/* Decorative Glow Ring / Top Icon */}
          <div className="relative mx-auto mt-2 select-none">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl scale-125 animate-pulse" />
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner relative z-10 animate-bounce">
              <Bell size={20} className="fill-emerald-500/10" />
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-3.5 right-3.5 text-zinc-400 hover:text-zinc-650 bg-zinc-50 hover:bg-zinc-100 p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X size={14} />
          </button>

          {/* Text Descriptions */}
          <div className="text-center flex flex-col gap-1.5">
            <h3 className="text-sm font-black font-display text-zinc-950 uppercase tracking-wide leading-tight">
              ¡Entérate de tus pedidos! 🛵
            </h3>
            <p className="text-[11px] text-zinc-500 leading-normal font-sans">
              Para brindarte nuestro servicio express en <strong>Valencia</strong>, requerimos permiso para enviarte alertas instantáneas directamente a tu pantalla.
            </p>
          </div>

          {/* Core Feature Highlights Visual Layout */}
          <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-zinc-50 border border-zinc-150">
            {/* Feature 1 */}
            <div className="flex gap-2 text-left items-start">
              <div className="p-1 px-1.5 bg-emerald-100 rounded text-emerald-700 font-bold shrink-0 text-[10px] mt-0.5">
                📦
              </div>
              <div className="flex flex-col leading-snug">
                <span className="text-[10px] font-extrabold text-zinc-900">Estado de Compras en Vivo</span>
                <span className="text-[9px] text-zinc-400 leading-normal">
                  Recibe avisos rápidos al cambiar tu pedido a "Preaparación", "En camino" o "Entregado".
                </span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-2 text-left items-start border-t border-zinc-200/50 pt-2">
              <div className="p-1 px-1.5 bg-emerald-100 rounded text-emerald-700 font-bold shrink-0 text-[10px] mt-0.5">
                🛵
              </div>
              <div className="flex flex-col leading-snug">
                <span className="text-[10px] font-extrabold text-zinc-900">Alertas de Delivery Express</span>
                <span className="text-[9px] text-zinc-400 leading-normal">
                  Sabrás exactamente el momento en que nuestro motorizado parta a tu dirección.
                </span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-2 text-left items-start border-t border-zinc-200/50 pt-2">
              <div className="p-1 px-1.5 bg-amber-100 rounded text-amber-700 font-bold shrink-0 text-[10px] mt-0.5">
                ⚡
              </div>
              <div className="flex flex-col leading-snug">
                <span className="text-[10px] font-extrabold text-zinc-900">Promociones Relámpago</span>
                <span className="text-[9px] text-zinc-400 leading-normal">
                  Descuentos exclusivos en embutidos, quesos madurados y víveres frescos antes de agotarse.
                </span>
              </div>
            </div>
          </div>

          {/* Regulatory Safe-trust note */}
          <p className="text-[9px] text-zinc-400 font-mono leading-normal text-center select-none">
            🔒 Comprometidos con tu privacidad. Sin spam. Puedes cancelar o reestructurar permisos desde tu perfil cuando quieras.
          </p>

          {/* CTA Button Layout Controls */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              type="button"
              onClick={handleDismiss}
              className="py-2.5 rounded-xl text-zinc-650 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200 bg-white font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer text-center flex items-center justify-center active:scale-95 shrink-0"
            >
              Más Tarde
            </button>
            <button
              type="button"
              onClick={handleRequestPermission}
              className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-500/20 text-center flex items-center justify-center gap-1 active:scale-95 shrink-0 font-display"
            >
              Activar 🚀
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
