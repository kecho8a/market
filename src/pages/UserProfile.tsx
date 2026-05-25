import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { motion } from 'motion/react';
import { supabase } from '../store/supabaseClient';
import { 
  User, Lock, Phone, UserPlus, LogIn, LogOut, Bell, Package, Mail,
  CheckCircle, Clock, Truck, MapPin, Edit2, AlertCircle, Eye, EyeOff, Tag,
  Copy, Check, X
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';

interface UserProfileProps {
  setTab: (tab: 'home' | 'catalog' | 'cart' | 'admin' | 'profile') => void;
  deferredPrompt?: any;
  onInstallClick?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ setTab, deferredPrompt, onInstallClick }) => {
  const { 
    currentUser, 
    users, 
    orders, 
    notifications, 
    config, 
    registerUser, 
    loginUser, 
    logoutUser, 
    updateUser,
    sendPasswordResetEmail,
    markNotificationAsRead,
    addNotification,
    deleteNotification,
    hapticEnabled,
    toggleHaptic
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'orders' | 'notifications'>('orders');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');

  // ── Lógica de Popup Automático de Instalación (PWA) ────────────────────────
  const [showAutoPopup, setShowAutoPopup] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const hasSeenThisSession = sessionStorage.getItem('marketo_install_popup_shown');

    if (deferredPrompt && !isStandalone && !hasSeenThisSession) {
      const timer = setTimeout(() => {
        setShowAutoPopup(true);
        sessionStorage.setItem('marketo_install_popup_shown', 'true');
      }, 3000); // Aparece 3 segundos después de cargar para mejor UX
      return () => clearTimeout(timer);
    }
  }, [deferredPrompt]);

  // ── Delivery Timeline Modal (disparado al finalizar el checkout) ─────────────────
  const [activeOrderModalId, setActiveOrderModalId] = useState<string | null>(null);
  const [showOrderTimelineModal, setShowOrderTimelineModal] = useState(false);

  const [notificationPermission, setNotificationPermission] = useState<'default' | 'granted' | 'denied' | 'unsupported'>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission as 'default' | 'granted' | 'denied';
  });

  // Sync state if user enables it somewhere else
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const handleFocus = () => {
        setNotificationPermission(Notification.permission as any);
      };
      window.addEventListener('focus', handleFocus);
      return () => {
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, []);

  // Función auxiliar para convertir la llave VAPID de Base64 a Uint8Array
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeUserToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !currentUser) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Suscribirse al servidor de Push del navegador (FCM/Apple/Mozilla)
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)
      });

      // Extraer llaves y endpoint para la DB
      const subJSON = subscription.toJSON();
      
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: currentUser.id,
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys?.p256dh,
        auth_secret: subJSON.keys?.auth
      }, { onConflict: 'user_id, endpoint' });

      if (error) throw error;
    } catch (err) {
      console.error('Error al registrar suscripción push en Supabase:', err);
    }
  };

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    try {
      const res = await Notification.requestPermission();
      setNotificationPermission(res as any);
      if (res === 'granted') {
        // Si el usuario acepta, procedemos a crear la suscripción push real
        await subscribeUserToPush();
        
        new Notification('¡Notificaciones Habilitadas!', {
          body: '¡Excelente! Ahora recibirás actualizaciones rápidas de tus pedidos y promociones de Marketo.',
          icon: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=100',
          tag: 'welcome-trv'
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const sendTestPushNotification = () => {
    if (notificationPermission === 'granted' && typeof window !== 'undefined' && 'Notification' in window) {
      new Notification('Prueba Exitosa', {
        body: 'Esta es una notificación de prueba. Todo está configurado correctamente en Marketo.',
        icon: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=100',
        tag: 'test'
      });
    }
  };

  // Input states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  
  const [forgotEmail, setForgotEmail] = useState('');
  const [logPhone, setLogPhone] = useState('');
  const [logPassword, setLogPassword] = useState('');

  const [editName, setEditName] = useState(currentUser?.nombre || '');
  const [editEmail, setEditEmail] = useState(currentUser?.email || '');
  const [editPhone, setEditPhone] = useState(currentUser?.telefono || '');
  const [editPassword, setEditPassword] = useState(currentUser?.contrasena || '');

  // Errors & Modals
  const [resetSent, setResetSent] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showReminderModal, setShowReminderModal] = useState<any>(null); // holds registered info to remind them
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [showEditFields, setShowEditFields] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // States to animate custom copying success feedback for each credential element
  const [copiedName, setCopiedName] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [showReminderPassword, setShowReminderPassword] = useState(false);

  const handleCopyText = (text: string, type: 'name' | 'phone' | 'password' | 'all') => {
    navigator.clipboard.writeText(text);
    if (type === 'name') {
      setCopiedName(true);
      setTimeout(() => setCopiedName(false), 2000);
    } else if (type === 'phone') {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } else if (type === 'password') {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    } else if (type === 'all') {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword.trim()) {
      setAuthError('Todos los campos son obligatorios.');
      return;
    }

    const phoneRegex = /^\+?[0-9]{7,15}$/;
    const cleanedPhone = regPhone.replace(/[\s\-()]/g, '');
    if (!phoneRegex.test(cleanedPhone)) {
      setAuthError('Número de teléfono inválido (debe tener de 7 a 15 dígitos).');
      return;
    }

    // Check if phone matches any registered user database-wide
    const { data: existingUser } = await supabase
      .from('usuarios_clientes')
      .select('id')
      .eq('telefono', regPhone.trim())
      .limit(1);

    if (existingUser && existingUser.length > 0) {
      setAuthError('Este número de teléfono ya está registrado.');
      return;
    }

    setAuthError('');
    const userCreated = await registerUser(regName.trim(), regEmail.trim(), regPhone.trim(), regPassword.trim());
    
    // Set Edit states
    setEditName(userCreated.nombre);
    setEditPhone(userCreated.telefono);
    setEditPassword(userCreated.contrasena);

    // Show credentials reminder modal
    setShowReminderModal({
      nombre: userCreated.nombre,
      telefono: userCreated.telefono,
      contrasena: userCreated.contrasena
    });

    // Clear register fields
    setRegName('');
    setRegPhone('');
    setRegPassword('');
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setAuthError('Por favor ingrese su correo electrónico.');
      return;
    }
    const res = await sendPasswordResetEmail(forgotEmail);
    if (res.success) {
      setResetSent(true);
      setAuthError('');
    } else {
      setAuthError(res.error || 'Ocurrió un error al enviar el correo.');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logPhone.trim() || !logPassword.trim()) {
      setAuthError('Por favor complete todos los campos.');
      return;
    }

    const loggedUser = await loginUser(logPhone, logPassword);
    if (loggedUser) {
      setAuthError('');
      setLogPhone('');
      setLogPassword('');
      setEditName(loggedUser.nombre);
      setEditPhone(loggedUser.telefono);
      setEditPassword(loggedUser.contrasena);
      setActiveSubTab('orders');
    } else {
      setAuthError('Credenciales incorrectas. Verifique el teléfono y contraseña.');
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editPhone.trim() || !editPassword.trim()) {
      setAuthError('No se permiten campos vacíos.');
      return;
    }

    updateUser({
      nombre: editName.trim(),
      telefono: editPhone.trim(),
      contrasena: editPassword.trim()
    });

    setUpdateSuccess(true);
    setShowEditFields(false);
    
    // Show credentials reminder modal for updating too
    setShowReminderModal({
      nombre: editName.trim(),
      telefono: editPhone.trim(),
      contrasena: editPassword.trim(),
      is_update: true
    });

    setTimeout(() => {
      setUpdateSuccess(false);
    }, 4000);
  };

  // Filter orders related to currently logged user
  const userOrders = currentUser 
    ? orders.filter(o => o.usuario_id === currentUser.id || o.cliente_telefono.trim() === currentUser.telefono.trim()) 
    : [];

  const modalOrder = activeOrderModalId
    ? userOrders.find(o => o.id === activeOrderModalId) || null
    : null;

  // Filter notifications (Global + personal targeted)
  const userNotifications = currentUser 
    ? notifications.filter(n => 
        n.tipo === 'todos' || 
        (n.tipo === 'personal' && n.destinatario_telefono?.trim() === currentUser.telefono.trim())
      ) 
    : [];

  // Unread notification count
  const unreadCount = userNotifications.filter(n => !n.leida).length;

  // Disparar modal si existe un pedido reciente creado en Checkout
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tryOpenModal = () => {
      const storedId = localStorage.getItem('trv_active_order_id');
      if (!storedId) return;

      // Buscar tanto en userOrders (DB) como en orders (Estado global local)
      const exists = orders.find(o => o.id === storedId);
      if (!exists) return;

      setActiveOrderModalId(storedId);
      setShowOrderTimelineModal(true);
    };

    tryOpenModal();

    // si llegan órdenes luego de refrescar, reintentar
  }, [orders]); // Depender del estado global para mayor velocidad

  return (
    <div className="flex flex-col gap-6 pb-24 text-zinc-900 bg-white">
      <SEOHead title={currentUser ? `Panel de ${currentUser.nombre}` : "Panel de Usuario"} />

      {/* Pop-up de Instalación Automática (PWA) */}
      {showAutoPopup && deferredPrompt && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-[340px] bg-white rounded-[32px] shadow-2xl border border-zinc-200 overflow-hidden mb-16 sm:mb-0"
          >
            {/* Imagen de Captura de Pantalla / Preview */}
            <div className="relative h-44 bg-zinc-100 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800" 
                alt="Marketo App Screenshot" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20" />
              <button 
                onClick={() => setShowAutoPopup(false)} 
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer z-20"
              >
                <X size={16} />
              </button>
              <div className="absolute bottom-4 left-6 bg-violet-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-lg">
                App Oficial
              </div>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-violet-200 shrink-0">
                  <Smartphone size={22} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <h4 className="text-[15px] font-black text-zinc-900 uppercase tracking-tight">Lleva Marketo en tu móvil</h4>
                  <p className="text-[11px] text-zinc-500 font-medium leading-tight">Seguimiento en mapa, alertas de pedidos y compras offline más rápidas.</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 mt-1">
                <button
                  onClick={() => {
                    if (onInstallClick) onInstallClick();
                    setShowAutoPopup(false);
                  }}
                  className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 cursor-pointer"
                >
                  Instalar Ahora
                </button>
                <button
                  onClick={() => setShowAutoPopup(false)}
                  className="w-full bg-transparent text-zinc-400 hover:text-zinc-600 font-bold py-1 rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                >
                  Quizás luego
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delivery Timeline Modal (llamativo, animado) */}
      {showOrderTimelineModal && modalOrder && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-5 bg-gradient-to-br from-violet-600 to-violet-800 text-white flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
                  <Truck size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">
                    Seguimiento de Pedido
                  </h3>
                  <p className="text-[11px] text-white/80 mt-0.5 font-mono">
                    ID: <span className="font-bold">{modalOrder.id}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('trv_active_order_id');
                  setActiveOrderModalId(null);
                  setShowOrderTimelineModal(false);
                }}
                className="text-white/90 hover:text-white transition cursor-pointer rounded-lg p-1.5 bg-white/10 border border-white/15"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4 text-xs text-zinc-800">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono">
                    Estado actual
                  </span>
                  <span className="mt-1 text-sm font-black">
                    {modalOrder.status === 'Enviado' ? 'Enviado / Despachado' : modalOrder.status}
                  </span>
                </div>

                <span
                  className={`text-[10px] font-bold px-3 py-1 rounded-full font-mono border ${
                    modalOrder.status === 'Pendiente' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                    modalOrder.status === 'Procesando' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                    modalOrder.status === 'En preparación' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' :
                    modalOrder.status === 'En camino' ? 'bg-violet-100 text-violet-800 border-violet-400 animate-pulse' :
                    modalOrder.status === 'Enviado' ? 'bg-violet-100 text-violet-800 border-violet-300' :
                    'bg-zinc-100 text-zinc-850 border border-zinc-300'
                  }`}
                >
                  {modalOrder.status === 'Enviado' ? 'Enviado / Despachado' : modalOrder.status}
                </span>
              </div>

              {/* Timeline blocks */}
              <div className="p-4 bg-zinc-50/60 border border-zinc-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                    Línea de tiempo
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Se actualiza en tiempo real
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-3 font-mono text-[9px]">
                  {[
                    { label: 'Pendiente', target: ['Pendiente'] },
                    { label: 'Preparación', target: ['En preparación', 'Procesando'] },
                    { label: 'En Camino', target: ['En camino', 'Enviado'] },
                    { label: 'Entregado', target: ['Entregado'] },
                  ].map((stepObj, idx) => {
                    const statusOrder = ['Pendiente', 'Procesando', 'En preparación', 'En camino', 'Enviado', 'Entregado'];
                    const currentPower = statusOrder.indexOf(modalOrder.status);
                    let isStepPassed = false;
                    if (stepObj.label === 'Pendiente') isStepPassed = currentPower >= 0;
                    if (stepObj.label === 'Preparación') isStepPassed = currentPower >= 1;
                    if (stepObj.label === 'En Camino') isStepPassed = currentPower >= 3;
                    if (stepObj.label === 'Entregado') isStepPassed = currentPower >= 5;

                    const isCurrent = stepObj.target.includes(modalOrder.status);

                    return (
                      <div key={idx} className="flex flex-col items-center relative">
                        {modalOrder.status === 'En camino' && stepObj.label === 'En Camino' && (
                          <motion.div
                            initial={{ x: '-40%' }}
                            animate={{ x: '40%' }}
                            transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                            className="absolute -top-6 text-violet-600 drop-shadow-sm"
                          >
                            <Truck size={16} />
                          </motion.div>
                        )}

                        <div
                          className={`h-[4px] w-full rounded-full transition-all ${
                            isCurrent ? 'bg-violet-600 ring-2 ring-violet-400/30 animate-pulse' :
                            isStepPassed ? 'bg-zinc-800' : 'bg-zinc-200'
                          }`}
                        />
                        <span
                          className={`mt-2 text-[8px] font-medium ${
                            isCurrent ? 'text-violet-600 font-bold' :
                            isStepPassed ? 'text-zinc-900 font-semibold' : 'text-zinc-400'
                          }`}
                        >
                          {stepObj.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Estimated time */}
              {modalOrder.status !== 'Entregado' && (
                <div className="p-3 bg-violet-50/50 border border-violet-100 rounded-lg text-violet-900 text-[11px] leading-relaxed">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-violet-800">Tiempo estimado de entrega:</span>
                    <span className="font-black underline text-violet-700">
                      {modalOrder.tiempo_estimado_entrega || 'En asignación por tienda'}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('trv_active_order_id');
                    setActiveOrderModalId(null);
                    setShowOrderTimelineModal(false);
                    setActiveSubTab('orders');
                  }}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 px-3 rounded-lg text-[11px] transition-colors cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <CheckCircle size={14} /> Ver mi pedido
                </button>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('trv_active_order_id');
                    setActiveOrderModalId(null);
                    setShowOrderTimelineModal(false);
                  }}
                  className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 font-bold py-2.5 px-3 rounded-lg text-[11px] transition-colors cursor-pointer w-full sm:w-auto uppercase tracking-wider"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {/* Title */}
      <div>
        <span className="text-[10px] font-mono text-violet-600 font-bold uppercase tracking-wider">Espacio del Cliente</span>
        <h2 className="text-xl font-bold font-display text-zinc-900">Panel de Usuario Inteligente</h2>
      </div>

      {/* NOT LOGGED IN ZONE */}
      {!currentUser ? (
        <div className="w-full flex flex-col border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
          {/* Tabs header */}
          <div className="flex border-b border-zinc-200">
            <button
              onClick={() => { setAuthMode('login'); setAuthError(''); setResetSent(false); }}
              className={`flex-1 py-3 text-xs font-bold uppercase font-display tracking-wider flex items-center justify-center gap-1.5 transition-all outline-none ${authMode === 'login' || authMode === 'forgot' ? 'bg-zinc-950 text-white font-black' : 'bg-zinc-55 text-zinc-600 hover:bg-zinc-100'}`}
            >
              <LogIn size={14} /> Acceder
            </button>
            <button
              onClick={() => { setAuthMode('register'); setAuthError(''); setResetSent(false); }}
              className={`flex-1 py-3 text-xs font-bold uppercase font-display tracking-wider flex items-center justify-center gap-1.5 transition-all outline-none ${authMode === 'register' ? 'bg-zinc-950 text-white font-black' : 'bg-zinc-55 text-zinc-600 hover:bg-zinc-100'}`}
            >
              <UserPlus size={14} /> Registrarse
            </button>
          </div>

          <div className="p-5 flex flex-col gap-4">
            <div className="text-center">
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                {authMode === 'login' && 'Inicia sesión con tus datos personales para consultar el estado en tiempo real de tus compras.'}
                {authMode === 'register' && 'Regístrate para recibir notificaciones de promociones, envíos exprés de alimentos y ver el estatus de tus órdenes.'}
                {authMode === 'forgot' && 'Ingresa tu correo electrónico para recibir un enlace de recuperación de contraseña.'}
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-red-50/50 border border-red-200 rounded-lg text-xs font-semibold text-red-650 flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-red-600" />
                <span>{authError}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            {authMode === 'login' && !resetSent && (
              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3.5 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-zinc-650 flex items-center gap-1.5 uppercase font-mono text-[9px] tracking-wider">
                    <Phone size={11} className="text-violet-500" /> Telefono del Checkout
                  </label>
                  <input
                    type="tel"
                    required
                    value={logPhone}
                    onChange={(e) => setLogPhone(e.target.value)}
                    placeholder="Ej: +584124976451 o 04124976451"
                    className="bg-zinc-50 px-3 py-2 border border-zinc-200 rounded-lg outline-none focus:border-zinc-950 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5 relative">
                  <label className="font-bold text-zinc-650 flex items-center gap-1.5 uppercase font-mono text-[9px] tracking-wider">
                    <Lock size={11} className="text-violet-500" /> Contrasena Secreta
                  </label>
                  <div className="relative w-full">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={logPassword}
                      onChange={(e) => setLogPassword(e.target.value)}
                      placeholder="Ingrese su contrasena..."
                      className="bg-zinc-50 pl-3 pr-10 py-2 border border-zinc-200 rounded-lg outline-none focus:border-zinc-950 w-full text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition"
                      title={showPassword ? "Ocultar Contrasena" : "Mostrar Contrasena"}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-750 text-white font-bold font-display uppercase tracking-wider py-2.5 rounded-lg text-xs mt-2 transition-transform cursor-pointer"
                >
                  Entrar a Mi Panel
                </button>
                
                <button
                  type="button"
                  onClick={() => setAuthMode('forgot')}
                  className="text-[10px] text-zinc-500 hover:text-violet-600 transition-colors font-medium mt-1 text-center"
                >
                  ¿Olvidó su contraseña?
                </button>
              </form>
            )}

            {/* FORGOT PASSWORD FORM */}
            {authMode === 'forgot' && !resetSent && (
              <form onSubmit={handleForgotSubmit} className="flex flex-col gap-3.5 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-zinc-650 flex items-center gap-1.5 uppercase font-mono text-[9px] tracking-wider">
                    <User size={11} className="text-violet-500" /> Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="bg-zinc-50 px-3 py-2 border border-zinc-200 rounded-lg outline-none focus:border-zinc-950 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-750 text-white font-bold font-display uppercase tracking-wider py-2.5 rounded-lg text-xs mt-2 transition-transform cursor-pointer"
                >
                  Enviar Enlace de Recuperación
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-[10px] text-zinc-500 hover:text-violet-600 transition-colors font-medium mt-1 text-center"
                >
                  Volver al Inicio de Sesión
                </button>
              </form>
            )}

            {/* REGISTER FORM */}
            {authMode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3.5 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-zinc-650 flex items-center gap-1.5 uppercase font-mono text-[9px] tracking-wider">
                    <User size={11} className="text-violet-500" /> Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ej. Carlos Perez"
                    className="bg-zinc-50 px-3 py-2 border border-zinc-200 rounded-lg outline-none focus:border-zinc-950 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-zinc-650 flex items-center gap-1.5 uppercase font-mono text-[9px] tracking-wider">
                    <Mail size={11} className="text-violet-500" /> Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="bg-zinc-50 px-3 py-2 border border-zinc-200 rounded-lg outline-none focus:border-zinc-950 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-zinc-650 flex items-center gap-1.5 uppercase font-mono text-[9px] tracking-wider">
                    <Phone size={11} className="text-violet-500" /> Telefono (El mismo que usas en el checkout)
                  </label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="Ej. +584124976451"
                    className="bg-zinc-50 px-3 py-2 border border-zinc-200 rounded-lg outline-none focus:border-zinc-950 text-sm"
                  />
                  <p className="text-[10px] text-zinc-400 italic">Es muy importante usar el mismo telefono para que tus pedidos se sincronicen automaticamente.</p>
                </div>

                <div className="flex flex-col gap-1.5 relative">
                  <label className="font-bold text-zinc-650 flex items-center gap-1.5 uppercase font-mono text-[9px] tracking-wider">
                    <Lock size={11} className="text-violet-500" /> Crear Contrasena Secreta
                  </label>
                  <div className="relative w-full">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Crea una contrasena..."
                      className="bg-zinc-50 pl-3 pr-10 py-2 border border-zinc-200 rounded-lg outline-none focus:border-zinc-950 w-full text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition"
                      title={showPassword ? "Ocultar Contrasena" : "Mostrar Contrasena"}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-750 text-white font-bold font-display uppercase tracking-wider py-2.5 rounded-lg text-xs mt-2 transition-transform cursor-pointer"
                >
                  Registrar e Ingresar
                </button>
              </form>
            )}

            {/* Easy credentials reminder banner */}
            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg flex items-start gap-2.5 text-[10px] sm:text-xs leading-relaxed text-zinc-700 font-mono">
              <div>
                Tu <strong>Nombre</strong> y tu <strong>Telefono Movil</strong> combinados con tu clave elegida, seran tu usuario y contrasena vital para seguir tus pedidos en Valencia.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* LOGGED IN VIEW */
        <div className="flex flex-col gap-6">
          {/* USER CHROME HEADER AND QUICK STATS */}
          <div className="p-5 border border-zinc-200 rounded-xl bg-gradient-to-br from-zinc-50 to-zinc-100/40 divide-y divide-zinc-200/80 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-lg shadow-inner animate-fade-in animate-duration-500">
                  {currentUser.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 leading-tight flex items-center gap-1.5">
                    {currentUser.nombre}
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono flex items-center gap-1 mt-0.5">
                    <Phone size={11} className="text-zinc-400" /> {currentUser.telefono}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  logoutUser();
                  setTab('home');
                }}
                className="bg-white hover:bg-zinc-100 text-red-500 hover:text-red-700 hover:border-red-600 transition-all border border-zinc-200 text-[10px] font-bold uppercase tracking-wider py-1.5 px-2.5 rounded-lg cursor-pointer flex items-center gap-1"
              >
                <LogOut size={11} /> Salir
              </button>
            </div>

            {/* SUB-TABS INTERIOR */}
            <div className="pt-4 flex justify-between items-center bg-transparent gap-2">
              <button
                type="button"
                onClick={() => { setActiveSubTab('orders'); setShowEditFields(false); }}
                className={`flex-1 py-1 px-1.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider text-center flex items-center justify-center gap-1 ${activeSubTab === 'orders' ? 'bg-zinc-950 text-white' : 'text-zinc-500 hover:text-zinc-900 bg-white border border-zinc-200'}`}
              >
                <Package size={13} /> Pedidos ({userOrders.length})
              </button>
              
              <button
                type="button"
                onClick={() => { setActiveSubTab('notifications'); setShowEditFields(false); }}
                className={`flex-1 py-1 px-1.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider text-center flex items-center justify-center gap-1 relative ${activeSubTab === 'notifications' ? 'bg-zinc-950 text-white' : 'text-zinc-500 hover:text-zinc-900 bg-white border border-zinc-200'}`}
              >
                <Bell size={13} /> Mensajes
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1 bg-red-500 border border-white text-white font-mono text-[8px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center antialiased">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setActiveSubTab('profile'); setShowEditFields(true); }}
                className={`flex-1 py-1 px-1.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider text-center flex items-center justify-center gap-1 ${activeSubTab === 'profile' ? 'bg-zinc-950 text-white' : 'text-zinc-500 hover:text-zinc-900 bg-white border border-zinc-200'}`}
              >
                <Edit2 size={13} /> Mi Cuenta
              </button>
            </div>
          </div>

          {/* EDIT PROFILE FIELDS CONTAINER */}
          {activeSubTab === 'profile' && showEditFields && (
            <div className="p-4 border border-zinc-200 rounded-xl bg-white flex flex-col gap-4 text-xs">
              <h3 className="text-sm font-bold font-display text-zinc-900 border-b border-zinc-150 pb-2">Editar Datos de Perfil</h3>
              
              <form onSubmit={handleUpdateProfile} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-zinc-650">Nombre Completo</span>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:border-zinc-900 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-zinc-650">Teléfono Registrado</span>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:border-zinc-900 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1 relative">
                  <span className="font-semibold text-zinc-650">Contraseña Secreta</span>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="bg-zinc-50 border border-zinc-200 rounded-lg pl-3 pr-10 py-2 outline-none focus:border-zinc-900 w-full text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-2.5 rounded-lg text-xs tracking-wider transition-colors uppercase font-display cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </form>
            </div>
          )}

          {/* ACTIVE TAB CONTENT Area: ORDERS */}
          {activeSubTab === 'orders' && (
            <div className="flex flex-col gap-4 text-xs">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold font-display text-zinc-900">Mis Pedidos en Valencia</h3>
                <span className="text-[10px] text-zinc-500 font-mono">Total: {userOrders.length}</span>
              </div>

              {userOrders.length === 0 ? (
                <div className="text-center py-12 p-6 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col items-center gap-2">
                  <span className="text-2xl mt-1"></span>
                  <h4 className="font-semibold text-zinc-800">No tienes pedidos registrados</h4>
                  <p className="text-[11px] text-zinc-400 max-w-xs leading-normal">
                    Si ya realizaste un checkout, asegurate de que tu numero de telefono registrado ({currentUser.telefono}) coincida exactamente con el de la factura de WhatsApp.
                  </p>
                  <button
                    onClick={() => setTab('catalog')}
                    className="mt-3 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-bold text-xs cursor-pointer"
                  >
                    Hacer Mi Primer Pedido
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {userOrders.map(order => (
                    <div key={order.id} className="border border-zinc-200 bg-white rounded-xl overflow-hidden shadow-sm flex flex-col divide-y divide-zinc-100">
                      {/* Order top bar info */}
                      <div className="p-3 bg-zinc-50/50 flex justify-between items-center">
                        <div>
                          <p className="font-mono text-zinc-900 font-bold tracking-tight text-xs">{order.id}</p>
                          <p className="text-[9px] text-zinc-400 font-mono">{order.fecha}</p>
                        </div>
                        {/* Status badges */}
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => { setActiveOrderModalId(order.id); setShowOrderTimelineModal(true); }}
                            className="text-[9px] bg-violet-600 text-white px-2 py-0.5 rounded font-bold uppercase animate-pulse cursor-pointer"
                          >
                            Rastrear 🛵
                          </button>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase font-mono ${
                            order.status === 'Pendiente' ? 'bg-amber-100 text-amber-800 border-amber-300 border' :
                            order.status === 'Procesando' ? 'bg-blue-100 text-blue-800 border-blue-300 border' :
                            order.status === 'En preparación' ? 'bg-indigo-100 text-indigo-800 border-indigo-300 border' :
                            order.status === 'En camino' ? 'bg-violet-100 text-violet-800 border-violet-400 border animate-pulse' :
                            order.status === 'Enviado' ? 'bg-violet-100 text-violet-800 border-violet-300 border' :
                            'bg-zinc-100 text-zinc-850 border border-zinc-300' // 'Entregado'
                          }`}>
                            {order.status === 'Enviado' ? 'Enviado / Despachado' : order.status}
                          </span>
                        </div>
                      </div>

                      {/* Items details nested list */}
                      <div className="p-3 bg-white flex flex-col gap-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Productos del Pedido:</span>
                        <div className="flex flex-col gap-1.5">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[11px] text-zinc-700 bg-zinc-50/40 p-1.5 rounded border border-zinc-100/60 font-mono">
                              <span className="line-clamp-1 flex-1 font-sans font-medium text-zinc-900">{it.cantidad}x {it.nombre}</span>
                              <span className="font-bold text-zinc-800 shrink-0 ml-2">${(it.precio_usd * it.cantidad).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* DELIVERY / COURIER METRICS */}
                      <div className="p-3 bg-zinc-50/30 flex flex-col gap-2.5">
                        <div className="flex justify-between text-[11px] text-zinc-650">
                          <span className="flex items-center gap-1"><MapPin size={12} className="text-red-500" /> Direccion recogida / delivery:</span>
                          <span className="font-mono text-zinc-950 font-bold text-right">{order.direccion_envio}</span>
                        </div>

                        {/* ESTIMATIVE PROGRESS BAR */}
                        <div className="flex flex-col gap-1.5 mt-1 border-t border-zinc-100 pt-2 bg-transparent">
                          <div className="flex justify-between items-baseline">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                              <Clock size={11} className="text-violet-500" /> Estado de Envio
                            </span>
                          </div>

                          {/* Graphical Visualizer */}
                          <div className="grid grid-cols-4 gap-1 mt-1 font-mono text-[9px]">
                            {[
                              { label: 'Pendiente', target: ['Pendiente'] },
                              { label: 'Preparación', target: ['En preparación', 'Procesando'] },
                              { label: 'En Camino', target: ['En camino', 'Enviado'] },
                              { label: 'Entregado', target: ['Entregado'] },
                            ].map((stepObj, idx, arr) => {
                              // evaluate if this step has been completed in order status sequence
                              const statusOrder = ['Pendiente', 'Procesando', 'En preparación', 'En camino', 'Enviado', 'Entregado'];
                              const currentPower = statusOrder.indexOf(order.status);
                              
                              let isStepPassed = false;
                              if (stepObj.label === 'Pendiente') isStepPassed = currentPower >= 0;
                              if (stepObj.label === 'Preparación') isStepPassed = currentPower >= 1; // Procesando = preparacion index wise
                              if (stepObj.label === 'En Camino') isStepPassed = currentPower >= 3; // En camino / Enviado
                              if (stepObj.label === 'Entregado') isStepPassed = currentPower >= 5;

                              const isCurrent = stepObj.target.includes(order.status);

                              return (
                                <div key={idx} className="flex flex-col gap-1 items-center relative">
                                  {order.status === 'En camino' && stepObj.label === 'En Camino' && (
                                    <motion.div
                                      initial={{ x: "-40%" }}
                                      animate={{ x: "40%" }}
                                      transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                                      className="absolute -top-5 text-violet-600 drop-shadow-sm"
                                    >
                                      <Truck size={16} />
                                    </motion.div>
                                  )}
                                  <div className={`h-[4px] w-full rounded-full transition-all ${
                                    isCurrent ? 'bg-violet-600 ring-2 ring-violet-400/30 animate-pulse' :
                                    isStepPassed ? 'bg-zinc-800' : 'bg-zinc-200'
                                  }`} />
                                  <span className={`text-[8px] font-medium transition-colors ${
                                    isCurrent ? 'text-violet-600 font-bold' :
                                    isStepPassed ? 'text-zinc-900 font-semibold' : 'text-zinc-400'
                                  }`}>{stepObj.label}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* DELIVERY ESTIMATED TIME (Requested) */}
                          {order.status !== 'Entregado' && (
                            <div className="mt-1.5 p-2 bg-violet-50/50 border border-violet-100 rounded-lg text-violet-850 text-[11px] leading-relaxed flex items-center justify-between font-medium">
                              <div className="flex items-center gap-1.5">
                                <span>Tiempo de entrega estimado:</span>
                              </div>
                              <span className="font-bold underline text-violet-700">
                                {order.tiempo_estimado_entrega || "En asignación por tienda"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Invoice and Support action bottom bar of order cards */}
                      <div className="p-3 bg-zinc-50 flex justify-between items-center text-xs font-mono">
                        <div>
                          <span className="text-zinc-400">Total pagado:</span>
                          <p className="font-bold text-zinc-900 scale-105 ml-1 mt-0.5">${(order.total_usd || 0).toFixed(2)} • <span className="text-green-600 font-semibold">{(order.total_bs || 0).toFixed(2)} Bs</span></p>
                        </div>
                        
                        <a
                          href={`https://wa.me/${config.telefono_soporte.replace(/[+ ]/g, '')}?text=${encodeURIComponent(`Hola, quisiera soporte e información de mi Pedido en Valencia con Código: *${order.id}*. El estatus actual es *${order.status}*.`)}`}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          className="bg-zinc-950 hover:bg-zinc-800 text-white font-sans text-[10px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 transition-colors hover:scale-[1.02]"
                        >
                          Soporte Pedido
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ACTIVE TAB CONTENT Area: NOTIFICATIONS & PROMOTIONS (Requested) */}
          {activeSubTab === 'notifications' && (
            <div className="flex flex-col gap-4 text-xs">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold font-display text-zinc-900">Mensajería Directa & Avisos</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white font-bold px-2 py-0.5 rounded-full text-[9px]">{unreadCount} nuevos</span>
                )}
              </div>

              {/* Browser Push Notifications Utility Box */}
              <div id="browser-push-settings" className="p-4 border border-violet-200 bg-violet-50/10 rounded-xl relative overflow-hidden flex flex-col gap-3">
                <div className="flex gap-2.5 items-start">
                  <div className="p-2 bg-violet-100 rounded-lg text-violet-600 shrink-0">
                    <Bell size={16} />
                  </div>
                  <div className="flex-1 flex flex-col gap-0.5">
                    <h4 className="font-bold text-zinc-950 text-xs">Notificaciones de Escritorio / Móvil</h4>
                    <p className="text-[11px] text-zinc-650 leading-relaxed font-sans">
                      Permite que la app te envíe avisos rápidos de promociones y estado de tus pedidos directamente en tu pantalla.
                    </p>
                  </div>
                </div>

                {/* Sub-status control based on state */}
                {notificationPermission === 'unsupported' && (
                  <div className="bg-zinc-100 border border-zinc-200 text-zinc-650 text-[10px] p-2.5 rounded-lg flex items-center gap-1.5 leading-normal">
                     <AlertCircle size={12} className="shrink-0 text-zinc-500" />
                    <span>Las notificaciones nativas no son soportadas por tu navegador en este contexto. Prueba abriendo en una pestaña aparte.</span>
                  </div>
                )}

                {notificationPermission === 'denied' && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-800 text-[10px] p-2.5 rounded-lg flex flex-col gap-1 leading-normal font-sans">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertCircle size={12} className="shrink-0 text-rose-500" />
                      <span>Notificaciones Bloqueadas en tu Navegador</span>
                    </div>
                    <span>Has desactivado los permisos de notificación. Para habilitarlos, por favor haz clic en el ícono de candado junto a la URL del navegador y cambia el permiso a "Permitir".</span>
                  </div>
                )}

                {notificationPermission === 'default' && (
                  <div className="flex flex-col gap-2 pt-1 border-t border-violet-100/30 font-display">
                    <button
                      type="button"
                      onClick={requestNotificationPermission}
                      className="w-full bg-violet-600 hover:bg-violet-750 text-white font-extrabold py-2.5 px-3 rounded-lg text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                    >
                      <span>Habilitar Notificaciones de Navegador</span>
                    </button>
                  </div>
                )}

                {notificationPermission === 'granted' && (
                  <div className="flex flex-col gap-2.5 pt-1 border-t border-violet-100/30">
                    <div className="bg-violet-50 border border-violet-150 text-violet-850 text-[10px] p-2.5 rounded-lg flex items-center gap-1.5 font-medium leading-normal">
                      <CheckCircle size={12} className="shrink-0 text-violet-600" />
                      <span>¡Notificaciones Habilitadas Exitosamente para Valencia!</span>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={sendTestPushNotification}
                        className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-2.5 px-3.5 rounded-lg text-[11px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.97]"
                      >
                        🔔 Enviar Notificación de Prueba
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {userNotifications.length === 0 ? (
                <div className="text-center py-16 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col items-center gap-2">
                  <span className="text-3xl mt-1"></span>
                  <p className="font-semibold text-zinc-700">Tu bandeja de avisos está limpia</p>
                  <p className="text-[11px] text-zinc-400 max-w-xs mt-0.5 leading-relaxed">
                    Aquí enviaremos ofertas inmediatas en quesos, carnes frescas, embutidos y cupones de despacho gratuito en el Gran Valencia.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {userNotifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`p-3.5 border rounded-xl flex items-start gap-3 relative shadow-xs transition-colors ${
                        notif.leida 
                          ? 'bg-zinc-50/40 border-zinc-200 text-zinc-700' 
                          : 'bg-violet-50/10 border-violet-200 text-zinc-950 ring-1 ring-violet-500/5'
                      }`}
                    >
                      {/* Read status dot */}
                      {!notif.leida && (
                        <div className="absolute top-3.5 right-3.5 w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" />
                      )}

                      <div className="p-1.5 rounded-lg bg-violet-100/60 text-violet-600 font-bold shrink-0 mt-0.5 font-mono text-[10px]">
                        {notif.tipo === 'personal' ? 'P' : 'T'}
                      </div>

                      <div className="flex-1 flex flex-col gap-1 pr-4">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-zinc-800 text-[12px] pr-2">{notif.titulo}</h4>
                          {notif.tipo === 'personal' && (
                            <span className="text-[8px] bg-indigo-50 border border-indigo-200 text-indigo-600 px-1 py-0.2 rounded font-mono font-bold tracking-tight uppercase">Personal</span>
                          )}
                          {notif.tipo === 'todos' && (
                            <span className="text-[8px] bg-violet-50 border border-violet-200 text-violet-600 px-1 py-0.2 rounded font-mono font-bold tracking-tight uppercase">Promo</span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-650 leading-relaxed font-sans mt-0.5">{notif.mensaje}</p>
                        <span className="text-[9px] font-mono text-zinc-400 mt-1">{notif.fecha}</span>
                      </div>

                      <div className="absolute bottom-3 right-3 flex gap-2 items-center">
                        {/* Action mark as read */}
                        {!notif.leida && (
                          <button
                            onClick={() => markNotificationAsRead(notif.id)}
                            className="text-[10px] text-violet-600 hover:text-violet-800 hover:underline font-bold"
                          >
                            Marcar leída
                          </button>
                        )}

                        {/* Delete notification (borrar mensajes) */}
                        <button
                          type="button"
                          onClick={() => {
                            const ok = confirm('¿Seguro que deseas borrar este mensaje del panel?');
                            if (ok) deleteNotification(notif.id);
                          }}
                          className="text-[10px] text-rose-600 hover:text-rose-800 hover:underline font-bold"
                          title="Borrar mensaje"
                        >
                          Borrar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Direct Message Module from User to Business */}
              <div className="p-4 border border-indigo-100 bg-indigo-50/30 rounded-xl flex flex-col gap-3 mt-2">
                <div className="flex gap-2 items-center">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 shrink-0">
                    <Edit2 size={16} />
                  </div>
                  <h4 className="font-bold text-indigo-950 text-xs">Enviar Mensaje al Negocio</h4>
                </div>
                <p className="text-[11px] text-zinc-650 leading-relaxed font-sans">
                  ¿Tienes alguna consulta o necesitas ayuda con un pedido? Escríbenos directamente y te responderemos por este mismo medio o a tu WhatsApp.
                </p>
                <textarea 
                  id="direct-msg"
                  className="w-full text-xs p-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white" 
                  placeholder="Ej: Hola, quisiera saber si tienen disponibilidad para..."
                  rows={3}
                />
                <button 
                  onClick={() => {
                    const desc = (document.getElementById('direct-msg') as HTMLTextAreaElement).value;
                    if (desc.trim()) {
                      addNotification(
                        'Mensaje de Cliente: ' + currentUser.nombre,
                        `El cliente envió este mensaje:\n\n"${desc}"\n\nTeléfono de contacto: ${currentUser.telefono}`,
                        'request',
                        currentUser.telefono
                      );
                      addNotification(
                        'Mensaje Enviado',
                        'Tu mensaje ha sido enviado exitosamente al equipo de Marketo.',
                        'personal',
                        currentUser.telefono
                      );
                      (document.getElementById('direct-msg') as HTMLTextAreaElement).value = '';
                      alert('¡Mensaje enviado correctamente!');
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2.5 font-bold text-xs transition-colors"
                >
                  Enviar Mensaje
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREDENTIALS REMINDER DIALOG (MANDATORY REQUIREMENT) */}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xl flex flex-col text-zinc-900 border-t-4 border-t-violet-600 scale-100 transition-all">
            
            {/* Header section with modern background */}
            <div className="p-5 text-center flex flex-col items-center bg-zinc-50 border-b border-zinc-100">
              <div className="w-12 h-12 bg-violet-500/10 text-violet-600 border border-violet-500/20 rounded-full flex items-center justify-center mb-3 text-2xl shrink-0 animate-bounce">
              </div>
              <h4 className="text-sm font-black font-display uppercase tracking-wider text-violet-950 leading-tight">
                {showReminderModal.is_update ? '¡Perfil Actualizado!' : '¡Registro Completado con Éxito!'}
              </h4>
              <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                {showReminderModal.is_update 
                  ? 'Has modificado tus datos de acceso. Guarda o anota tus nuevas credenciales para evitar inconvenientes en tus inicios de sesión futuros:'
                  : 'Para asegurar la seguridad de tu cuenta y el rastreo de tus pedidos de supermercado, toma nota y guarda tus credenciales ahora.'}
              </p>
            </div>

            {/* Credential display grid and copy elements */}
            <div className="p-5 flex flex-col gap-3.5 bg-white">
              
              {/* BRAND / HEADER */}
              <div className="text-[9px] font-mono uppercase tracking-[0.2em] font-extrabold text-violet-600 bg-violet-50/50 py-1 px-2.5 rounded-md border border-violet-100/30 text-center">
                Club de Clientes de Marketo
              </div>

              {/* 1. NAME CREDENTIAL */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-50 border border-zinc-200 transition-all hover:bg-zinc-100/50">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase font-mono tracking-wider text-zinc-400">
                  <span className="flex items-center gap-1">Nombre / Usuario</span>
                  {copiedName && <span className="text-violet-600 font-extrabold flex items-center gap-0.5 animate-pulse">¡Copiado!</span>}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-black text-zinc-900 truncate leading-none">
                    {showReminderModal.nombre}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(showReminderModal.nombre, 'name')}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-violet-600 hover:bg-violet-50 border border-transparent hover:border-violet-200 transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-90"
                    title="Copiar nombre"
                  >
                    {copiedName ? <Check size={13} className="text-violet-600" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              {/* 2. PHONE CREDENTIAL */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-50 border border-zinc-200 transition-all hover:bg-zinc-100/50">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase font-mono tracking-wider text-zinc-400">
                  <span className="flex items-center gap-1">Telefono de Acceso</span>
                  {copiedPhone && <span className="text-violet-600 font-extrabold flex items-center gap-0.5 animate-pulse">¡Copiado!</span>}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-black text-zinc-900 truncate leading-none">
                    {showReminderModal.telefono}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(showReminderModal.telefono, 'phone')}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-violet-600 hover:bg-violet-50 border border-transparent hover:border-violet-200 transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-90"
                    title="Copiar teléfono"
                  >
                    {copiedPhone ? <Check size={13} className="text-violet-600" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              {/* 3. PASSWORD CREDENTIAL */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-50 border border-zinc-200 transition-all hover:bg-zinc-100/50">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase font-mono tracking-wider text-zinc-400">
                  <span className="flex items-center gap-1">Clave Secreta</span>
                  <div className="flex items-center gap-2">
                    {copiedPassword && <span className="text-violet-600 font-extrabold flex items-center gap-0.5 animate-pulse">¡Copiado!</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-black text-violet-600 truncate leading-none">
                    {showReminderPassword ? showReminderModal.contrasena : '••••••••••••'}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowReminderPassword(!showReminderPassword)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-850 hover:bg-zinc-200/60 border border-transparent transition-all cursor-pointer flex items-center justify-center active:scale-90"
                      title={showReminderPassword ? "Ocultar Contrasena" : "Mostrar Contrasena"}
                    >
                      {showReminderPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyText(showReminderModal.contrasena, 'password')}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-violet-600 hover:bg-violet-50 border border-transparent hover:border-violet-200 transition-all cursor-pointer flex items-center justify-center active:scale-90"
                      title="Copiar contraseña"
                    >
                      {copiedPassword ? <Check size={13} className="text-violet-600" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. EXPORT ALL BUTTON */}
              <button
                type="button"
                onClick={() => handleCopyText(
`MIS CREDENCIALES DE MARKETO:
======================================
Cliente/Usuario: ${showReminderModal.nombre}
Teléfono Móvil: ${showReminderModal.telefono}
Contraseña/Clave: ${showReminderModal.contrasena}
======================================
*Nota: Nunca compartas estos datos con extraños.`, 'all')}
                className={`w-full py-2 px-3 rounded-xl border border-dashed text-xs font-bold font-mono text-center flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] ${
                  copiedAll 
                    ? 'bg-violet-50 text-violet-700 border-violet-300' 
                    : 'bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200 hover:border-violet-400'
                }`}
              >
                {copiedAll ? (
                  <>
                    <Check size={14} className="text-violet-600" />
                    <span>¡Todas las credenciales copiadas!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copiar todas mis credenciales</span>
                  </>
                )}
              </button>

              {/* SECURITY NOTICE METRIC */}
              <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-[10px] leading-relaxed text-zinc-700 font-medium">
                <div>
                  <strong>Aviso de Privacidad:</strong> Estas credenciales se guardan localmente para tu comodidad. Escríbelas en una libreta segura. Tu teléfono registrado es fundamental para vincular tus pedidos automáticamente.
                </div>
              </div>

            </div>

            {/* BUTTON MAIN ACCENT DISMISS */}
            <div className="p-5 bg-zinc-50 border-t border-zinc-100 text-center">
              <button
                type="button"
                onClick={() => {
                  setShowReminderModal(null);
                  setShowReminderPassword(false);
                }}
                className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-extrabold font-display py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer text-center hover:scale-[1.01] active:scale-95 shadow-md shadow-zinc-950/10"
              >
                Comprendido, He Seguro Anotado los Datos
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
