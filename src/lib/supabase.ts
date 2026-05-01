import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let browserClient: SupabaseClient | null = null;
export function getBrowserSupabase(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return browserClient;
}

// サーバー専用: service_role を使用（RLSをバイパス）
export function getServerSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

// ストレージにdata URLまたはBufferをアップロードしてpublic URLを返す
export async function uploadToStorage(
  bucket: 'collages' | 'keyframes' | 'videos',
  pathHint: string,
  data: Buffer | Blob,
  contentType: string
): Promise<string | null> {
  const supabase = getServerSupabase();
  if (!supabase) return null;

  const ext = contentType.split('/')[1]?.split(';')[0] || 'bin';
  const path = `${Date.now()}-${pathHint}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, data, {
    contentType,
    upsert: false,
  });
  if (error) {
    console.error('Storage upload error:', error);
    return null;
  }
  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
  return pub.publicUrl;
}
