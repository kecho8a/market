export interface AppUser {
  id: string;
  nombre: string;
  telefono: string;
  contrasena: string;
  createdAt: string;
}

export interface AutoPart {
  id: string;
  codigo: string; // SKU or OEM number
  nombre: string;
  descripcion: string;
  categoria: string; // e.g., 'Frenos', 'Motor', 'Suspensión', 'Eléctrico', etc.
  marca_carro: string; // e.g., 'Chevrolet', 'Toyota', 'Ford'
  modelo_carro: string; // e.g., 'Aveo', 'Corolla', 'Fiesta'
  marca_repuesto: string; // e.g., 'GM', 'Denso', 'Gates'
  condicion: 'Nuevo' | 'Usado';
  anio_inicio: number;
  anio_fin: number;
  precio_usd: number;
  stock: number;
  imagen_urls: string[]; // Support multiple images
  es_promo: boolean;
  es_nuevo: boolean;
  es_mas_vendido: boolean;
  delivery_gratis?: boolean;
  compatibilidad_detalle?: string;
  activo?: boolean; // New flag to determine if it's sellable
}

export interface OrderItem {
  part_id: string;
  nombre: string;
  codigo: string;
  precio_usd: number;
  cantidad: number;
}

export interface Order {
  id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  usuario_id?: string; // Link order to a registered user
  items: OrderItem[];
  subtotal_usd: number;
  costo_envio_usd: number;
  total_usd: number;
  total_bs: number;
  metodo_pago: 'Pago Móvil' | 'Zelle' | 'Efectivo' | 'Transferencia';
  lat: number;
  lng: number;
  direccion_envio: string;
  distancia_km: number;
  status: 'Pendiente' | 'Procesando' | 'Enviado' | 'En preparación' | 'En camino' | 'Entregado';
  tiempo_estimado_entrega?: string; // Delivery time set by admin
  fecha: string;
}

export interface StoreConfig {
  site_nombre: string;
  telefono_soporte: string;
  direccion_fisica: string;
  coordenadas_tienda: {
    lat: number;
    lng: number;
  };
  banners: string[]; // exactly 3 urls
  zelle_enabled: boolean;
  zelle_data: string;
  zelle_discount_percent: number;
  pagomovil_enabled: boolean;
  pagomovil_data: string;
  pagomovil_discount_percent: number;
  efectivo_enabled: boolean;
  efectivo_data: string;
  efectivo_discount_percent: number;
  transferencia_enabled: boolean;
  transferencia_data: string;
  transferencia_discount_percent: number;
  tasa_cambio: number; // exchange rate (Bs per USD)
  logo_url?: string;
  theme_color?: string;
  delivery_gratis?: boolean;
  costo_delivery_km?: number;
  envio_nacional?: boolean;
  costo_envio_nacional?: number;
  favicon_url?: string;
  banner_texts?: string[];
  categories?: string[];
}

export interface InAppNotification {
  id: string;
  titulo: string;
  mensaje: string;
  fecha: string;
  tipo: 'todos' | 'personal' | 'admin' | 'request';
  destinatario_telefono?: string; // Link to specific user's phone number
  leida: boolean;
}
