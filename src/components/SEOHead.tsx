import React, { useEffect, useRef } from 'react';
import { Producto } from '../types/store';
import { useApp } from '../store/AppContext';

interface SEOHeadProps {
  title?: string;
  description?: string;
  type?: 'home' | 'product' | 'catalog' | 'admin';
  product?: Producto;
  filters?: {
    category?: string;
    brand?: string;
    model?: string;
    year?: string;
    engine?: string;
  };
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  type = 'home',
  product,
  filters
}) => {
  const { config } = useApp();
  const indexedDBTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 1. Dynamic Title & Description Update
    const defaultTitle = `Supermercado Online Premium en Valencia | ${config.site_nombre}`;
    const defaultDesc = `Compra víveres frescos, quesos importados, cortes premium, delicatessen y bodegón a domicilio en Valencia, San Diego y Naguanagua. Despacho rápido en empaques térmicos especializados.`;
    const defaultKeywords = `supermercado, marketo, viveres, valencia, delivery, san diego, naguanagua, quesos, carnes, gourmet, licores, carabobo`;
    
    let seoTitle = title;
    let seoDesc = description;
    let seoKeywords = defaultKeywords;

    // AIO: Automatic SEO Generation for Products
    if (type === 'product' && product) {
      seoTitle = `${product.nombre} fresco en Valencia | ${config.site_nombre || 'Supermercado'}`;
      seoDesc = `Compra ${product.nombre} ${product.condicion.toLowerCase()} de la mejor calidad. Despacho premium a domicilio en Valencia, Naguanagua y San Diego. Código SKU: ${product.codigo}. Delivery Express con cadena de frío garantizada.`;
      seoKeywords = `${product.nombre}, ${product.seccion}, ${product.subseccion}, ${product.categoria}, marketo, valencia, venezuela, carabobo, delicatessen naguanagua, gourmet san diego, sku ${product.codigo}, ${product.marca}`;
    }

    // AIO: Automatic SEO Generation for Catalog
    if (type === 'catalog') {
      const { category, brand, model, year, engine } = filters || {};
      
      const parts = [];
      if (category) parts.push(category);
      if (brand) parts.push(brand);
      if (model) parts.push(model);
      if (year) parts.push(year);
      if (engine) parts.push(engine);

      const filterText = parts.length > 0 ? parts.join(' ') : 'Víveres Fresh y Delicatessen';
      
      seoTitle = `Comprar ${filterText} en Valencia | Catálogo ${config.site_nombre || 'Supermercado'}`;
      seoDesc = `Catálogo gourmet de ${filterText} en Valencia, Venezuela. Quesos, embutidos, frutas frescas y despensa importada con delivery express. Naguanagua y San Diego. Compra online en ${config.site_nombre || 'nuestro supermercado'} con stock real.`;
      
      const kwParts = ['marketo', 'valencia', 'venezuela', 'supermercado online', 'delivery express', 'naguanagua', 'san diego'];
      if (category) kwParts.push(`compra ${category.toLowerCase()}`);
      if (brand) kwParts.push(brand.toLowerCase());
      if (model) kwParts.push(model.toLowerCase());
      seoKeywords = kwParts.join(', ');
    }

    document.title = seoTitle ? `${seoTitle} | ${config.site_nombre}` : defaultTitle;
    
    const setMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    setMeta('description', seoDesc || defaultDesc);
    setMeta('keywords', seoKeywords);
    setMeta('og:title', seoTitle || defaultTitle, 'property');
    setMeta('og:description', seoDesc || defaultDesc, 'property');
    if (type === 'product' && product) {
      setMeta('og:type', 'product', 'property');
      setMeta('og:image', product.imagen_urls[0], 'property');
    } else {
      setMeta('og:type', 'website', 'property');
      setMeta('og:image', 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200', 'property');
    }

    // PWA: Guardar logo_url, site_name y theme_color en IndexedDB para manifest dinámico (con debounce)
    if (indexedDBTimeoutRef.current) {
      clearTimeout(indexedDBTimeoutRef.current);
    }
    indexedDBTimeoutRef.current = setTimeout(() => {
      const DB_NAME = 'marketo-pwa';
      const DB_VERSION = 1;
      const STORE_NAME = 'config';
      const openReq = indexedDB.open(DB_NAME, DB_VERSION);
      openReq.onupgradeneeded = (e: any) => {
        e.target.result.createObjectStore(STORE_NAME);
      };
      openReq.onsuccess = (e: any) => {
        const db = e.target.result;
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        
        if (config.logo_url) {
          store.put(config.logo_url, 'logo_url');
        }
        if (config.site_nombre) {
          store.put(config.site_nombre, 'site_name');
        }
        if (config.theme_color) {
          store.put(config.theme_color, 'theme_color');
        }
        
        tx.oncomplete = () => {
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            if (config.logo_url) {
              navigator.serviceWorker.controller.postMessage({
                type: 'UPDATE_LOGO_URL',
                logoUrl: config.logo_url
              });
            }
            if (config.site_nombre) {
              navigator.serviceWorker.controller.postMessage({
                type: 'UPDATE_SITE_NAME',
                siteName: config.site_nombre
              });
            }
            if (config.theme_color) {
              navigator.serviceWorker.controller.postMessage({
                type: 'UPDATE_THEME_COLOR',
                themeColor: config.theme_color
              });
            }
          }
        };
      };
    }, 500);

    // Apple Touch Icon dinámico para iOS
    const appleTouchUrl = config.logo_url || config.favicon_url || '/pwa-192x192.png';
    let appleLink = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null;
    if (!appleLink) {
      appleLink = document.createElement('link');
      appleLink.setAttribute('rel', 'apple-touch-icon');
      document.head.appendChild(appleLink);
    }
    appleLink.setAttribute('href', appleTouchUrl);

    // Favicon injection
    if (config.favicon_url || config.logo_url) {
      let iconLink = document.querySelector('link[rel="icon"]');
      if (!iconLink) {
        iconLink = document.createElement('link');
        iconLink.setAttribute('rel', 'icon');
        document.head.appendChild(iconLink);
      }
      iconLink.setAttribute('href', config.favicon_url || config.logo_url || '/favicon.ico');
    }
    
    // Theme color meta
    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeMeta);
    }
    themeMeta.setAttribute('content', config.theme_color || '#10b981');

    // Apple mobile web app title dinámico
    let appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (!appleTitleMeta) {
      appleTitleMeta = document.createElement('meta');
      appleTitleMeta.setAttribute('name', 'apple-mobile-web-app-title');
      document.head.appendChild(appleTitleMeta);
    }
    appleTitleMeta.setAttribute('content', config.site_nombre || 'Marketo');

    // 2. Generate and Inject JSON-LD Schema
    const existingScript = document.getElementById('trv-jsonld-schema');
    if (existingScript) {
      existingScript.remove();
    }

    let schemaObj: any = null;

    if (type === 'home') {
      schemaObj = {
        '@context': 'https://schema.org',
        '@type': 'GroceryStore',
        'name': config.site_nombre || 'Supermercado',
        'image': 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200',
        '@id': 'https://marketo.com.ve',
        'url': 'https://marketo.com.ve',
        'telephone': '+584124976451',
        'priceRange': '$$',
        'address': {
          '@type': 'PostalAddress',
          'streetAddress': 'Calle 140 con Av. Bolívar Norte, Sector Las Acacias',
          'addressLocality': 'Valencia',
          'addressRegion': 'Carabobo',
          'postalCode': '2001',
          'addressCountry': 'VE'
        },
        'areaServed': [
          { '@type': 'City', 'name': 'Valencia' },
          { '@type': 'City', 'name': 'Naguanagua' },
          { '@type': 'City', 'name': 'San Diego' }
        ],
        'geo': {
          '@type': 'GeoCoordinates',
          'latitude': 10.198300,
          'longitude': -68.004400
        },
        'openingHoursSpecification': {
          '@type': 'OpeningHoursSpecification',
          'dayOfWeek': [
            'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
          ],
          'opens': '07:30',
          'closes': '21:00'
        },
        'description': 'La mejor opción para comprar víveres y delicatessen a domicilio en Valencia.'
      };
    } else if (type === 'product' && product) {
      schemaObj = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': product.nombre,
        'image': product.imagen_urls[0],
        'description': seoDesc,
        'sku': product.codigo,
        'mpn': product.codigo,
        'brand': {
          '@type': 'Brand',
          'name': product.marca
        },
        'offers': {
          '@type': 'Offer',
          'url': `https://marketo.com.ve/catalog?search=${product.codigo}`,
          'priceCurrency': 'USD',
          'price': product.precio_usd.toFixed(2),
          'itemCondition': 'https://schema.org/NewCondition',
          'availability': product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          'areaServed': ['Valencia', 'Naguanagua', 'San Diego'],
          'seller': {
            '@type': 'GroceryStore',
            'name': 'Marketo Supermercado'
          }
        },
        'category': product.categoria
      };
    } else if (type === 'catalog') {
      schemaObj = {
        '@context': 'https://schema.org',
        '@type': 'SearchResultsPage',
        'name': `Catálogo Premium de Víveres | ${config.site_nombre || 'Supermercado'}`,
        'description': 'Filtrado inteligente por pasillo, estante y dietas para artículos selectos en Valencia, Venezuela.'
      };
    }

    if (schemaObj) {
      const script = document.createElement('script');
      script.id = 'trv-jsonld-schema';
      script.type = 'application/ld+json';
      script.innerHTML = JSON.stringify(schemaObj);
      document.head.appendChild(script);
    }

    return () => {
      if (indexedDBTimeoutRef.current) {
        clearTimeout(indexedDBTimeoutRef.current);
      }
    };
  }, [title, description, type, product, filters, config.site_nombre, config.theme_color, config.logo_url, config.favicon_url]);

  return null; // Side-effect only component
};
