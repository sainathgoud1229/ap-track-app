import { useEffect, useState } from 'react'
import { supabase } from '../supabase/config'

export function useDocument(pathParts) {
  const pathKey = pathParts?.join('/') ?? ''
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(Boolean(pathParts && supabase))

  useEffect(() => {
    if (!pathParts || pathParts.length < 2 || !supabase) {
      setData(null)
      setLoading(false)
      return
    }

    setLoading(true)
    let isMounted = true
    
    const table = pathParts[pathParts.length - 2]
    const docId = pathParts[pathParts.length - 1]

    const fetchDoc = async () => {
      const { data: docData, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', docId)
        .single()

      if (!isMounted) return

      if (error) {
        if (error.code !== 'PGRST116') { // PGRST116 is no rows returned
          console.warn('Document listen failed:', error.message)
        }
        setData(null)
      } else {
        setData(docData)
      }
      setLoading(false)
    }

    fetchDoc()

    const channel = supabase.channel(`public:${table}:${docId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: table, filter: `id=eq.${docId}` }, () => {
        fetchDoc()
      })
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [pathKey])

  return { data, loading }
}
