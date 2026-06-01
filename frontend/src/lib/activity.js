import { supabase } from '../supabase/config'

export async function logActivity(userId, type, message, metadata = {}) {
  if (!supabase || !userId) return
  try {
    await supabase.from('activities').insert({
      user_id: userId,
      type,
      message,
      metadata,
    })
  } catch (e) {
    console.warn('Activity log failed:', e)
  }
}
