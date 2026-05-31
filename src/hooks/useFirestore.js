import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { logActivity } from '../lib/activity'
import { buildMetricEntry } from '../lib/metrics'

function assertDb(userId) {
  if (!db || !userId) {
    throw new Error('Database is not available. Sign in and check Firebase configuration.')
  }
}

export function useFirestore(userId) {
  const add = async (collectionName, data, activityMsg) => {
    assertDb(userId)
    const ref = await addDoc(collection(db, 'users', userId, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    if (activityMsg) await logActivity(userId, collectionName, activityMsg)
    return ref.id
  }

  const update = async (collectionName, id, data, activityMsg) => {
    assertDb(userId)
    await updateDoc(doc(db, 'users', userId, collectionName, id), {
      ...data,
      updatedAt: serverTimestamp(),
    })
    if (activityMsg) await logActivity(userId, collectionName, activityMsg)
  }

  const remove = async (collectionName, id, activityMsg) => {
    assertDb(userId)
    await deleteDoc(doc(db, 'users', userId, collectionName, id))
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
