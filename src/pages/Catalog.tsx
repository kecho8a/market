import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { Producto } from '../types/store';
import { Search, SlidersHorizontal, RefreshCcw, Camera, FilterX, Carrot } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { ProductCard } from '../components/ProductCard';

const SkeletonCard: React.FC = () => (
  <div className="border border-zinc-200/80 rounded-xl bg-white p-3.5 flex flex-col justify-between h-[340px] animate-pulse">
    <div className="flex flex-col gap-2">
      {/* Shimmer Image */}
      <div className="w-full aspect-[4/3] bg-zinc-100 rounded-lg"></div>
      
      {/* Brand & SKU bar */}
      <div className="flex justify-between items-center mt-2">
        <div className="w-16 h-3 bg-zinc-100 rounded"></div>
        <div className="w-12 h-3 bg-zinc-50 rounded"></div>
      </div>
      
      {/* Title block */}
      <div className="w-full h-3.5 bg-zinc-100 rounded mt-2"></div>
      <div className="w-4/5 h-3.5 bg-zinc-100 rounded mt-1"></div>
      
      {/* Department/Pasillo tag */}
      <div className="w-20 h-4 bg-zinc-50 rounded mt-2.5"></div>
    </div>
    
    {/* Bottom block */}
    <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <div className="w-16 h-4 bg-zinc-100 rounded"></div>
      </div>
      <div className="w-9 h-9 bg-zinc-100 rounded-full shrink-0"></div>
    </div>
  </div>
);

interface CatalogProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedEngine: string;
  setSelectedEngine: (engine: string) => void;
  onViewProductDetails: (part: Producto) => void;
  onOpenScanner: () => void;
  passedSearchCode?: string;
  clearPassedSearchCode?: () => void;
  passedSearchTerm?: string;
  clearPassedSearchTerm?: () => void;
  resetGlobalFilters: () => void;
}

