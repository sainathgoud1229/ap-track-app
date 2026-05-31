import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase/config'
import { isFirestorePermissionError } from '../lib/firestore-errors'

export function useCollection(userId, collectionName, orderField = 'createdAt') {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(Boolean(userId && db))
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId || !db) {
      setDocs([])
      setLoading(false)
      return
    }

    setLoading(true)
    const ref = collection(db, 'users', userId, collectionName)
    const q = query(ref, orderBy(orderField, 'desc'))

    const unsub = onSnapshot(
      q,
      (snap) => {
        setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
        setError(null)
      },
      (err) => {
        if (isFirestorePermissionError(err.message)) {
          setDocs([])
          setError(null)
        } else {
          setError(err.message)
        }
        setLoading(false)
      }
    )

    return unsub
  }, [userId, collectionName, orderField])

  return { docs, loading, error }
}
