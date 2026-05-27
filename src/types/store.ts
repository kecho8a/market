export interface AppUser {
  id: string;
  nombre: string;
  telefono: string;
  contrasena: string;
  email?: string;
  createdAt: string;
}

export interface Producto {
  id: string;
  codigo: string;                // SKU del producto
  nombre: string;
  descripcion: string;
  categoria: string;             // Ej: 'Lácteos', 'Carnes', 'Panadería'
  seccion: string;               // Pasillo del mercado. Ej: 'Pasillo 1 - Lácteos'
  subseccion: string;            // Subsección. Ej: 'Leches y Cremas', 'Cortes Vacunos'
  marca: string;                 // Marca del producto. Ej: 'Campestre', 'El Rey'
  condicion: 'Nacional' | 'Importado'; // Origen
  anio_inicio: number;           // Reutilizado en UI como "Vida Útil en Días"
  anio_fin: number;              // Reutilizado en UI como "Temperatura Conservación °C"
  precio_usd: number;
  stock: number;
  imagen_urls: string[];         // Múltiples imágenes del producto
  es_promo: boolean;
  es_nuevo: boolean;
  es_mas_vendido: boolean;
  delivery_gratis?: boolean;
  detalle_adicional?: string;    // Info extra del producto (origen, peso, etc.)
  activo?: boolean;              // Si está visible/vendible en el catálogo
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
  cliente_email?: string;
  usuario_id?: string; // Link order to a registered user
  items: OrderItem[];
  subtotal_usd: number;
  costo_envio_usd: number;
  descuento_cupon_usd?: number;
  cupon_codigo?: string;
  total_usd: number;
  total_bs: number;
  metodo_pago: 'Pago Móvil' | 'Zelle' | 'Efectivo' | 'Transferencia';
  lat: number;
  lng: number;
  direccion_envio: string;
  distancia_km: number;
  status: 'Pendiente' | 'Procesando' | 'Enviado' | 'En preparación' | 'En camino' | 'Entregado' | 'Cancelado';
  tiempo_estimado_entrega?: string; // Delivery time set by admin
  notas_admin?: string;
  fecha: string;
}

export interface StoreConfig {
  site_nombre: string;
  telefono_soporte: string;
  direccion_fisica: string;
  logo_url?: string;
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
  theme_color?: string;
  delivery_gratis?: boolean;
  costo_delivery_km?: number;
  envio_nacional?: boolean;
  costo_envio_nacional?: number;
  favicon_url?: string;
  banner_texts?: string[];
  categories?: string[];
  mensaje_bienvenida?: string;
  push_webhook_url?: string;
  push_webhook_secret?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  active: boolean;
  usage_limit?: number;
  usage_count: number;
  valid_until?: string;
  created_at?: string;
}

export interface InAppNotification {
  id: string;
  titulo: string;
  mensaje: string;
  fecha: string;
  tipo: 'todos' | 'personal' | 'admin' | 'request';
  destinatario_telefono?: string; // Link to specific user's phone number
  leida: boolean;
  imagen_url?: string;
  link_url?: string;
}

