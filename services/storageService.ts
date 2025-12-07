import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- Types ---
export interface DbConfig {
  url: string;
  key: string;
}

// --- Client Management ---
let supabase: SupabaseClient | null = null;

export const initSupabase = (config: DbConfig | null) => {
  if (config && config.url && config.key) {
    try {
      supabase = createClient(config.url, config.key);
      return true;
    } catch (e) {
      console.error("Failed to init Supabase client", e);
      return false;
    }
  }
  supabase = null;
  return false;
};

// --- Check Connection ---
export const checkConnection = async (): Promise<boolean> => {
    if (!supabase) return false;
    try {
        // Try to select just one row or just check if table exists
        // We use head: true to avoid downloading data, just checking permissions/existence
        const { error } = await supabase.from('app_data').select('key', { count: 'exact', head: true });
        
        if (error) {
            console.error("Connection Check Failed:", error.message);
            return false;
        }
        return true;
    } catch (e) {
        console.error("Unexpected Connection Error:", e);
        return false;
    }
}

// --- Storage Functions ---

/**
 * Loads data from Cloud (Supabase) if available, otherwise returns null.
 */
export const loadFromCloud = async (tableKey: 'transactions' | 'budgets'): Promise<any | null> => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('app_data')
      .select('value')
      .eq('key', tableKey)
      .single();

    if (error) {
      // PGRST116 means row not found, which is normal for first time. Other codes are errors.
      if (error.code !== 'PGRST116') {
          console.warn('Supabase Load Error:', error.message);
      }
      return null;
    }

    return data?.value || null;
  } catch (err) {
    console.error('Unexpected Supabase Error', err);
    return null;
  }
};

/**
 * Saves data to Cloud (Supabase).
 */
export const saveToCloud = async (tableKey: 'transactions' | 'budgets', data: any): Promise<boolean> => {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('app_data')
      .upsert(
        { key: tableKey, value: data, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) {
      console.error('Supabase Save Error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Unexpected Supabase Save Error', err);
    return false;
  }
};

// --- Local Storage Fallbacks (Helpers) ---
export const saveToLocal = (key: string, data: any) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("Local Storage Save Error", e);
    }
  }
};

export const loadFromLocal = (key: string): any | null => {
  if (typeof window !== 'undefined') {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error("Local Storage Load Error", e);
      return null;
    }
  }
  return null;
};
