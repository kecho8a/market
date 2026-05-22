import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { Producto, Order } from '../types/store';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import { 
  Plus, Edit, Trash2, Camera, Landmark, Settings, ShoppingBag, BarChart3, 
  Search, CheckCircle, Truck, PackageCheck, AlertTriangle, Send, Bell, Ticket,
  Receipt, Printer, Check, X, MessageSquare, ExternalLink, Upload, DollarSign, Package, ShoppingCart, User
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { EditProductForm } from '../components/EditProductForm';

const compressImage = (file: File, callback: (base64: string) => void, formatOverride?: 'image/webp' | 'image/jpeg') => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 600;
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const format = formatOverride || (file.type === 'image/webp' ? 'image/webp' : 'image/jpeg');
        const compressedBase64 = canvas.toDataURL(format, 0.75);
        callback(compressedBase64);
      } else {
        callback(e.target?.result as string);
      }
    };
    img.src = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

interface AdminProps {
  onOpenScanner: () => void;
  scannedResultCode?: string;
  clearScannedResultCode?: () => void;
  setTab: (tab: 'home' | 'catalog' | 'cart' | 'admin') => void;
}

export const Admin: React.FC<AdminProps> = ({ 
  onOpenScanner, 
  scannedResultCode, 
  clearScannedResultCode,
  setTab
}) => {
  const { 
    parts, orders, config, notifications, 
    addPart, updatePart, deletePart, updateConfig, updateExchangeRate, 
    updateOrderStatus, addNotification, toggleNotificationReadStatus,
    updateAdminCredentials, adminUser, adminPass, users, updateUserByAdmin,
    addCategory, deleteCategory, updateCategory
  } = useApp();

  // Temporary local state for credential editing
  const [newAdminUser, setNewAdminUser] = useState(adminUser);
  const [newAdminPass, setNewAdminPass] = useState(adminPass);

  // Navigation within admin panel: 'inventory' | 'orders' | 'settings' | 'reports' | 'notifications' | 'customers'
  const [adminSection, setAdminSection] = useState<'inventory' | 'orders' | 'settings' | 'reports' | 'notifications' | 'customers'>('reports');

  // Search input for inventory parts CRUD search
  const [crudSearch, setCrudSearch] = useState('');

  // Sinc scanned part code to CRUD search if passed
  React.useEffect(() => {
    if (scannedResultCode) {
      setCrudSearch(scannedResultCode);
      setAdminSection('inventory');
      if (clearScannedResultCode) clearScannedResultCode();
    }
  }, [scannedResultCode, clearScannedResultCode]);

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

  // Broadcaster states
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTipo, setBroadcastTipo] = useState<'todos' | 'personal' | 'admin'>('todos');
  const [broadcastDestinatarioTelefono, setBroadcastDestinatarioTelefono] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastTitle, setToastTitle] = useState('');

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
    }
    setIsEditorOpen(true);
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
      detalle_adicional: formDetalleAdicional.trim()
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

  const handleCreateBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    
    // Check if phone was filled for personal notification
    if (broadcastTipo === 'personal' && !broadcastDestinatarioTelefono.trim()) {
      alert('Por favor, especifique el número de teléfono para la notificación personal.');
      return;
    }
    
    const sentTitle = broadcastTitle.trim();
    const sentMessage = broadcastMessage.trim();
    const targetPhone = broadcastTipo === 'personal' ? broadcastDestinatarioTelefono.trim() : undefined;
    
    addNotification(sentTitle, sentMessage, broadcastTipo, targetPhone);
    
    // Custom polished visual confirmation toast showing the title of the broadcast
    setToastTitle(
      broadcastTipo === 'todos' ? '📢 Comunicado Difundido Exitosamente' :
      broadcastTipo === 'personal' ? '👤 Envío de Notificación Personalizada' :
      '🛡️ Alerta de Administrador Creada'
    );
    
    setToastMessage(
      broadcastTipo === 'todos' ? `El comunicado general "${sentTitle}" fue enviado a todos los clientes.` :
      broadcastTipo === 'personal' ? `La notificación privada fue dirigida al cliente con teléfono ${targetPhone}.` :
      `La alerta de uso interno "${sentTitle}" fue registrada.`
    );
    
    setBroadcastTitle('');
    setBroadcastMessage('');
    setBroadcastDestinatarioTelefono('');
    setBroadcastTipo('todos');
  };

  // --------------------------------------------------------------------------------
  // RECHARTS ANALYTICAL METRICS COMPUTATION
  // --------------------------------------------------------------------------------
  const reportTotals = useMemo(() => {
    const totalVentasUsd = orders.reduce((acc, o) => acc + (Number(o.total_usd) || 0), 0);
    const totalPedidosCount = orders.length;
    let partsSold = 0;
    
    orders.forEach(o => {
      o.items.forEach(it => {
        partsSold += (Number(it.cantidad) || 0);
      });
    });

    return {
      salesUSD: totalVentasUsd,
      salesBs: totalVentasUsd * (Number(config.tasa_cambio) || 1),
      ordersCount: totalPedidosCount,
      partsSoldCount: partsSold
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

  // Crud Catalog Search helper match
  const crudSearchParts = useMemo(() => {
    if (!crudSearch.trim()) return parts;
    return parts.filter(p => 
      p.nombre.toLowerCase().includes(crudSearch.toLowerCase()) ||
      p.codigo.toLowerCase().includes(crudSearch.toLowerCase()) ||
      p.seccion.toLowerCase().includes(crudSearch.toLowerCase()) ||
      p.subseccion.toLowerCase().includes(crudSearch.toLowerCase())
    );
  }, [parts, crudSearch]);

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
          <span className="text-[11px] font-mono text-violet-600 font-bold uppercase tracking-wider">Control Total y Logística de Despacho Marketo</span>
          <h2 className="text-[21px] font-bold font-display text-slate-900">Dashboard Administrativo</h2>
        </div>

        {/* Action Quick Rate Input */}
        <div className="p-2.5 rounded-lg border border-violet-100 bg-violet-50/40 flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-700">
            <Landmark size={14} className="text-violet-600" />
            <span>Tasa de Cambio (Bs):</span>
          </div>
          <input
            type="number"
            step="0.01"
            value={config.tasa_cambio}
            onChange={(e) => updateExchangeRate(Number(e.target.value))}
            className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1 text-center font-mono text-xs text-slate-900 font-bold focus:outline-none focus:border-violet-500"
            title="Modificar tasa del Bolívar en tiempo real"
            placeholder="36.5"
          />
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
          {/* Quick Metrics Cards grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </div>
      )}

      {/* ----------------- SUBSECTION 2: CATALOG MANAGEMENT CRUD ----------------- */}
      {adminSection === 'inventory' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center bg-slate-100 p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-bold font-display text-slate-800">Editar o Cargar Productos</span>
            
            <button
              type="button"
              onClick={() => openEditor(null)}
              className="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus size={13} /> Agregar Articulo
            </button>
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
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg py-2 pl-9 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-all"
              />
            </div>

            {/* Barcode cam reader shortcut */}
            <button
              type="button"
              onClick={onOpenScanner}
              className="bg-[#18181b] border border-[#27272a] text-violet-400 hover:bg-violet-500/10 px-3 rounded-lg flex items-center gap-1.5 transition-all text-xs cursor-pointer"
              title="Cargar escaneando Barra SKU"
            >
              <Camera size={14} /> Escanear Barra SKU
            </button>
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
                  <div>
                    <div className="flex gap-2 items-center">
                      <h5 className="text-xs font-bold text-slate-900 line-clamp-1">{part.nombre}</h5>
                      {part.activo === false && (
                        <span className="bg-red-100 text-red-600 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Inactivo</span>
                      )}
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

      {/* ----------------- SUBSECTION 3: ORDERS MANAGEMENT & REAL-TIME EMULATOR ----------------- */}
      {adminSection === 'orders' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs uppercase font-mono font-bold text-[#a1a1aa] tracking-wider">Cola de Pedidos Recibidos</h4>
            
            {/* Status filters */}
            <div className="flex gap-1 text-[10px] font-mono bg-slate-100 p-1 border border-slate-200 rounded-lg">
              {['Todos', 'Pendiente', 'Procesando', 'Enviado'].map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setOrderFilter(f as any)}
                  className={`px-3 py-1.5 rounded-md cursor-pointer ${orderFilter === f ? 'bg-violet-600 text-white font-bold' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  {f}
                </button>
              ))}
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
                  <div className="flex justify-between items-start border-b border-slate-200 pb-2.5">
                     <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 font-mono">{order.id}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold ${order.status === 'Pendiente' ? 'bg-amber-100 text-amber-700' : order.status === 'Procesando' ? 'bg-indigo-100 text-indigo-700' : 'bg-violet-100 text-violet-750'}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 font-mono">📅 {order.fecha}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-violet-600 font-mono">${(Number(order.total_usd) || 0).toFixed(2)}</div>
                      <div className="text-[10px] text-violet-600 font-mono font-bold">{(Number(order.total_bs) || 0).toFixed(2)} Bs</div>
                    </div>
                  </div>

                  {/* Customer info */}
                  <div className="grid grid-cols-2 text-xs text-slate-700 gap-1.5 font-mono">
                    <div>👤 Cliente: <strong className="text-slate-900 font-sans">{order.cliente_nombre}</strong></div>
                    <div>📞 Telf: <strong className="text-slate-900">{order.cliente_telefono}</strong></div>
                    <div className="col-span-2">📍 Destino: <strong className="text-slate-900">{order.direccion_envio}</strong></div>
                  </div>

                  {/* Items itemized summary list */}
                  <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 flex flex-col gap-1 text-[11px] font-mono">
                    {order.items.map(it => (
                      <div key={it.part_id} className="flex justify-between text-slate-600">
                        <span>{it.cantidad}x {it.nombre}</span>
                        <span>${(Number(it.precio_usd) * Number(it.cantidad || 1)).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action transitions status with notifications dispatcher */}
                  <div className="flex justify-between items-center pt-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPrintingOrder(order)}
                      className="bg-[#18181b] text-gray-300 border border-[#27272a] hover:text-white px-2.5 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1 cursor-pointer hover:bg-[#27272a] transition-colors"
                    >
                      <Receipt size={12} /> Factura Digital
                    </button>

                    <div className="flex gap-1 text-[10px] font-mono">
                      {order.status !== 'Enviado' && (
                        <button
                          type="button"
                          onClick={() => {
                            const nextStatus = order.status === 'Pendiente' ? 'Procesando' : 'Enviado';
                            updateOrderStatus(order.id, nextStatus);
                            
                            // Send custom app alert to this client
                            addNotification(
                              `Despacho de Pedido ${order.id}`, 
                              `Su pedido ya se encuentra en fase: ${nextStatus}. ¡Sintonice con soporte en Valencia para el delivery!`,
                              'personal'
                            );
                          }}
                          className="bg-violet-600 hover:bg-violet-700 text-white px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 active:scale-95 transition-all text-[11px] cursor-pointer"
                        >
                          Avanzar ➔
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

      {/* ----------------- SUBSECTION 4: WEB PUSH BROADCASTER & IN-APP NOTIFICATIONS ----------------- */}
      {adminSection === 'notifications' && (
        <div className="flex flex-col gap-4">
          <div className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm flex flex-col gap-3">
            <span className="text-xs font-bold font-display text-slate-900 uppercase tracking-wider flex items-center gap-1"><Bell size={14} className="text-violet-600" /> Emitir Comunicado / Web Push</span>
            <p className="text-[11px] text-slate-500 leading-normal">Permite redactar y disparar un mensaje de alerta push en tiempo real a todos los motorizados o clientes suscritos en Valencia, Carabobo.</p>

            <form onSubmit={handleCreateBroadcast} className="flex flex-col gap-3.5 text-xs text-slate-900">
              {/* Type Selection Field */}
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-slate-700">Tipo de Notificación *</span>
                <select
                  value={broadcastTipo}
                  onChange={(e) => setBroadcastTipo(e.target.value as 'todos' | 'personal' | 'admin')}
                  className="bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                >
                  <option value="todos">Todos los Usuarios (Público / Promoción)</option>
                  <option value="personal">Personal / Dirigida (Cliente específico por Teléfono)</option>
                  <option value="admin">Administrador (Uso interno)</option>
                </select>
              </div>

              {/* Optional Client Phone Field */}
              {broadcastTipo === 'personal' && (
                <div className="flex flex-col gap-1 border-l-2 border-violet-500 pl-3 py-1 bg-violet-50/50 rounded-r-lg transition-all animate-fade-in animate-duration-300">
                  <span className="font-semibold text-violet-700">Teléfono del destinatario *</span>
                  <input
                    type="text"
                    required
                    value={broadcastDestinatarioTelefono}
                    onChange={(e) => setBroadcastDestinatarioTelefono(e.target.value)}
                    placeholder="Ej. +584124976451"
                    className="bg-white border border-slate-300 rounded-lg px-3 py-2 tracking-wide outline-none focus:border-violet-500 font-mono text-xs"
                  />
                  <span className="text-[10px] text-slate-500">
                    Solo el cliente registrado con este número recibirá este aviso en su sección "Avisos & Promociones".
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <span className="font-semibold text-slate-700">Título de la Notificación *</span>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder={
                    broadcastTipo === 'todos' ? "Ej. ¡Descuento de 15% en quesos madurados!" :
                    broadcastTipo === 'personal' ? "Ej. Su pedido de embutidos y carnes está listo" :
                    "Ej. Alerta de Stock Bajo detectada en lomo de aguja"
                  }
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-semibold text-slate-700">Contenido del mensaje *</span>
                <textarea
                  required
                  rows={2.5}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Detalle el aviso, marcas, ofertas o promoción..."
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-violet-500 font-sans text-xs"
                />
              </div>

              <button
                type="submit"
                className="bg-violet-600 text-white font-bold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 self-end cursor-pointer hover:bg-violet-700 transition-all"
              >
                <Send size={13} /> 
                {broadcastTipo === 'todos' ? 'Emitir Push masivo' :
                 broadcastTipo === 'personal' ? 'Enviar Notificación Personal' :
                 'Crear Alerta de Admin'}
              </button>
            </form>
          </div>

          {/* List processed notifications */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center bg-slate-100 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Historial de Comunicados y Solicitudes</span>
            </div>
            
            {notifications.map(notif => {
              const isAdminAlerta = notif.tipo === 'admin';
              const isPersonalAlerta = notif.tipo === 'personal';
              const isRequest = notif.tipo === 'request';
              
              return (
                <div 
                  key={notif.id} 
                  className={`p-4 rounded-xl text-xs flex flex-col gap-3 border transition-colors shadow-sm bg-white hover:border-slate-300 ${
                    isRequest
                      ? 'border-indigo-200'
                      : isAdminAlerta 
                      ? 'border-amber-200' 
                      : isPersonalAlerta
                      ? 'border-violet-200'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col gap-1">
                      <h5 className={`font-bold text-[13px] ${
                        isRequest ? 'text-indigo-700' :
                        isAdminAlerta ? 'text-amber-700' : 
                        isPersonalAlerta ? 'text-violet-700' : 
                        'text-slate-800'
                      }`}>
                        {isRequest ? 'Petición de Alimento Especial:' : ''} {notif.titulo}
                      </h5>
                      <span className="text-slate-500 text-[10px] font-mono">📅 {notif.fecha}</span>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                             <button
                        type="button"
                        onClick={() => toggleNotificationReadStatus(notif.id)}
                        className={`text-[9.5px] font-bold px-2 py-1 rounded-md uppercase font-mono border flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                          notif.leida
                            ? 'bg-violet-50 text-violet-600 border-violet-200'
                            : 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm'
                        }`}
                        title={notif.leida ? "Marcar como NO leída" : "Marcar como leída"}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${notif.leida ? 'bg-violet-500' : 'bg-rose-500 animate-pulse'}`} />
                        <span>{notif.leida ? 'Leída' : 'Pendiente'}</span>
                      </button>

                      <span className={`text-[8.5px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        isRequest ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        isAdminAlerta ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                        isPersonalAlerta ? 'bg-violet-50 text-violet-700 border-violet-200' : 
                        'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {notif.tipo === 'request' ? 'solicitud' : notif.tipo}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-700 leading-relaxed text-[11.5px] font-sans bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">{notif.mensaje}</p>

                  {/* Destinatario section footer if exists */}
                  {notif.destinatario_telefono && (
                    <div className="flex justify-between items-center text-[10.5px] font-mono text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 mt-1">
                      <span className="font-semibold">{isRequest ? 'Contacto del Cliente:' : 'Destinatario Telf:'}</span>
                      <div className="flex gap-2 items-center">
                        <strong className="text-violet-600 font-bold">{notif.destinatario_telefono}</strong>
                        {isRequest && (
                           <>
                             <a 
                               href={`https://wa.me/${notif.destinatario_telefono.replace(/[^0-9]/g, '')}`} 
                               target="_blank" 
                               className="text-white bg-green-500 hover:bg-green-600 px-2 py-0.5 rounded text-[9px] font-sans font-bold"
                             >
                               WhatsApp
                             </a>
                             <button
                               onClick={() => {
                                 const mensaje = prompt(`Responder a ${notif.destinatario_telefono}:`, '');
                                 if (mensaje && mensaje.trim()) {
                                   addNotification(
                                     'Mensaje de Soporte',
                                     mensaje.trim(),
                                     'personal',
                                     notif.destinatario_telefono
                                   );
                                   alert('Respuesta enviada al cliente.');
                                 }
                               }}
                               className="text-white bg-violet-650 hover:bg-violet-750 px-2 py-0.5 rounded text-[9px] font-sans font-bold cursor-pointer transition-colors"
                             >
                               Responder In-App
                             </button>
                           </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
                          const titulo = prompt(`Título del mensaje para ${user.nombre || 'cliente'}:`, 'Aviso de Su Pedido');
                          if (!titulo) return;
                          const mensaje = prompt(`Cuerpo del mensaje:`, '');
                          if (titulo && mensaje) {
                            addNotification(titulo, mensaje, 'personal', user.telefono);
                            alert('Mensaje enviado exitously.');
                          }
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

      {/* ----------------- SUBSECTION 5: SITE SYSTEM CONFIGS ----------------- */}
      {adminSection === 'settings' && (
        <div className="flex flex-col gap-6 animate-fade-in">
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
              alert('¡Ajustes de sucursal física de Marketo guardados!');
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
              <span>Telefono Atencion Pedidos (WhatsApp)::</span>
              <input
                type="text"
                value={config.telefono_soporte}
                onChange={(e) => updateConfig({ telefono_soporte: e.target.value })}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500"
              />
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

            <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-100 pt-3">
              <div className="flex flex-col gap-1">
                <span>Logo de la Tienda (PNG/JPEG):</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        updateConfig({ logo_url: reader.result as string });
                      };
                      reader.readAsDataURL(file);
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
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        updateConfig({ favicon_url: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500"
                />
                {config.favicon_url && (
                   <img src={config.favicon_url} alt="Favicon preview" className="mt-2 h-8 w-8 object-contain bg-slate-100 rounded border border-slate-200" />
                )}
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <span>Color Primario (Hexadecimal, ej: #7c3aed):</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.theme_color || '#7c3aed'}
                    onChange={(e) => updateConfig({ theme_color: e.target.value })}
                    className="w-10 h-10 p-0 border-0 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.theme_color || ''}
                    onChange={(e) => updateConfig({ theme_color: e.target.value })}
                    placeholder="Ej. #7c3aed"
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
                <input
                  type="text"
                  value={newAdminPass}
                  onChange={(e) => setNewAdminPass(e.target.value)}
                  placeholder="Contraseña"
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500"
                />
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
                detalle_adicional: updatedPart.detalle_adicional
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
            <div className="absolute -bottom-14 left-0 right-0 z-40 flex justify-center">
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
    </div>
  );
};
