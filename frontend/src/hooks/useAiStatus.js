import { useEffect, useState } from 'react'
import { checkAiConfigured } from '../lib/ai'

export function useAiStatus() {
  const [configured, setConfigured] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    checkAiConfigured().then((ok) => {
      if (active) {
        setConfigured(ok)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [])

  return { configured, loading }
}
