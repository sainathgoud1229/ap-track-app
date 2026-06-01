import { supabase } from '../supabase/config'
import { logActivity } from '../lib/activity'
import { buildMetricEntry } from '../lib/metrics'

function assertDb(userId) {
  if (!supabase || !userId) {
    throw new Error('Database is not available. Sign in and check Supabase configuration.')
  }
}

export function useFirestore(userId) {
  const add = async (collectionName, data, activityMsg) => {
    assertDb(userId)
    const { data: inserted, error } = await supabase.from(collectionName).insert({
      user_id: userId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).select().single()
    if (error) throw error
    if (activityMsg) await logActivity(userId, collectionName, activityMsg)
    return inserted.id
  }

  const update = async (collectionName, id, data, activityMsg) => {
    assertDb(userId)
    const { error } = await supabase.from(collectionName).update({
      ...data,
      updatedAt: new Date().toISOString()
    }).eq('id', id).eq('user_id', userId)
    if (error) throw error
    if (activityMsg) await logActivity(userId, collectionName, activityMsg)
  }

  const remove = async (collectionName, id, activityMsg) => {
    assertDb(userId)
    const { error } = await supabase.from(collectionName).delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
    if (activityMsg) await logActivity(userId, collectionName, activityMsg)
  }

  const logMetric = async (entry) => {
    assertDb(userId)
    const data = buildMetricEntry(entry)
    await add('metrics', data, null)
    return data
  }

  return { add, update, remove, logMetric }
}
