import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Info, ArrowRight, X, Check, Navigation } from 'lucide-react';
import { DeliveryZone } from '../types/store';

interface LeafletMapProps {
  onLocationSelected: (lat: number, lng: number, distance: number, cost: number, zoneName: string) => void;
  shopCoords: { lat: number; lng: number };
  config?: { delivery_gratis?: boolean; costo_delivery_km?: number; envio_nacional?: boolean; costo_envio_nacional?: number; site_nombre?: string; delivery_zonas?: DeliveryZone[] };
  isFullscreen?: boolean;
  onClose?: () => void;
  onConfirm?: (lat: number, lng: number, distance: number, cost: number, zoneName: string) => void;
  initialPosition?: { lat: number; lng: number };
}

const VALENCIA_ZONES = [
  { name: 'Cercano (Trigaleña, Guaparo, Las Chimeneas, El Viñedo)', minKm: 0, maxKm: 3, cost: 2.00 },
  { name: 'Medio (Prebo, Mañongo, Prebo II, San Diego)', minKm: 3, maxKm: 8, cost: 4.50 },
  { name: 'Lejano (Guacara, Los Guayos, Tocuyito, Flor Amarillo)', minKm: 8, maxKm: 18, cost: 7.00 },
  { name: 'Fuera de Valencia (Envíos por encomienda Zoom/Tealka)', minKm: 18, maxKm: 100, cost: 0.00 }
];

export const getHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
};

export const calculateShippingCostSymbolic = (distanceKm: number, config?: LeafletMapProps['config']): { cost: number; zone: string } => {
  if (config?.delivery_gratis) {
    return { cost: 0, zone: 'Zona Exclusiva - Delivery Gratis' };
  }

  const zones = (config?.delivery_zonas && config.delivery_zonas.length > 0)
    ? config.delivery_zonas
    : VALENCIA_ZONES;

  const matchedZone = zones.find(z => distanceKm >= z.minKm && distanceKm <= z.maxKm);
  if (matchedZone) {
    return { cost: matchedZone.cost, zone: matchedZone.name };
  }

  if (distanceKm > 18) {
    if (config?.envio_nacional) {
      return { cost: config.costo_envio_nacional || 0, zone: 'Envío Nacional Estándar' };
    }
    return { cost: 0, zone: 'Fuera de Valencia (Cobro a Destino)' };
  }

  const ratePerKm = config?.costo_delivery_km ?? 0.45;
  const cost = parseFloat(Math.max(1.5, 1.5 + (distanceKm * ratePerKm)).toFixed(2));

  return { cost, zone: 'Zona General Valencia' };
};

