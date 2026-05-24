import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Producto, Order, StoreConfig, InAppNotification, OrderItem, AppUser, Coupon } from '../types/store';
import { supabase } from './supabaseClient';

interface AppContextProps {
  products: Producto[];
  orders: Order[];
  config: StoreConfig;
  coupons: Coupon[];
  notifications: InAppNotification[];
  cart: { item: Producto; quantity: number }[];
  isAdminAuthenticated: boolean;
  favorites: string[];
  toggleFavorite: (partId: string) => void;
  isFavorite: (partId: string) => boolean;
  
  // Haptic Feedback
  hapticEnabled: boolean;
  toggleHaptic: () => void;
  
  // User Management
  displayCurrency: 'USD' | 'BS';
  toggleCurrency: () => void;
  users: AppUser[];
  currentUser: AppUser | null;
  registerUser: (nombre: string, email: string, telefono: string, contrasena: string) => Promise<AppUser>;
  loginUser: (identifier: string, contrasena: string) => Promise<AppUser | null>;
  logoutUser: () => void;
  updateUser: (updated: Partial<AppUser>) => void;
  sendPasswordResetEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateUserByAdmin: (userId: string, updated: Partial<AppUser>) => void;
  requestPart: (nombre: string, telefono: string, descripcion: string, imagenUrl?: string) => void;
  
  // Catalog actions
  addProduct: (product: Omit<Producto, 'id'>) => void;
  updateProduct: (id: string, updated: Partial<Producto>) => void;
  deleteProduct: (id: string) => void;
  searchPartsSemantically: (query: string) => Producto[];
  
  // Cart Actions
  addToCart: (part: Producto, qty?: number) => void;
  removeFromCart: (partId: string) => void;
  updateCartQuantity: (partId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Checkout & Order Actions
  createOrder: (orderData: Omit<Order, 'id' | 'subtotal_usd' | 'total_usd' | 'total_bs' | 'fecha' | 'status'> & { descuento_cupon_usd?: number; cupon_codigo?: string }, preGeneratedId?: string) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: Order['status'], estimatedTime?: string, notas?: string) => void;
  updateOrderItems: (orderId: string, newItems: OrderItem[]) => Promise<void>;

  // Coupon Actions
  addCoupon: (coupon: Omit<Coupon, 'id' | 'usage_count'>) => Promise<void>;
  updateCoupon: (id: string, updated: Partial<Coupon>) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  
  // Config Actions
  updateConfig: (newConfig: Partial<StoreConfig>) => void;
  updateExchangeRate: (rate: number) => void;
  fetchExchangeRate: () => Promise<void>;
  addCategory: (categoryName: string) => void;
  deleteCategory: (categoryName: string) => void;
  updateCategory: (oldCategory: string, newCategory: string) => void;
  
  // Notification Actions
  addNotification: (title: string, message: string, tipo?: 'todos' | 'personal' | 'admin' | 'request', targetPhone?: string) => void;
  markNotificationAsRead: (id: string) => void;
  toggleNotificationReadStatus: (id: string) => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  // App State
  isGlobalLoading: boolean;
  
