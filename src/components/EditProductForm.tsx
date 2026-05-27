import React, { useState, useEffect } from 'react';
import { Producto } from '../types/store';
import { X, Upload, Camera, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { uploadFileToStorage, compressImage } from '../store/supabaseClient';

interface EditProductFormProps {
  part: Producto;
  onSubmit: (partData: Producto) => void;
  onClose: () => void;
}

export const EditProductForm: React.FC<EditProductFormProps> = ({ part, onSubmit, onClose }) => {
  const { parts, config } = useApp();
  const [formCodigo, setFormCodigo] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formMarca, setFormMarca] = useState('');
  const [formCondicion, setFormCondicion] = useState<'Nacional' | 'Importado'>('Nacional');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formDetalleAdicional, setFormDetalleAdicional] = useState('');
  const [uploadFormat, setUploadFormat] = useState<'image/webp' | 'image/jpeg'>('image/webp');
  const [formCategoria, setFormCategoria] = useState('Lácteos y Quesos');
  const [formSeccion, setFormSeccion] = useState('Pasillo 1 - Lacteos');
  const [formSubseccion, setFormSubseccion] = useState('');
  const [formAnioInicio, setFormAnioInicio] = useState(15);
  const [formAnioFin, setFormAnioFin] = useState(4);
  const [formPrecio, setFormPrecio] = useState(0.00);
  const [formStock, setFormStock] = useState(0);
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formPromo, setFormPromo] = useState(false);
  const [formNuevo, setFormNuevo] = useState(false);
  const [formVendido, setFormVendido] = useState(false);
  const [formDeliveryGratis, setFormDeliveryGratis] = useState(false);
  const [formActivo, setFormActivo] = useState(true);

  // Local validation error state
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (part) {
      setFormCodigo(part.codigo || '');
      setFormNombre(part.nombre || '');
      setFormMarca(part.marca || '');
      setFormCondicion(part.condicion || 'Nacional');
      setFormDescripcion(part.descripcion || '');
      setFormCategoria(part.categoria || 'Lácteos y Quesos');
      setFormSeccion(part.seccion || 'Pasillo 1 - Lacteos');
      setFormSubseccion(part.subseccion || '');
      setFormAnioInicio(part.anio_inicio ?? 15);
      setFormAnioFin(part.anio_fin ?? 4);
      setFormPrecio(part.precio_usd ?? 0.00);
      setFormStock(part.stock ?? 0);
      setFormImages(part.imagen_urls && part.imagen_urls.length > 0 ? [...part.imagen_urls] : ['']);
      setFormPromo(!!part.es_promo);
      setFormNuevo(!!part.es_nuevo);
      setFormVendido(!!part.es_mas_vendido);
      setFormDeliveryGratis(!!part.delivery_gratis);
      setFormActivo(part.activo !== undefined ? part.activo : true);
      setFormDetalleAdicional(part.detalle_adicional || '');
      setValidationErrors({});
    }
  }, [part]);

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    const trimmedCodigo = formCodigo.trim();
    if (!trimmedCodigo) {
      errors.codigo = 'El SKU del artículo es requerido.';
    } else {
      const exists = parts.some(p => p.codigo === trimmedCodigo && p.id !== part.id);
      if (exists) {
        errors.codigo = 'Ya existe un artículo con este SKU.';
      }
    }
    
    if (!formNombre.trim()) {
      errors.nombre = 'El nombre del artículo es requerido.';
    }
    if (!formMarca.trim()) {
      errors.marca = 'La marca del fabricante es requerida.';
    }
    if (!formCategoria.trim()) {
      errors.categoria = 'La categoría/departamento es requerida.';
    }
    
    if (formPrecio === undefined || formPrecio === null || isNaN(formPrecio) || formPrecio < 0) {
      errors.precio = 'El precio debe ser un número positivo válido.';
    }
    if (formStock === undefined || formStock === null || isNaN(formStock) || formStock < 0 || !Number.isInteger(formStock)) {
      errors.stock = 'El stock debe ser un número entero no negativo.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const filteredImages = formImages
      .map(url => url.trim())
      .filter(url => url !== '');

    const updatedPart: Producto = {
      ...part,
      codigo: formCodigo.trim(),
      nombre: formNombre.trim(),
      marca: formMarca.trim(),
      condicion: formCondicion,
      descripcion: formDescripcion.trim(),
      categoria: formCategoria,
      seccion: formSeccion.trim(),
      subseccion: formSubseccion.trim(),
      anio_inicio: Number(formAnioInicio) || 0,
      anio_fin: Number(formAnioFin) || 0,
      precio_usd: Number(formPrecio),
      stock: Number(formStock),
      imagen_urls: filteredImages.length > 0 ? filteredImages : ['https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=500'],
      es_promo: formPromo,
      es_nuevo: formNuevo,
      es_mas_vendido: formVendido,
      delivery_gratis: formDeliveryGratis,
      activo: formActivo,
      detalle_adicional: formDetalleAdicional.trim()
    };

    onSubmit(updatedPart);
  };

  return (
    <div id="edit-product-form-container" className="bg-[#18181b] border border-[#27272a] rounded-xl text-white p-6 shadow-2xl relative w-full max-w-2xl mx-auto overflow-y-auto max-h-[90vh] no-scrollbar">
      {/* Header section with closing button */}
      <div className="flex justify-between items-center border-b border-[#27272a] pb-3 mb-4">
        <div>
          <h3 className="text-sm font-bold font-display uppercase tracking-wider text-white">
            {part.id ? `Editar Artículo: ${part.nombre}` : 'Cargar Nuevo Artículo'}
          </h3>
          {part.id && (
            <p className="text-[11px] text-[#a1a1aa] mt-0.5 font-mono">ID: {part.id}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[#a1a1aa] hover:text-white bg-white/5 p-1 rounded-lg transition-colors cursor-pointer"
          title="Cerrar formulario"
        >
          <X size={16} />
        </button>
      </div>

      {/* Main Form content */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 text-xs">
          
          {/* Part Code Input field */}
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-zinc-355">SKU / Código de Fábrica *</span>
            <input
              type="text"
              value={formCodigo}
              onChange={(e) => setFormCodigo(e.target.value)}
              placeholder="Ej. MK-96416301"
              className={`bg-[#09090b] border ${validationErrors.codigo ? 'border-red-500/60 focus:border-red-500' : 'border-[#27272a] focus:border-emerald-500'} rounded-lg px-2.5 py-2 outline-none transition-colors`}
            />
            {validationErrors.codigo && (
              <span className="text-[10px] text-red-400 font-mono mt-0.5">{validationErrors.codigo}</span>
            )}
          </div>

          {/* Category Input field */}
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-zinc-355">Categoría / Departamento *</span>
            <select
              value={formCategoria}
              onChange={(e) => setFormCategoria(e.target.value)}
              className={`bg-[#09090b] border ${validationErrors.categoria ? 'border-red-500/60 focus:border-red-500' : 'border-[#27272a] focus:border-emerald-500'} text-white rounded-lg px-2.5 py-1.5 outline-none transition-colors h-[34px]`}
            >
              {(config.categories || []).map((cat) => (
                <option key={cat} value={cat} className="bg-[#09090b] text-white">
                  {cat}
                </option>
              ))}
              {formCategoria && !(config.categories || []).includes(formCategoria) && (
                <option value={formCategoria} className="bg-[#09090b] text-white">
                  {formCategoria}
                </option>
              )}
            </select>
            {validationErrors.categoria && (
              <span className="text-[10px] text-red-400 font-mono mt-0.5">{validationErrors.categoria}</span>
            )}
          </div>

          {/* Part Name Fullwidth input */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-1">
            <span className="font-semibold text-zinc-350">Nombre del Producto *</span>
            <input
              type="text"
              value={formNombre}
              onChange={(e) => setFormNombre(e.target.value)}
              placeholder="Ej. Queso De Año Premium"
              className={`bg-[#09090b] border ${validationErrors.nombre ? 'border-red-500/60 focus:border-red-500' : 'border-[#27272a] focus:border-emerald-500'} rounded-lg px-2.5 py-2 outline-none transition-colors`}
            />
            {validationErrors.nombre && (
              <span className="text-[10px] text-red-400 font-mono mt-0.5">{validationErrors.nombre}</span>
            )}
          </div>

          {/* Brand/Fabricator Brand input */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-1">
            <span className="font-semibold text-zinc-350">Marca / Fabricante *</span>
            <input
              type="text"
              value={formMarca}
              onChange={(e) => setFormMarca(e.target.value)}
              placeholder="Ej. Marketo, Alpina, Kraft..."
              className={`bg-[#09090b] border ${validationErrors.marca ? 'border-red-500/60 focus:border-red-500' : 'border-[#27272a] focus:border-emerald-500'} rounded-lg px-2.5 py-2 outline-none transition-colors`}
            />
            {validationErrors.marca && (
              <span className="text-[10px] text-red-400 font-mono mt-0.5">{validationErrors.marca}</span>
            )}
          </div>

          {/* Condition Field */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-1">
            <span className="font-semibold text-zinc-350">Origen / Tipo del Producto *</span>
            <div className="flex bg-[#09090b] border border-[#27272a] rounded-lg p-1 gap-1">
              {['Nacional', 'Importado'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setFormCondicion(opt as any)}
                  className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${
                    formCondicion === opt 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Supermarket Section */}
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-zinc-350">Pasillo de Ubicación (Opcional)</span>
            <input
              type="text"
              value={formSeccion}
              onChange={(e) => setFormSeccion(e.target.value)}
              placeholder="Ej. Lácteos, Carnes, Bebidas..."
              className="bg-[#09090b] border border-[#27272a] text-white rounded-lg px-2.5 py-2 focus:border-emerald-500 outline-none transition-colors h-[34px]"
            />
          </div>

          {/* Supermarket Subsection */}
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-zinc-350">Estante / Ubicación (Opcional)</span>
            <input
              type="text"
              value={formSubseccion}
              onChange={(e) => setFormSubseccion(e.target.value)}
              placeholder="Ej. Refrigerador 3, Estante B2..."
              className="bg-[#09090b] border border-[#27272a] focus:border-emerald-500 rounded-lg px-2.5 py-2 outline-none transition-colors h-[34px]"
            />
          </div>

          {/* Start and End Years compatibilities interval fields */}
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-zinc-350">Vida Útil en Días (Opcional)</span>
            <input
              type="number"
              value={formAnioInicio || ''}
              onChange={(e) => setFormAnioInicio(e.target.value ? Number(e.target.value) : 0)}
              placeholder="Ej. 15"
              className="bg-[#09090b] border border-[#27272a] rounded-lg px-2.5 py-2 focus:border-emerald-500 outline-none transition-colors font-mono"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-semibold text-zinc-350">Temperatura Conservación °C (Opcional)</span>
            <input
              type="number"
              value={formAnioFin || ''}
              onChange={(e) => setFormAnioFin(e.target.value ? Number(e.target.value) : 0)}
              placeholder="Ej. 4"
              className="bg-[#09090b] border border-[#27272a] rounded-lg px-2.5 py-2 focus:border-emerald-500 outline-none transition-colors font-mono"
            />
          </div>
          {validationErrors.anios && (
            <div className="col-span-2 text-[10px] text-red-400 font-mono text-right">{validationErrors.anios}</div>
          )}

          {/* Price of output component */}
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-zinc-350">Precio Venta (USD) *</span>
            <input
              type="number"
              step="0.01"
              value={formPrecio}
              onChange={(e) => setFormPrecio(Number(e.target.value))}
              className={`bg-[#09090b] border ${validationErrors.precio ? 'border-red-500/60 focus:border-red-500' : 'border-[#27272a] focus:border-emerald-500'} rounded-lg px-2.5 py-2 outline-none font-mono text-emerald-550 font-bold transition-colors`}
            />
            {validationErrors.precio && (
              <span className="text-[10px] text-red-400 font-mono mt-0.5">{validationErrors.precio}</span>
            )}
          </div>

          {/* Stock inventory level */}
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-zinc-350">Unidades en Stock *</span>
            <input
              type="number"
              value={formStock}
              onChange={(e) => setFormStock(Number(e.target.value))}
              className={`bg-[#09090b] border ${validationErrors.stock ? 'border-red-500/60 focus:border-red-500' : 'border-[#27272a] focus:border-[#3b82f6]'} rounded-lg px-2.5 py-2 outline-none font-mono transition-colors`}
            />
            {validationErrors.stock && (
              <span className="text-[10px] text-red-400 font-mono mt-0.5">{validationErrors.stock}</span>
            )}
          </div>

          {/* Multiple Image URLs Manager with compression local uploading option (REUSED AS REQUESTED) */}
          <div className="col-span-2 flex flex-col gap-2 border-t border-[#27272a]/40 pt-3 mt-1">
            <div className="flex justify-between items-center bg-[#1c1c1e] p-2.5 rounded-lg border border-[#27272a]">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Imágenes del Producto</span>
                <span className="text-[10px] text-zinc-400">Personaliza URLs o sube un archivo local</span>
              </div>
              <button
                type="button"
                onClick={() => setFormImages([...formImages, ''])}
                className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded transition-colors"
              >
                <Plus size={11} /> Agregar URL
              </button>
            </div>

            {/* Local image drag upload and compress sector */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-3 flex flex-col gap-2">
              <div className="flex justify-between items-center text-[11px] text-zinc-350">
                <span className="font-semibold flex items-center gap-1.5">
                  <Upload size={13} className="text-emerald-500" /> Subir imagen local (.webp, .jpg, .png...)
                </span>
                <div className="flex items-center gap-1 bg-[#09090b] border border-[#27272a] p-0.5 rounded font-mono text-[9px]">
                  <span className="px-1 text-zinc-500 font-medium select-none">Exportar a:</span>
                  <button
                    type="button"
                    onClick={() => setUploadFormat('image/webp')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${uploadFormat === 'image/webp' ? 'bg-emerald-600 text-white font-semibold' : 'text-zinc-400 hover:text-white'}`}
                  >
                    WEBP
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadFormat('image/jpeg')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${uploadFormat === 'image/jpeg' ? 'bg-amber-600 text-white font-semibold' : 'text-zinc-400 hover:text-white'}`}
                  >
                    JPG
                  </button>
                </div>
              </div>

              <label className="flex flex-col items-center justify-center border border-dashed border-[#27272a] hover:border-emerald-500/45 bg-[#09090b]/40 rounded-lg p-4 cursor-pointer text-[#a1a1aa] hover:text-white transition-all text-center select-none">
                <Upload size={18} className="text-emerald-550 animate-pulse mb-1.5" />
                <span className="text-[10px] font-medium leading-normal">Haz clic para buscar o arrastrar y subir imagen comprimida</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        try {
                          const compressed = await compressImage(file, { maxWidth: 800, format: uploadFormat });
                          const url = await uploadFileToStorage(compressed, 'products', 'catalog');
                          setFormImages(prev => {
                            const currentImages = prev.filter(img => img.trim() !== '');
                            return [...currentImages, url];
                          });
                        } catch (err) {
                          console.error("Error subiendo imagen:", err);
                        }
                      }
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {/* List and preview input items for images */}
            <div className="flex flex-col gap-2 max-h-[170px] overflow-y-auto pr-1">
              {formImages.map((imgUrl, idx) => (
                <div key={idx} className="bg-[#09090b] border border-[#27272a] rounded-lg p-2 flex gap-2.5 items-center">
                  
                  {/* Thumbnail circular/rounded frame */}
                  <div className="w-10 h-10 rounded overflow-hidden border border-[#27272a] bg-black/40 shrink-0 flex items-center justify-center relative select-none">
                    {imgUrl && imgUrl.trim() !== '' ? (
                      <img src={imgUrl} alt={`Previsualización ${idx + 1}`} className="w-full h-full object-cover" onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }} />
                    ) : (
                      <Camera size={14} className="text-zinc-650" />
                    )}
                    <span className="absolute top-0 left-0 bg-[#09090b]/80 border-r border-b border-[#27272a] text-zinc-400 font-mono text-[8px] px-1 rounded-br">
                      {idx + 1}
                    </span>
                  </div>

                  {/* Input form url */}
                  <div className="flex-1 flex flex-col gap-1">
                    <input
                      type="text"
                      value={imgUrl}
                      onChange={(e) => {
                        const updated = [...formImages];
                        updated[idx] = e.target.value;
                        setFormImages(updated);
                      }}
                      placeholder={`Pegue URL o Base64 de la Foto ${idx + 1}`}
                      className="w-full bg-[#18181b] border border-[#27272a] rounded-md px-2 py-1 focus:border-emerald-500 outline-none font-mono text-[10px] text-zinc-300 transition-colors"
                    />
                    <div className="flex justify-between items-center text-[9px] text-zinc-500 font-mono select-none">
                      <span className="truncate max-w-[170px]">
                        {imgUrl.startsWith('data:') ? 'Imagen Local (Subido)' : imgUrl ? 'URL remota' : 'Vacío'}
                      </span>
                      <label className="text-emerald-400 hover:text-emerald-350 font-bold cursor-pointer">
                        [Reemplazar archivo]
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              compressImage(file, { maxWidth: 800, format: uploadFormat })
                                .then(compressed => uploadFileToStorage(compressed, 'products', 'catalog'))
                                .then(url => {
                                  const updated = [...formImages];
                                  updated[idx] = url;
                                  setFormImages(updated);
                                })
                                .catch(err => console.error("Error subiendo imagen:", err));
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Delete individual slot button */}
                  {formImages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = formImages.filter((_, i) => i !== idx);
                        setFormImages(updated);
                      }}
                      className="p-1 px-1.5 text-red-400 hover:text-red-350 hover:bg-red-500/10 bg-white/5 border border-red-500/15 rounded transition-all cursor-pointer shrink-0"
                      title="Eliminar foto"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Description general rich textarea */}
          <div className="col-span-2 flex flex-col gap-1 border-t border-[#27272a]/40 pt-3 mt-1">
            <span className="font-semibold text-zinc-350">Descripción General del Producto *</span>
            <textarea
              rows={3}
              value={formDescripcion}
              onChange={(e) => setFormDescripcion(e.target.value)}
              placeholder="Ej. Exquisito queso madurado premium, empacado al vacío para máxima frescura..."
              className="bg-[#09090b] border border-[#27272a] focus:border-emerald-500 rounded-lg px-2.5 py-2 outline-none font-sans text-xs text-zinc-300 transition-colors"
            />
          </div>

          {/* Additional details like ingredients, allergens, or nutrition info */}
          <div className="col-span-2 flex flex-col gap-1">
            <span className="font-semibold text-zinc-355 font-sans">Información Nutricional / Ingredientes / Alérgenos:</span>
            <input
              type="text"
              value={formDetalleAdicional}
              onChange={(e) => setFormDetalleAdicional(e.target.value)}
              placeholder="Ej. Sin Gluten • Alto en Calcio • 100% Orgánico"
              className="bg-[#09090b] border border-[#27272a] focus:border-emerald-500 rounded-lg px-2.5 py-2 outline-none font-sans text-xs text-zinc-300 transition-colors"
            />
          </div>

          {/* Checkout feature flags boolean settings cards */}
          <div className="col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <label className="flex items-center gap-2.5 p-2 bg-[#09090b] border border-[#27272a] hover:border-emerald-500/35 rounded-lg cursor-pointer select-none transition-colors">
              <input
                type="checkbox"
                checked={formActivo}
                onChange={(e) => setFormActivo(e.target.checked)}
                className="accent-emerald-500 h-4.5 w-4.5"
              />
              <div className="flex flex-col">
                <span className="font-bold text-[11px] text-white">Activo</span>
                <span className="text-[9px] text-[#a1a1aa] leading-none">Visible para ventas</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-2 bg-[#09090b] border border-[#27272a] hover:border-emerald-500/35 rounded-lg cursor-pointer select-none transition-colors">
              <input
                type="checkbox"
                checked={formPromo}
                onChange={(e) => setFormPromo(e.target.checked)}
                className="accent-emerald-600 h-4.5 w-4.5"
              />
              <div className="flex flex-col">
                <span className="font-bold text-[11px] text-white">En Oferta</span>
                <span className="text-[9px] text-[#a1a1aa] leading-none">Aplica descuento</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-2 bg-[#09090b] border border-[#27272a] hover:border-violet-500/35 rounded-lg cursor-pointer select-none transition-colors">
              <input
                type="checkbox"
                checked={formNuevo}
                onChange={(e) => setFormNuevo(e.target.checked)}
                className="accent-[#8b5cf6] h-4.5 w-4.5"
              />
              <div className="flex flex-col">
                <span className="font-bold text-[11px] text-white">Es Nuevo</span>
                <span className="text-[9px] text-[#a1a1aa] leading-none">Muestra etiqueta</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-2 bg-[#09090b] border border-[#27272a] hover:border-yellow-500/35 rounded-lg cursor-pointer select-none transition-colors">
              <input
                type="checkbox"
                checked={formVendido}
                onChange={(e) => setFormVendido(e.target.checked)}
                className="accent-amber-500 h-4.5 w-4.5"
              />
              <div className="flex flex-col">
                <span className="font-bold text-[11px] text-white">Destacado</span>
                <span className="text-[9px] text-[#a1a1aa] leading-none">Artículo popular</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-2 bg-[#09090b] border border-[#27272a] hover:border-indigo-500/35 rounded-lg cursor-pointer select-none transition-colors">
              <input
                type="checkbox"
                checked={formDeliveryGratis}
                onChange={(e) => setFormDeliveryGratis(e.target.checked)}
                className="accent-indigo-500 h-4.5 w-4.5"
              />
              <div className="flex flex-col">
                <span className="font-bold text-[11px] text-white">Delivery Gratis</span>
                <span className="text-[9px] text-[#a1a1aa] leading-none">Envío sin costo</span>
              </div>
            </label>
          </div>

        </div>

        {/* Footer actions toolbar */}
        <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-[#27272a]">
          <button
            type="button"
            onClick={onClose}
            className="bg-[#09090b] text-[#a1a1aa] hover:text-white border border-[#27272a] px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-550 text-white font-bold text-xs px-5 py-2 rounded-lg cursor-pointer transition-all hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.98]"
          >
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
};