export const LeafletMap: React.FC<LeafletMapProps> = ({
  onLocationSelected, shopCoords, config,
  isFullscreen = false, onClose, onConfirm, initialPosition
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  const defaultPos = initialPosition || { lat: shopCoords.lat + 0.015, lng: shopCoords.lng + 0.015 };
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(defaultPos);
  const [distance, setDistance] = useState<number>(0);
  const [shipCost, setShipCost] = useState<number>(0);
  const [zone, setZone] = useState<string>('');
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  useEffect(() => {
    const verifyLeaflet = () => {
      if ((window as any).L) {
        setMapLoaded(true);
        return true;
      }
      return false;
    };
    if (verifyLeaflet()) return;
    const interval = setInterval(() => {
      if (verifyLeaflet()) clearInterval(interval);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (mapInstanceRef.current) {
      try { mapInstanceRef.current.remove(); } catch (e) {}
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [defaultPos.lat, defaultPos.lng],
      zoom: isFullscreen ? 15 : 13,
      zoomControl: true,
      scrollWheelZoom: true,
      touchZoom: true,
      tap: true
    });

    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const shopIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute inline-flex h-8 w-8 rounded-full bg-emerald-600 opacity-25 animate-ping"></span>
          <div class="relative bg-zinc-950 border border-emerald-500 text-emerald-500 p-2 rounded-full flex items-center justify-center shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 22H2"/><path d="M10 22v-5a2 2 0 0 1 4 0v5"/><path d="M21 11v11"/><path d="M3 11v11"/><path d="M12 2 2 11h20L12 2Z"/></svg>
          </div>
        </div>
      `,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const userIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute inline-flex h-10 w-10 rounded-full bg-emerald-500 opacity-20 animate-pulse"></span>
          <div class="relative bg-[#10b981] border-2 border-white text-white p-2.5 rounded-full flex items-center justify-center shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        </div>
      `,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    L.marker([shopCoords.lat, shopCoords.lng], { icon: shopIcon })
      .addTo(map)
      .bindPopup(`
        <div class="text-xs p-1 font-sans text-zinc-900">
          <h4 class="font-bold text-emerald-600 mb-0.5">Sede Central ${config?.site_nombre || 'de la tienda'}</h4>
          <p class="text-zinc-650">¡Retiro en tienda gratuito aquí!</p>
        </div>
      `);

    const userMarker = L.marker([defaultPos.lat, defaultPos.lng], {
      icon: userIcon,
      draggable: true
    }).addTo(map);

    userMarkerRef.current = userMarker;

    const polyline = L.polyline([
      [shopCoords.lat, shopCoords.lng],
      [defaultPos.lat, defaultPos.lng]
    ], {
      color: '#10b981',
      weight: 2,
      dashArray: '6, 8',
      opacity: 0.8
    }).addTo(map);

    polylineRef.current = polyline;

    const updateLocation = (lat: number, lng: number) => {
      const dist = getHaversineDistance(shopCoords.lat, shopCoords.lng, lat, lng);
      const { cost, zone: selectedZone } = calculateShippingCostSymbolic(dist, config);

      setCoords({ lat, lng });
      setDistance(dist);
      setShipCost(cost);
      setZone(selectedZone);

      polyline.setLatLngs([
        [shopCoords.lat, shopCoords.lng],
        [lat, lng]
      ]);

      onLocationSelected(lat, lng, dist, cost, selectedZone);
    };

    updateLocation(defaultPos.lat, defaultPos.lng);

    userMarker.on('drag', (e: any) => {
      const position = e.target.getLatLng();
      updateLocation(position.lat, position.lng);
    });

    map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      userMarker.setLatLng([lat, lng]);
      updateLocation(lat, lng);
    });

    const resizeTimeout = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 300);

    return () => {
      clearTimeout(resizeTimeout);
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove(); } catch (e) {}
        mapInstanceRef.current = null;
      }
    };
  }, [mapLoaded, shopCoords, config, isFullscreen, defaultPos.lat, defaultPos.lng]);

  const handleConfirm = useCallback(() => {
    if (onConfirm) {
      onConfirm(coords.lat, coords.lng, distance, shipCost, zone);
    }
  }, [onConfirm, coords, distance, shipCost, zone]);

  const handleRecenter = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([coords.lat, coords.lng], 16);
    }
  }, [coords]);

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-950 text-white shrink-0 shadow-lg">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider">Elige tu ubicación</span>
            <span className="text-[10px] text-zinc-400">Arrastra el marcador o toca el mapa</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900 text-white text-[11px] shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            <MapPin size={12} className="text-emerald-400" />
            <span className="font-mono">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span>
          </div>
          <span className="text-zinc-600">|</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <ArrowRight size={12} className="text-blue-400" />
            <span className="font-bold">{distance} KM</span>
          </div>
          <span className="text-zinc-600">|</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-emerald-400 font-bold">
              {shipCost === 0 ? 'Gratis' : `$${shipCost.toFixed(2)}`}
            </span>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          {!mapLoaded && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-900 border-t-transparent"></div>
              <p className="text-xs text-zinc-600 mt-2 font-display">Cargando mapa...</p>
            </div>
          )}
          <div ref={mapContainerRef} id="leaflet-map-fullscreen" className="w-full h-full z-10" />

          {/* Recenter button */}
          <button
            onClick={handleRecenter}
            className="absolute top-3 right-3 z-50 p-2.5 bg-white rounded-full shadow-lg border border-zinc-200 hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            <Navigation size={16} className="text-zinc-700" />
          </button>

          {/* Zone indicator */}
          {zone && (
            <div className="absolute top-3 left-3 z-50 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-zinc-200 text-[10px] font-bold text-emerald-700 max-w-[60%] truncate">
              {zone}
            </div>
          )}
        </div>

        {/* Bottom confirm bar */}
        <div className="shrink-0 bg-white border-t border-zinc-200 p-4 safe-area-bottom">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-zinc-500 uppercase font-bold">Costo de envío:</span>
            <span className="text-sm font-black text-zinc-900">
              {shipCost === 0 ? 'Gratis / Encomienda' : `$${shipCost.toFixed(2)}`}
            </span>
          </div>
          <button
            onClick={handleConfirm}
            className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Check size={16} />
            Confirmar esta ubicación
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 font-sans text-zinc-900">
      <div id="distance-viewer" className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-zinc-200 bg-white shadow-sm flex flex-col justify-between">
          <span className="text-[10px] uppercase font-mono font-bold text-zinc-400 flex items-center gap-1.5">
            <MapPin size={11} className="text-zinc-500" /> Coordenadas Destino
          </span>
          <p className="text-[13px] font-mono text-zinc-900 mt-1 font-bold">
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-zinc-200 bg-white shadow-sm flex flex-col justify-between">
          <span className="text-[10px] uppercase font-mono font-bold text-zinc-400 flex items-center gap-1.5">
            <ArrowRight size={11} className="text-zinc-500" /> Distancia de Envío
          </span>
          <p className="text-[13px] text-zinc-650 mt-1 font-sans">
            <span className="text-lg font-bold text-zinc-950 font-display">{distance}</span> KM desde Sede
          </p>
        </div>

        <div className="p-3.5 rounded-xl border-2 border-zinc-900 bg-zinc-950 text-white shadow-sm flex flex-col justify-between">
          <span className="text-[10px] uppercase font-mono font-bold text-zinc-400 flex items-center gap-1">
            ✨ Costo de Delivery
          </span>
          <p className="text-[14px] mt-1 font-display font-bold">
            <span className="text-lg font-bold text-white">
              {shipCost === 0 ? 'Gratis / Encomienda' : `$${shipCost.toFixed(2)}`}
            </span>
          </p>
        </div>
      </div>

      <div className="relative rounded-xl border border-zinc-200 overflow-hidden shadow-sm bg-zinc-50">
        {!mapLoaded && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-900 border-t-transparent"></div>
            <p className="text-xs text-zinc-600 mt-2 font-display">Estableciendo señal de mapas...</p>
          </div>
        )}
        <div ref={mapContainerRef} id="leaflet-map" className="w-full h-[280px] z-10" />
      </div>

      <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/55 flex gap-2.5 items-start text-xs text-zinc-600 leading-relaxed shadow-sm">
        <Info size={14} className="mt-0.5 shrink-0 text-zinc-800" />
        <p>
          <strong>Instrucciones:</strong> Arrastra el marcador azul de entrega o haz clic directamente sobre tu calle/taller en Valencia para fijar tu ubicación. Calcularemos el costo estimado según la distancia.
        </p>
      </div>

      <div className="flex items-center justify-between py-2.5 px-3.5 border border-zinc-200 rounded-lg bg-zinc-50 text-xs text-zinc-850 font-mono shadow-sm">
        <span className="font-semibold text-zinc-500">Zona Identificada:</span>
        <span className="text-emerald-700 font-extrabold uppercase tracking-wide">{zone || "Estableciendo dirección..."}</span>
      </div>
    </div>
  );
};