export const Catalog: React.FC<CatalogProps> = ({
  selectedCategory,
  setSelectedCategory,
  selectedBrand,
  setSelectedBrand,
  selectedModel,
  setSelectedModel,
  selectedYear,
  setSelectedYear,
  selectedEngine,
  setSelectedEngine,
  onViewProductDetails,
  onOpenScanner,
  passedSearchCode,
  clearPassedSearchCode,
  passedSearchTerm,
  clearPassedSearchTerm,
  resetGlobalFilters
}) => {
  const { parts, config, addToCart, searchPartsSemantically, displayCurrency } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const PAGE_SIZE = 16;

  // Shimmer skeleton reactiveness
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedBrand, selectedModel, selectedYear, selectedEngine, currentPage]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    if (passedSearchCode) {
      setSearchQuery(passedSearchCode);
      if (clearPassedSearchCode) clearPassedSearchCode();
    }
  }, [passedSearchCode, clearPassedSearchCode]);

  useEffect(() => {
    if (passedSearchTerm) {
      setSearchQuery(passedSearchTerm);
      if (clearPassedSearchTerm) clearPassedSearchTerm();
    }
  }, [passedSearchTerm, clearPassedSearchTerm]);

  const activeParts = useMemo(() => parts.filter(p => p.activo !== false), [parts]);

  // Mapeo predefinido de categorías → pasillos → estantes
  const CATEGORY_AISLES: Record<string, Record<string, string[]>> = {
    'Lácteos y Quesos': {
      'Pasillo 1 - Lácteos': ['Leches', 'Cremas', 'Mantequillas', 'Yogures', 'Quesos Frescos', 'Quesos Madurados', 'Huevos'],
      'Pasillo 2 - Derivados': ['Helados', 'Postres Lácteos', 'Bebidas Lácteas']
    },
    'Carnes y Aves': {
      'Pasillo 3 - Carnes': ['Cortes Vacunos', 'Cortes Porcinos', 'Cordero', 'Embutidos Frescos'],
      'Pasillo 4 - Aves': ['Pollo Entero', 'Pollo por Partes', 'Pavo', 'Huevos de Codorniz']
    },
    'Charcutería': {
      'Pasillo 5 - Charcutería': ['Jamones', 'Salchichas', 'Mortadelas', 'Mojos', 'Salsas']
    },
    'Frutas y Verduras': {
      'Pasillo 6 - Frutas': ['Frutas Frescas', 'Frutas Tropicales', 'Frutas Congeladas'],
      'Pasillo 7 - Verduras': ['Verduras Frescas', 'Verduras Congeladas', 'Hierbas y Especias', 'Ensaladas']
    },
    'Víveres y Despensa': {
      'Pasillo 8 - Granos': ['Arroz', 'Legumbres', 'Pastas', 'Harinas'],
      'Pasillo 9 - Aceites': ['Aceites', 'Vinegas', 'Salsas', 'Condimentos'],
      'Pasillo 10 - Enlatados': ['Enlatados', 'Conservas', 'Sopas Instantáneas'],
      'Pasillo 11 - Café': ['Café', 'Té', 'Cereales', 'Azúcar', 'Sal']
    },
    'Panadería y Pastelería': {
      'Pasillo 12 - Panadería': ['Pan Blanco', 'Pan Integral', 'Arepa', 'Cachapas'],
      'Pasillo 13 - Pastelería': ['Tortas', 'Galletas', 'Bollería', 'Repostería']
    },
    'Bebidas y Jugos': {
      'Pasillo 14 - Aguas': ['Aguas', 'Agua Mineral', 'Agua Saborizada'],
      'Pasillo 15 - Jugos': ['Jugos Naturales', 'Jugos Envasados', 'Néctares'],
      'Pasillo 16 - Gaseosas': ['Gaseosas', 'Refrescos', 'Energizantes'],
      'Pasillo 17 - Cervezas': ['Cervezas', 'Vinos', 'Licores', 'Maltas']
    },
    'Snacks y Dulces': {
      'Pasillo 18 - Snacks': ['Papitas', 'Snacks Salados', 'Frutos Secos', 'Popotes'],
      'Pasillo 19 - Dulces': ['Chocolate', 'Caramelo', 'Gomitas', 'Golosinas'],
      'Pasillo 20 - Infantil': ['Snacks Infantiles', 'Bebidas Infantiles']
    }
  };

  const brands = useMemo(() => {
    if (selectedCategory && CATEGORY_AISLES[selectedCategory]) {
      return Object.keys(CATEGORY_AISLES[selectedCategory]);
    }
    const list = activeParts.filter(p => p.seccion).map(p => p.seccion);
    return Array.from(new Set(list));
  }, [activeParts, selectedCategory]);

  const models = useMemo(() => {
    if (selectedCategory && selectedBrand && CATEGORY_AISLES[selectedCategory]?.[selectedBrand]) {
      return CATEGORY_AISLES[selectedCategory][selectedBrand];
    }
    const list = activeParts
      .filter(p => (!selectedBrand || p.seccion === selectedBrand) && p.subseccion)
      .map(p => p.subseccion);
    return Array.from(new Set(list));
  }, [activeParts, selectedBrand, selectedCategory]);

  const yearsRange = useMemo(() => {
    const years: number[] = [];
    for (let yr = 1998; yr <= 2026; yr++) years.push(yr);
    return years.reverse();
  }, []);

  const engineVersions = useMemo(() => {
    const list = activeParts
      .filter(p => {
        if (selectedBrand && p.seccion !== selectedBrand) return false;
        if (selectedModel && p.subseccion !== selectedModel) return false;
        return p.marca;
      })
      .map(p => p.marca);
    return Array.from(new Set(list)).sort();
  }, [activeParts, selectedBrand, selectedModel]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedBrand, selectedModel, selectedYear, selectedEngine]);

  const filteredProducts = useMemo(() => {
    let list = searchPartsSemantically(searchQuery);

    if (selectedCategory) {
      list = list.filter(p => p.categoria.toLowerCase() === selectedCategory.toLowerCase());
    }
    if (selectedBrand) {
      list = list.filter(p => p.seccion.toLowerCase() === selectedBrand.toLowerCase());
    }
    if (selectedModel) {
      list = list.filter(p => p.subseccion.toLowerCase() === selectedModel.toLowerCase());
    }
    if (selectedEngine) {
      list = list.filter(p => p.marca?.toLowerCase() === selectedEngine.toLowerCase());
    }
    if (selectedYear) {
      list = list.filter(p => p.condicion === selectedYear);
    }

    return list;
  }, [parts, searchQuery, selectedCategory, selectedBrand, selectedModel, selectedYear, selectedEngine, searchPartsSemantically]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedEngine('');
    resetGlobalFilters();
  };

  return (
    <div className="flex flex-col gap-6 pb-24">
      <SEOHead 
        type="catalog" 
        filters={{
          category: selectedCategory,
          brand: selectedBrand,
          model: selectedModel,
          year: selectedYear,
          engine: selectedEngine
        }}
      />

      <div className="flex justify-between items-center text-zinc-900">
        <div>
          <span className="text-[11px] font-mono text-violet-600 font-bold uppercase tracking-wider">Supermercado Express Premium</span>
          <h2 className="text-[21px] font-bold font-display text-zinc-900">Buscador de Pasillos</h2>
        </div>
        <span className="text-xs text-zinc-500 font-mono bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-lg">
          {filteredProducts.length} articulos
        </span>
      </div>

      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-3 text-zinc-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Busca por viveres, SKU o ingredientes..."
            className="w-full bg-zinc-50 hover:bg-zinc-100 focus:bg-white border border-zinc-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-violet-500 transition-all shadow-sm"
          />
        </div>

        <button
          type="button"
          onClick={onOpenScanner}
          className="bg-zinc-50 border border-zinc-200 text-violet-600 hover:bg-violet-50 p-2.5 rounded-lg transition-all cursor-pointer"
          title="Escanear Codigo de Barras SKU"
        >
          <Camera size={16} />
        </button>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`border p-2.5 rounded-lg transition-all cursor-pointer ${showAdvanced ? 'bg-violet-600 text-white border-violet-600' : 'bg-transparent text-zinc-800 border-zinc-200 hover:bg-zinc-50'}`}
        >
          <SlidersHorizontal size={16} />
        </button>
      </div>

      <div className={`p-4 border border-zinc-200 rounded-lg bg-zinc-50/50 flex flex-col gap-3 transition-all ${showAdvanced ? 'block' : 'hidden md:flex'} text-zinc-900 shadow-sm`}>
        <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
          <span className="text-[11px] uppercase font-mono font-bold text-zinc-800 tracking-wider flex items-center gap-1.5">
            <Carrot size={13} className="text-violet-600" /> Pasillos y Preferencias
          </span>
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-[11px] font-mono text-zinc-400 hover:text-violet-600 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RefreshCcw size={10} /> Restablecer filtros
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">1. Departamento</span>
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setSelectedBrand(''); setSelectedModel(''); setSelectedEngine(''); }}
              className="bg-white text-zinc-900 border border-zinc-200 rounded-lg px-2.5 py-1.5 font-sans outline-none focus:border-violet-500 transition-all text-xs font-bold"
            >
              <option value="">Todos los Departamentos</option>
              {(config.categories || []).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">2. Pasillo</span>
            <select
              value={selectedBrand}
              onChange={(e) => { setSelectedBrand(e.target.value); setSelectedModel(''); setSelectedEngine(''); }}
              className="bg-white text-zinc-900 border border-zinc-200 rounded-lg px-2.5 py-1.5 font-sans outline-none focus:border-violet-500 transition-all text-xs font-bold"
            >
              <option value="">Cualquier Pasillo</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">3. Estante</span>
            <select
              value={selectedModel}
              onChange={(e) => { setSelectedModel(e.target.value); setSelectedEngine(''); }}
              className="bg-white text-zinc-900 border border-zinc-200 rounded-lg px-2.5 py-1.5 font-sans outline-none focus:border-violet-500 transition-all disabled:opacity-50 text-xs font-bold"
              disabled={!selectedBrand}
            >
              <option value="">Cualquier Estante</option>
              {models.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">4. Marca</span>
            <select
              value={selectedEngine}
              onChange={(e) => setSelectedEngine(e.target.value)}
              className="bg-white text-zinc-900 border border-zinc-200 rounded-lg px-2.5 py-1.5 font-sans outline-none focus:border-violet-500 transition-all disabled:opacity-50 text-xs font-bold"
            >
              <option value="">Cualquier Marca</option>
              {engineVersions.map(ver => (
                <option key={ver} value={ver}>{ver}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">5. Origen</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white text-zinc-900 border border-zinc-200 rounded-lg px-2.5 py-1.5 font-sans outline-none focus:border-violet-500 transition-all text-xs font-bold"
            >
              <option value="">Cualquier Origen</option>
              <option value="Nacional">Nacional</option>
              <option value="Importado">Importado</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center justify-center border border-dashed border-zinc-200 rounded-lg p-6 bg-zinc-50/50">
          <FilterX size={40} className="text-zinc-400 mb-2" />
          <h4 className="text-sm font-bold font-display text-zinc-800">No se encontraron artículos</h4>
          <p className="text-xs text-zinc-500 max-w-xs mt-1 leading-relaxed">
            No encontramos coincidencias en {selectedCategory || 'el catálogo'} para tu búsqueda. Haz clic en limpiar filtros para restablecer.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-4 bg-zinc-100 text-xs font-bold font-display px-4 py-2 rounded-lg border border-zinc-200 hover:bg-zinc-200 text-zinc-800 transition-colors cursor-pointer"
          >
            Limpiar Filtros
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {paginatedProducts.map((part) => (
              <ProductCard
                key={part.id}
                part={part}
                config={config}
                fullWidth={true}
                onViewProductDetails={onViewProductDetails}
                addToCart={(p, qty) => {
                  addToCart(p, qty);
                  setToastMessage(p.nombre);
                }}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-4">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-4 py-2 bg-zinc-105 text-zinc-800 rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                Anterior
              </button>
              <span className="text-xs text-zinc-500 font-mono">
                Pag {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-20 left-4 right-4 z-50 bg-zinc-950/95 border border-zinc-800 px-4 py-3.5 rounded-xl flex items-center justify-between shadow-2xl backdrop-blur-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <span className="text-violet-400 text-sm font-bold">✓</span>
            <div>
              <p className="text-[11px] font-bold text-white leading-tight">Agregado al Carrito</p>
              <p className="text-[9px] text-zinc-400 mt-0.5 max-w-[180px] line-clamp-1">{toastMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="text-zinc-300 hover:text-white text-[10px] font-mono font-bold uppercase cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
};