  // Auth
  authenticateAdmin: (email: string, pass: string) => Promise<boolean>;
  logoutAdmin: () => Promise<void>;
  updateAdminCredentials: (user: string, pass: string) => void;
  adminUser: string;
  adminPass: string;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

// INITIAL PRODUCTS DATA
const DEFAULT_PRODUCTS: Producto[] = [
  {
    id: 'a4829bef-0c7f-4b08-be94-7123aa123b01',
    codigo: 'LCT-LECH-964',
    nombre: 'Leche Liquida Entera Campestre 1L',
    descripcion: 'Leche entera de vaca pasteurizada premium, enriquecida con vitaminas A y D. Ideal para toda la familia.',
    categoria: 'Lácteos y Quesos',
    seccion: 'Pasillo 1 - Lacteos',
    subseccion: 'Leches y Cremas',
    marca: 'Campestre',
    condicion: 'Nacional',
    anio_inicio: 2000,
    anio_fin: 2026,
    precio_usd: 1.80,
    stock: 50,
    imagen_urls: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=500'],
    es_promo: true,
    es_nuevo: false,
    es_mas_vendido: true,
    delivery_gratis: true,
    detalle_adicional: '100% Leche fresca pasteurizada. Conservar refrigerado.'
  },
  {
    id: 'a4829bef-0c7f-4b08-be94-7123aa123b02',
    codigo: 'LCT-QUES-GOU',
    nombre: 'Queso Amarillo Tipo Gouda Madurado 500g',
    descripcion: 'Queso amarillo gouda premium madurado con textura cremosa y sabor semi-fuerte. Perfecto para picar o sandwiches.',
    categoria: 'Lácteos y Quesos',
    seccion: 'Pasillo 1 - Lacteos',
    subseccion: 'Quesos y Embutidos',
    marca: 'Torondoy',
    condicion: 'Nacional',
    anio_inicio: 2000,
    anio_fin: 2026,
    precio_usd: 6.50,
    stock: 15,
    imagen_urls: ['https://images.unsplash.com/photo-1486299267070-8382e21b471a?auto=format&fit=crop&q=80&w=500'],
    es_promo: true,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: true,
    detalle_adicional: 'Contiene lactosa. Maduracion controlada de 45 dias.'
  },
  {
    id: 'a4829bef-0c7f-4b08-be94-7123aa123b03',
    codigo: 'LCT-YOGU-GRI',
    nombre: 'Yogur Griego Natural Sin Azucar 500g',
    descripcion: 'Yogur griego cremoso alto en proteinas, sin azucar añadida ni conservantes. Excelente fuente de calcio.',
    categoria: 'Lácteos y Quesos',
    seccion: 'Pasillo 1 - Lacteos',
    subseccion: 'Yogures y Postres',
    marca: 'ValleFresco',
    condicion: 'Nacional',
    anio_inicio: 2000,
    anio_fin: 2026,
    precio_usd: 3.90,
    stock: 25,
    imagen_urls: ['https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: true,
    es_mas_vendido: true,
    delivery_gratis: false,
    detalle_adicional: 'Mantener en refrigeracion constante entre 2 y 4 grados.'
  },
  {
    id: 'a4829bef-0c7f-4b08-be94-7123aa123b04',
    codigo: 'CRN-RIBE-ANG',
    nombre: 'Ribeye de Carne Premium Angus 400g',
    descripcion: 'Corte selecto Ribeye de res Angus certificado con excelente marmoleo para garantizar jugosidad extrema y gran suavidad.',
    categoria: 'Carnes y Aves',
    seccion: 'Pasillo 2 - Carnes',
    subseccion: 'Cortes Vacunos',
    marca: 'Angus Gold',
    condicion: 'Nacional',
    anio_inicio: 2000,
    anio_fin: 2026,
    precio_usd: 14.90,
    stock: 12,
    imagen_urls: ['https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: true,
    delivery_gratis: false,
    detalle_adicional: 'Empacado al vacio de origen. Conservar congelado.'
  },
  {
    id: 'a4829bef-0c7f-4b08-be94-7123aa123b05',
    codigo: 'CRN-PECH-POL',
    nombre: 'Pechuga de Pollo Entera Deshuesada 1kg',
    descripcion: 'Pechuga de pollo fresca, limpia, deshuesada y sin piel. Carne tierna ideal para preparar a la plancha o ensaladas.',
    categoria: 'Carnes y Aves',
    seccion: 'Pasillo 2 - Carnes',
    subseccion: 'Aves y Pollo',
    marca: 'GranjaSol',
    condicion: 'Nacional',
    anio_inicio: 2000,
    anio_fin: 2026,
    precio_usd: 5.80,
    stock: 25,
    imagen_urls: ['https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=500'],
    es_promo: true,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: true,
    detalle_adicional: 'Pollo fresco libre de hormonas, lavado y empacado de forma segura.'
  },
  {
    id: 'a4829bef-0c7f-4b08-be94-7123aa123b06',
    codigo: 'CHRC-SERR-JAM',
    nombre: 'Jamon Serrano Bodega Reserva 150g',
    descripcion: 'Jamon serrano curado artesanalmente en bodega. Rebanadas finas de intenso sabor y excelente aroma español.',
    categoria: 'Charcutería',
    seccion: 'Pasillo 1 - Lacteos',
    subseccion: 'Quesos y Embutidos',
    marca: 'Campestre',
    condicion: 'Nacional',
    anio_inicio: 2000,
    anio_fin: 2026,
    precio_usd: 8.20,
    stock: 20,
    imagen_urls: ['https://images.unsplash.com/photo-1524438418049-b04be11b576d?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: true,
    es_mas_vendido: true,
    delivery_gratis: false,
    detalle_adicional: 'Listo para consumir. Ideal con pan con tomate o tablas de quesos.'
  },
  {
    id: 'a4829bef-0c7f-4b08-be94-7123aa123b07',
    codigo: 'CHRC-PROS-ITA',
    nombre: 'Prosciutto Italiano Di Parma Rebanado 100g',
    descripcion: 'Prosciutto curado italiano original. Sabor balanceado y textura sedosa que se derrite en la boca.',
    categoria: 'Charcutería',
    seccion: 'Pasillo 1 - Lacteos',
    subseccion: 'Quesos y Embutidos',
    marca: 'Torondoy',
    condicion: 'Nacional',
    anio_inicio: 2000,
    anio_fin: 2026,
    precio_usd: 9.90,
    stock: 15,
    imagen_urls: ['https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=500'],
    es_promo: true,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: true,
    detalle_adicional: 'Conservar refrigerado. Abrir 10 minutos antes de consumir.'
  },
  {
    id: 'a4829bef-0c7f-4b08-be94-7123aa123b08',
    codigo: 'FRV-FRES-MER',
    nombre: 'Fresas Organicas Seleccionadas del Valle 500g',
    descripcion: 'Fresas organicas cosechadas en altura en Merida. Gran sabor dulce natural y consistencia firme.',
    categoria: 'Frutas y Verduras',
    seccion: 'Pasillo 2 - Frescos',
    subseccion: 'Frutas y Vegetales',
    marca: 'ValleFresco',
    condicion: 'Nacional',
    anio_inicio: 2000,
    anio_fin: 2026,
    precio_usd: 4.20,
    stock: 18,
    imagen_urls: ['https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&q=80&w=500'],
    es_promo: true,
    es_nuevo: true,
    es_mas_vendido: false,
    delivery_gratis: false,
    detalle_adicional: 'Lavar y desinfectar bien. Mantener refrigerado.'
  },
  {
    id: 'a4829bef-0c7f-4b08-be94-7123aa123b09',
    codigo: 'FRV-AGUA-HAS',
    nombre: 'Aguacate Hass Maduro Premium Pack de 3',
    descripcion: 'Aguacates de variedad Hass seleccionados en su punto optimo de maduracion. Textura suave como mantequilla.',
    categoria: 'Frutas y Verduras',
    seccion: 'Pasillo 2 - Frescos',
    subseccion: 'Frutas y Vegetales',
    marca: 'EcoGranja',
    condicion: 'Nacional',
    anio_inicio: 2000,
    anio_fin: 2026,
    precio_usd: 3.50,
    stock: 30,
    imagen_urls: ['https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: true,
    delivery_gratis: false,
    detalle_adicional: 'Ideal para guacamole o rebanar de inmediato.'
  },
  {
    id: 'a4829bef-0c7f-4b08-be94-7123aa123b10',
    codigo: 'DSP-OLIV-ESP',
    nombre: 'Aceite de Oliva Extra Virgen Andaluz 500ml',
    descripcion: 'Aceite de oliva extra virgen prensado en frio en España. Sabor equilibrado frutal excelente para aderezos.',
    categoria: 'Víveres y Despensa',
    seccion: 'Pasillo 3 - Despensa',
    subseccion: 'Aceites y Abarrotes',
    marca: 'Carbonell',
    condicion: 'Importado',
    anio_inicio: 2000,
    anio_fin: 2026,
    precio_usd: 9.50,
    stock: 40,
    imagen_urls: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: true,
    es_mas_vendido: true,
    delivery_gratis: false,
    detalle_adicional: 'Acidez inferior a 0.4%. Almacenar en lugar seco y oscuro.'
  },
  {
    id: 'a4829bef-0c7f-4b08-be94-7123aa123b11',
    codigo: 'DSP-ARRO-BAS',
    nombre: 'Arroz Extra Premium Basmati Aromatico 1kg',
    descripcion: 'Arroz basmati de grano extra largo y gran fragancia. Su coccion suelta es ideal para recetas asiaticas o gourmet.',
    categoria: 'Víveres y Despensa',
    seccion: 'Pasillo 3 - Despensa',
    subseccion: 'Arroces y Granos',
    marca: 'Royal',
    condicion: 'Importado',
    anio_inicio: 2000,
    anio_fin: 2026,
    precio_usd: 3.90,
    stock: 35,
    imagen_urls: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    detalle_adicional: 'Naturalmente libre de gluten. Cocinar con doble medida de agua.'
  },
  {
    id: 'a4829bef-0c7f-4b08-be94-7123aa123b12',
    codigo: 'PAN-BAGU-ART',
    nombre: 'Pan Baguette Artesanal de Masa Madre 250g',
    descripcion: 'Pan tipo baguette artesanal cocido en horno de piedra. Corteza crujiente y miga esponjosa y aireada.',
    categoria: 'Panadería y Pastelería',
    seccion: 'Pasillo 4 - Panaderia',
    subseccion: 'Panes Frescos',
    marca: 'El Rey',
    condicion: 'Nacional',
    anio_inicio: 2000,
    anio_fin: 2026,
    precio_usd: 1.20,
    stock: 40,
    imagen_urls: ['https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80&w=500'],
    es_promo: true,
    es_nuevo: true,
    es_mas_vendido: false,
    delivery_gratis: false,
    detalle_adicional: 'Elaborado el dia de hoy con harina de trigo fortificada.'
  },
  {
    id: 'a4829bef-0c7f-4b08-be94-7123aa123b13',
    codigo: 'PAN-CROI-BUT',
    nombre: 'Croissant Frances Genuino de Mantequilla Pack x4',
    descripcion: 'Pack de 4 croissants elaborados con hojaldre frances real y mantequilla premium. Crujientes por fuera y suaves por dentro.',
    categoria: 'Panadería y Pastelería',
    seccion: 'Pasillo 4 - Panaderia',
    subseccion: 'Panes Frescos',
    marca: 'El Rey',
    condicion: 'Nacional',
    anio_inicio: 2000,
    anio_fin: 2026,
    precio_usd: 4.50,
    stock: 15,
    imagen_urls: ['https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: true,
    delivery_gratis: true,
    detalle_adicional: 'Consumir fresco o entibiar 2 minutos en horno convencional.'
  },
  {
    id: 'a4829bef-0c7f-4b08-be94-7123aa123b14',
    codigo: 'BEB-NAR-ORG',
    nombre: 'Nectar de Naranja Organica Exprimida 1L',
    descripcion: 'Jugo natural de naranja exprimida al momento, sin azucar ni agua agregada. 100% puro sabor citrico natural.',
    categoria: 'Bebidas y Jugos',
    seccion: 'Pasillo 2 - Frescos',
    subseccion: 'Bebidas y Licores',
    marca: 'GranjaSol',
    condicion: 'Nacional',
    anio_inicio: 2000,
    anio_fin: 2026,
    precio_usd: 2.80,
    stock: 35,
    imagen_urls: ['https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    detalle_adicional: 'Rico en Vitamina C natural. Agitar antes de abrir.'
  },
  {
    id: 'a4829bef-0c7f-4b08-be94-7123aa123b15',
    codigo: 'SNC-CHOC-DAR',
    nombre: 'Chocolate Oscuro 70% Cacao Carenero Superior 80g',
    descripcion: 'Tableta de chocolate gourmet con 70% de puro cacao fino de aroma del tipo Carenero Superior. Sabor profundo con notas frutales.',
    categoria: 'Snacks y Dulces',
    seccion: 'Pasillo 3 - Despensa',
    subseccion: 'Confiteria y Snacks',
    marca: 'El Rey',
    condicion: 'Nacional',
    anio_inicio: 2000,
    anio_fin: 2026,
    precio_usd: 3.50,
    stock: 50,
    imagen_urls: ['https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&q=80&w=500'],
    es_promo: true,
    es_nuevo: true,
    es_mas_vendido: true,
    delivery_gratis: false,
    detalle_adicional: 'Cacao venezolano de origen unico, libre de aditivos artificiales.'
  }
];

const DEFAULT_CONFIG: StoreConfig = {
  site_nombre: 'Marketo',
  telefono_soporte: '+584124976451',
  direccion_fisica: 'Av. Bolívar Norte con Calle 140, Sector Las Acacias, local #12, Valencia, Carabobo',
  coordenadas_tienda: { lat: 10.198300, lng: -68.004400 },
  banners: [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200', // Fresh produce banner
    'https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?auto=format&fit=crop&q=80&w=1200', // Supermarket aisles banner
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=1200'  // Organic items & details banner
  ],
  zelle_enabled: true,
  zelle_data: 'pagos@marketo.com.ve',
  zelle_discount_percent: 0,
  pagomovil_enabled: true,
  pagomovil_data: 'Banesco (0134) - RIF J-50123456-7 - Tel: 0412-4976451',
  pagomovil_discount_percent: 0,
  efectivo_enabled: true,
  efectivo_data: 'Paga al motorizado en efectivo (USD/Bs) al recibir tu delivery',
  efectivo_discount_percent: 0,
  transferencia_enabled: true,
  transferencia_data: 'Banesco Cuenta Corriente - 0134-1122-33-4455667788 - Marketo C.A. - RIF J-50123456-7',
  transferencia_discount_percent: 0,
  tasa_cambio: 36.50,
  logo_url: '',
  theme_color: '#7c3aed', // Aesthetic Violet theme color
  delivery_gratis: false,
  costo_delivery_km: 1.5,
  envio_nacional: true,
  costo_envio_nacional: 5.0,
  favicon_url: '',
  banner_texts: [
    'Frescura garantizada directo a tu hogar',
    'Pasillos llenos de productos nacionales e importados',
    'Panaderia, charcuteria y cortes selectos'
  ],
  categories: [
    'Lácteos y Quesos',
    'Carnes y Aves',
    'Charcutería',
    'Frutas y Verduras',
    'Víveres y Despensa',
    'Panadería y Pastelería',
    'Bebidas y Jugos',
    'Snacks y Dulces'
  ]
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persistence state loaders
  const [products, setProducts] = useState<Producto[]>(() => {
    const saved = localStorage.getItem('trv_products');
    return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('trv_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('trv_coupons');
    return saved ? JSON.parse(saved) : [];
  });

  const [config, setConfig] = useState<StoreConfig>(() => {
    const saved = localStorage.getItem('trv_config');
    if (saved) {
      try {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_CONFIG;
      }
    }
    return DEFAULT_CONFIG;
  });

  const [notifications, setNotifications] = useState<InAppNotification[]>(() => {
    const saved = localStorage.getItem('trv_notifications');
    return saved ? JSON.parse(saved) : [
      {
        id: 'init-notif',
        titulo: 'Bienvenidos a Marketo',
        mensaje: 'Encuentra los mejores cortes de carne, quesos madurados y viveres frescos con delivery express en Valencia.',
        fecha: new Date().toLocaleDateString(),
        tipo: 'todos',
        leida: false
      }
    ];
  });

  const [isGlobalLoading, setIsGlobalLoading] = useState(true);

  const [cart, setCart] = useState<{ item: Producto; quantity: number }[]>(() => {
    const saved = localStorage.getItem('trv_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('trv_admin_auth') === 'true';
  });

  const [adminUser, setAdminUser] = useState<string>(() => {
    const saved = localStorage.getItem('trv_admin_user')?.trim();
    return saved && saved.length > 0 ? saved : 'admin';
  });

  const [adminPass, setAdminPass] = useState<string>(() => {
    const saved = localStorage.getItem('trv_admin_pass')?.trim();
    return saved && saved.length > 0 ? saved : 'admin123';
  });

  const [displayCurrency, setDisplayCurrency] = useState<'USD' | 'BS'>(() => {
    return (localStorage.getItem('trv_currency') as 'USD' | 'BS') || 'USD';
  });

  const [hapticEnabled, setHapticEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('trv_haptic_enabled');
    return saved === null ? true : saved === 'true';
  });

  const hapticEnabledRef = useRef(hapticEnabled);
  useEffect(() => {
    hapticEnabledRef.current = hapticEnabled;
  }, [hapticEnabled]);

  const toggleHaptic = () => {
    const newVal = !hapticEnabled;
    setHapticEnabled(newVal);
    localStorage.setItem('trv_haptic_enabled', String(newVal));
  };

  const toggleCurrency = () => {
    const newCurrency = displayCurrency === 'USD' ? 'BS' : 'USD';
    setDisplayCurrency(newCurrency);
    localStorage.setItem('trv_currency', newCurrency);
  };

  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem('trv_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('trv_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('trv_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // --- MOTOR DE TIEMPO REAL (SUPABASE CHANNELS) ---
  const currentUserRef = useRef<AppUser | null>(currentUser);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const playNotificationSound = (type: 'new' | 'update', status?: Order['status']) => {
    const soundUrl = type === 'new' 
      ? 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3' // Sonido de Caja Registradora para nuevos pedidos
      : 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'; // Sonido Ding para actualizaciones
    const audio = new Audio(soundUrl);
    audio.play().catch(() => console.log('Audio playback blocked by browser'));

    if (hapticEnabledRef.current && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (type === 'update' && status === 'En camino') {
        navigator.vibrate(100); // Vibración corta para avisar al cliente que su pedido salió
      }
      if (type === 'new') {
        navigator.vibrate([200, 100, 200]);
      }
    }
  };

  useEffect(() => {
    let mainChannel: any = null;

    try {
      // CANAL UNIFICADO PARA BROADCAST Y POSTGRES CHANGES
      mainChannel = supabase.channel('marketo_realtime_system');

      mainChannel
        // Escuchar cambios en Configuración
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'store_config' }, payload => {
          const newRow = (payload as any)?.new;
          if (newRow) {
            setConfig(prev => ({
              ...prev,
              ...newRow,
              tasa_cambio: Number(newRow.tasa_cambio) || prev.tasa_cambio,
              coordenadas_tienda: newRow.tienda_lat ? { lat: newRow.tienda_lat, lng: newRow.tienda_lng } : prev.coordenadas_tienda,
              banners: [newRow.banner_url_1, newRow.banner_url_2, newRow.banner_url_3].filter(Boolean).length > 0 
                ? [newRow.banner_url_1, newRow.banner_url_2, newRow.banner_url_3].filter(Boolean)
                : prev.banners
            }));
          }
        })
        // Escuchar cambios en Pedidos (CDC)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, payload => {
          const updated = payload.new as Order;
          const old = payload.old as Order;

          if (!updated?.id) return;
          
          // Si el status cambió, emitir sonido
          if (old && old.status !== updated.status) {
            playNotificationSound('update', updated.status);
          }

          setOrders(prev =>
            prev.map(o =>
              o.id === updated.id
                ? { ...o, status: updated.status, tiempo_estimado_entrega: updated.tiempo_estimado_entrega }
                : o
            )
          );

          const cu = currentUserRef.current;
          if (cu && updated.cliente_telefono === cu.telefono) {
            if ('Notification' in window && Notification.permission === 'granted') {
              const direccion = updated.direccion_envio || '';
              const tiempo = updated.tiempo_estimado_entrega || '';
              const extras = [direccion ? `Ubicación: ${direccion}` : '', tiempo ? `Tiempo estimado: ${tiempo}` : '']
                .filter(Boolean)
                .join(' • ');

              new Notification('Marketo: Actualización de Pedido', {
                body: `Tu pedido ${updated.id} ahora está: ${updated.status}${extras ? `\n${extras}` : ''}`,
                icon: '/icon.png'
              });
            }
          }
        })
        // Escuchar Pedidos Nuevos vía BROADCAST (Ultra Rápido)
        .on('broadcast', { event: 'new_order_broadcast' }, (payload: any) => {
          const newOrder = payload.payload;
          setOrders(prev => [newOrder, ...prev]);
          window.dispatchEvent(new CustomEvent('new_order_received', { detail: newOrder }));
          playNotificationSound('new');
          
          if ('Notification' in window && Notification.permission === 'granted') {
             new Notification('¡NUEVO PEDIDO!', { body: `Cliente: ${newOrder.cliente_nombre} - Total: $${newOrder.total_usd}` });
          }
        })
        // Escuchar Notificaciones (CDC)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
          const newNotif = payload.new as InAppNotification;
          
          // Validar si es para todos o específicamente para el usuario actual
          const cu = currentUserRef.current;
          const isForMe = newNotif.tipo === 'todos' || 
                         (cu && newNotif.destinatario_telefono === cu.telefono) ||
                         (isAdminAuthenticated && newNotif.tipo === 'request');

          if (isForMe) {
            setNotifications(prev => [newNotif, ...prev]);
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(newNotif.titulo, { body: newNotif.mensaje });
            }
          }
        })
        // Escuchar cambios en Productos (CDC)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'products' },
          payload => {
            const inserted = (payload as any)?.new;
            if (!inserted?.id) return;

            setProducts(prev => {
              const idxById = prev.findIndex(p => p.id === inserted.id);
              if (idxById >= 0) {
                const copy = [...prev];
                copy[idxById] = { ...copy[idxById], ...inserted };
                return copy;
              }

              // fallback por codigo
              const idxByCode = prev.findIndex(p => p.codigo === inserted.codigo);
              if (idxByCode >= 0) {
                const copy = [...prev];
                copy[idxByCode] = { ...copy[idxByCode], ...inserted };
                return copy;
              }

              return [inserted as Producto, ...prev];
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'products' },
          payload => {
            const updated = (payload as any)?.new;
            if (!updated?.id) return;

            setProducts(prev => {
              // Upsert por id
              const idxById = prev.findIndex(p => p.id === updated.id);
              if (idxById >= 0) {
                const copy = [...prev];
                copy[idxById] = { ...copy[idxById], ...updated };
                return copy;
              }

              // fallback por codigo
              const idxByCode = prev.findIndex(p => p.codigo === updated.codigo);
              if (idxByCode >= 0) {
                const copy = [...prev];
                copy[idxByCode] = { ...copy[idxByCode], ...updated };
                return copy;
              }

              return [updated as Producto, ...prev];
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'products' },
          payload => {
            const deleted = (payload as any)?.old;
            if (!deleted) return;

            setProducts(prev => {
              const byId = deleted.id ? prev.filter(p => p.id !== deleted.id) : prev;
              const byCode = deleted.codigo ? byId.filter(p => p.codigo !== deleted.codigo) : byId;
              return byCode;
            });
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Conectado al sistema Realtime de Marketo');
          }
        });

    } catch (e) {
      console.error('Realtime channels failed:', e);
    }

    setIsGlobalLoading(false);
    return () => {
      if (mainChannel) supabase.removeChannel(mainChannel);
    };
  }, [currentUser]);
  useEffect(() => {
    localStorage.setItem('trv_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('trv_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('trv_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('trv_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('trv_coupons', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem('trv_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('trv_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('trv_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('trv_admin_user', adminUser);
    localStorage.setItem('trv_admin_pass', adminPass);
  }, [adminUser, adminPass]);

  // Daily Exchange Rate Update Routine
  const fetchExchangeRate = async () => {
    try {
      console.log('🔍 Marketo: Verificando tasa de cambio oficial BCV...');
      const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
      if (response.ok) {
        const data = await response.json();
        // DolarAPI retorna el campo 'valor' con la tasa oficial
        const rateValue = data.valor;
        if (rateValue) {
          const newRate = parseFloat(rateValue);
          // Rango de seguridad realista para evitar picos erróneos (ej. 526)
          if (!isNaN(newRate) && newRate > 1 && newRate < 1000) {
            updateExchangeRate(newRate);
            localStorage.setItem('trv_last_rate_fetch', new Date().toDateString());
            console.log(`✅ Tasa BCV actualizada automáticamente: ${newRate} Bs.`);
          } else {
            console.warn('Tasa de cambio fuera de rango lógico, ignorando:', newRate);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch BCV rate:', error);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setIsGlobalLoading(true);
      const lastFetch = localStorage.getItem('trv_last_rate_fetch');
      const today = new Date().toDateString();

      // Cargar productos de Supabase
      const { data: dbProducts } = await supabase.from('products').select('*').eq('activo', true);
      if (dbProducts) setProducts(dbProducts as Producto[]);
      
      // Cargar configuración COMPLETA de la tienda
      const { data: dbConfig } = await supabase.from('store_config').select('*').single();
      if (dbConfig) {
        setConfig(prev => ({
          ...prev,
          esta_abierta: dbConfig.esta_abierta,
          site_nombre: dbConfig.site_nombre || prev.site_nombre,
          telefono_soporte: dbConfig.telefono_soporte || prev.telefono_soporte,
          direccion_fisica: dbConfig.direccion_fisica || prev.direccion_fisica,
          tasa_cambio: dbConfig.tasa_cambio || prev.tasa_cambio,
          coordenadas_tienda: { lat: dbConfig.tienda_lat, lng: dbConfig.tienda_lng },
          banners: [dbConfig.banner_url_1, dbConfig.banner_url_2, dbConfig.banner_url_3].filter(Boolean),
          pagomovil_data: dbConfig.pagomovil_data,
          zelle_data: dbConfig.zelle_data,
          efectivo_data: dbConfig.efectivo_data,
          transferencia_data: dbConfig.transferencia_data
        }));
      }

      // Cargar cupones
      const { data: dbCoupons } = await supabase.from('coupons').select('*');
      if (dbCoupons) setCoupons(dbCoupons as Coupon[]);

      // BUG FIX: Si es admin, cargar TODO. Si es cliente, cargar lo propio.
      const { data: { session } } = await supabase.auth.getSession();
      const isAdmin = session?.user.email === 'kecho8a@gmail.com' || session?.user.app_metadata?.role === 'admin';

      if (isAdmin) {
        setIsAdminAuthenticated(true);
        // Cargar TODO para el admin ignorando filtros de usuario
        const [ordersRes, usersRes, notifsRes] = await Promise.all([
          supabase.from('orders').select('*').order('fecha', { ascending: false }),
          supabase.from('usuarios_clientes').select('*'),
          supabase.from('notifications').select('*').order('created_at', { ascending: false })
        ]);

        if (ordersRes.data) setOrders(ordersRes.data as Order[]);
        if (usersRes.data) setUsers(usersRes.data.map(u => ({ ...u, createdAt: u.created_at, contrasena: 'managed' })));
        if (notifsRes.data) setNotifications(notifsRes.data as InAppNotification[]);
      } else if (currentUser) {
        // Cargar Pedidos del usuario (por teléfono o ID)
        const { data: dbOrders } = await supabase.from('orders')
          .select('*')
          .or(`cliente_telefono.eq."${currentUser.telefono}",cliente_uid.eq."${currentUser.id}"`)
          .order('fecha', { ascending: false });
        if (dbOrders) setOrders(dbOrders as Order[]);

        // Cargar Notificaciones (Globales y personales)
        const { data: dbNotifs } = await supabase.from('notifications')
          .select('*')
          .or(`tipo.eq.todos,destinatario_telefono.eq."${currentUser.telefono}"`)
          .order('id', { ascending: false });
        if (dbNotifs) setNotifications(dbNotifs as InAppNotification[]);
      }

      if (lastFetch !== today) {
        await fetchExchangeRate();
      }
      setIsGlobalLoading(false);
    };
    initData();
  }, [currentUser, isAdminAuthenticated]); // Re-ejecutar al cambiar login o admin

  const toggleFavorite = (partId: string) => {
    setFavorites(prev => 
      prev.includes(partId) ? prev.filter(id => id !== partId) : [...prev, partId]
    );
  };

  const isFavorite = (partId: string) => {
    return favorites.includes(partId);
  };

  const requestPart = (nombre: string, telefono: string, descripcion: string, imagenUrl?: string) => {
    addNotification(
      'Nueva Solicitud de Producto Especial 🍏',
      `Solicitud de: ${nombre} (${telefono})\n\nProducto: ${descripcion}${imagenUrl ? `\n\nImagen disponible` : ''}`,
      'request',
      telefono
    );
     // Also notify user that request was received
     addNotification(
      'Solicitud de Producto Recibida',
      `Hola ${nombre}, hemos recibido tu solicitud para "${descripcion.substring(0, 30)}...". Un agente de Marketo te contactará pronto.`,
      'personal',
      telefono
    );
  };

  // Catalog CRUD Functions
  const addProduct = (productData: Omit<Producto, 'id'>) => {
    // No generamos ID manual para productos para que Supabase use gen_random_uuid()
    addNotification('Procesando...', `Agregando ${productData.nombre} al catálogo.`);
    
    // Supabase Async Sync
    supabase.from('products').insert([{
      codigo: productData.codigo,
      nombre: productData.nombre,
      descripcion: productData.descripcion,
      categoria: productData.categoria,
      seccion: productData.seccion,
      subseccion: productData.subseccion,
      precio_usd: productData.precio_usd,
      stock: productData.stock,
      imagen_urls: productData.imagen_urls || [],
      es_promo: productData.es_promo,
      es_nuevo: productData.es_nuevo,
      es_mas_vendido: productData.es_mas_vendido
    }]).select().single().then(({ data, error }) => { 
      if (error) console.error('Add part error:', error);
      if (data) setProducts(prev => [data as Producto, ...prev]);
    });
  };

  const updateProduct = (id: string, updated: Partial<Producto>) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const updatedPart = { ...p, ...updated };
        
        // Supabase Async Sync
        const updatePayload: any = { ...updated };
        delete updatePayload.id; // avoid id conflicts
        supabase.from('products').update(updatePayload).eq('codigo', updatedPart.codigo)
          .then(({ error }) => { if (error) console.error('Update part error:', error); });
          
        return updatedPart;
      }
      return p;
    }));
  };

  const deleteProduct = (id: string) => {
    const targetPart = products.find(p => p.id === id);
    if (targetPart) {
      supabase.from('products').delete().eq('codigo', targetPart.codigo)
        .then(({ error }) => { if (error) console.error('Delete part error:', error); });
    }
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Buscador Inteligente de Supermercado (Lógica Semántica)
  const searchPartsSemantically = (query: string): Producto[] => {
    if (!query || query.trim() === '') return products.filter(p => p.activo !== false);
    
    const cleanQuery = query.toLowerCase().trim();
    const tokens = cleanQuery.split(/\s+/);
    
    // Filtrado opcional por año (útil para añadas de licores o vigencia de combos)
    let queryYear: number | null = null;
    const remainingTokens: string[] = [];
    
    for (const token of tokens) {
      const parsedNum = parseInt(token);
      if (!isNaN(parsedNum) && parsedNum >= 1980 && parsedNum <= 2026) {
        queryYear = parsedNum;
      } else {
        remainingTokens.push(token);
      }
    }
    
    return products.filter(part => {
      // 0. Only active parts
      if (part.activo === false) {
        return false;
      }

      // 1. Year Match (anio_inicio <= queryYear <= anio_fin)
      if (queryYear !== null) {
        if (part.anio_inicio > queryYear || part.anio_fin < queryYear) {
          return false;
        }
      }
      
      // If there are no other keywords, just filter by compatible year
      if (remainingTokens.length === 0) return true;
      
      // Búsqueda por palabras clave en campos relevantes (Nombre, Marca, Sección, etc.)
      const partSearchText = `${part.nombre} ${part.codigo} ${part.descripcion} ${part.categoria} ${part.seccion} ${part.subseccion} ${part.marca} ${part.condicion} ${part.delivery_gratis ? 'delivery gratis' : ''} ${part.detalle_adicional || ''}`.toLowerCase();
      
      // Enforce AND logic or highly relevant matching
      return remainingTokens.every(tok => partSearchText.includes(tok));
    });
  };

  // Cart Actions
  const addToCart = (part: Producto, qty = 1) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.item.id === part.id);
      if (idx > -1) {
        const currentQty = prev[idx].quantity;
        const targetQty = Math.min(part.stock, currentQty + qty);
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: targetQty };
        return copy;
      } else {
        return [...prev, { item: part, quantity: Math.min(part.stock, qty) }];
      }
    });
  };

  const removeFromCart = (partId: string) => {
    setCart(prev => prev.filter(item => item.item.id !== partId));
  };

  const updateCartQuantity = (partId: string, quantity: number) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.item.id === partId);
      if (idx > -1) {
        const partStock = prev[idx].item.stock;
        const targetQty = Math.max(1, Math.min(partStock, quantity));
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: targetQty };
        return copy;
      }
      return prev;
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  // Orders Management
  const createOrder = async (orderData: Omit<Order, 'id' | 'subtotal_usd' | 'total_usd' | 'total_bs' | 'fecha' | 'status'> & { descuento_cupon_usd?: number; cupon_codigo?: string }, preGeneratedId?: string) => {
    // Recalculate Totals securely
    const items = cart.map(item => ({
      part_id: item.item.id,
      nombre: item.item.nombre,
      codigo: item.item.codigo,
      precio_usd: item.item.precio_usd,
      cantidad: item.quantity
    }));

    const subtotal = items.reduce((acc, item) => acc + (item.precio_usd * item.cantidad), 0);
    console.log('Subtotal:', subtotal);
    
    // Apply discount based on payment method
    let discountPercent = 0;
    if (orderData.metodo_pago === 'Pago Móvil') discountPercent = config.pagomovil_discount_percent || 0;
    else if (orderData.metodo_pago === 'Zelle') discountPercent = config.zelle_discount_percent || 0;
    else if (orderData.metodo_pago === 'Efectivo') discountPercent = config.efectivo_discount_percent || 0;
    else if (orderData.metodo_pago === 'Transferencia') discountPercent = config.transferencia_discount_percent || 0;
    
    console.log('Discount Percent:', discountPercent, 'Payment Method:', orderData.metodo_pago);
    
    const discountAmount = (subtotal || 0) * ((discountPercent || 0) / 100);
    const subtotalAfterDiscount = (subtotal || 0) - (discountAmount || 0) - (orderData.descuento_cupon_usd || 0);
    
    console.log('Discount Amount:', discountAmount, 'Costo Envío:', orderData.costo_envio_usd);
    
    const totalUsd = (subtotalAfterDiscount || 0) + (orderData.costo_envio_usd || 0);
    const totalBs = (totalUsd || 0) * (config.tasa_cambio || 1);

    console.log('Total USD:', totalUsd, 'Total BS:', totalBs);



    const newOrder: Order = {
      ...orderData,
      id: preGeneratedId || `PED-${Math.floor(1000 + Math.random() * 9000)}-VAL-${new Date().getFullYear()}`,
      usuario_id: orderData.usuario_id || (currentUser ? currentUser.id : undefined),
      items,
      subtotal_usd: subtotal,
      total_usd: totalUsd,
      total_bs: totalBs,
      status: 'Pendiente',
      fecha: new Date().toLocaleString()
    };

    // 1. Rebajar stock en Supabase (Persistencia Real)
    for (const cartItem of cart) {
      const nextStock = Math.max(0, cartItem.item.stock - cartItem.quantity);
      await supabase.from('products').update({ stock: nextStock }).eq('id', cartItem.item.id);
      
      if (cartItem.item.stock >= 5 && nextStock < 5) {
        addNotification(
          'Alerta de Stock Bajo (Admin)',
          `El producto "${cartItem.item.nombre}" tiene un nivel crítico de ${nextStock} unidades.`,
          'admin'
        );
      }
    }

    // Supabase Insert
    const { error } = await supabase.from('orders').insert([{
      id: newOrder.id,
      cliente_nombre: newOrder.cliente_nombre,
      cliente_telefono: newOrder.cliente_telefono,
      cliente_email: newOrder.cliente_email,
      cliente_uid: newOrder.usuario_id,
      items: newOrder.items,
      descuento_cupon_usd: orderData.descuento_cupon_usd || 0,
      cupon_codigo: orderData.cupon_codigo || null,
      subtotal_usd: newOrder.subtotal_usd,
      costo_envio_usd: newOrder.costo_envio_usd,
      total_usd: newOrder.total_usd,
      total_bs: newOrder.total_bs,
      metodo_pago: newOrder.metodo_pago,
      lat: newOrder.lat,
      lng: newOrder.lng,
      direccion_envio: newOrder.direccion_envio,
      distancia_km: newOrder.distancia_km,
      status: newOrder.status,
      tiempo_estimado_entrega: newOrder.tiempo_estimado_entrega,
      fecha: new Date().toISOString()
    }]);

    if (error) {
      console.error('Insert order error:', error);
      return null;
    }

    setOrders(prev => [newOrder, ...prev]);
    clearCart();

    // BROADCAST: Enviar señal inmediata al Admin sin esperar a la DB
    supabase.channel('marketo_realtime_system').send({
      type: 'broadcast',
      event: 'new_order_broadcast',
      payload: newOrder
    });

    // Trigger Notification for the store and the client
    addNotification('Nuevo Pedido Recibido', `Pedido ${newOrder.id} fue procesado correctamente para ${newOrder.cliente_nombre}.`);

    // Add notification specifically for the admin
    addNotification(
      'Nuevo Pedido Recibido',
      `Se ha recibido un nuevo pedido con el ID: ${newOrder.id} del cliente "${newOrder.cliente_nombre}".`,
      'admin'
    );

    // If the order has a targeted user or phone, notify them
    if (newOrder.cliente_telefono) {
      addNotification(
        'Pedido Recibido con Éxito 📦',
        `Hola ${newOrder.cliente_nombre}! Tu pedido con ID ${newOrder.id} por un monto de $${newOrder.total_usd.toFixed(2)} (${newOrder.total_bs.toFixed(2)} Bs) ha sido ingresado en estado: Pendiente. Estamos listos para atenderte.`,
        'personal',
        newOrder.cliente_telefono
      );
    }

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: Order['status'], estimatedTime?: string, notas?: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { 
      ...o, 
      status, 
      tiempo_estimado_entrega: estimatedTime !== undefined ? estimatedTime : o.tiempo_estimado_entrega,
      notas_admin: notas !== undefined ? notas : o.notas_admin 
    } : o));
    
