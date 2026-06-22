import React from 'react';
import { Producto, StoreConfig } from '../types/store';
import { ShoppingCart, Eye } from 'lucide-react';

interface ProductCardProps {
  part: Producto;
  config: StoreConfig;
  onViewProductDetails: (part: Producto) => void;
  addToCart: (part: Producto) => void;
  isOffer?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  part, 
  config, 
  onViewProductDetails, 
  addToCart,
  isOffer 
}) => {
  // Extraemos la disponibilidad (con fallback a Disponible)
  const disponibilidad = (part as any).disponibilidad || 'Disponible';
  const isAgotado = disponibilidad === 'Agotado';
  const isEnReposicion = disponibilidad === 'En Reposición';
  const isDisponible = disponibilidad === 'Disponible';

  return (
    <div className="shrink-0 snap-start w-[165px] sm:w-[210px] flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group relative">
      {/* Etiqueta Flotante de Disponibilidad */}
      {!isDisponible && (
        <div className={`absolute top-2 left-2 z-10 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter shadow-sm border animate-in fade-in zoom-in duration-300 ${
          isAgotado ? 'bg-rose-600 text-white border-rose-500' : 'bg-amber-500 text-white border-amber-400'
        }`}>
          {disponibilidad}
        </div>
      )}

      {/* Contenedor de Imagen */}
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        <img 
          src={part.imagen_urls[0]} 
          alt={part.nombre} 
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${isAgotado ? 'grayscale opacity-60' : ''}`}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button 
            onClick={() => onViewProductDetails(part)}
            className="p-2 bg-white rounded-full text-slate-900 shadow-lg hover:scale-110 transition-transform cursor-pointer"
          >
            <Eye size={18} />
          </button>
        </div>
      </div>

      {/* Información del Producto */}
      <div className="p-3.5 flex flex-col gap-1.5 flex-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{part.marca}</span>
          <h4 className="text-[13px] font-bold text-slate-900 line-clamp-2 leading-tight h-8">{part.nombre}</h4>
        </div>

        <div className="mt-auto flex flex-col gap-3">
          <div className="flex flex-col">
            <span className="text-sm font-black" style={{ color: config.theme_color || '#0f5d34' }}>${part.precio_usd.toFixed(2)}</span>
            <span className="text-[10px] text-slate-400 font-mono">{(part.precio_usd * config.tasa_cambio).toFixed(2)} Bs.</span>
          </div>
          
          <button
            onClick={() => !isAgotado && addToCart(part)}
            disabled={isAgotado}
            style={!isAgotado ? { backgroundColor: config.theme_color || '#0f5d34' } : undefined}
            className={`w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${
              isAgotado 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                : 'text-white shadow-md active:scale-95 cursor-pointer hover:opacity-90'
            }`}
          >
            <ShoppingCart size={14} />
            {isAgotado ? 'Sin Stock' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
};