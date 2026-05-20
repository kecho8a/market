import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, ShoppingCart, Check, Camera } from 'lucide-react';
import { AutoPart } from '../types/store';
import { useApp } from '../store/AppContext';

interface ProductCardProps {
  part: AutoPart;
  config: any;
  onViewProductDetails: (part: AutoPart) => void;
  addToCart: (part: AutoPart, quantity: number) => void;
  isOffer?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ part, config, onViewProductDetails, addToCart, isOffer = false }) => {
  const [added, setAdded] = useState(false);
  const { displayCurrency } = useApp();
  const priceInBs = part.precio_usd * config.tasa_cambio;

  const handleAddToCart = () => {
    addToCart(part, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // Calculate a mock discount or original price if it is a promo to show the Woolworths-style Specials detail
  const originalPriceUsd = part.es_promo ? part.precio_usd * 1.25 : null;
  const originalPriceBs = originalPriceUsd ? originalPriceUsd * config.tasa_cambio : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`snap-start shrink-0 w-[240px] sm:w-[260px] md:w-[230px] lg:w-[230px] rounded-xl flex flex-col justify-between overflow-hidden relative group transition-all duration-300 bg-white border border-zinc-200/80 hover:border-zinc-300 hover:shadow-lg`}
    >
      {/* Promotional Floating Badges (Woolworths HSL Green/Orange) */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm select-none ${
          part.condicion === 'Nuevo' 
            ? 'bg-violet-600 text-white' 
            : 'bg-zinc-800 text-white'
        }`}>
          {part.condicion === 'Nuevo' ? 'Fresco' : 'Vívere'}
        </span>
        
        {part.es_promo && (
          <span className="text-[9px] font-extrabold bg-amber-500 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm select-none animate-pulse">
            Especial
          </span>
        )}
      </div>

      {/* Gallery indicator */}
      {part.imagen_urls && part.imagen_urls.length > 1 && (
        <div className="absolute top-2.5 right-2.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md z-10 flex items-center gap-1 backdrop-blur-xs select-none">
          <Camera size={9} /> <span>{part.imagen_urls.length}</span>
        </div>
      )}

      {/* Product Image Frame */}
      <div className="relative aspect-[4/3] w-full bg-zinc-50/50 overflow-hidden border-b border-zinc-100 flex items-center justify-center p-2">
        <img 
          src={part.imagen_urls[0]} 
          alt={part.nombre} 
          className="max-h-full max-w-full object-contain group-hover:scale-103 transition-transform duration-300"
          referrerPolicy="no-referrer"
        />
        
        {/* Action trigger overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-zinc-900/10 backdrop-blur-[1px]">
          <button
            type="button"
            onClick={() => onViewProductDetails(part)}
            className="p-2.5 rounded-full bg-white hover:bg-zinc-50 text-zinc-900 transition-all shadow-md cursor-pointer border border-zinc-200 hover:scale-105 active:scale-95"
            title="Ver detalle"
          >
            <Eye size={15} />
          </button>
        </div>
      </div>

      {/* Details Wrapper */}
      <div className="p-3.5 flex flex-col justify-between flex-1 text-zinc-900 bg-white">
        <div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider truncate">
              {part.marca_repuesto}
            </span>
            <span className="text-[9px] text-zinc-400 font-mono shrink-0">
              SKU: {part.codigo.split('-')[0]}
            </span>
          </div>
          
          <h4 
            className="text-[13px] font-semibold text-zinc-800 line-clamp-2 mt-1 leading-snug h-[36px] cursor-pointer hover:text-violet-650 transition-colors"
            onClick={() => onViewProductDetails(part)}
          >
            {part.nombre}
          </h4>
          
          <div className="flex items-center gap-1.5 mt-2.5 overflow-hidden">
            <span className="bg-zinc-100 px-2 py-0.5 rounded text-[9px] font-bold text-zinc-650 shrink-0">
              {part.marca_carro}
            </span>
            <span className="text-[9px] text-zinc-400 font-medium truncate">
              {part.modelo_carro}
            </span>
          </div>
        </div>

        {/* Pricing & Add to Cart Action */}
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-zinc-100">
          <div className="flex flex-col">
            {displayCurrency === 'USD' ? (
              <div className="flex flex-col">
                {originalPriceUsd && (
                  <span className="text-[10px] text-zinc-400 font-mono line-through leading-none mb-1">
                    ${originalPriceUsd.toFixed(2)}
                  </span>
                )}
                <span className={`text-[15px] font-black font-mono leading-none ${part.es_promo ? 'text-amber-600' : 'text-zinc-900'}`}>
                  ${part.precio_usd.toFixed(2)}
                </span>
                <span className="text-[9px] text-zinc-400 font-mono mt-0.5">≈ {priceInBs.toFixed(2)} Bs</span>
              </div>
            ) : (
              <div className="flex flex-col">
                {originalPriceBs && (
                  <span className="text-[10px] text-zinc-400 font-mono line-through leading-none mb-1">
                    {originalPriceBs.toFixed(2)} Bs
                  </span>
                )}
                <span className={`text-[15px] font-black font-mono leading-none ${part.es_promo ? 'text-amber-600' : 'text-zinc-900'}`}>
                  {priceInBs.toFixed(2)} Bs
                </span>
                <span className="text-[9px] text-zinc-400 font-mono mt-0.5">≈ ${part.precio_usd.toFixed(2)}</span>
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={added}
            className={`flex items-center justify-center w-9 h-9 rounded-full transition-all shadow-sm active:scale-90 cursor-pointer border
              ${added 
                ? 'bg-zinc-50 border-zinc-200 text-violet-650 hover:bg-zinc-100' 
                : 'bg-white border-violet-650 hover:bg-violet-600 text-violet-750 hover:text-white hover:shadow-md'
              }
            `}
          >
            {added ? <Check size={16} strokeWidth={3} /> : <ShoppingCart size={16} strokeWidth={2.5} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
