import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// URL y Clave anónima de Supabase inyectadas desde las variables de entorno de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const createMockClient = (): SupabaseClient => {
  const mock: any = {
    from: () => mock,
    select: () => mock,
    insert: () => mock,
    update: () => mock,
    delete: () => mock,
    eq: () => mock,
    single: () => ({ data: null, error: null }),
    order: () => mock,
    upsert: () => mock,
    then: (cb: Function) => cb({ data: [], error: null }),
    storage: {
      from: () => ({
        upload: async () => ({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null }, error: null }),
      signUp: async () => ({ data: { user: null }, error: null }),
      signOut: async () => {},
      updateUser: async () => ({ data: { user: null }, error: null }),
      resetPasswordForEmail: async () => ({ data: null, error: null }),
    },
    channel: () => ({
      send: async () => {},
      on: () => ({}),
      subscribe: () => ({}),
    }),
    removeChannel: async () => {},
    rpc: async () => ({ data: [], error: null }),
  };
  return mock;
};

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();

/**
 * Comprime una imagen y la devuelve como un Blob listo para subir
 */
export const compressImage = async (
  file: File,
  options: { maxWidth?: number; quality?: number; format?: 'image/webp' | 'image/jpeg' | 'image/png' } = {}
): Promise<Blob> => {
  const { maxWidth = 800, quality = 0.8, format = 'image/webp' } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth * height) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Error al comprimir imagen'));
        }, format, quality);
      };
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Sube un archivo a un bucket de Supabase Storage y retorna su URL pública
 */
export const uploadFileToStorage = async (file: File | Blob, bucket: string, folder: string): Promise<string> => {
  const fileExt = file instanceof File ? file.name.split('.').pop() : 'webp';
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type || 'image/webp'
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
};

/**
 * Obtiene la URL pública de un archivo en Supabase Storage
 */
export const getPublicUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};