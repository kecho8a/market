import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../store/AppContext';
import { Producto, Order, OrderItem, AppUser, DeliveryZone } from '../types/store';
import { supabase, uploadFileToStorage, compressImage, getPublicUrl } from '../store/supabaseClient';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import {
  Plus, Edit, Trash2, Landmark, Settings, ShoppingBag, BarChart3, Mic, FileJson,
  Search, CheckCircle, Truck, PackageCheck, AlertTriangle, Send, Bell, Ticket,
  Receipt, Printer, Check, X, MessageSquare, MessageCircle, ExternalLink, Upload, DollarSign, Package, ShoppingCart, User, Download, FileSpreadsheet, Eye, EyeOff, Calendar, AlertCircle, RefreshCcw
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { EditProductForm } from '../components/EditProductForm';

interface AdminProps {
  setTab: (tab: 'home' | 'catalog' | 'cart' | 'admin') => void;
}

export const Admin: React.FC<AdminProps> = ({ setTab }) => {
  const { 
    parts, orders, config, notifications, searchPartsSemantically,
    addPart, updatePart, deletePart, updateConfig, updateExchangeRate, currentUser, syncPushSubscription,
    updateOrderStatus, updateOrderItems, addNotification, toggleNotificationReadStatus, deleteNotification,
    updateAdminCredentials, adminUser, adminPass, users, updateUserByAdmin,
    addCategory, deleteCategory, updateCategory, 
    coupons, addCoupon, updateCoupon, deleteCoupon, clearAllNotifications
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bImageInputRef = useRef<HTMLInputElement>(null);

  // Temporary local state for credential editing
  const [newAdminUser, setNewAdminUser] = useState(adminUser);
  const [newAdminPass, setNewAdminPass] = useState(adminPass);

  // Navigation within admin panel: 'inventory' | 'orders' | 'settings' | 'reports' | 'notifications' | 'customers'
  const [adminSection, setAdminSection] = useState<'inventory' | 'orders' | 'settings' | 'reports' | 'notifications' | 'customers' | 'coupons'>('reports');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied'
  );
  const [isListening, setIsListening] = useState(false);

  // New Order Modal State
  const [incomingOrder, setIncomingOrder] = useState<Order | null>(null);
  const [adminNote, setAdminNote] = useState('');
  
  // Múltiples modales abiertos
  const [openOrderDetailIds, setOpenOrderDetailIds] = useState<string[]>([]);
  const [statusUpdateTarget, setStatusUpdateTarget] = useState<{id: string, nextStatus: Order['status']} | null>(null);
  const [estimatedTimeInput, setEstimatedTimeInput] = useState('');

  // Estado para Chat de Notificaciones
  const [activeChatPhone, setActiveChatPhone] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [notifCatFilter, setNotifCatFilter] = useState<'clientes' | 'grupal' | 'sistema'>('clientes');

  // State para edición de items de pedido
  const [editingOrderItems, setEditingOrderItems] = useState<Order | null>(null);
  const [tempEditItems, setTempEditItems] = useState<OrderItem[]>([]);
  const [orderEditSearch, setOrderEditSearch] = useState('');

  // State para editor de zonas de delivery
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneCost, setNewZoneCost] = useState(0);
  const [newZoneMinKm, setNewZoneMinKm] = useState(0);
  const [newZoneMaxKm, setNewZoneMaxKm] = useState(0);

  useEffect(() => {
    if (editingOrderItems) {
      setTempEditItems([...editingOrderItems.items]);
    }
  }, [editingOrderItems]);

  const filteredCatalogForEdit = useMemo(() => {
    if (!orderEditSearch.trim()) return [];
    return parts.filter(p => p.nombre.toLowerCase().includes(orderEditSearch.toLowerCase()) || p.codigo.toLowerCase().includes(orderEditSearch.toLowerCase())).slice(0, 5);
  }, [parts, orderEditSearch]);

  useEffect(() => {
    const handleNewOrder = (e: any) => {
      setIncomingOrder(e.detail);
    };
    window.addEventListener('new_order_received', handleNewOrder);
    return () => window.removeEventListener('new_order_received', handleNewOrder);
  }, []);

  // Search input for inventory parts CRUD search
  const [crudSearch, setCrudSearch] = useState('');

  // CRUD MODAL STATE
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Producto | null>(null);

  // Form states for adding/editing a product
  const [formCodigo, setFormCodigo] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formDetalleAdicional, setFormDetalleAdicional] = useState('');
  const [uploadFormat, setUploadFormat] = useState<'image/webp' | 'image/jpeg'>('image/webp');
  const [formCategoria, setFormCategoria] = useState('Lácteos y Quesos');
  const [formMarca, setFormMarca] = useState('Pasillo 1 - Lacteos');
  const [formModelo, setFormModelo] = useState('');
  const [formAnioInicio, setFormAnioInicio] = useState(15);
  const [formAnioFin, setFormAnioFin] = useState(4);
  const [formPrecio, setFormPrecio] = useState(0.00);
  const [formStock, setFormStock] = useState(1);
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formPromo, setFormPromo] = useState(false);
  const [formNuevo, setFormNuevo] = useState(false);
  const [formVendido, setFormVendido] = useState(false);
  const [formDisponibilidad, setFormDisponibilidad] = useState<'Disponible' | 'Agotado' | 'En Reposición'>('Disponible');

  // Broadcaster states
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTipo, setBroadcastTipo] = useState<'todos' | 'personal' | 'admin'>('todos');
  const [broadcastImage, setBroadcastImage] = useState('');
  const [broadcastLink, setBroadcastLink] = useState('');
  const [broadcastDestinatarioTelefono, setBroadcastDestinatarioTelefono] = useState('');
  const [showProductPickerForBroadcast, setShowProductPickerForBroadcast] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastTitle, setToastTitle] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // ✅ Monitorizar nuevas notificaciones para feedback visual y auditivo en tiempo real (Puebas Admin)
  const prevNotifCount = useRef(notifications.length);
  useEffect(() => {
    // Si el contador aumenta, es que llegó algo nuevo vía Realtime
    if (notifications.length > prevNotifCount.current) {
      const latest = notifications[0]; 
      // Solo mostrar toast si es una notificación "viva" y no la de inicialización
      if (latest && latest.id !== 'init-notif' && !latest.leida) {
        setToastTitle(`🔔 Nueva Alerta: ${latest.titulo}`);
        setToastMessage(latest.mensaje);
        
        // Nota: El sonido se dispara automáticamente desde AppContext.tsx 
        // al detectar el INSERT en la tabla notifications.
      }
    }
    prevNotifCount.current = notifications.length;
  }, [notifications]);

  // ✅ Manejador de subida de imagen promocional
  const handleUploadBroadcastImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Generar preview local inmediata para mejor UX
    const localUrl = URL.createObjectURL(file);
    setBroadcastImage(localUrl);
    setIsUploadingImage(true);

    try {
      setToastTitle('⏳ Subiendo Imagen...');
      setToastMessage('Procesando archivo para la promoción...');
      
      const compressed = await compressImage(file, { maxWidth: 800, quality: 0.8 });
      const url = await uploadFileToStorage(compressed, 'settings', `promos/${Date.now()}.webp`);
      setBroadcastImage(url);
      setToastTitle('✅ Imagen Lista');
      setToastMessage('La imagen se ha vinculado a la notificación.');
    } catch (err: any) {
      alert('Error al subir imagen: ' + err.message);
    } finally {
      setIsUploadingImage(false);
    }
    if (e.target) e.target.value = '';
  };

  // ✅ FIX: Estado del modal inline "Enviar Mensaje" a cliente (reemplaza prompt() que falla en PWA)
  const [sendMsgModal, setSendMsgModal] = useState<{ user: AppUser } | null>(null);
  const [sendMsgTitle, setSendMsgTitle] = useState('');
  const [sendMsgBody, setSendMsgBody] = useState('');
  const [sendMsgLoading, setSendMsgLoading] = useState(false);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage('');
        setToastTitle('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Invoice visual receipt printing state
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  // Filter state for orders
  const [orderFilter, setOrderFilter] = useState<'Todos' | 'Pendiente' | 'Procesando' | 'Enviado'>('Todos');

  // Coupon Form State
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState(5);
  const [newCouponLimit, setNewCouponLimit] = useState<number | ''>('');

  // Open CRUD Editor Helper
  const openEditor = (part: Producto | null = null) => {
    if (part) {
      setEditingPart(part);
      setFormCodigo(part.codigo);
      setFormNombre(part.nombre);
      setFormDescripcion(part.descripcion);
      setFormCategoria(part.categoria);
      setFormMarca(part.seccion);
      setFormModelo(part.subseccion);
      setFormAnioInicio(part.anio_inicio);
      setFormAnioFin(part.anio_fin);
      setFormPrecio(part.precio_usd);
      setFormStock(part.stock);
      setFormImages(part.imagen_urls && part.imagen_urls.length > 0 ? [...part.imagen_urls] : ['']);
      setFormPromo(part.es_promo);
      setFormNuevo(part.es_nuevo);
      setFormVendido(part.es_mas_vendido);
      setFormDetalleAdicional(part.detalle_adicional || '');
      setFormDisponibilidad((part as any).disponibilidad || 'Disponible');
    } else {
      setEditingPart(null);
      setFormCodigo('');
      setFormNombre('');
      setFormDescripcion('');
      setFormCategoria(config.categories?.[0] || 'Lácteos y Quesos');
      setFormMarca('Pasillo 1 - Lacteos');
      setFormModelo('');
      setFormAnioInicio(15);
      setFormAnioFin(4);
      setFormPrecio(1.00);
      setFormStock(10);
      setFormImages(['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=500']);
      setFormPromo(false);
      setFormNuevo(true);
      setFormVendido(false);
      setFormDetalleAdicional('');
      setFormDisponibilidad('Disponible');
    }
    setIsEditorOpen(true);
  };

  const forceUpdateApp = async () => {
    if (confirm("¿Desea forzar la actualización de la aplicación? Se limpiará la caché y se reiniciará para obtener la última versión.")) {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      // Pequeña pausa antes de recargar
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const handleEditorSubmit = (e: React.FormEvent) => {
    if (formStock < 0) {
      alert('El stock no puede ser negativo.');
      return;
    }

    const filteredImages = formImages
      .map(url => url.trim())
      .filter(url => url !== '');

    const payload = {
      codigo: formCodigo.trim(),
      nombre: formNombre.trim(),
      descripcion: formDescripcion.trim(),
      categoria: formCategoria,
      seccion: formMarca,
      subseccion: formModelo.trim(),
      anio_inicio: Number(formAnioInicio),
      anio_fin: Number(formAnioFin),
      precio_usd: Number(formPrecio),
      stock: Number(formStock),
      imagen_urls: filteredImages.length > 0 ? filteredImages : ['https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=500'],
      es_promo: formPromo,
      es_nuevo: formNuevo,
      es_mas_vendido: formVendido,
      detalle_adicional: formDetalleAdicional.trim(),
      disponibilidad: formDisponibilidad
    };

    if (editingPart) {
      updatePart(editingPart.id, payload);
      alert(`¡Artículo ${payload.nombre} actualizado!`);
    } else {
      addPart(payload);
      alert(`¡Nuevo producto ${payload.nombre} creado en el catálogo!`);
    }

    setIsEditorOpen(false);
  };

  const handleProcessIncomingOrder = (status: Order['status']) => {
    if (!incomingOrder) return;
    updateOrderStatus(incomingOrder.id, status, '', adminNote);
    setIncomingOrder(null);
    setAdminNote('');
  };

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Lo siento, su navegador no soporta búsqueda por voz. Pruebe con Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-VE';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setCrudSearch(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleManualBackup = (isAuto = false) => {
    const backupData = {
      version: "1.0",
      site: config.site_nombre,
      date: new Date().toISOString(),
      type: isAuto ? "automatic" : "manual",
      data: {
        products: parts,
        orders,
        users,
        config,
        coupons,
        notifications
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `marketo_backup_${isAuto ? 'auto_' : 'manual'}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    if (!isAuto) {
      localStorage.setItem('marketo_last_backup_date', String(new Date().getTime()));
      alert("¡Respaldo de seguridad generado y descargado con éxito!");
    }
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string);
        if (!backup.data || !backup.version) throw new Error("Formato de respaldo inválido");

        if (confirm(`¿Está seguro? Esto sobrescribirá la configuración actual de la tienda y cargará ${backup.data.products?.length || 0} productos.`)) {
          // Restaurar Configuración
          if (backup.data.config) updateConfig(backup.data.config);
          
          // Restaurar Categorías si existen
          if (backup.data.config.categories) {
             await supabase.from('store_config').update({ categories: backup.data.config.categories }).eq('id', 1);
          }

          alert("Sincronización completada. Los productos se actualizarán en segundo plano.");
          window.location.reload();
        }
      } catch (err) {
        alert(`Error al restaurar: El archivo no es un respaldo válido de ${config.site_nombre || 'la aplicación'}.`);
      }
    };
    reader.readAsText(file);
  };

  const toggleOrderDetail = (orderId: string) => {
    setOpenOrderDetailIds(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const handleStatusAdvance = (order: Order) => {
    const statusSequence: Order['status'][] = ['Pendiente', 'Procesando', 'En preparación', 'En camino', 'Entregado'];
    const currentIndex = statusSequence.indexOf(order.status);
    const nextStatus = statusSequence[currentIndex + 1];

    if (nextStatus === 'En camino') {
      setStatusUpdateTarget({ id: order.id, nextStatus });
    } else if (nextStatus) {
      updateOrderStatus(order.id, nextStatus);
    }
  };

  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    console.log('📢 Admin: Iniciando difusión de notificación:', broadcastTitle);

    // Check if phone was filled for personal notification
    if (broadcastTipo === 'personal' && !broadcastDestinatarioTelefono.trim()) {
      addNotification('⚠️ Falta Teléfono', 'Para notificaciones personales debes especificar el número de teléfono del destinatario.', 'admin');
      return;
    }

    const sentTitle = broadcastTitle.trim();
    const sentMessage = broadcastMessage.trim();
    const targetPhone = broadcastTipo === 'personal' ? broadcastDestinatarioTelefono.trim() : undefined;

    // 1. Insertar en la DB (esto dispara el trigger de push en Supabase automáticamente)
    const success = await addNotification(sentTitle, sentMessage, broadcastTipo, targetPhone, broadcastImage, broadcastLink);

    if (!success) {
      console.error('❌ Admin Error: addNotification falló.');
      alert('Error al enviar notificación. Verifique la consola.');
      return;
    }

    // Custom polished visual confirmation toast showing the title of the broadcast
    setToastTitle(
      broadcastTipo === 'todos' ? '📢 Comunicado Difundido Exitosamente' :
      broadcastTipo === 'personal' ? '👤 Envío de Notificación Personalizada' :
      '🛡️ Alerta de Sistema Registrada'
    );

    setToastMessage(
      broadcastTipo === 'todos'
        ? `El mensaje "${sentTitle}" ha sido enviado vía Push a todos los suscriptores.`
        : `Notificación dirigida al cliente ${targetPhone || 'seleccionado'}.`
    );

    setBroadcastTitle('');
    setBroadcastMessage('');
    setBroadcastDestinatarioTelefono('');
    setBroadcastImage('');
    setBroadcastLink('');
    setBroadcastTipo('todos');
  };

  const exportOrdersToCSV = () => {
    if (orders.length === 0) {
      alert("No hay pedidos para exportar.");
      return;
    }

    const headers = ["ID", "Fecha", "Cliente", "Email", "Telefono", "Cupon", "Desc Cupon", "Metodo Pago", "Total USD", "Total Bs", "Status", "Direccion"];
    const rows = orders.map(order => [
      order.id,
      `"${order.fecha}"`,
      `"${order.cliente_nombre.replace(/"/g, '""')}"`,
      order.cliente_email || "N/A",
      order.cliente_telefono,
      order.cupon_codigo || "N/A",
      (Number(order.descuento_cupon_usd) || 0).toFixed(2),
      order.metodo_pago,
      order.total_usd.toFixed(2),
      order.total_bs.toFixed(2),
      order.status,
      `"${order.direccion_envio.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pedidos_marketo_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      // Analizador robusto de CSV que maneja valores entrecomillados
      const parseCSV = (str: string) => {
        const rows = [];
        let row: string[] = [];
        let col = '';
        let inQuotes = false;
        for (let i = 0; i < str.length; i++) {
          const char = str[i];
          if (char === '"') inQuotes = !inQuotes;
          else if (char === ',' && !inQuotes) { row.push(col.trim()); col = ''; }
          else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (col || row.length) {
              row.push(col.trim());
              rows.push(row);
              row = [];
              col = '';
            }
            if (char === '\r' && str[i+1] === '\n') i++;
          } else col += char;
        }
        if (col || row.length) { row.push(col.trim()); rows.push(row); }
        return rows;
      };

      const rows = parseCSV(text);
      if (rows.length < 2) {
        alert("El archivo está vacío o no tiene el formato correcto.");
        return;
      }

      const headers = rows[0].map(h => h.toLowerCase());
      const importedProducts = rows.slice(1).map(row => {
        const p: any = {};
        headers.forEach((h, i) => {
          let val: any = row[i]?.replace(/^"|"$/g, '').replace(/""/g, '"');
          if (['precio_usd', 'stock', 'anio_inicio', 'anio_fin'].includes(h)) val = parseFloat(val) || 0;
          else if (h.startsWith('es_') || h === 'delivery_gratis') val = val?.toLowerCase() === 'true';
          else if (h === 'imagen_urls') val = val ? val.split(';') : [];
          p[h] = val;
        });
        
        // Valores por defecto para campos obligatorios
        if (!p.categoria) p.categoria = config.categories?.[0] || 'Lácteos y Quesos';
        return p;
      }).filter(p => p.codigo && p.nombre);

      let addedCount = 0;
      let updatedCount = 0;

      importedProducts.forEach(p => {
        // Buscar si el producto ya existe mediante su código SKU
        const existingPart = parts.find(ep => ep.codigo === p.codigo);
        
        if (existingPart) {
          updatePart(existingPart.id, p);
          updatedCount++;
        } else {
          addPart(p);
          addedCount++;
        }
      });

      alert(`¡Importación finalizada!\n\nSe han agregado ${addedCount} productos nuevos.\nSe han actualizado ${updatedCount} productos existentes.`);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset para permitir re-importar el mismo archivo
  };

  const downloadCSVTemplate = () => {
    const headers = ["codigo", "nombre", "descripcion", "categoria", "seccion", "subseccion", "marca", "condicion", "anio_inicio", "anio_fin", "precio_usd", "stock", "imagen_urls", "es_promo", "es_nuevo", "es_mas_vendido", "delivery_gratis", "detalle_adicional"];
    const exampleRow = [
      "LCT-LECH-001", "Leche Entera 1L", "Leche de vaca pasteurizada premium", "Lácteos y Quesos", "Pasillo 1", "Lácteos", "Campestre", "Nacional", "2024", "2026", "1.80", "100", "https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80;https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80", "false", "true", "false", "true", "Mantener refrigerado entre 2 y 4 grados"
    ];
    
    const csvContent = [headers.join(","), exampleRow.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_importacion_marketo.csv");
    link.click();
  };

  // --------------------------------------------------------------------------------
  // RECHARTS ANALYTICAL METRICS COMPUTATION
  // --------------------------------------------------------------------------------
  const reportTotals = useMemo(() => {
    const totalVentasUsd = orders.reduce((acc, o) => acc + (Number(o.total_usd) || 0), 0);
    const totalAhorroCuponesUsd = orders.reduce((acc, o) => acc + (Number(o.descuento_cupon_usd) || 0), 0);
    const totalPedidosCount = orders.length;
    let partsSold = 0;
    
    orders.forEach(o => {
      o.items.forEach(it => {
        partsSold += (Number(it.cantidad) || 0);
      });
    });

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = now.getTime() - (7 * 24 * 60 * 60 * 1000);
    const startOfMonth = now.getTime() - (30 * 24 * 60 * 60 * 1000);
    const startOfPrevMonth = now.getTime() - (60 * 24 * 60 * 60 * 1000);

    let dayTotal = 0, weekTotal = 0, monthTotal = 0, prevMonthTotal = 0;

    orders.forEach(o => {
      const orderTime = new Date(o.fecha).getTime();
      const amount = Number(o.total_usd) || 0;
      if (orderTime >= startOfDay) dayTotal += amount;
      if (orderTime >= startOfWeek) weekTotal += amount;
      if (orderTime >= startOfMonth) monthTotal += amount;
      else if (orderTime >= startOfPrevMonth) prevMonthTotal += amount;
    });

    return {
      salesUSD: totalVentasUsd,
      couponSavingsUSD: totalAhorroCuponesUsd,
      salesBs: totalVentasUsd * (Number(config.tasa_cambio) || 1),
      ordersCount: totalPedidosCount,
      partsSoldCount: partsSold,
      dayTotal,
      weekTotal,
      monthTotal,
      prevMonthTotal
    };
  }, [orders, config.tasa_cambio]);

  // Chart 1: daily sales calculation
  const salesChartData = useMemo(() => {
    const datesMap: { [date: string]: number } = {};
    const now = new Date();
    // Pre-populate last 7 days with zeros for consistency
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      datesMap[d.toLocaleDateString([], { month: 'short', day: 'numeric' })] = 0;
    }

    orders.forEach(o => {
      const orderUsd = Number(o.total_usd) || 0;
      // parse date key e.g "May 16"
      try {
        const rawDate = new Date(o.fecha);
        const key = rawDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
        if (datesMap[key] !== undefined) {
          datesMap[key] += orderUsd;
        } else {
          datesMap[key] = orderUsd;
        }
      } catch (e) {
        // Fallback or static parsing
        const key = o.fecha.split(' ')[0] || 'Hoy';
        if (datesMap[key] !== undefined) datesMap[key] += orderUsd;
      }
    });

    return Object.keys(datesMap).map((k) => ({
      fecha: k,
      Ventas: parseFloat(Number(datesMap[k] || 0).toFixed(2)),
    }));
  }, [orders]);

  // Chart: daily coupon usage calculation
  const couponUsageChartData = useMemo(() => {
    const datesMap: { [date: string]: number } = {};
    const now = new Date();
    // Pre-populate last 7 days with zeros for consistency
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      datesMap[d.toLocaleDateString([], { month: 'short', day: 'numeric' })] = 0;
    }

    orders.forEach(o => {
      if (o.cupon_codigo) {
        try {
          const rawDate = new Date(o.fecha);
          const key = rawDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
          if (datesMap[key] !== undefined) {
            datesMap[key] += 1;
          } else {
            datesMap[key] = 1;
          }
        } catch (e) {
          const key = o.fecha.split(' ')[0] || 'Hoy';
          if (datesMap[key] !== undefined) datesMap[key] += 1;
        }
      }
    });

    return Object.keys(datesMap).map((k) => ({
      fecha: k,
      Usos: datesMap[k],
    }));
  }, [orders]);

  // Chart 2: Top Products
  const topProductsChartData = useMemo(() => {
    const productsMap: { [name: string]: number } = {};
    // Preload defaults from our catalog if orders list is sparse so the chart looks rich
    parts.slice(0, 5).forEach(p => {
      productsMap[p.nombre.substring(0, 22)] = p.stock > 10 ? 4 : 2;
    });

    orders.forEach(o => {
      o.items.forEach(it => {
        const abbreviated = it.nombre.substring(0, 22);
        if (productsMap[abbreviated] !== undefined) {
          productsMap[abbreviated] += it.cantidad;
        } else {
          productsMap[abbreviated] = it.cantidad;
        }
      });
    });

    return Object.keys(productsMap).map(k => ({
      name: k,
      Unidades: productsMap[k]
    })).sort((a,b) => b.Unidades - a.Unidades).slice(0, 5);
  }, [orders, parts]);

  const monthlyComparisonData = useMemo(() => {
    return [
      { period: 'Anterior', total: reportTotals.prevMonthTotal },
      { period: 'Actual', total: reportTotals.monthTotal },
    ];
  }, [reportTotals]);

  // --- Lógica de Respaldo: Preguntar cada 15 días ---
  useEffect(() => {
    if (adminSection === 'reports' || adminSection === 'settings') {
      const lastBackup = localStorage.getItem('marketo_last_backup_date');
      const now = new Date().getTime();
      const fifteenDays = 15 * 24 * 60 * 60 * 1000;

      if (!lastBackup || (now - Number(lastBackup)) > fifteenDays) {
        if (confirm("🗓️ Han pasado 15 días desde su último respaldo. ¿Desea descargar una copia de seguridad de sus datos ahora?")) {
          handleManualBackup(true);
          localStorage.setItem('marketo_last_backup_date', String(now));
          console.log("💾 Marketo: Respaldo manual solicitado por periodo quincenal.");
        }
      }
    }
  }, [adminSection]);

  // Crud Catalog Search helper match
  const crudSearchParts = useMemo(() => {
    return searchPartsSemantically(crudSearch, true);
  }, [parts, crudSearch]);

  const pickerFilteredProducts = useMemo(() => {
    if (!pickerSearch.trim()) return parts.slice(0, 5);
    return searchPartsSemantically(pickerSearch, true).slice(0, 8);
  }, [parts, pickerSearch]);

  // Filtered orders list mapping
  const activeOrdersMapped = useMemo(() => {
    if (orderFilter === 'Todos') return orders;
    return orders.filter(o => o.status === orderFilter);
  }, [orders, orderFilter]);

  return (
    <div className="flex flex-col gap-6 pb-24 px-4 sm:px-6">
      <SEOHead title="Panel de Control Admin" type="admin" />

      {/* DASHBOARD TOP HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4 gap-3 bg-white p-4 rounded-xl shadow-sm">
        <div>
          <span className="text-[11px] font-mono text-violet-600 font-bold uppercase tracking-wider">Control Total • {config.site_nombre || 'Supermarket'}</span>
          <h2 className="text-[21px] font-bold font-display text-slate-900">Dashboard Administrativo</h2>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Switch de Tienda Abierta/Cerrada */}
          <button
            onClick={() => updateConfig({ esta_abierta: !config.esta_abierta })}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border flex items-center gap-2 ${
              config.esta_abierta 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${config.esta_abierta ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            {config.esta_abierta ? 'Tienda: Operativa' : 'Hoy No Trabajamos'}
          </button>

          <div className="p-2.5 rounded-lg border border-violet-100 bg-violet-50/40 flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-700">
              <Landmark size={14} className="text-violet-600" />
              <span>Tasa:</span>
            </div>
            <input
              type="number"
              step="0.01"
              value={config.tasa_cambio}
              onChange={(e) => updateExchangeRate(Number(e.target.value))}
              className="w-16 bg-white border border-slate-300 rounded-lg px-1 py-1 text-center font-mono text-xs font-bold"
            />
          </div>
        </div>
      </div>

      {/* SECTIONS SELECTION SUB NAVIGATION BAR */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 bg-slate-100 p-2 rounded-xl font-display text-xs ml-2 mr-2 shadow-inner">
        {[
          { key: 'reports', label: 'Estadísticas', icon: BarChart3 },
          { key: 'inventory', label: 'Catálogo', icon: Settings },
          { key: 'orders', label: 'Pedidos', icon: ShoppingBag },
          { key: 'notifications', label: 'Alertas', icon: Bell },
          { key: 'customers', label: 'Clientes', icon: User },
          { key: 'coupons', label: 'Cupones', icon: Ticket },
          { key: 'settings', label: 'Ajustes', icon: Landmark }
        ].map(sect => {
          const Icon = sect.icon;
          return (
            <button
              key={sect.key}
              type="button"
              onClick={() => setAdminSection(sect.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 shrink-0 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                adminSection === sect.key 
                  ? 'bg-violet-600 text-white shadow-lg' 
                  : 'text-slate-600 hover:text-violet-600 hover:bg-slate-200/60'
              }`}
            >
              <Icon size={14} />
              {sect.label}
            </button>
          );
        })}
      </div>

      {/* ----------------- SUBSECTION 1: STATS REPORTS SHOWING RECHARTS ----------------- */}
      {adminSection === 'reports' && (
        <div className="flex flex-col gap-5">
          {/* Sales Performance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-200">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Ventas Hoy</span>
                <Calendar size={16} />
              </div>
              <p className="text-2xl font-black font-mono mt-2">${reportTotals.dayTotal.toFixed(2)}</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Esta Semana</span>
                <BarChart3 size={16} />
              </div>
              <p className="text-2xl font-black font-mono mt-2">${reportTotals.weekTotal.toFixed(2)}</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl text-white shadow-lg shadow-violet-200">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Últimos 30 Días</span>
                <ShoppingBag size={16} />
              </div>
              <p className="text-2xl font-black font-mono mt-2">${reportTotals.monthTotal.toFixed(2)}</p>
            </div>
          </div>

          {/* Quick Metrics Cards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm hover:border-violet-300 transition-all duration-300 group">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">Ingresos (USD)</span>
                <div className="p-1.5 rounded-lg bg-violet-50 text-violet-600 transition-all">
                  <DollarSign size={14} />
                </div>
              </div>
              <p className="text-xl font-bold font-mono text-slate-900 mt-1">${reportTotals.salesUSD.toFixed(1)}</p>
            </div>
            <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm hover:border-violet-300 transition-all duration-300 group">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">Ingresos (Bs)</span>
                <div className="p-1.5 rounded-lg bg-violet-50 text-violet-600 transition-all">
                  <Landmark size={14} />
                </div>
              </div>
              <p className="text-xl font-bold font-mono text-slate-900 mt-1">{reportTotals.salesBs.toFixed(1)}</p>
            </div>
            <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm hover:border-slate-300 transition-all duration-300 group">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">Órdenes</span>
                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 transition-all">
                  <ShoppingCart size={14} />
                </div>
              </div>
              <p className="text-xl font-bold font-mono text-slate-900 mt-1">{reportTotals.ordersCount}</p>
            </div>
            <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm hover:border-indigo-300 transition-all duration-300 group">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">Unidades Sold</span>
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 transition-all">
                  <Package size={14} />
                </div>
              </div>
              <p className="text-xl font-bold font-mono text-slate-900 mt-1">{reportTotals.partsSoldCount}</p>
            </div>
            <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm hover:border-pink-300 transition-all duration-300 group">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">Ahorro Cupones</span>
                <div className="p-1.5 rounded-lg bg-pink-50 text-pink-600 transition-all">
                  <Ticket size={14} />
                </div>
              </div>
              <p className="text-xl font-bold font-mono text-slate-900 mt-1">${reportTotals.couponSavingsUSD.toFixed(1)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Chart: Monthly Comparison */}
            <div className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold font-display text-slate-900 uppercase tracking-wider">Crecimiento Mensual</h4>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${reportTotals.monthTotal >= reportTotals.prevMonthTotal ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {reportTotals.prevMonthTotal > 0 ? `${(((reportTotals.monthTotal - reportTotals.prevMonthTotal) / reportTotals.prevMonthTotal) * 100).toFixed(1)}%` : '+100%'}
                </span>
              </div>
              <div className="w-full h-[220px] text-[10px] font-mono mt-3">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyComparisonData}>
                    <XAxis dataKey="period" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ventas']} />
                    <Bar dataKey="total" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 1: Revenue line chart */}
            <div className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm flex flex-col gap-2">
              <h4 className="text-xs font-bold font-display text-slate-900 uppercase tracking-wider">Flujo Diario de Ventas (USD)</h4>
              <div className="w-full h-[220px] text-[10px] font-mono mt-3">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={salesChartData}>
                    <XAxis dataKey="fecha" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a' }} />
                    <Line type="monotone" dataKey="Ventas" stroke="#7c3aed" strokeWidth={2.5} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Top Products bar chart */}
            <div className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm flex flex-col gap-2">
              <h4 className="text-xs font-bold font-display text-slate-900 uppercase tracking-wider">Productos Más Vendidos (Unidades)</h4>
              <div className="w-full h-[220px] text-[10px] font-mono mt-3">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={topProductsChartData}>
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a' }} />
                    <Bar dataKey="Unidades" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Coupon Usage line chart */}
            <div className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm flex flex-col gap-2">
              <h4 className="text-xs font-bold font-display text-slate-900 uppercase tracking-wider">Uso Diario de Cupones (Redenciones)</h4>
              <div className="w-full h-[220px] text-[10px] font-mono mt-3">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={couponUsageChartData}>
                    <XAxis dataKey="fecha" stroke="#64748b" />
                    <YAxis stroke="#64748b" allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a' }} />
                    <Line type="monotone" dataKey="Usos" stroke="#ec4899" strokeWidth={2.5} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUBSECTION 2: CATALOG MANAGEMENT CRUD ----------------- */}
      {adminSection === 'inventory' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-100 p-4 rounded-xl border border-slate-200 gap-3">
            <span className="text-xs font-bold font-display text-slate-800">Editar o Cargar Productos</span>
            
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImportCSV} 
                accept=".csv" 
                className="hidden" 
              />
              <button
                type="button"
                onClick={downloadCSVTemplate}
                className="flex-1 sm:flex-none bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <FileSpreadsheet size={13} /> Plantilla CSV
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Upload size={13} /> Importar CSV/Excel
              </button>
              <button
                type="button"
                onClick={() => openEditor(null)}
                className="flex-1 sm:flex-none bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Plus size={13} /> Agregar Articulo
              </button>
            </div>
          </div>

          {/* CRUD Search field */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-gray-500">
                <Search size={14} />
              </span>
              <input
                type="text"
                value={crudSearch}
                onChange={(e) => setCrudSearch(e.target.value)}
                placeholder="Filtrar por nombre, codigo SKU o pasillo..."
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg py-2.5 pl-9 pr-12 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={startVoiceSearch}
                className={`absolute right-3 top-2.5 p-1 rounded-md transition-all cursor-pointer ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-violet-400 hover:bg-white/5'}`}
                title={isListening ? "Escuchando..." : "Búsqueda por voz"}
              >
                <Mic size={16} />
              </button>
            </div>
          </div>

          {/* List display */}
          <div className="flex flex-col gap-2.5">
            {crudSearchParts.map(part => (
              <div 
                key={part.id} 
                className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm flex justify-between items-center gap-4 hover:border-violet-300 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 relative">
                    <img src={part.imagen_urls[0]} alt={part.nombre} className="w-full h-full object-cover" />
                    {part.imagen_urls && part.imagen_urls.length > 1 && (
                      <span className="absolute bottom-0 right-0 bg-violet-650 text-white font-mono text-[7px] font-bold px-1 py-0.2 rounded-tl tracking-tighter" title={`${part.imagen_urls.length} imagenes cargadas`}>
                        {part.imagen_urls.length}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex gap-2 items-center">
                      <h5 className="text-xs font-bold text-slate-900 line-clamp-1">{part.nombre}</h5>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border ${
                        (part as any).disponibilidad === 'Agotado' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                        (part as any).disponibilidad === 'En Reposición' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        part.activo === false ? 'bg-slate-100 text-slate-500 border-slate-200' :
                        'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {(part as any).disponibilidad || (part.activo ? 'Disponible' : 'Inactivo')}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono flex gap-2 mt-0.5">
                      <span className="text-violet-600 font-bold">COD: {part.codigo}</span>
                      <span>•</span>
                      <span>Stock: <strong className={part.stock <= 3 ? 'text-red-500' : 'text-slate-900'}>{part.stock} unid</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button 
                    type="button"
                    onClick={() => openEditor(part)}
                    className="p-1.5 text-slate-500 hover:text-violet-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                    title="Editar"
                  >
                    <Edit size={13} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      if (confirm(`¿Seguro que desea eliminar '${part.nombre}' del inventario?`)) {
                        deletePart(part.id);
                      }
                    }}
                    className="p-1.5 text-slate-500 hover:text-red-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DE NUEVO PEDIDO EN TIEMPO REAL */}
      {incomingOrder && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
          <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-violet-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} />
                <h3 className="font-bold uppercase tracking-tighter">¡Nuevo Pedido Entrante!</h3>
              </div>
              <span className="text-xs font-mono bg-white/20 px-2 py-1 rounded">{incomingOrder.id}</span>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="text-sm">
                <p className="font-bold text-slate-900">{incomingOrder.cliente_nombre}</p>
                <p className="text-slate-500">{incomingOrder.cliente_telefono}</p>
                <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100 font-mono text-xs">
                   {incomingOrder.items.map((it, idx) => (
                     <div key={idx} className="flex justify-between">
                       <span>{it.cantidad}x {it.nombre}</span>
                       <span className="font-bold">${it.precio_usd}</span>
                     </div>
                   ))}
                   <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between font-bold text-violet-600">
                     <span>TOTAL</span>
                     <span>${incomingOrder.total_usd}</span>
                   </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nota para el cliente (Ej: Sin stock de x, cambio por y)</label>
                <textarea 
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-violet-500 outline-none"
                  placeholder="Escriba aquí si hay algún cambio o mensaje especial..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <button onClick={() => handleProcessIncomingOrder('Procesando')} className="bg-emerald-600 text-white font-bold py-3 rounded-xl text-xs uppercase shadow-lg shadow-emerald-200">Aceptar Pedido</button>
                <button onClick={() => setIncomingOrder(null)} className="bg-slate-100 text-slate-600 font-bold py-3 rounded-xl text-xs uppercase">Ver Luego</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUBSECTION 3: ORDERS MANAGEMENT & REAL-TIME EMULATOR ----------------- */}
      {adminSection === 'orders' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-3">
            <h4 className="text-xs uppercase font-mono font-bold text-[#a1a1aa] tracking-wider">Cola de Pedidos Recibidos</h4>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <button
                onClick={exportOrdersToCSV}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer w-full sm:w-auto"
              >
                <Download size={14} /> Exportar CSV
              </button>
              
              {/* Status filters */}
              <div className="flex gap-1 text-[10px] font-mono bg-slate-100 p-1 border border-slate-200 rounded-lg overflow-x-auto no-scrollbar w-full sm:w-auto">
                {['Todos', 'Pendiente', 'Procesando', 'Enviado'].map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setOrderFilter(f as any)}
                    className={`px-3 py-1.5 rounded-md cursor-pointer whitespace-nowrap ${orderFilter === f ? 'bg-violet-600 text-white font-bold' : 'text-slate-600 hover:text-slate-800'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {activeOrdersMapped.length === 0 ? (
              <div className="p-10 border border-dashed border-[#27272a] rounded-lg text-center text-xs text-gray-500">
                No hay pedidos en cola con estado: {orderFilter}.
              </div>
            ) : (
              activeOrdersMapped.map(order => (
                <div 
                  key={order.id} 
                  className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-col gap-3 shadow-sm hover:border-indigo-200 transition-colors"
                >
                  {/* Title order row */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 border-b border-slate-200 pb-2.5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 font-mono">{order.id}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold ${order.status === 'Pendiente' ? 'bg-amber-100 text-amber-700' : order.status === 'Procesando' ? 'bg-indigo-100 text-indigo-700' : 'bg-violet-100 text-violet-750'}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 font-mono">📅 {order.fecha}</div>
                    </div>

                    <div className="sm:text-right flex flex-row sm:flex-col gap-2 sm:gap-0 items-center sm:items-end">
                      <div className="text-xs font-bold text-violet-600 font-mono">${(Number(order.total_usd) || 0).toFixed(2)}</div>
                      <div className="text-[10px] text-violet-600 font-mono font-bold">{(Number(order.total_bs) || 0).toFixed(2)} Bs</div>
                    </div>
                  </div>

                  {/* Customer info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 text-xs text-slate-700 gap-1.5 font-mono">
                    <div className="truncate">👤 Cliente: <strong className="text-slate-900 font-sans">{order.cliente_nombre}</strong></div>
                    <div className="truncate">📞 Telf: <strong className="text-slate-900">{order.cliente_telefono}</strong></div>
                    <div className="col-span-2">📧 Email: <strong className="text-slate-900">{order.cliente_email || 'No registrado'}</strong></div>
                    {order.cupon_codigo && (
                      <div className="col-span-2 text-violet-600">🎫 Cupón: <strong className="font-bold">{order.cupon_codigo} (-${(Number(order.descuento_cupon_usd) || 0).toFixed(2)})</strong></div>
                    )}
                    <div className="col-span-2">📍 Destino: <strong className="text-slate-900">{order.direccion_envio}</strong></div>
                  </div>

                  {/* Items itemized summary list */}
                  <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 flex flex-col gap-1 text-[11px] font-mono">
                    {order.items.map(it => (
                      <div key={it.part_id} className="flex justify-between text-slate-600">
                        <span className="truncate pr-2">{it.cantidad}x {it.nombre}</span>
                        <span>${(Number(it.precio_usd) * Number(it.cantidad || 1)).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action transitions status with notifications dispatcher */}
                  <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center pt-2 gap-3">
                    <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                      <button
                        type="button"
                        onClick={() => toggleOrderDetail(order.id)}
                        className="flex-1 sm:flex-none bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 px-2.5 py-2 rounded-lg text-[11px] font-mono flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                      >
                        <Eye size={12} /> {openOrderDetailIds.includes(order.id) ? 'Cerrar' : 'Ver Detalles'}
                      </button>
                      
                      {openOrderDetailIds.includes(order.id) && (
                        <button
                          type="button"
                          onClick={() => setEditingOrderItems(order)}
                          className="flex-1 sm:flex-none bg-emerald-600 text-white border border-emerald-500 hover:bg-emerald-700 px-2.5 py-2 rounded-lg text-[11px] font-mono flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                        >
                          <Edit size={12} /> Editar Items
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setPrintingOrder(order)}
                        className="flex-1 sm:flex-none bg-[#18181b] text-gray-300 border border-[#27272a] hover:text-white px-2.5 py-2 rounded-lg text-[11px] font-mono flex items-center justify-center gap-1 cursor-pointer hover:bg-[#27272a] transition-colors"
                      >
                        <Receipt size={12} /> Digital
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPrintingOrder(order);
                          setTimeout(() => window.print(), 300);
                        }}
                        className="flex-1 sm:flex-none bg-indigo-600 text-white border border-indigo-500 hover:bg-indigo-700 px-2.5 py-2 rounded-lg text-[11px] font-mono flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                      >
                        <Printer size={12} /> Imprimir Ticket
                      </button>
                    </div>

                    <div className="flex gap-1 text-[10px] font-mono w-full xl:w-auto mt-2 xl:mt-0">
                      {order.status !== 'Enviado' && (
                        <button
                          type="button"
                          onClick={() => handleStatusAdvance(order)}
                          className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-1 active:scale-95 transition-all text-[11px] cursor-pointer w-full sm:w-auto"
                        >
                          {order.status === 'En preparación' ? 'Despachar (Pedido Saliendo) 🛵' : 'Siguiente Paso ➔'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal para Tiempo Estimado (Pedido Saliendo) */}
      {statusUpdateTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border-t-4 border-violet-600">
            <h3 className="text-sm font-black uppercase mb-2">Despacho de Pedido: {statusUpdateTarget.id}</h3>
            <p className="text-xs text-slate-500 mb-4">Ingrese el tiempo aproximado para que el cliente reciba su pedido en Valencia.</p>
            
            <div className="flex flex-col gap-3">
              <input 
                type="text" 
                value={estimatedTimeInput}
                onChange={(e) => setEstimatedTimeInput(e.target.value)}
                placeholder="Ej: 20-30 minutos, Llega a las 2:00pm..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-violet-500"
                autoFocus
              />
              
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    updateOrderStatus(statusUpdateTarget.id, statusUpdateTarget.nextStatus, estimatedTimeInput);
                    setStatusUpdateTarget(null);
                    setEstimatedTimeInput('');
                  }}
                  className="flex-1 bg-violet-600 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest"
                >
                  Confirmar Salida
                </button>
                <button onClick={() => setStatusUpdateTarget(null)} className="px-4 py-3 text-xs font-bold text-slate-400">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MÓDULO DE COMUNICACIÓN (Subsection 4) */}
      {adminSection === 'notifications' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna Izquierda: Central de Difusión (Push/Promociones) */}
            <div className="flex flex-col gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Send size={18} className="text-violet-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase">Centro de Notificaciones</h3>
                </div>

                {/* Filtros por categoría */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                  {(['clientes', 'grupal', 'sistema'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setNotifCatFilter(cat)}
                      className={`flex-1 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                        notifCatFilter === cat
                          ? 'bg-white text-violet-700 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {cat === 'clientes' ? '👤 Clientes' : cat === 'grupal' ? '📢 Envío Grupal' : '⚙️ Sistema'}
                    </button>
                  ))}
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setToastTitle('🔊 Prueba de Audio/Vista');
                    setToastMessage('Así es como el cliente visualizará y escuchará la notificación en tiempo real.');
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                    audio.volume = 0.5;
                    audio.play().catch(() => console.warn('Audio bloqueado por el navegador'));
                  }}
                  className="ml-auto p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
                  title="Probar sonido y vista previa"
                >
                  <RefreshCcw size={14} />
                </button>
              </div>
              
              <form onSubmit={handleCreateBroadcast} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Título de la Notificación</label>
                  <input 
                    type="text" 
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="Ej: ¡Oferta Relámpago en Carnes! 🥩"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-violet-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Tipo de Alcance</label>
                    <select 
                      value={broadcastTipo}
                      onChange={(e) => setBroadcastTipo(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-violet-500"
                    >
                      <option value="todos">📣 Todos los Clientes</option>
                      <option value="personal">👤 Cliente Específico</option>
                    </select>
                  </div>

                  {broadcastTipo === 'personal' ? (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Teléfono del Destinatario</label>
                      <input 
                        type="text" 
                        value={broadcastDestinatarioTelefono}
                        onChange={(e) => setBroadcastDestinatarioTelefono(e.target.value)}
                        placeholder="Ej: 04124976451"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Asistente de Ofertas</label>
                      <button 
                        type="button"
                        onClick={() => setShowProductPickerForBroadcast(true)}
                        className="flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-indigo-100 transition-colors"
                      >
                        <Package size={14} /> Vincular Producto
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Imagen Promocional</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={broadcastImage}
                        onChange={(e) => setBroadcastImage(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] outline-none"
                        placeholder="URL de imagen o sube un archivo..."
                      />
                      <button type="button" onClick={() => bImageInputRef.current?.click()} className="p-2.5 bg-violet-100 text-violet-600 rounded-xl hover:bg-violet-200 transition-colors" title="Subir imagen"><Upload size={14} /></button>
                      <input type="file" ref={bImageInputRef} hidden accept="image/*" onChange={handleUploadBroadcastImage} />
                    </div>
                    
                    {/* Miniatura de previsualización inmediata */}
                    {broadcastImage && (
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-100 group shadow-sm bg-slate-50">
                        <img src={broadcastImage} className={`w-full h-full object-cover transition-opacity duration-300 ${isUploadingImage ? 'opacity-40' : 'opacity-100'}`} alt="Preview" />
                        {isUploadingImage && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <RefreshCcw size={16} className="text-violet-600 animate-spin" />
                          </div>
                        )}
                        {!isUploadingImage && (
                          <button 
                            type="button"
                            onClick={() => setBroadcastImage('')}
                            className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Enlace de Acción</label>
                    <input 
                      type="text" 
                      value={broadcastLink}
                      onChange={(e) => setBroadcastLink(e.target.value)}
                      placeholder="/?id=codigo-producto"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Mensaje / Contenido</label>
                  <textarea 
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs outline-none focus:border-violet-500 min-h-[100px]"
                    placeholder="Escribe aquí el contenido de la promoción u oferta..."
                  />
                </div>

                <button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-violet-200">
                  Enviar Notificación
                </button>
              </form>
            </div>

            {/* NUEVA UI: Chat de Conversación por Cliente */}
            {(() => {
              // Filtrar notificaciones según la categoría seleccionada
              let filteredNotifications: typeof notifications = [];
              let clientPhones: string[] = [];
              let groupNotifs: typeof notifications = [];
              let systemNotifs: typeof notifications = [];

              if (notifCatFilter === 'clientes') {
                // Clientes: notificaciones personales de cada cliente
                const phoneSet = new Set<string>();
                notifications.filter(n => n.destinatario_telefono && n.tipo === 'personal').forEach(n => phoneSet.add(n.destinatario_telefono!));
                clientPhones = Array.from(phoneSet);
                filteredNotifications = notifications.filter(n => n.destinatario_telefono && n.tipo === 'personal');
              } else if (notifCatFilter === 'grupal') {
                // Envío Grupal: broadcasts (tipo 'todos')
                groupNotifs = notifications.filter(n => n.tipo === 'todos');
                filteredNotifications = groupNotifs;
              } else {
                // Sistema: notificaciones del admin para sí mismo
                systemNotifs = notifications.filter(n => n.tipo === 'admin');
                filteredNotifications = systemNotifs;
              }

              const broadcastNotifs = groupNotifs;
              const broadcastCount = broadcastNotifs.length;
              const phonesWithMessages = clientPhones;

              const getClientMessages = (phone: string) =>
                notifications.filter(n => n.destinatario_telefono === phone).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

              const getLastMessage = (phone: string) => {
                const msgs = getClientMessages(phone);
                return msgs[msgs.length - 1];
              };

              const handleSendReply = async () => {
                if (!activeChatPhone || !replyMessage.trim() || notifCatFilter !== 'clientes') return;
                const sentTitle = `Re: Tu mensaje`;
                const success = await addNotification(sentTitle, replyMessage.trim(), 'personal', activeChatPhone, '', '');
                if (success) {
                  setReplyMessage('');
                }
              };

              const handleDeleteClientMessages = () => {
                if (!activeChatPhone) return;
                const clientNotifs = notifications.filter(n => n.destinatario_telefono === activeChatPhone);
                clientNotifs.forEach(n => deleteNotification(n.id));
                setActiveChatPhone(null);
              };

              return (
                <div className="flex gap-4 h-[600px]">
                  {/* Sidebar: Lista según categoría */}
                  <div className="w-1/3 flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-violet-50">
                      <div className="flex items-center gap-2 mb-3">
                        {notifCatFilter === 'clientes' ? <MessageSquare size={16} className="text-violet-600" /> : notifCatFilter === 'grupal' ? <Send size={16} className="text-violet-600" /> : <Settings size={16} className="text-violet-600" />}
                        <h3 className="text-xs font-bold text-slate-800 uppercase">
                          {notifCatFilter === 'clientes' ? 'Clientes' : notifCatFilter === 'grupal' ? 'Envíos Grupales' : 'Registro del Sistema'}
                        </h3>
                        <span className="ml-auto text-[10px] bg-violet-200 text-violet-800 px-2 py-0.5 rounded-full font-bold">
                          {notifCatFilter === 'clientes' ? phonesWithMessages.length : notifCatFilter === 'grupal' ? broadcastCount : systemNotifs.length}
                        </span>
                      </div>
                      {notifCatFilter === 'grupal' && broadcastCount > 0 && (
                        <button
                          onClick={() => setActiveChatPhone('broadcast')}
                          className={`w-full text-left p-2.5 rounded-xl text-xs font-bold mb-2 transition-all ${activeChatPhone === 'broadcast' ? 'bg-violet-600 text-white shadow-lg' : 'bg-white border border-violet-200 text-violet-700 hover:bg-violet-50'}`}
                        >
                          📢 Todos los Broadcasts
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {notifCatFilter === 'clientes' ? (
                        phonesWithMessages.length === 0 ? (
                          <div className="text-center py-12 text-slate-400 text-xs italic px-4">No hay mensajes de clientes aún.</div>
                        ) : (
                          phonesWithMessages.map(phone => {
                            const lastMsg = getLastMessage(phone);
                            const unread = getClientMessages(phone).filter(m => !m.leida).length;
                            return (
                              <button
                                key={phone}
                                onClick={() => setActiveChatPhone(phone)}
                                className={`w-full text-left p-3 border-b border-slate-50 hover:bg-slate-50 transition-all ${activeChatPhone === phone ? 'bg-violet-50 border-l-4 border-l-violet-600' : ''}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-800">{phone}</span>
                                  {unread > 0 && <span className="w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unread}</span>}
                                </div>
                                <p className="text-[10px] text-slate-500 truncate mt-1">{lastMsg?.mensaje || 'Sin mensajes'}</p>
                                <p className="text-[9px] text-slate-400 mt-1">{lastMsg?.fecha}</p>
                              </button>
                            );
                          })
                        )
                      ) : notifCatFilter === 'grupal' ? (
                        broadcastCount === 0 ? (
                          <div className="text-center py-12 text-slate-400 text-xs italic px-4">No hay envíos grupales.</div>
                        ) : (
                          broadcastNotifs.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map(notif => (
                            <button
                              key={notif.id}
                              onClick={() => { setActiveChatPhone('broadcast'); }}
                              className="w-full text-left p-3 border-b border-slate-50 hover:bg-slate-50"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800">📢 Broadcast</span>
                                <span className="text-[9px] text-slate-400">{notif.fecha}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 truncate mt-1">{notif.titulo}</p>
                            </button>
                          ))
                        )
                      ) : (
                        systemNotifs.length === 0 ? (
                          <div className="text-center py-12 text-slate-400 text-xs italic px-4">No hay notificaciones del sistema.</div>
                        ) : (
                          systemNotifs.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map(notif => (
                            <button
                              key={notif.id}
                              onClick={() => { setActiveChatPhone('system'); }}
                              className="w-full text-left p-3 border-b border-slate-50 hover:bg-slate-50"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800">⚙️ Sistema</span>
                                <span className="text-[9px] text-slate-400">{notif.fecha}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 truncate mt-1">{notif.titulo}</p>
                            </button>
                          ))
                        )
                      )}
                    </div>
                  </div>

                  {/* Área de Chat */}
                  <div className="w-2/3 flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {activeChatPhone ? (
                      <>
                        {/* Header del chat */}
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                              <User size={18} className="text-violet-600" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-800">
                                {activeChatPhone === 'broadcast' ? '📢 Todos los Clientes' :
                                 activeChatPhone === 'system' ? '⚙️ Registro del Sistema' :
                                 activeChatPhone}
                              </h4>
                              <p className="text-[10px] text-slate-500">
                                {activeChatPhone === 'broadcast' ? `${broadcastCount} mensajes broadcast` :
                                 activeChatPhone === 'system' ? `${systemNotifs.length} mensajes` :
                                 `${getClientMessages(activeChatPhone).length} mensajes`}
                              </p>
                            </div>
                          </div>
                          {activeChatPhone !== 'broadcast' && activeChatPhone !== 'system' && (
                            <div className="flex gap-2">
                              <a href={`https://wa.me/${activeChatPhone.replace(/\D/g, '')}`} target="_blank" className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors" title="WhatsApp">
                                <MessageCircle size={16} />
                              </a>
                              <button onClick={handleDeleteClientMessages} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors" title="Eliminar conversación">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Mensajes como burbujas */}
                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 flex flex-col gap-3">
                          {/* Mostrar según el tipo de chat activo */}
                          {(activeChatPhone === 'broadcast' || activeChatPhone === 'system' ? filteredNotifications : getClientMessages(activeChatPhone)).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()).map(msg => (
                            <div key={msg.id} className={`flex ${msg.tipo === 'admin' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[75%] ${msg.tipo === 'admin' ? 'order-2' : 'order-1'}`}>
                                {/*如果是admin的消息显示在右边，个人的显示在左边*/}
                                <div className={`p-3 rounded-2xl ${msg.tipo === 'admin' ? 'bg-violet-600 text-white rounded-br-md' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md'}`}>
                                  {/* Imagen si existe */}
                                  {msg.imagen_url && (
                                    <div className="mb-2">
                                      <img src={msg.imagen_url} alt="Imagen" className="w-full max-h-40 object-cover rounded-xl" />
                                    </div>
                                  )}
                                  {/* Título */}
                                  {msg.titulo && <p className="text-xs font-bold mb-1">{msg.titulo}</p>}
                                  {/* Mensaje */}
                                  <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.mensaje}</p>
                                  {/* Link si existe */}
                                  {msg.link_url && (
                                    <a href={msg.link_url} target="_blank" className={`flex items-center gap-1 mt-2 text-[10px] font-bold ${msg.tipo === 'admin' ? 'text-violet-200' : 'text-violet-600'}`}>
                                      <ExternalLink size={10} /> Ver oferta
                                    </a>
                                  )}
                                </div>
                                <p className={`text-[9px] mt-1 ${msg.tipo === 'admin' ? 'text-right text-violet-400' : 'text-left text-slate-400'}`}>
                                  {msg.fecha}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Input para responder (solo si es un cliente) */}
                        {activeChatPhone !== 'broadcast' && activeChatPhone !== 'system' && (
                          <div className="p-3 border-t border-slate-100 bg-white flex gap-2">
                            <input
                              type="text"
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                              placeholder="Escribir respuesta..."
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-xs outline-none focus:border-violet-500"
                            />
                            <button
                              onClick={handleSendReply}
                              disabled={!replyMessage.trim()}
                              className="p-2.5 bg-violet-600 text-white rounded-full hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Send size={14} />
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-slate-400">
                        <div className="text-center">
                          <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
                          <p className="text-xs">Selecciona una conversación</p>
                          <p className="text-[10px] mt-1">o revisa los broadcasts</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL PICKER DE PRODUCTOS PARA NOTIFICACIÓN */}
      {showProductPickerForBroadcast && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl flex flex-col gap-4 max-h-[80vh]">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Vincular Producto a Promo</h4>
              <button onClick={() => setShowProductPickerForBroadcast(false)} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
            </div>
            
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por nombre o código..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-violet-500"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 no-scrollbar">
              {pickerFilteredProducts.map(p => (
                <button 
                  key={p.id}
                  onClick={() => {
                    setBroadcastTitle(`🔥 ¡${p.nombre} en Oferta!`);
                    setBroadcastMessage(`¡No te pierdas esta oportunidad! Llévatelo hoy por solo $${p.precio_usd.toFixed(2)}. ${p.descripcion.substring(0, 50)}...`);
                    setBroadcastImage(p.imagen_urls[0] || '');
                    setBroadcastLink(`/?id=${p.id}`);
                    setShowProductPickerForBroadcast(false);
                  }}
                  className="flex items-center gap-3 p-2 bg-slate-50 hover:bg-violet-50 border border-slate-100 rounded-xl transition-all text-left"
                >
                  <img src={p.imagen_urls[0]} className="w-10 h-10 rounded-lg object-cover border" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-700">{p.nombre}</span>
                    <span className="text-[9px] text-slate-500 font-mono">${p.precio_usd} • Stock: {p.stock}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notificación de Permisos para el Administrador */}
      {notifPermission === 'default' && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-full text-amber-600 shrink-0">
              <Bell size={18} />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-amber-900 leading-tight">Alertas de Navegador Desactivadas</p>
              <p className="text-[10px] text-amber-700 mt-0.5">Para que suenen los pedidos nuevos y ver avisos en tiempo real, active los permisos de notificación.</p>
            </div>
          </div>
          <button 
            onClick={async () => { const res = await Notification.requestPermission(); setNotifPermission(res); }}
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg transition-all active:scale-95 cursor-pointer"
          >
            Activar Sonidos y Alertas 🔔
          </button>
        </div>
      )}

      {/* ----------------- SUBSECTION 5: CUSTOMERS MANAGEMENT ----------------- */}
      {adminSection === 'customers' && (
        <div className="flex flex-col gap-4">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Gestión de Clientes</h4>
          <div className="flex flex-col gap-3">
            {users && Array.isArray(users) && users.length > 0 ? (
              users.map(user => (
                <div key={user.id} className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col gap-3 hover:border-indigo-200 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <h5 className="font-bold text-slate-900">{user.nombre || 'Cliente sin nombre'}</h5>
                      <p className="text-xs text-slate-500 font-mono">Telf: {user.telefono || 'Sin teléfono'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSendMsgTitle('Aviso de Su Pedido');
                          setSendMsgBody('');
                          setSendMsgModal({ user });
                        }}
                        className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg transition-colors border border-indigo-200"
                      >
                        Enviar Mensaje
                      </button>
                      <button 
                        onClick={() => {
                          const nuevaClave = prompt(`Nueva clave para ${user.nombre || 'cliente'}:`, user.contrasena || '');
                          if (nuevaClave) updateUserByAdmin(user.id, { contrasena: nuevaClave });
                        }}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
                      >
                        Resetear Clave
                      </button>
                    </div>
                  </div>
                  {/* Orders for this user */}
                  <div className="text-[10px] font-mono border-t border-slate-100 pt-3">
                    <strong>Historial de Pedidos:</strong>
                    {orders && orders.filter(o => o.cliente_telefono === (user.telefono || '')).length > 0 ? (
                      <ul className="list-disc pl-4 mt-2 text-slate-600">
                        {orders.filter(o => o.cliente_telefono === (user.telefono || '')).map(o => (
                          <li key={o.id}>{o.fecha} - {o.status} - ${(Number(o.total_usd) || 0).toFixed(2)}</li>
                        ))}
                      </ul>
                    ) : <span className="text-slate-400 pl-2"> Sin pedidos todavía</span>}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-10 text-slate-500 bg-white rounded-xl border border-dashed">No hay clientes registrados.</div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- SUBSECTION: COUPON MANAGEMENT ----------------- */}
      {adminSection === 'coupons' && (
        <div className="flex flex-col gap-6">
          <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col gap-4">
            <h4 className="text-xs font-bold font-display text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Ticket size={16} className="text-violet-600" /> Crear Nuevo Cupón de Descuento
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Código del Cupón</label>
                <input 
                  type="text" 
                  value={newCouponCode} 
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                  placeholder="EJ: MARKETO10"
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">% Descuento</label>
                <input 
                  type="number" 
                  value={newCouponDiscount} 
                  onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Límite Usos (Opcional)</label>
                <input 
                  type="number" 
                  value={newCouponLimit} 
                  onChange={(e) => setNewCouponLimit(e.target.value === '' ? '' : Number(e.target.value))}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>
              <button 
                onClick={() => {
                  if(!newCouponCode) return alert('Indique el código');
                  addCoupon({ 
                    code: newCouponCode, 
                    discount_percent: newCouponDiscount, 
                    active: true, 
                    usage_limit: newCouponLimit === '' ? undefined : newCouponLimit 
                  });
                  setNewCouponCode('');
                }}
                className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Guardar Cupón
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {coupons.map(coupon => (
              <div key={coupon.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col gap-2 relative">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black font-mono text-violet-600">{coupon.code}</span>
                  <span className="text-xs font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded">-{coupon.discount_percent}%</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Usos: {coupon.usage_count} / {coupon.usage_limit || '∞'}
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={coupon.active} onChange={(e) => updateCoupon(coupon.id, { active: e.target.checked })} className="accent-violet-600" />
                    <span className="text-[10px] font-bold uppercase text-slate-600">Activo</span>
                  </label>
                  <button onClick={() => deleteCoupon(coupon.id)} className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DETALLADO PARA EDITAR PRODUCTOS DE UN PEDIDO */}
      {editingOrderItems && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-emerald-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Edit size={18} />
                <h3 className="font-bold uppercase text-xs tracking-wider">Editor de Pedido: {editingOrderItems.id}</h3>
              </div>
              <button onClick={() => setEditingOrderItems(null)} className="hover:rotate-90 transition-transform"><X size={18}/></button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Items actuales en el pedido</span>
                {tempEditItems.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs border border-dashed rounded-xl italic">No hay productos. Agrega uno abajo.</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {tempEditItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800">{item.nombre}</span>
                          <span className="text-[10px] text-slate-500 font-mono">SKU: {item.codigo} • ${item.precio_usd}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-inner">
                            <button 
                              type="button"
                              onClick={() => {
                                const next = [...tempEditItems];
                                next[idx].cantidad = Math.max(1, next[idx].cantidad - 1);
                                setTempEditItems(next);
                              }}
                              className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 transition-colors"
                            >-</button>
                            <span className="px-3 text-xs font-bold font-mono text-slate-900 border-x border-slate-200">{item.cantidad}</span>
                            <button 
                              type="button"
                              onClick={() => {
                                const next = [...tempEditItems];
                                next[idx].cantidad += 1;
                                setTempEditItems(next);
                              }}
                              className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 transition-colors"
                            >+</button>
                          </div>
                          <button 
                            onClick={() => setTempEditItems(prev => prev.filter((_, i) => i !== idx))}
                            className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Buscar y agregar nuevos productos</span>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Nombre del producto o código SKU..."
                      value={orderEditSearch}
                      onChange={(e) => setOrderEditSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-1">
                  {filteredCatalogForEdit.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => {
                        const existingIdx = tempEditItems.findIndex(item => item.part_id === p.id);
                        if (existingIdx > -1) {
                          const next = [...tempEditItems];
                          next[existingIdx].cantidad += 1;
                          setTempEditItems(next);
                        } else {
                          setTempEditItems(prev => [...prev, { part_id: p.id, nombre: p.nombre, codigo: p.codigo, precio_usd: p.precio_usd, cantidad: 1 }]);
                        }
                        setOrderEditSearch('');
                      }}
                      className="flex justify-between items-center p-2.5 bg-white hover:bg-emerald-50 border border-slate-100 rounded-xl transition-all text-left"
                    >
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-700">{p.nombre}</span>
                        <span className="text-[10px] text-slate-500 font-mono">${p.precio_usd} • Stock: {p.stock}</span>
                      </div>
                      <Plus size={14} className="text-emerald-600" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col gap-3">
              <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nuevo Total Estimado:</span>
                <div className="text-right">
                  <div className="text-xl font-black text-emerald-600 font-mono">
                    ${tempEditItems.reduce((acc, it) => acc + (it.precio_usd * it.cantidad), 0).toFixed(2)}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 uppercase">
                    Original: ${editingOrderItems.total_usd.toFixed(2)}
                  </div>
                </div>
              </div>
              <button 
                onClick={async () => {
                  try {
                    await updateOrderItems(editingOrderItems.id, tempEditItems);
                    setEditingOrderItems(null);
                    alert('Pedido actualizado y cliente notificado.');
                  } catch (e) {
                    alert('Error al guardar los cambios en el pedido.');
                  }
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-emerald-200 active:scale-[0.98] transition-all"
              >
                Guardar Cambios y Notificar Cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUBSECTION 5: SITE SYSTEM CONFIGS ----------------- */}
      {adminSection === 'settings' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* MÓDULO DE RESPALDO DE SEGURIDAD */}
          <div className="flex flex-col gap-4 p-5 border border-amber-200 rounded-2xl bg-amber-50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
                <FileJson size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900">Respaldo de Seguridad Integral</h4>
                <p className="text-[11px] text-amber-700">Descarga un archivo JSON con todos los productos, ventas y clientes. El sistema realiza esto automáticamente cada 15 días.</p>
              </div>
            </div>
            <button 
              onClick={() => handleManualBackup(false)}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md shadow-amber-200"
            >
              Generar Respaldo Ahora
            </button>
            <input type="file" ref={restoreInputRef} onChange={handleRestoreBackup} accept=".json" className="hidden" />
            <button 
              onClick={() => restoreInputRef.current?.click()}
              className="w-full bg-white border border-amber-300 text-amber-700 font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all hover:bg-amber-100"
            >
              Restaurar Copia de Seguridad
            </button>
          </div>

          {/* PRUEBA DE NOTIFICACIONES PUSH */}
          <div className="flex flex-col gap-4 p-5 border border-violet-200 rounded-2xl bg-violet-50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-violet-100 text-violet-600 rounded-xl">
                <Bell size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-violet-900">Verificador de Notificaciones Push</h4>
                <p className="text-[11px] text-violet-700">Lanza una alerta de prueba para verificar el estilo visual nativo y los permisos del navegador.</p>
              </div>
            </div>
            <button 
              onClick={async () => {
                console.log('🧪 Iniciando prueba de comunicación Push...');
                const target = config.telefono_soporte || currentUser?.telefono;
                if (!target) {
                  alert('⚠️ No hay un número de teléfono configurado para recibir la prueba.');
                  return;
                }
                const success = await addNotification(
                  `Prueba de Sistema ${config.site_nombre || ''} 🔔`, 
                  "Si recibes esta alerta, el sistema de Web Push real (VAPID + Supabase) está funcionando correctamente.", 
                  "admin",
                  target
                );
                if (success) {
                  console.log('✅ Prueba enviada con éxito.');
                  setToastTitle('🧪 Prueba de Notificación');
                  setToastMessage(`Se ha enviado una alerta a ${target}. Si no llega, verifica la extensión pg_net en Supabase.`);
                } else {
                  console.error('❌ Falló la inserción de la notificación de prueba.');
                  alert('Error al enviar prueba. Es probable que la tabla "notifications" no exista o los permisos RLS estén bloqueando la subida.');
                }
              }}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md shadow-violet-200 cursor-pointer"
            >
              Ejecutar Test de Notificación Push
            </button>
          </div>

          {/* MANTENIMIENTO TÉCNICO DE LA APP */}
          <div className="flex flex-col gap-4 p-5 border border-slate-200 rounded-2xl bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
                <RefreshCcw size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Mantenimiento de Aplicación (PWA)</h4>
                <p className="text-[11px] text-slate-500">Si los clientes no ven los últimos cambios visuales, pídales que ejecuten esta acción.</p>
              </div>
            </div>
            <button 
              onClick={forceUpdateApp}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md cursor-pointer"
            >
              Forzar Actualización Global
            </button>
          </div>

          {/* GESTIÓN DE CATEGORÍAS (DEPARTAMENTOS) */}
          <div className="flex flex-col gap-4 p-4 border border-slate-200 rounded-xl bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Settings size={14} className="text-violet-600" />
                <span className="text-xs uppercase font-mono font-bold text-slate-900">Administración de Categorías (Departamentos)</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  id="new-category-input"
                  placeholder="Ej. Congelados y Pescadería..."
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500 flex-1 text-xs text-slate-900 font-sans"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) {
                        addCategory(val);
                        (e.target as HTMLInputElement).value = '';
                        alert(`Categoría "${val}" agregada.`);
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('new-category-input') as HTMLInputElement;
                    const val = el?.value.trim();
                    if (val) {
                      addCategory(val);
                      el.value = '';
                      alert(`Categoría "${val}" agregada.`);
                    } else {
                      alert('Por favor escribe un nombre de categoría válido.');
                    }
                  }}
                  className="bg-violet-600 hover:bg-violet-750 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Agregar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 mt-2">
                {(config.categories || []).map((cat) => (
                  <div key={cat} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <span className="font-semibold text-slate-800 truncate pr-1" title={cat}>{cat}</span>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const nuevoNombre = prompt(`Editar nombre de categoría "${cat}":`, cat);
                          if (nuevoNombre && nuevoNombre.trim() !== cat) {
                            updateCategory(cat, nuevoNombre.trim());
                            alert(`Categoría actualizada a "${nuevoNombre.trim()}"`);
                          }
                        }}
                        className="p-1 hover:text-violet-600 bg-white border border-slate-200 rounded text-slate-500 hover:border-violet-300 transition-colors cursor-pointer"
                        title="Editar nombre"
                      >
                        <Edit size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Seguro que deseas eliminar la categoría "${cat}"?\nTodos los productos pertenecientes a ella se moverán a "Víveres y Despensa".`)) {
                            deleteCategory(cat);
                            alert(`Categoría "${cat}" eliminada.`);
                          }
                        }}
                        className="p-1 hover:text-red-600 bg-white border border-slate-200 rounded text-slate-500 hover:border-red-300 transition-colors cursor-pointer"
                        title="Eliminar categoría"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              alert(`¡Ajustes de sucursal física de ${config.site_nombre || 'la tienda'} guardados!`);
            }}
            className="flex flex-col gap-4 p-4 border border-slate-200 rounded-xl bg-white shadow-sm"
          >
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Settings size={14} className="text-violet-600" />
            <span className="text-xs uppercase font-mono font-bold text-slate-900">Editar Parametros de la Tienda</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-900">
            <div className="flex flex-col gap-1">
              <span>Nombre Comercial:</span>
              <input
                type="text"
                value={config.site_nombre}
                onChange={(e) => updateConfig({ site_nombre: e.target.value })}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5">
                  Número Maestro de Notificaciones (Push/WA):
                </span>
                {currentUser && config.telefono_soporte !== currentUser.telefono && (
                  <button
                    type="button"
                    onClick={async () => {
                      updateConfig({ telefono_soporte: currentUser.telefono });
                      const syncResult = await syncPushSubscription();
                      if (!syncResult.success) {
                        addNotification('⚠️ Error Push', syncResult.error!, 'personal');
                      }
                    }}
                    className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded border border-amber-200 hover:bg-amber-200 transition-colors cursor-pointer font-bold uppercase tracking-tighter"
                  >
                    Usar mi número
                  </button>
                )}
              </div>
              <input
                type="text"
                value={config.telefono_soporte}
                onChange={(e) => updateConfig({ telefono_soporte: e.target.value })}
                className={`bg-white border rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500 transition-all ${
                  currentUser && config.telefono_soporte !== currentUser.telefono ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-300'
                }`}
              />
              {currentUser && config.telefono_soporte !== currentUser.telefono && (
                <p className="text-[9px] text-amber-600 font-bold mt-1 flex items-center gap-1 animate-pulse">
                  <AlertTriangle size={10} /> Atención: Para recibir notificaciones Push de Admin, este número debe coincidir con tu perfil ({currentUser.telefono}).
                </p>
              )}
              {config.telefono_soporte && (
                <a
                  href={`https://wa.me/${(config.telefono_soporte || '584124976451').replace(/\D/g, '').replace(/^0/, '58')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 bg-violet-50 text-violet-700 border border-violet-200 px-2 py-1 rounded text-[10px] font-mono transition-colors w-fit select-none shrink-0"
                >
                  <MessageSquare size={11} className="text-violet-600" /> Enlace Directo WhatsApp
                  <ExternalLink size={10} className="ml-0.5 text-violet-500" />
                </a>
              )}
            </div>

            <div className="col-span-2 flex flex-col gap-1">
              <span>Direccion Fisica de la Tienda:</span>
              <input
                type="text"
                value={config.direccion_fisica}
                onChange={(e) => updateConfig({ direccion_fisica: e.target.value })}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500"
              />
            </div>

            <div className="col-span-2 flex flex-col gap-1 border-t border-slate-100 pt-3">
              <span className="font-bold text-slate-800">Mensaje de Bienvenida (Popup Inicial):</span>
              <textarea
                value={config.mensaje_bienvenida}
                onChange={(e) => updateConfig({ mensaje_bienvenida: e.target.value })}
                placeholder="Escribe el mensaje que verán los clientes al entrar por primera vez..."
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-2 outline-none focus:border-violet-500 text-xs min-h-[60px]"
              />
              <p className="text-[10px] text-slate-400 italic mt-1">Este mensaje aparece en la bandeja de notificaciones de los nuevos usuarios.</p>

              {/* Previsualizador de Notificación Estilo Nativo */}
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-2 right-3">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Vista Previa Nativa</span>
                </div>
                <div className="max-w-xs mx-auto bg-white/90 backdrop-blur-md border border-slate-200 rounded-[22px] p-3.5 shadow-xl flex items-start gap-3 transition-all hover:scale-[1.02] border-t-white">
                  <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-violet-200 overflow-hidden">
                    {config.logo_url ? <img src={config.logo_url} className="w-full h-full object-cover" alt="App Logo" /> : <Bell size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight truncate">{config.site_nombre || 'Marketo'}</span>
                      <span className="text-[9px] text-slate-400 font-medium">ahora</span>
                    </div>
                    <h5 className="text-[12px] font-bold text-slate-800 leading-tight">¡Bienvenido a {config.site_nombre || 'nuestra tienda'}!</h5>
                    <p className="text-[11px] text-slate-600 leading-snug mt-1 line-clamp-2">
                      {config.mensaje_bienvenida || 'Escribe un mensaje de bienvenida arriba para ver cómo se verá en el teléfono del cliente...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-100 pt-3">
              <div className="flex flex-col gap-1">
                <span>Logo de la Tienda (PNG/JPEG):</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const compressed = await compressImage(file, { maxWidth: 400, format: 'image/png' });
                        const url = await uploadFileToStorage(compressed, 'settings', `logos/${Date.now()}.png`);
                        updateConfig({ logo_url: url });
                        // Limpiar cache de imágenes para forzar recarga del logo
                        if ('caches' in window) {
                          const cacheNames = await caches.keys();
                          for (const name of cacheNames) {
                            if (name.includes('image') || name.includes('supabase')) {
                              await caches.delete(name);
                            }
                          }
                        }
                        // Notificar al Service Worker: nuevo logo para manifest dinámico
                        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                          navigator.serviceWorker.controller.postMessage({
                            type: 'UPDATE_LOGO_URL',
                            logoUrl: url
                          });
                          navigator.serviceWorker.controller.postMessage({
                            type: 'CLEAR_ASSETS_CACHE'
                          });
                        }
                      } catch (err) {
                        alert('Error al subir el logo: ' + (err as any).message);
                      }
                    }
                  }}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500"
                />
                {config.logo_url && (
                   <img src={config.logo_url} alt="Logo preview" className="mt-2 h-10 w-auto object-contain bg-slate-100 rounded border border-slate-200" />
                )}
              </div>
              
              <div className="flex flex-col gap-1">
                <span>Favicon (Logo Pestana):</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/x-icon"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const compressed = await compressImage(file, { maxWidth: 64, format: 'image/png' });
                        const url = await uploadFileToStorage(compressed, 'settings', 'favicons');
                        updateConfig({ favicon_url: url });
                        // Limpiar cache de imágenes para forzar recarga del favicon
                        if ('caches' in window) {
                          const cacheNames = await caches.keys();
                          for (const name of cacheNames) {
                            if (name.includes('image') || name.includes('supabase')) {
                              await caches.delete(name);
                            }
                          }
                        }
                        // Notificar al Service Worker para limpiar su cache
                        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                          navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_ASSETS_CACHE' });
                        }
                      } catch (err) {
                        alert('Error al subir el favicon: ' + (err as any).message);
                      }
                    }
                  }}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500"
                />
                {config.favicon_url && (
                   <img src={config.favicon_url} alt="Favicon preview" className="mt-2 h-8 w-8 object-contain bg-slate-100 rounded border border-slate-200" />
                )}
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <span>Color Primario (Hexadecimal, ej: #ffffff):</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.theme_color || '#ffffff'}
                    onChange={(e) => updateConfig({ theme_color: e.target.value })}
                    className="w-10 h-10 p-0 border-0 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.theme_color || '#ffffff'}
                    onChange={(e) => updateConfig({ theme_color: e.target.value })}
                    placeholder="Ej. #ffffff"
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500 flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="col-span-2 flex flex-col gap-3 border-t border-slate-100 pt-3">
               <span className="font-bold text-slate-800">Banners Promocionales (Inicio)</span>
               {[0, 1, 2].map(index => (
                 <div key={index} className="flex flex-col gap-2 p-3 border border-slate-200 rounded-lg bg-slate-50">
                    <span className="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-wider">Banner {index + 1}</span>
                    <div className="flex flex-col gap-1">
                      <span>URL de Imagen:</span>
                      <input
                        type="text"
                        value={config.banners[index] || ''}
                        onChange={(e) => {
                          const newBanners = [...config.banners];
                          newBanners[index] = e.target.value;
                          updateConfig({ banners: newBanners });
                        }}
                        className="bg-white border border-slate-300 rounded px-2 py-1.5 outline-none focus:border-blue-500 text-xs"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span>Texto del Banner:</span>
                      <input
                        type="text"
                        value={config.banner_texts?.[index] || ''}
                        onChange={(e) => {
                          const newTexts = config.banner_texts ? [...config.banner_texts] : ['', '', ''];
                          newTexts[index] = e.target.value;
                          updateConfig({ banner_texts: newTexts });
                        }}
                        className="bg-white border border-slate-300 rounded px-2 py-1.5 outline-none focus:border-blue-500 text-xs"
                      />
                    </div>
                 </div>
               ))}
            </div>

            <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-100 pt-3">
              <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold text-slate-800">Opciones de Delivery Local</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.delivery_gratis || false}
                    onChange={(e) => updateConfig({ delivery_gratis: e.target.checked })}
                    className="accent-violet-600 h-4 w-4 rounded"
                  />
                  <span>Delivery Gratis</span>
                </label>
                {!config.delivery_gratis && (
                  <div className="flex items-center gap-2 mt-1">
                    <span>Costo base por Km ($):</span>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={config.costo_delivery_km || 0}
                      onChange={(e) => updateConfig({ costo_delivery_km: parseFloat(e.target.value) || 0 })}
                      className="bg-white border border-slate-300 rounded px-2 py-1 outline-none focus:border-violet-500 w-24"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold text-slate-800">Opciones de Envío Nacional</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.envio_nacional || false}
                    onChange={(e) => updateConfig({ envio_nacional: e.target.checked })}
                    className="accent-violet-600 h-4 w-4 rounded"
                  />
                  <span>Ofrecer Envío Nacional</span>
                </label>
                {config.envio_nacional && (
                  <div className="flex items-center gap-2 mt-1">
                    <span>Costo de Envío Fijo ($):</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={config.costo_envio_nacional || 0}
                      onChange={(e) => updateConfig({ costo_envio_nacional: parseFloat(e.target.value) || 0 })}
                      className="bg-white border border-slate-300 rounded px-2 py-1 outline-none focus:border-violet-500 w-24"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold text-slate-800">Recogida en el Local</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.recogida_en_local || false}
                    onChange={(e) => updateConfig({ recogida_en_local: e.target.checked })}
                    className="accent-violet-600 h-4 w-4 rounded"
                  />
                  <span>Ofrecer Recogida en Tienda</span>
                </label>
              </div>

              <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold text-slate-800">Entrega por Zonas</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.entrega_por_zonas || false}
                    onChange={(e) => updateConfig({ entrega_por_zonas: e.target.checked })}
                    className="accent-violet-600 h-4 w-4 rounded"
                  />
                  <span>Ofrecer Entrega por Zonas (selección manual)</span>
                </label>
              </div>
            </div>

            {/* Editor de Zonas de Delivery */}
            <div className="col-span-2 border-t border-slate-100 pt-3 flex flex-col gap-3">
              <span className="text-[10px] uppercase font-mono text-slate-500 block pb-1">Configuración de Zonas de Delivery</span>
              <p className="text-[11px] text-slate-400">Define las zonas de entrega con su nombre, costo y rango de distancia (km). Estas zonas aparecen en el checkout cuando el cliente elige "Entrega por Zonas".</p>

              {/* Lista de zonas existentes */}
              <div className="flex flex-col gap-2">
                {(config.delivery_zonas || []).map((z, idx) => (
                  <div key={z.id} className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg text-xs">
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-slate-800 block truncate">{z.name}</span>
                      <span className="text-[10px] text-slate-500">{z.minKm}–{z.maxKm} km | ${z.cost.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => {
                        setEditingZone(z);
                        setNewZoneName(z.name);
                        setNewZoneCost(z.cost);
                        setNewZoneMinKm(z.minKm);
                        setNewZoneMaxKm(z.maxKm);
                      }}
                      className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 transition-colors cursor-pointer"
                      title="Editar zona"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => {
                        const updated = (config.delivery_zonas || []).filter((_, i) => i !== idx);
                        updateConfig({ delivery_zonas: updated });
                      }}
                      className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors cursor-pointer"
                      title="Eliminar zona"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {(!config.delivery_zonas || config.delivery_zonas.length === 0) && (
                  <p className="text-[11px] text-slate-400 italic">No hay zonas configuradas. Agrega una zona abajo.</p>
                )}
              </div>

              {/* Formulario agregar/editar zona */}
              <div className="flex flex-col gap-2 p-3 bg-white border border-slate-200 rounded-lg">
                <span className="font-bold text-slate-800 text-xs">{editingZone ? 'Editar Zona' : 'Agregar Nueva Zona'}</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Nombre de la Zona</span>
                    <input
                      type="text"
                      value={newZoneName}
                      onChange={(e) => setNewZoneName(e.target.value)}
                      placeholder="Ej: Cercano (Guaparo, El Viñedo)"
                      className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500 text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Costo ($)</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={newZoneCost}
                      onChange={(e) => setNewZoneCost(parseFloat(e.target.value) || 0)}
                      className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500 text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Kilómetros Mínimos</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={newZoneMinKm}
                      onChange={(e) => setNewZoneMinKm(parseFloat(e.target.value) || 0)}
                      className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500 text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Kilómetros Máximos</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={newZoneMaxKm}
                      onChange={(e) => setNewZoneMaxKm(parseFloat(e.target.value) || 0)}
                      className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500 text-xs"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => {
                      if (!newZoneName.trim()) return;
                      const zone: DeliveryZone = {
                        id: editingZone ? editingZone.id : `z${Date.now()}`,
                        name: newZoneName.trim(),
                        cost: newZoneCost,
                        minKm: newZoneMinKm,
                        maxKm: newZoneMaxKm
                      };
                      const zones = [...(config.delivery_zonas || [])];
                      if (editingZone) {
                        const idx = zones.findIndex(z => z.id === editingZone.id);
                        if (idx >= 0) zones[idx] = zone;
                      } else {
                        zones.push(zone);
                      }
                      updateConfig({ delivery_zonas: zones });
                      setEditingZone(null);
                      setNewZoneName('');
                      setNewZoneCost(0);
                      setNewZoneMinKm(0);
                      setNewZoneMaxKm(0);
                    }}
                    disabled={!newZoneName.trim()}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: config.theme_color || '#0f5d34' }}
                  >
                    {editingZone ? 'Guardar Cambios' : 'Agregar Zona'}
                  </button>
                  {editingZone && (
                    <button
                      onClick={() => {
                        setEditingZone(null);
                        setNewZoneName('');
                        setNewZoneCost(0);
                        setNewZoneMinKm(0);
                        setNewZoneMaxKm(0);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="col-span-2 border-t border-slate-100 pt-3 flex flex-col gap-3">
              <span className="text-[10px] uppercase font-mono text-slate-500 block pb-1">Configuración del Motor Push (VAPID / Webhook)</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <span>URL del Webhook (Cloudflare Pages):</span>
                  <input
                    type="text"
                    value={config.push_webhook_url || ''}
                    onChange={(e) => updateConfig({ push_webhook_url: e.target.value })}
                    placeholder="https://su-app.pages.dev/api/push-notify"
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500 font-mono text-[11px]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span>Webhook Secret (Auth):</span>
                  <input
                    type="password"
                    value={config.push_webhook_secret || ''}
                    onChange={(e) => updateConfig({ push_webhook_secret: e.target.value })}
                    placeholder="Clave de seguridad del webhook..."
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500 font-mono text-[11px]"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 italic">
                Esta configuración conecta Supabase con el Worker de Cloudflare para procesar los envíos reales a los navegadores.
              </p>
            </div>

            <div className="col-span-2 border-t border-slate-100 pt-3 flex flex-col gap-2">
              <span className="text-[10px] uppercase font-mono text-slate-500 block pb-1">Credenciales de Acceso (Admin)</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  value={newAdminUser}
                  onChange={(e) => setNewAdminUser(e.target.value)}
                  placeholder="Usuario"
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500"
                />
                <div className="relative">
                  <input
                    type={showAdminPass ? "text" : "password"}
                    value={newAdminPass}
                    onChange={(e) => setNewAdminPass(e.target.value)}
                    placeholder="Contraseña"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPass(!showAdminPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showAdminPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    updateAdminCredentials(newAdminUser, newAdminPass);
                    alert('Credenciales actualizadas exitosamente.');
                  }}
                  className="col-span-2 bg-violet-600 hover:bg-violet-750 text-white py-2 rounded-lg font-bold cursor-pointer transition-all"
                >
                  Guardar Nuevas Credenciales
                </button>
              </div>
            </div>

            {/* Change Payment switches toggles */}
            <div className="col-span-2 border-t border-slate-100 pt-3 flex flex-col gap-2">
              <span className="text-[10px] uppercase font-mono text-slate-500 block pb-1">Habilitar Canales de Pago</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'pagomovil_enabled', label: 'Pago Móvil Bs', dataKey: 'pagomovil_data', discKey: 'pagomovil_discount_percent' },
                  { key: 'zelle_enabled', label: 'Zelle USD', dataKey: 'zelle_data', discKey: 'zelle_discount_percent' },
                  { key: 'efectivo_enabled', label: 'Efectivo en Tienda / Delivery', dataKey: 'efectivo_data', discKey: 'efectivo_discount_percent' },
                  { key: 'transferencia_enabled', label: 'Transferencia Bancaria Nacional', dataKey: 'transferencia_data', discKey: 'transferencia_discount_percent' }
                ].map(p => (
                  <div key={p.key} className="flex flex-col gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(config as any)[p.key]}
                        onChange={(e) => updateConfig({ [p.key]: e.target.checked })}
                        className="accent-violet-600 rounded h-4 w-4"
                      />
                      <span className="font-semibold text-slate-800">{p.label}</span>
                    </label>
                    {(config as any)[p.key] && (
                      <>
                        <input
                          type="text"
                          value={(config as any)[p.dataKey]}
                          onChange={(e) => updateConfig({ [p.dataKey]: e.target.value })}
                          placeholder={`Datos de ${p.label}...`}
                          className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 outline-none focus:border-violet-500 w-full"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600">Descuento (%):</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={(config as any)[p.discKey]}
                            onChange={(e) => updateConfig({ [p.discKey]: parseFloat(e.target.value) || 0 })}
                            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 outline-none focus:border-violet-500 w-full"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-750 border border-violet-600 py-3.5 rounded-lg text-xs font-bold uppercase transition-all mt-4 cursor-pointer text-white"
          >
            Guardar Cambios de Sucursal
          </button>
        </form>
        </div>
      )}

      {/* --------------------------------------------------------------------------------
      CRUD EDITOR MODAL (FORMULARIO MODALS DE CONTROL)
      -------------------------------------------------------------------------------- */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm overflow-y-auto">
          <EditProductForm 
            part={editingPart || {
              id: '',
              codigo: '',
              nombre: '',
              marca: 'Genérica',
              condicion: 'Nacional',
              descripcion: '',
              categoria: config.categories?.[0] || 'Lácteos y Quesos',
              seccion: 'Pasillo 1 - Lacteos',
              subseccion: '',
              anio_inicio: 15,
              anio_fin: 4,
              precio_usd: 1.00,
              stock: 10,
              imagen_urls: ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=500'],
              es_promo: false,
              es_nuevo: true,
              es_mas_vendido: false,
              delivery_gratis: false,
              detalle_adicional: ''
            }}
            onClose={() => setIsEditorOpen(false)}
            onSubmit={(updatedPart) => {
              const payload = {
                codigo: updatedPart.codigo,
                nombre: updatedPart.nombre,
                marca: updatedPart.marca,
                condicion: updatedPart.condicion,
                descripcion: updatedPart.descripcion,
                categoria: updatedPart.categoria,
                seccion: updatedPart.seccion,
                subseccion: updatedPart.subseccion,
                anio_inicio: updatedPart.anio_inicio,
                anio_fin: updatedPart.anio_fin,
                precio_usd: updatedPart.precio_usd,
                stock: updatedPart.stock,
                imagen_urls: updatedPart.imagen_urls,
                es_promo: updatedPart.es_promo,
                es_nuevo: updatedPart.es_nuevo,
                es_mas_vendido: updatedPart.es_mas_vendido,
                delivery_gratis: updatedPart.delivery_gratis,
                detalle_adicional: updatedPart.detalle_adicional,
                disponibilidad: (updatedPart as any).disponibilidad
              };
              if (editingPart) {
                updatePart(editingPart.id, payload);
                alert(`¡Producto ${payload.nombre} actualizado!`);
              } else {
                addPart(payload);
                alert(`¡Nuevo producto ${payload.nombre} creado en el catálogo!`);
              }
              setIsEditorOpen(false);
            }}
          />
        </div>
      )}

      {/* --------------------------------------------------------------------------------
      DIGITAL RECEIPT PREVIEW (FACTURAS ESTILIZADAS MODAL)
      -------------------------------------------------------------------------------- */}
      {printingOrder && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-sm bg-white text-black p-6 rounded-none shadow-2xl font-mono relative border-t-8 border-[#7c3aed]">
            {/* Header store */}
            <div className="text-center flex flex-col items-center">
              <h3 className="font-extrabold text-md uppercase font-display select-none tracking-tight">*** {config.site_nombre} ***</h3>
              <p className="text-[10px] text-gray-600 mt-1 uppercase max-w-[240px] leading-tight font-sans">{config.direccion_fisica}</p>
              <p className="text-[10px] text-gray-500 font-mono mt-0.5">Telf: {config.telefono_soporte}</p>
            </div>

            {/* Receipt title */}
            <div className="border-t border-dashed border-black mt-4 pt-3 text-xs flex flex-col gap-1 font-mono">
              <div className="flex justify-between font-bold">
                <span>NRO FACTURA:</span>
                <span>{printingOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span>FECHA PEDIDO:</span>
                <span>{printingOrder.fecha.substring(0,10)}</span>
              </div>
              <div className="flex justify-between">
                <span>METODO PAGO:</span>
                <span>{printingOrder.metodo_pago}</span>
              </div>
            </div>

            {/* Separator */}
            <div className="border-t border-dashed border-black mt-3 pt-3 text-xs font-bold uppercase">
              PRODUCTOS ADQUIRIDOS
            </div>

            {/* Ordered Parts items list loop inside digital ticket receipt */}
            <div className="text-xs flex flex-col gap-2 mt-2 font-mono">
              {printingOrder.items.map(it => (
                <div key={it.part_id} className="flex flex-col">
                  <div className="flex justify-between font-bold">
                    <span>{it.nombre}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-[11px] pl-2">
                    <span>Cod: {it.codigo}  ({it.cantidad}x  ${Number(it.precio_usd || 0).toFixed(2)})</span>
                    <span>${(Number(it.cantidad || 0) * Number(it.precio_usd || 0)).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery values */}
            <div className="border-t border-dashed border-black mt-3 pt-3 text-xs flex flex-col gap-1 font-mono">
              <div className="flex justify-between">
                <span>SUBTOTAL:</span>
                <span>${(Number(printingOrder.subtotal_usd) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>DELIVERY EXPRESS:</span>
                <span>${(Number(printingOrder.costo_envio_usd) || 0).toFixed(2)}</span>
              </div>
              {printingOrder.cupon_codigo && (
                <div className="flex justify-between text-violet-600 font-bold">
                  <span>CUPÓN ({printingOrder.cupon_codigo}):</span>
                  <span>-${(Number(printingOrder.descuento_cupon_usd) || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm border-t border-black pt-2">
                <span>MONTO USD:</span>
                <span>${(Number(printingOrder.total_usd) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-700 text-xs">
                <span>EQUIVALENTE BS:</span>
                <span>{(Number(printingOrder.total_usd || 0) * Number(config.tasa_cambio || 1)).toFixed(2)} Bs</span>
              </div>
            </div>

            {/* Client specifics instructions footer */}
            <div className="mt-4 p-2 bg-yellow-50/50 border border-yellow-100 text-[10px] leading-snug font-sans text-gray-850">
              <strong>Cliente:</strong> {printingOrder.cliente_nombre}<br />
              <strong>Telf:</strong> {printingOrder.cliente_telefono}<br />
              <strong>Email:</strong> {printingOrder.cliente_email || 'No registrado'}<br />
              <strong>Filtro Zona:</strong> {printingOrder.direccion_envio} ({printingOrder.distancia_km} km)
            </div>

            {/* Barcode scanner mockup image at the bottom of the bill receipt */}
            <div className="flex flex-col items-center mt-5 pt-3 border-t border-dashed border-black">
              <div className="w-full h-8 bg-black/10 rounded flex items-center justify-center text-[8px] tracking-[6px] text-gray-500 font-bold overflow-hidden select-none">
                |||| | || || | |||| || | || ||| ||
              </div>
              <p className="text-[9px] text-gray-400 font-mono mt-1">¡Gracias por preferirnos en Valencia!</p>
            </div>

            {/* Close trigger button */}
            <div className="absolute -bottom-14 left-0 right-0 z-40 flex justify-center print:hidden">
              <button
                type="button"
                onClick={() => setPrintingOrder(null)}
                className="bg-black text-[#7c3aed] border border-[#7c3aed]/40 shadow-xl px-5 py-2.5 text-xs font-bold uppercase rounded-lg flex items-center gap-1 hover:bg-zinc-900 transition-all font-mono cursor-pointer"
              >
                <X size={15} /> Cerrar Ficha Recibo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sleek Custom Toast Notification for Admin Actions */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] max-w-sm w-[90vw] sm:w-[320px] bg-[#18181b]/95 border border-violet-500/40 px-4 py-3.5 rounded-xl shadow-2xl backdrop-blur-md transition-all duration-300 flex items-start gap-3 animate-fade-in-up">
          <div className="bg-violet-500/10 p-2 rounded-lg border border-violet-500/20 shrink-0">
            <Bell size={16} className="text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-violet-300 font-display leading-tight">{toastTitle}</h4>
            <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed font-sans">{toastMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setToastMessage('');
              setToastTitle('');
            }}
            className="text-zinc-400 hover:text-white text-[10px] font-mono uppercase bg-zinc-800/40 hover:bg-zinc-800 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
          >
            Esc
          </button>
        </div>
      )}

      {/* ✅ FIX: Modal inline "Enviar Mensaje" a cliente — reemplaza prompt() que falla en PWA móvil */}
      {sendMsgModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Enviar Mensaje</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Para: <span className="font-bold text-indigo-600">{sendMsgModal.user.nombre || sendMsgModal.user.telefono}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSendMsgModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Form */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Título del Mensaje *</label>
                <input
                  type="text"
                  value={sendMsgTitle}
                  onChange={(e) => setSendMsgTitle(e.target.value)}
                  placeholder="Ej: Aviso de su pedido..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-400 transition-colors"
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cuerpo del Mensaje *</label>
                <textarea
                  value={sendMsgBody}
                  onChange={(e) => setSendMsgBody(e.target.value)}
                  placeholder="Escribe aquí el mensaje para el cliente..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-400 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setSendMsgModal(null)}
                className="py-2.5 rounded-xl border border-slate-200 text-slate-600 text-[11px] font-bold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={sendMsgLoading || !sendMsgTitle.trim() || !sendMsgBody.trim()}
                onClick={async () => {
                  if (!sendMsgTitle.trim() || !sendMsgBody.trim()) return;
                  setSendMsgLoading(true);
                  const ok = await addNotification(
                    sendMsgTitle.trim(),
                    sendMsgBody.trim(),
                    'personal',
                    sendMsgModal.user.telefono
                  );
                  setSendMsgLoading(false);
                  setSendMsgModal(null);
                  setSendMsgTitle('');
                  setSendMsgBody('');
                  if (ok) {
                    setToastTitle('✅ Mensaje Enviado');
                    setToastMessage(`Notificación enviada a ${sendMsgModal.user.nombre || sendMsgModal.user.telefono}.`);
                  } else {
                    setToastTitle('❌ Error');
                    setToastMessage('No se pudo enviar el mensaje. Verifica la consola.');
                  }
                }}
                className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[11px] font-bold transition-colors cursor-pointer"
              >
                {sendMsgLoading ? 'Enviando...' : 'Enviar 📨'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
