import { useEffect, useState } from 'react'
import { supabase } from '../supabase/config'
import { useAuth } from '../hooks/useAuth'
import { ThemeContext } from './theme-context'

export function ThemeProvider({ children }) {
  const { user } = useAuth()
  const [dark, setDark] = useState(true)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    if (!supabase || !user) return
    
    let isMounted = true
    const fetchTheme = async () => {
      const { data } = await supabase.from('users').select('theme').eq('id', user.id).single()
      if (isMounted && data?.theme) setDark(data.theme === 'dark')
    }
    fetchTheme()

    const channel = supabase.channel(`public:users:${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` }, (payload) => {
        if (payload.new?.theme) setDark(payload.new.theme === 'dark')
      })
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [user])

  const toggleTheme = async () => {
    const next = !dark
    setDark(next)
    if (supabase && user) {
      await supabase.from('users').update({ theme: next ? 'dark' : 'light' }).eq('id', user.id)
    }
  }

  return (
    <ThemeContext.Provider value={{ dark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