    // Find who placed the order and send a profile notification
    const orderObj = orders.find(o => o.id === orderId);
    const targetPhone = orderObj?.cliente_telefono;
    const clientName = orderObj?.cliente_nombre || 'Cliente';
    
    let statusMsg = `Tu pedido ${orderId} ahora se encuentra en estado: ${status}.`;
    if (status === 'En preparación') {
      statusMsg = `🥬 ¡Buenas noticias, ${clientName}! Tu pedido ${orderId} ya está en preparación en nuestros almacenes de Las Acacias.`;
    } else if (status === 'En camino') {
      statusMsg = `🛵 ¡Tu pedido ${orderId} va en camino! Nuestro motorizado se dirige a tu ubicación en Valencia con cadena de frío.`;
    } else if (status === 'Entregado') {
      statusMsg = `✅ Pedido ${orderId} entregado con éxito. ¡Gracias por preferir a Marketo!`;
    } else {
      statusMsg = `El pedido ${orderId} ahora se encuentra en estado: ${status}.`;
    }
    
    if (estimatedTime) {
      statusMsg += ` Tiempo estimado de entrega: ${estimatedTime}.`;
    }
    
    addNotification('Estado de Pedido Actualizado', statusMsg, 'todos');
    
    if (targetPhone) {
      addNotification('Estado de Pedido Actualizado', statusMsg, 'personal', targetPhone);
    }
    
