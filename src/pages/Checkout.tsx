import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { ListOrdered, Edit2, Trash2, MapPin, Phone, User, Landmark, Compass, Smartphone, CheckCircle, Info, X } from 'lucide-react';
import { LeafletMap } from '../components/LeafletMap';
import { SEOHead } from '../components/SEOHead';

interface CheckoutProps {
  setTab: (tab: 'home' | 'catalog' | 'cart' | 'admin') => void;
}

export const Checkout: React.FC<CheckoutProps> = ({ setTab }) => {
  const { cart, config, updateCartQuantity, removeFromCart, createOrder, users, currentUser, loginUser, registerUser } = useApp();
  
  // Wizard steps helper: 1: Cart, 2: Location, 3: Details & Pay
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showPopupHelp, setShowPopupHelp] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if any item in the cart has free delivery
  const hasFreeDeliveryItem = cart.some(item => item.item.delivery_gratis);

  // Form Fields
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<'Pago Móvil' | 'Zelle' | 'Efectivo' | 'Transferencia'>('Pago Móvil');
  const [validationError, setValidationError] = useState('');
  
  // Map metrics
  const [shippingLat, setShippingLat] = useState<number>(config.coordenadas_tienda.lat);
  const [shippingLng, setShippingLng] = useState<number>(config.coordenadas_tienda.lng);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [shippingDistance, setShippingDistance] = useState<number>(0);
  const [shippingZone, setShippingZone] = useState<string>('Retiro en Tienda');

  // Completed order log reference
  const [processedOrder, setProcessedOrder] = useState<any>(null);

  // Cart prices calculations
  const subtotalUsd = cart.reduce((acc, ci) => acc + (ci.item.precio_usd * ci.quantity), 0);
  const effectiveShippingCost = hasFreeDeliveryItem ? 0 : shippingCost;
  const totalUsd = subtotalUsd + (step > 1 ? effectiveShippingCost : 0);
  const totalBs = totalUsd * config.tasa_cambio;

  const isNameInvalid = !!(validationError && (validationError.toLowerCase().includes('nombre') || validationError.toLowerCase().includes('completo')));
  const isPhoneInvalid = !!(validationError && (validationError.toLowerCase().includes('teléfono') || validationError.toLowerCase().includes('número') || validationError.toLowerCase().includes('digitos')));

  const handleLocationPicked = (lat: number, lng: number, distance: number, cost: number, zoneName: string) => {
    setShippingLat(lat);
    setShippingLng(lng);
    setShippingDistance(distance);
    setShippingCost(cost);
    setShippingZone(zoneName);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── Validar nombre ──────────────────────────────────────────────────────────
    const cleanedName = clientName.trim();
    if (!cleanedName) {
      setValidationError('Por favor, ingrese su nombre completo.');
      return;
    }

    // ── Validar teléfono ────────────────────────────────────────────────────────
    const cleanedPhone = clientPhone.replace(/[\s\-()]/g, '');
    const phoneRegex = /^\+?[0-9]{7,15}$/;
    if (!cleanedPhone) {
      setValidationError('Por favor, ingrese su número de teléfono.');
      return;
    }
    if (!phoneRegex.test(cleanedPhone)) {
      setValidationError('El número de teléfono no es válido. Debe contener de 7 a 15 números (ej: +584124976451 o 04124976451).');
      return;
    }
    setValidationError('');
    setIsProcessing(true);

    // ── PASO 1: Generar ID del pedido de forma SINCRÓNICA ───────────────────────
    // Debe hacerse antes de cualquier 'await' para incluirlo en el mensaje de WhatsApp
    const preOrderId = `PED-${Math.floor(1000 + Math.random() * 9000)}-VAL-${new Date().getFullYear()}`;

    // ── PASO 2: Construir mensaje de WhatsApp de forma SINCRÓNICA ──
    // Se construye con los datos del carrito ANTES de cualquier operación async.
    // Esto garantiza que podemos abrir WhatsApp dentro del contexto de gesto del usuario.
    let productosDetailText = '';
    cart.forEach(ci => {
      productosDetailText += `- ${ci.quantity}x ${ci.item.nombre} (SKU: ${ci.item.codigo}) - $${(ci.item.precio_usd * ci.quantity).toFixed(2)}\n`;
    });

    const deliveryLabel = effectiveShippingCost === 0
      ? 'Retiro en Tienda'
      : `Delivery Express (${shippingDistance} KM)`;

    const finalTotalUsd = (subtotalUsd + effectiveShippingCost).toFixed(2);
    const finalTotalBs  = ((subtotalUsd + effectiveShippingCost) * config.tasa_cambio).toFixed(2);

    const whatsappMessage =
`*Nuevo Pedido en Marketo Supermercado*
----------------------------------
*Pedido ID:* ${preOrderId}
*Cliente:* ${cleanedName}
*Telefono:* ${clientPhone.trim()}
*Direccion de Entrega:* ${shippingZone}
*Ubicacion Mapa:* https://www.google.com/maps?q=${shippingLat},${shippingLng}
*Metodo Despacho:* ${deliveryLabel} - Costo: $${effectiveShippingCost.toFixed(2)}

*Detalle del Carrito:*
${productosDetailText}
*Total Neto a Pagar:* $${finalTotalUsd} / ${finalTotalBs} Bs.
*Metodo de Pago:* ${selectedPayment}
----------------------------------`;

    let cleanConfigPhone = (config.telefono_soporte || '584124976451').replace(/\D/g, '');
    if (cleanConfigPhone.startsWith('0')) {
      cleanConfigPhone = '58' + cleanConfigPhone.substring(1);
    }
    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/${cleanConfigPhone}?text=${encodedMessage}`;

    // ── PASO 4: Operaciones asíncronas (después de abrir WhatsApp) ──────────────
    // El registro/login y la creación del pedido ocurren en background.
    // En móvil el navegador ya inició la apertura de WhatsApp.
    let finalUserId: string | undefined = currentUser ? currentUser.id : undefined;
    if (!currentUser) {
      const existingUser = users.find(u => u.telefono.trim() === clientPhone.trim());
      if (existingUser) {
        const logged = await loginUser(existingUser.telefono, existingUser.contrasena);
        if (logged) finalUserId = logged.id;
      } else {
        const registered = await registerUser(cleanedName, clientPhone.trim(), '123456');
        if (registered) finalUserId = registered.id;
      }
    }

    // Crear pedido usando el ID pre-generado para que coincida con el mensaje de WhatsApp
    const created = await createOrder({
      cliente_nombre: cleanedName,
      cliente_telefono: clientPhone.trim(),
      usuario_id: finalUserId,
      costo_envio_usd: effectiveShippingCost,
      metodo_pago: selectedPayment,
      lat: shippingLat,
      lng: shippingLng,
      direccion_envio: shippingZone,
      distancia_km: shippingDistance
    }, preOrderId);

    if (created) {
      setProcessedOrder(created);
      // Activa modal de timeline (cliente/admin) para la orden recién creada
      localStorage.setItem('trv_active_order_id', created.id);
      
      // Intentar abrir WhatsApp automáticamente ahora que el pedido es real en DB
      // Nota: Puede ser bloqueado por ser post-await, pero tenemos el botón de respaldo
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    } else {
      setValidationError('Error crítico: No se pudo registrar el pedido en el servidor. Verifique su conexión e intente de nuevo.');
    }
    
    setIsProcessing(false);
  };

  // If order was processed successfully
  if (processedOrder) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center py-16 gap-4 text-zinc-900 bg-white rounded-lg border border-zinc-200 shadow-sm">
        <SEOHead title="Pedido Confirmado" />
        <div className="w-16 h-16 rounded-full bg-violet-50 border border-violet-400 font-bold text-violet-600 flex items-center justify-center text-3xl animate-bounce shadow-sm">
          <CheckCircle size={32} />
        </div>

        <h3 className="text-[21px] font-bold font-display text-zinc-900">¡Su Compra ha sido Procesada!</h3>
        <p className="text-[13px] text-zinc-600 max-w-sm leading-relaxed">
          Hemos recibido su pedido de supermercado con el ID <strong>{processedOrder.id}</strong>. 
          Para agilizar el despacho y coordinar el pago, por favor envíe su factura por WhatsApp.
        </p>

        <div className="w-full max-w-sm bg-zinc-50 border border-zinc-200 p-4 rounded-lg text-left text-xs text-zinc-700 flex flex-col gap-2 font-mono mt-2">
          <span className="text-violet-600 font-bold font-display text-[15px] tracking-tight border-b border-zinc-200 pb-1 block">Recibo de Compra Marketo</span>
          <div>ID: <span className="text-zinc-900 font-bold">{processedOrder.id}</span></div>
          <div>Cliente: <span className="text-zinc-900">{processedOrder.cliente_nombre}</span></div>
          <div>Monto USD: <span className="text-violet-750 font-bold">${(processedOrder.total_usd || 0).toFixed(2)}</span></div>
          <div>Monto Bs: <span className="text-violet-600 font-bold">{(processedOrder.total_bs || 0).toFixed(2)} Bs</span></div>
          <div>Metodo: <span className="text-zinc-900 font-bold">{processedOrder.metodo_pago}</span></div>
        </div>

        <div className="flex flex-col gap-2 w-full max-w-xs mt-6">
          <button
            type="button"
            onClick={() => {
              // Re-construir mensaje si el popup fue bloqueado la primera vez
              let details = '';
              processedOrder.items.forEach((it: any) => {
                details += `- ${it.quantity || it.cantidad}x ${it.nombre} (SKU: ${it.codigo}) - $${(it.precio_usd * (it.quantity || it.cantidad)).toFixed(2)}\n`;
              });
              const msg = `*Nuevo Pedido en Marketo Supermercado*\n----------------------------------\n*Pedido ID:* ${processedOrder.id}\n*Cliente:* ${processedOrder.cliente_nombre}\n*Telefono:* ${processedOrder.cliente_telefono}\n*Direccion de Entrega:* ${processedOrder.direccion_envio}\n*Ubicacion Mapa:* https://www.google.com/maps?q=${processedOrder.lat},${processedOrder.lng}\n*Metodo Despacho:* Delivery Express - Costo: $${processedOrder.costo_envio_usd.toFixed(2)}\n\n*Productos:*\n${details}\n*Total Neto a Pagar:* $${processedOrder.total_usd.toFixed(2)} / ${processedOrder.total_bs.toFixed(2)} Bs.\n*Metodo de Pago:* ${processedOrder.metodo_pago}\n----------------------------------`;
              let cleanPhone = (config.telefono_soporte || '584124976451').replace(/\D/g, '');
              if (cleanPhone.startsWith('0')) cleanPhone = '58' + cleanPhone.substring(1);
              const retryUrlMobile = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
              // En desktop también usamos wa.me para evitar fallos/SDK manifest (api.whatsapp.com)
              const retryUrlWeb = retryUrlMobile;

              // Mismo patrón: móvil directo, desktop nueva pestaña con fallback
              const isMob = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
              if (isMob) {
                window.location.href = retryUrlMobile;
              } else {
                const tab = window.open(retryUrlWeb, '_blank', 'noopener,noreferrer');
                if (!tab) window.location.href = retryUrlMobile;
              }
            }}
            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 px-4 rounded-lg text-xs transition-transform tracking-wider flex items-center justify-center gap-1.5 uppercase font-display cursor-pointer shadow-md"
          >
            Enviar a WhatsApp 💬
          </button>
          
          {/* Pop‑up blocker guidance */}
          <div className="text-[10px] text-zinc-500 mb-2 flex items-start gap-2">
            <Info className="mt-0.5 flex-shrink-0 text-zinc-400" size={14} />
            <span>
              Si WhatsApp no se abrió automáticamente, habilite los pop‑ups en su navegador y presione este botón verde.
            </span>
            <button
              type="button"
              onClick={() => setShowPopupHelp(true)}
              className="ml-auto text-xs text-violet-600 underline"
            >
              ¿Cómo habilitar pop‑ups?
            </button>
          </div>

          {/* Modal for pop‑up instructions */}
          {showPopupHelp && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-zinc-800">Habilitar pop‑ups</h3>
                  <button onClick={() => setShowPopupHelp(false)} className="text-zinc-400 hover:text-zinc-600">
                    <X size={20} />
                  </button>
                </div>
                <ol className="list-decimal list-inside text-sm text-zinc-600 space-y-2">
                  <li>En Chrome, abre el menú (⋮) → Configuración → Privacidad y seguridad → Configuración de sitio → Pop‑ups y redirecciones → Permitir <code>wa.me</code>.</li>
                  <li>En Firefox, abre el menú (☰) → Opciones → Privacidad & Seguridad → Permisos → Pop‑ups → Excepciones → Añade <code>https://wa.me</code> y permite.</li>
                  <li>En Edge, ve a Configuración → Cookies y permisos del sitio → Pop‑ups y redirecciones → Añade <code>https://wa.me</code> y permite.</li>
                  <li>Después de habilitar, vuelve a presionar el botón “Enviar a WhatsApp”.</li>
                </ol>
                <button
                  onClick={() => setShowPopupHelp(false)}
                  className="mt-4 w-full bg-violet-600 hover:bg-violet-700 text-white py-2 rounded"
                >
                  Entendido
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => { setTab('profile'); }}
            className="w-full bg-violet-650 hover:bg-violet-750 text-white font-bold py-3 px-4 rounded-lg text-xs transition-all tracking-wider flex items-center justify-center gap-1.5 uppercase font-display cursor-pointer"
          >
            Ver Estatus de mi Pedido 🛵
          </button>

          <button
            type="button"
            onClick={() => { setTab('home'); }}
            className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 text-xs py-2 rounded-lg transition-all cursor-pointer font-medium"
          >
            Ir a la Tienda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-24 text-zinc-900">
      <SEOHead title="Checkout Rápido" />

      {/* Processing Overlay - Feedback Visual Global */}
      {isProcessing && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white/70 backdrop-blur-md">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-violet-100 rounded-full"></div>
            <div className="absolute w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="mt-6 flex flex-col items-center gap-1">
            <p className="text-sm font-black font-display text-zinc-900 uppercase tracking-tight">Procesando Pedido</p>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest animate-pulse">Sincronizando con Marketo Cloud...</p>
          </div>
        </div>
      )}

      {/* Heading */}
      <div>
        <span className="text-[11px] font-mono text-violet-600 font-bold uppercase tracking-wider">Compra Segura</span>
        <h2 className="text-[21px] font-bold font-display text-zinc-900">Carrito y Geolocalizacion Express</h2>
      </div>

      {/* 3-STEP FLOW INDICATOR */}
      <div className="grid grid-cols-3 gap-2 border-b border-zinc-200 pb-5">
        {[
          { label: 'Carrito', num: 1, active: step >= 1 },
          { label: 'Ubicacion', num: 2, active: step >= 2 },
          { label: 'Pago y Cierre', num: 3, active: step >= 3 }
        ].map(st => (
          <div key={st.num} className="flex flex-col gap-1.5 items-center">
            <span className={`text-[11px] uppercase font-mono tracking-wider font-bold transition-colors ${st.active ? 'text-zinc-950' : 'text-zinc-400'}`}>{st.label}</span>
            <div className={`h-[3px] w-full transition-all duration-300 ${st.num === step ? 'bg-zinc-950' : st.active ? 'bg-zinc-700' : 'bg-zinc-200'}`} />
          </div>
        ))}
      </div>

      {/* STEP 1: CART REVISION */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          {cart.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center justify-center p-6 bg-zinc-50/50 border border-zinc-200 rounded-lg">
              <ListOrdered size={36} className="text-zinc-400 mb-2" />
              <p className="text-xs font-bold font-display text-zinc-800">Tu carrito esta vacio</p>
              <p className="text-[11px] text-zinc-500 mt-1 max-w-xs leading-relaxed">Explora nuestros pasillos premium para agregar quesos, carnes, despensa y licores.</p>
              <button
                type="button"
                onClick={() => setTab('catalog')}
                className="mt-4 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer"
              >
                Explorar los Pasillos
              </button>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="flex flex-col gap-3">
                {cart.map(item => {
                  const subTotalItem = item.item.precio_usd * item.quantity;
                  return (
                    <div key={item.item.id} className="p-3 border border-zinc-200 rounded-lg bg-zinc-50/40 flex justify-between items-center gap-4 group hover:border-blue-500/20 transition-all text-zinc-900">
                      <div className="flex items-center gap-3">
                        {/* Image inside checklist */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
                          <img src={item.item.imagen_urls[0]} alt={item.item.nombre} className="w-full h-full object-cover" />
                        </div>
                        
                        <div>
                          <h4 className="text-xs font-bold text-zinc-800 line-clamp-1">{item.item.nombre}</h4>
                          <span className="text-[10px] text-zinc-500 font-mono">SKU: {item.item.codigo}</span>
                          <div className="text-[12px] font-mono text-violet-600 font-bold mt-0.5">${item.item.precio_usd.toFixed(2)} c/u</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Quantity Controller with stock restrictions */}
                        <div className="flex items-center border border-zinc-200 rounded-lg bg-white h-8.5">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.item.id, item.quantity - 1)}
                            className="w-7.5 h-full flex items-center justify-center text-zinc-500 hover:text-violet-600 text-xs transition-all active:scale-90 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-xs px-2.5 text-zinc-900 font-mono font-semibold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.item.id, item.quantity + 1)}
                            className="w-7.5 h-full flex items-center justify-center text-zinc-500 hover:text-violet-600 text-xs transition-all active:scale-90 cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        {/* Remove item button */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.item.id)}
                          className="text-zinc-400 hover:text-red-500 p-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Step 1 Recap totals */}
              <div className="p-4.5 border border-zinc-200 rounded-lg bg-zinc-50/50 flex flex-col gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Subtotal USD:</span>
                  <span className="font-mono text-zinc-800 font-bold text-sm">${subtotalUsd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-200 pt-2">
                  <span className="text-zinc-500">Subtotal Bs (al cambio):</span>
                  <span className="font-mono text-violet-600 font-bold text-sm">{(subtotalUsd * config.tasa_cambio).toFixed(2)} Bs</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="bg-violet-600 hover:bg-violet-700 text-white font-bold font-display text-[12px] py-3.5 rounded-lg tracking-wider transition-all uppercase cursor-pointer text-center"
              >
                Paso 2: Fijar Ubicacion delivery
              </button>
            </>
          )}
        </div>
      )}

      {/* STEP 2: LEAFLET OPENSTREETMAP COORDINATE PICKER */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
            <Compass size={16} className="text-zinc-800" />
            <h3 className="text-sm font-bold font-display text-zinc-900">Dirección y Cadena de Frío Express</h3>
          </div>

          {/* Leaflet Frame */}
          <LeafletMap 
            shopCoords={config.coordenadas_tienda} 
            onLocationSelected={handleLocationPicked} 
            config={config}
          />

          {/* Location Delivery summary check */}
          <div className="p-4 border border-zinc-200 rounded-lg bg-zinc-50/50 flex flex-col gap-2.5 text-xs text-zinc-800 leading-relaxed">
            <div className="flex justify-between items-baseline">
              <span className="text-zinc-500">Distancia de envio calculada:</span>
              <span className="font-mono text-zinc-900 font-extrabold">{shippingDistance} KM</span>
            </div>
            <div className="flex justify-between items-baseline pb-2 border-b border-zinc-200">
              <span className="text-zinc-500">Tarifa de envio:</span>
              <span className="font-mono text-violet-600 font-extrabold">
                {hasFreeDeliveryItem ? (
                  <span className="text-violet-600 animate-pulse">¡ENVIO GRATIS!</span>
                ) : (
                  shippingCost === 0 ? "Gratis / Retiro" : `$${shippingCost.toFixed(2)}`
                )}
              </span>
            </div>
            
            <div className="flex justify-between pt-1">
              <span className="text-violet-750 font-bold">Total Parcial Checkout:</span>
              <div className="text-right">
                <div className="font-mono text-zinc-900 font-bold text-[15px]">${totalUsd.toFixed(2)}</div>
                <div className="font-mono text-violet-600 font-bold text-xs">{(totalUsd * config.tasa_cambio).toFixed(2)} Bs</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 py-3.5 rounded-lg text-xs font-semibold font-display uppercase tracking-wider transition-colors cursor-pointer"
            >
              Revisar Carrito
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="bg-violet-600 hover:bg-violet-700 text-white py-3.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider transition-all cursor-pointer"
            >
              Paso 3: Contacto y Pago
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: CONTACT FORM AND PAYMENT METHOD SELECTION */}
      {step === 3 && (
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
            <Compass size={16} className="text-zinc-800" />
            <h3 className="text-sm font-bold font-display text-zinc-900">Datos de Contacto y Métodos de Pago</h3>
          </div>

          {/* Client fields */}
          <div className="flex flex-col gap-3 text-zinc-900">
            <div className="flex flex-col gap-1">
              <span className={`text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 transition-colors ${isNameInvalid ? 'text-red-650' : 'text-zinc-500'}`}>
                <User size={12} className={isNameInvalid ? 'text-red-650' : 'text-zinc-500'} /> Nombre Completo *
              </span>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => {
                  setClientName(e.target.value);
                  if (validationError && (e.target.value.trim() !== '')) {
                    setValidationError('');
                  }
                }}
                placeholder="Ej. Juan Pérez"
                className={`bg-zinc-50 px-3 py-2 border transition-all text-sm rounded-lg outline-none ${
                  isNameInvalid 
                    ? 'border-red-500 text-red-950 focus:border-red-600 bg-red-50/10 placeholder-red-400' 
                    : 'border-zinc-200 text-zinc-900 placeholder-zinc-450 focus:border-zinc-950'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className={`text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 transition-colors ${isPhoneInvalid ? 'text-red-650' : 'text-zinc-500'}`}>
                <Phone size={12} className={isPhoneInvalid ? 'text-red-650' : 'text-zinc-500'} /> Teléfono Móvil (WhatsApp) *
              </span>
              <input
                type="tel"
                required
                value={clientPhone}
                onChange={(e) => {
                  setClientPhone(e.target.value);
                  if (validationError) {
                    setValidationError('');
                  }
                }}
                placeholder="Ej. +584124976451 o 04124976451"
                className={`bg-zinc-50 px-3 py-2 border transition-all text-sm rounded-lg outline-none ${
                  isPhoneInvalid 
                    ? 'border-red-500 text-red-950 focus:border-red-600 bg-red-50/10 placeholder-red-400' 
                    : 'border-zinc-200 text-zinc-900 placeholder-zinc-450 focus:border-zinc-950'
                }`}
              />
            </div>
          </div>

          {/* PAYMENT METHODS SELECTOR WITH DESIGN SPEC */}
          <div className="flex flex-col gap-2 mt-1">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Acreditar Pago</span>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { key: 'Pago Movil', label: 'Pago Movil Bs', icon: 'Bs', enabled: config.pagomovil_enabled },
                { key: 'Zelle', label: 'Zelle USD', icon: 'USD', enabled: config.zelle_enabled },
                { key: 'Efectivo', label: 'Efectivo / Cash', icon: 'Cash', enabled: config.efectivo_enabled },
                { key: 'Transferencia', label: 'Transferencia', icon: 'Bco', enabled: config.transferencia_enabled }
              ].filter(pm => pm.enabled).map(pm => (
                <button
                  type="button"
                  key={pm.key}
                  onClick={() => setSelectedPayment(pm.key as any)}
                  className={`border p-3.5 rounded-lg text-left flex items-center gap-2.5 transition-all outline-none cursor-pointer ${selectedPayment === pm.key ? 'bg-zinc-950 text-white border-zinc-950 font-bold' : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'}`}
                >
                  <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-800 shrink-0">{pm.icon}</span>
                  <span className="font-semibold text-[13px]">{pm.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Static details instructions block for payment */}
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg text-[12px] text-zinc-750 leading-relaxed font-mono flex flex-col gap-1.5 shadow-sm">
            <span className="text-zinc-900 font-bold font-display text-sm mb-1">Instrucciones de Pago:</span>
            {selectedPayment === 'Pago Movil' && (
              <>
                <div>Banco: <strong className="text-zinc-900">Banesco (0134)</strong></div>
                <div>Cedula / RIF: <strong className="text-zinc-900">J-50123456-7</strong></div>
                <div>Telefono: <strong className="text-zinc-900">0412-4976451</strong></div>
                <div className="text-violet-750 font-black pt-1 bg-violet-50/50 px-2 py-1 rounded inline-block mt-1">Calcular al cambio: {totalBs.toFixed(2)} Bs.</div>
              </>
            )}
            {selectedPayment === 'Zelle' && (
              <>
                <div>Correo: <strong className="text-zinc-900">pagos@marketo.com.ve</strong></div>
                <div>Titular: <strong className="text-zinc-900">Marketo C.A.</strong></div>
                <div className="text-violet-750 font-black pt-1 bg-violet-50/50 px-2 py-1 rounded inline-block mt-1">Monto exacto: ${totalUsd.toFixed(2)} USD.</div>
              </>
            )}
            {selectedPayment === 'Efectivo' && (
              <div className="text-zinc-700">Paga en efectivo al motorizado al momento del delivery en Valencia, o en taquilla fisica de retiro en Sector Las Acacias.</div>
            )}
            {selectedPayment === 'Transferencia' && (
              <>
                <div>Banesco Cuenta Corriente:</div>
                <div className="text-zinc-900 font-bold">0134-1122-33-4455667788</div>
                <div>RIF: <strong className="text-zinc-900">J-50123456-7 (Marketo C.A.)</strong></div>
              </>
            )}
          </div>

          {/* Complete Summary invoice totals - Samsung Premium High-Contrast Layout */}
          <div className="p-5 border border-zinc-900 bg-zinc-950 text-white rounded-xl flex flex-col gap-3 text-xs shadow-md">
            <div className="flex justify-between text-zinc-400">
              <span className="font-medium text-[13px]">Total Productos:</span>
              <span className="font-mono font-bold text-white text-[13px]">${subtotalUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span className="font-medium text-[13px]">Envio / Delivery:</span>
              <span className="font-mono text-violet-300 font-semibold text-[13px]">
                {hasFreeDeliveryItem ? (
                  <span className="text-violet-300 animate-pulse uppercase">Gratis</span>
                ) : (
                  shippingCost === 0 ? "Cobro a destino / Zoom" : `$${shippingCost.toFixed(2)}`
                )}
              </span>
            </div>
            <div className="border-t border-zinc-800 pt-3 flex justify-between items-center">
              <span className="font-bold text-xs uppercase tracking-wider text-zinc-200">Total Neto a Pagar:</span>
              <div className="text-right">
                <p className="font-mono text-xl font-black text-white leading-none">${totalUsd.toFixed(2)}</p>
                <p className="font-mono text-xs text-violet-300 font-bold mt-1.5">{totalBs.toFixed(2)} Bs.</p>
              </div>
            </div>
          </div>

          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-600 text-center animate-pulse">
              {validationError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 py-3.5 rounded-lg text-xs font-semibold font-display uppercase tracking-wider transition-colors cursor-pointer"
            >
              Revisar Ubicacion
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className={`${isProcessing ? 'bg-zinc-400' : 'bg-[#25D366] hover:bg-[#128C7E]'} text-white font-bold font-display py-3.5 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer`}
            >
              {isProcessing ? 'Procesando...' : 'Procesar & WhatsApp'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
