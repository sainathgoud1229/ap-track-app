import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { isFirestorePermissionError } from '../lib/firestore-errors'

export function useDocument(pathParts) {
  const pathKey = pathParts?.join('/') ?? ''
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(Boolean(pathParts && db))

  useEffect(() => {
    if (!pathParts || !db) {
      setData(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const ref = doc(db, ...pathParts)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setData(snap.exists() ? snap.data() : null)
        setLoading(false)
      },
      (err) => {
        if (!isFirestorePermissionError(err.message)) {
          console.warn('Document listen failed:', err.message)
        }
        setData(null)
        setLoading(false)
      }
    )

    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pathKey encodes pathParts
  }, [pathKey])

  return { data, loading }
}
