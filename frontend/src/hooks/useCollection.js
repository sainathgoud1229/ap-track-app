import { useEffect, useState } from 'react'
import { supabase } from '../supabase/config'

export function useCollection(userId, collectionName, orderField = 'createdAt') {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(Boolean(userId && supabase))
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId || !supabase) {
      setDocs([])
      setLoading(false)
      return
    }

    setLoading(true)
    let isMounted = true

    const fetchDocs = async () => {
      const { data, error } = await supabase
        .from(collectionName)
        .select('*')
        .eq('user_id', userId)
        .order(orderField, { ascending: false })

      if (!isMounted) return

      if (error) {
        setError(error.message)
      } else {
        setDocs(data || [])
        setError(null)
      }
      setLoading(false)
    }

    fetchDocs()

    const channel = supabase.channel(`public:${collectionName}:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: collectionName, filter: `user_id=eq.${userId}` }, () => {
        fetchDocs()
      })
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [userId, collectionName, orderField])

  return { docs, loading, error }
}
