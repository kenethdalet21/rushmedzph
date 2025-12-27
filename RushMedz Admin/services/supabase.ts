import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase credentials not configured. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.local');
}

// Create a mock client if credentials are missing for development
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : {
      auth: {
        signUp: async () => ({ data: null, error: new Error('Supabase not configured') }),
        signIn: async () => ({ data: null, error: new Error('Supabase not configured') }),
        signOut: async () => ({ error: new Error('Supabase not configured') }),
      },
      storage: {
        from: () => ({
          upload: async () => ({ data: null, error: new Error('Supabase not configured') }),
          download: async () => ({ data: null, error: new Error('Supabase not configured') }),
        }),
      },
    } as any;

export async function uploadPrescription(fileUri: string, userId: string) {
  const resp = await fetch(fileUri);
  const blob = await resp.blob();
  const fileName = `prescriptions/${userId}/${Date.now()}.jpg`;
  const { data, error } = await supabase.storage.from('prescriptions').upload(fileName, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;
  return data?.path || fileName;
}
