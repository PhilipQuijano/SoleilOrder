import { supabase } from './supabaseClient';

export async function fetchCharms() {
  const { data, error } = await supabase
    .from('charms')
    .select('*');

  if (error) {
    console.error('Error fetching charms:', error);
    return [];
  }
  return data;
}
