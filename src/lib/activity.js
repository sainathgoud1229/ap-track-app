import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

export async function logActivity(userId, type, message, metadata = {}) {
  if (!db || !userId) return
  try {
    await addDoc(collection(db, 'users', userId, 'activities'), {
      type,
      message,
      metadata,
      createdAt: serverTimestamp(),
    })
  } catch (e) {
    console.warn('Activity log failed:', e)
  }
}