    if (orderObj) {
      const updatePayload: any = { status };
      if (estimatedTime !== undefined) {
        updatePayload.tiempo_estimado_entrega = estimatedTime;
      }
      if (notas !== undefined) {
        updatePayload.notas_admin = notas;
      }
      supabase.from('orders')
        .update(updatePayload)
        .eq('id', orderId)
        .then(({ error }) => { if (error) console.error('Update order status error:', error); });
    }
  };

  const updateOrderItems = async (orderId: string, newItems: OrderItem[]) => {
    const originalOrder = orders.find(o => o.id === orderId);
    if (!originalOrder) return;

    const oldItems = originalOrder.items;

    // Lógica para sincronizar stock automáticamente
    const stockChanges = new Map<string, number>();

    // Restamos las cantidades viejas del balance (las devolvemos al stock teóricamente)
    oldItems.forEach(item => {
      stockChanges.set(item.part_id, -(item.cantidad || 0));
    });

    // Sumamos las cantidades nuevas (las restamos del stock teóricamente)
    newItems.forEach(item => {
      const current = stockChanges.get(item.part_id) || 0;
      stockChanges.set(item.part_id, current + (item.cantidad || 0));
    });

    // Aplicar cambios en la base de datos
    for (const [partId, diff] of stockChanges.entries()) {
      if (diff === 0) continue;
      const { data: p } = await supabase.from('products').select('stock').eq('id', partId).single();
      if (p) {
        const nextStock = Math.max(0, p.stock - diff);
        await supabase.from('products').update({ stock: nextStock }).eq('id', partId);
      }
    }

    // Recalcular totales basados en la nueva lista de items
    const subtotal = newItems.reduce((acc, item) => acc + (item.precio_usd * item.cantidad), 0);
    
    let discountPercent = 0;
    if (originalOrder.metodo_pago === 'Pago Móvil') discountPercent = config.pagomovil_discount_percent || 0;
    else if (originalOrder.metodo_pago === 'Zelle') discountPercent = config.zelle_discount_percent || 0;
    else if (originalOrder.metodo_pago === 'Efectivo') discountPercent = config.efectivo_discount_percent || 0;
    else if (originalOrder.metodo_pago === 'Transferencia') discountPercent = config.transferencia_discount_percent || 0;

    const discountAmount = subtotal * (discountPercent / 100);
    const subtotalAfterDiscount = subtotal - discountAmount - (originalOrder.descuento_cupon_usd || 0);
    const totalUsd = subtotalAfterDiscount + (originalOrder.costo_envio_usd || 0);
    const totalBs = totalUsd * config.tasa_cambio;

    const updatePayload = {
      items: newItems,
      subtotal_usd: subtotal,
      total_usd: totalUsd,
      total_bs: totalBs
    };

    const { error } = await supabase.from('orders').update(updatePayload).eq('id', orderId);
    if (error) {
      console.error('Update order items error:', error);
      throw error;
    }

    // Actualizar estado local y notificar al cliente
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updatePayload } : o));
    addNotification('Pedido Modificado', `Se han actualizado los productos de tu pedido ${orderId}. El nuevo total es $${totalUsd.toFixed(2)}.`, 'personal', originalOrder.cliente_telefono);
  };

  // --- COUPON MANAGEMENT ---
  const addCoupon = async (coupon: Omit<Coupon, 'id' | 'usage_count'>) => {
    const { data, error } = await supabase.from('coupons').insert([coupon]).select().single();
    if (error) {
      console.error('Error adding coupon:', error);
      return;
    }
    if (data) setCoupons(prev => [...prev, data as Coupon]);
  };

  const updateCoupon = async (id: string, updated: Partial<Coupon>) => {
    const { error } = await supabase.from('coupons').update(updated).eq('id', id);
    if (error) {
      console.error('Error updating coupon:', error);
      return;
    }
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
  };

  const deleteCoupon = async (id: string) => {
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) return;
    setCoupons(prev => prev.filter(c => c.id !== id));
  };

  // User Management Implementation
  const registerUser = async (nombre: string, email: string, telefono: string, contrasena: string): Promise<AppUser> => {
    // 1. Registrar primero en Supabase Auth para obtener el UID oficial
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: contrasena.trim(),
      options: { data: { nombre: nombre.trim(), telefono: telefono.trim() } }
    });

    if (authError) {
      if (authError.status === 429) {
        throw new Error("Límite de intentos alcanzado. Por favor, espere un minuto antes de intentar de nuevo.");
      }
      throw authError;
    }

    const newUser: AppUser = {
      id: authData.user?.id || `user-${Date.now()}`, // Sincronizar con el ID de Auth
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      telefono: telefono.trim(),
      contrasena: contrasena.trim(),
      createdAt: new Date().toISOString()
    };

    // NOTA: El insert en 'usuarios_clientes' lo maneja el Trigger 'on_auth_user_created' 
    // en la base de datos para evitar errores 409 de duplicidad y asegurar atomicidad.

    setUsers(prev => {
      // Remove any existing user with the same phone to avoid duplicates
      const filtered = prev.filter(u => u.telefono.trim() !== newUser.telefono.trim());
      return [...filtered, newUser];
    });
    setCurrentUser(newUser);

    addNotification(
      '¡Registro Exitoso! 🎉',
      `Hola ${newUser.nombre}. Te has registrado con éxito. Recuerda que con tu nombre, teléfono (${newUser.telefono}) y tu clave secreta podrás acceder siempre a tu panel de usuario.`,
      'personal',
      newUser.telefono
    );
    
    return newUser;
  };

  const loginUser = async (identifier: string, contrasena: string): Promise<AppUser | null> => {
    // 1. Try local list first for speed
    const cleanId = identifier.trim().toLowerCase();
    let user = users.find(u => (u.telefono.trim() === cleanId || u.email?.toLowerCase() === cleanId) && u.contrasena.trim() === contrasena.trim());
    
    // 2. If not found locally, check Supabase
    if (!user) {
      const { data, error } = await supabase
        .from('usuarios_clientes')
        .select('*')
        .or(`telefono.eq.${identifier},email.eq.${cleanId}`)
        .eq('contrasena', contrasena.trim())
        .limit(1)
        .single();
        
      if (data && !error) {
        user = {
          id: data.id,
          nombre: data.nombre,
          email: data.email,
          telefono: data.telefono,
          contrasena: data.contrasena,
          createdAt: data.created_at || new Date().toISOString()
        };
        // Add to local state
        setUsers(prev => {
          const filtered = prev.filter(u => u.id !== data.id);
          return [...filtered, user!];
        });
      }
    }

    if (user) {
      setCurrentUser(user);
      addNotification(
        'Sesión Iniciada',
        `Bienvenido de vuelta, ${user.nombre}. Accede a tus notificaciones y estatus de compras desde este panel.`,
        'personal',
        user.telefono
      );
      return user;
    }
    return null;
  };

  const sendPasswordResetEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/profile?reset=true`,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const logoutUser = () => {
    setCurrentUser(null);
  };

  const updateUser = (updated: Partial<AppUser>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updated };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

    // Update in Supabase in background
    supabase.from('usuarios_clientes')
      .update({
        nombre: updatedUser.nombre,
        telefono: updatedUser.telefono,
        contrasena: updatedUser.contrasena
      })
      .eq('id', currentUser.id)
      .then(({ error }) => {
        if (error) console.error('Error updating user in Supabase:', error);
      });

    addNotification(
      'Datos Actualizados ⚙️',
      `Tus datos han sido guardados. Nombre: ${updatedUser.nombre}, Teléfono: ${updatedUser.telefono}. Tus credenciales de acceso son tu nombre, teléfono y contraseña guardada.`,
      'personal',
      updatedUser.telefono
    );
  };

  const updateUserByAdmin = (userId: string, updated: Partial<AppUser>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updated } : u));
    
    // If the updated user is the current user, update current user too
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...updated } : null);
    }

    // Sync to Supabase in background
    const updatePayload: any = {};
    if (updated.nombre !== undefined) updatePayload.nombre = updated.nombre;
    if (updated.telefono !== undefined) updatePayload.telefono = updated.telefono;
    if (updated.contrasena !== undefined) updatePayload.contrasena = updated.contrasena;

    if (Object.keys(updatePayload).length > 0) {
      supabase.from('usuarios_clientes')
        .update(updatePayload)
        .eq('id', userId)
        .then(({ error }) => {
          if (error) console.error('Error updating user by admin in Supabase:', error);
        });
    }
  };

  const addCategory = (categoryName: string) => {
    setConfig(prev => {
      const currentCats = prev.categories || [];
      if (currentCats.includes(categoryName)) return prev;
      const updated = { ...prev, categories: [...currentCats, categoryName] };
      localStorage.setItem('trv_config', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteCategory = (categoryName: string) => {
    setConfig(prev => {
      const currentCats = prev.categories || [];
      const updated = { ...prev, categories: currentCats.filter(c => c !== categoryName) };
      localStorage.setItem('trv_config', JSON.stringify(updated));
      return updated;
    });

    setProducts(prevProducts => {
      const updatedProducts = prevProducts.map(p => {
        if (p.categoria === categoryName) {
          return { ...p, categoria: 'Víveres y Despensa' };
        }
        return p;
      });
      localStorage.setItem('trv_parts', JSON.stringify(updatedProducts));
      return updatedProducts;
    });
  };

  const updateCategory = (oldCategory: string, newCategory: string) => {
    setConfig(prev => {
      const currentCats = prev.categories || [];
      const updated = {
        ...prev,
        categories: currentCats.map(c => c === oldCategory ? newCategory : c)
      };
      localStorage.setItem('trv_config', JSON.stringify(updated));
      return updated;
    });
    setProducts(prevProducts => {
      const updatedProducts = prevProducts.map(p => {
        if (p.categoria === oldCategory) {
          return { ...p, categoria: newCategory };
        }
        return p;
      });
      localStorage.setItem('trv_parts', JSON.stringify(updatedProducts));
      return updatedProducts;
    });
  };

  // Configurations
  const updateConfig = (newSettings: Partial<StoreConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('trv_config', JSON.stringify(updated));
      
      // Supabase Async Sync
      (async () => {
        try {
          const updatePayload: any = { id: 1 }; // Siempre actualizamos la fila con id=1

          // Mapeo dinámico de todas las llaves de newSettings a updatePayload
          Object.keys(newSettings).forEach(key => {
            const value = (newSettings as any)[key];
            if (value !== undefined) {
              if (key === 'coordenadas_tienda' && value) {
                updatePayload.tienda_lat = value.lat;
                updatePayload.tienda_lng = value.lng;
              } else if (key === 'banners' && Array.isArray(value)) {
                if (value[0] !== undefined) updatePayload.banner_url_1 = value[0];
                if (value[1] !== undefined) updatePayload.banner_url_2 = value[1];
                if (value[2] !== undefined) updatePayload.banner_url_3 = value[2];
              } else {
                updatePayload[key] = value;
              }
            }
          });
          
          if (Object.keys(updatePayload).length > 0) {
            await supabase.from('store_config').upsert(updatePayload);
          }
        } catch (e) {
          console.error('Failed to sync config', e);
        }
      })();
      
      return updated;
    });
  };

  const updateExchangeRate = (rate: number) => {
    if (isNaN(rate) || rate <= 0 || rate > 1000) {
      console.warn('Tasa de cambio rechazada por seguridad:', rate);
      return;
    }
    setConfig(prev => ({ ...prev, tasa_cambio: rate }));
    
    // Sincronizar con Supabase para que todos los clientes la vean
    supabase.from('store_config').update({ tasa_cambio: rate }).eq('id', 1)
      .then(({ error }) => { if (error) console.error('Error syncing rate to DB:', error); });
  };

  // Log notifications
  const addNotification = (title: string, message: string, tipo: 'todos' | 'personal' | 'admin' | 'request' = 'todos', targetPhone?: string) => {
    const newNotif: InAppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      titulo: title,
      mensaje: message,
      fecha: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tipo,
      destinatario_telefono: targetPhone,
      leida: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Sincronización con Supabase
    supabase.from('notifications').insert([{
      id: newNotif.id,
      titulo: newNotif.titulo,
      mensaje: newNotif.mensaje,
      fecha: newNotif.fecha,
      tipo: newNotif.tipo,
      destinatario_telefono: newNotif.destinatario_telefono,
      leida: newNotif.leida
    }]).then(({ error }) => { if (error) console.error('Error sync notification:', error); });

    // Push local browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${title} - Marketo`, { body: message });
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
  };

  const toggleNotificationReadStatus = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, leida: !n.leida } : n));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Admin Auth functions
  const authenticateAdmin = async (email: string, pass: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass.trim()
      });
      if (error) {
        console.error('Supabase Auth Error:', error.message);
        return false;
      }
      if (data.session) {
        setIsAdminAuthenticated(true);
        localStorage.setItem('trv_admin_auth', 'true');
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const logoutAdmin = async () => {
    await supabase.auth.signOut();
    setIsAdminAuthenticated(false);
    localStorage.removeItem('trv_admin_auth');
  };

  const updateAdminCredentials = async (email: string, pass: string) => {
    const { error } = await supabase.auth.updateUser({
      email: email.trim(),
      password: pass.trim()
    });
    if (error) {
      alert('Error al actualizar credenciales: ' + error.message);
    } else {
      alert('Credenciales de acceso administrativo actualizadas correctamente en Supabase Auth.');
    }
  };

  return (
    <AppContext.Provider value={{
      // NOTE: the store currently uses `products` as the source of truth.
      // Keeping the exposed context API consistent with the rest of the app.
      parts: products,
      orders,
      config,
      coupons,
      notifications,
      cart,
      isAdminAuthenticated,
      isGlobalLoading,
      favorites,
      toggleFavorite,
      isFavorite,
      users,
      currentUser,
      registerUser,
      loginUser,
      logoutUser,
      sendPasswordResetEmail,
      updateUser,
      updateUserByAdmin,
      // Catalog CRUD compatibility: map legacy API names to current implementations
      addCoupon,
      updateCoupon,
      deleteCoupon,
      addPart: addProduct,
      updatePart: updateProduct,
      deletePart: deleteProduct,
      searchPartsSemantically,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      createOrder,
      updateOrderStatus,
      updateOrderItems,
      updateConfig,
      updateExchangeRate,
      fetchExchangeRate,
      addCategory,
      deleteCategory,
      updateCategory,
      addNotification,
      markNotificationAsRead,
      toggleNotificationReadStatus,
      deleteNotification,
      clearAllNotifications,
      authenticateAdmin,
      logoutAdmin,
      updateAdminCredentials,
      adminUser,
      adminPass,
      requestPart,
      displayCurrency,
      toggleCurrency,
      hapticEnabled,
      toggleHaptic
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside an AppProvider');
  }
  return context;
};
