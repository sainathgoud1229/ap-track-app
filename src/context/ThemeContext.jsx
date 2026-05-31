import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
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
    if (!db || !user) return
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      const theme = snap.data()?.theme
      if (theme) setDark(theme === 'dark')
    })
    return unsub
  }, [user])

  const toggleTheme = async () => {
    const next = !dark
    setDark(next)
    if (db && user) {
      await setDoc(doc(db, 'users', user.uid), { theme: next ? 'dark' : 'light' }, { merge: true })
    }
  }

  return (
    <ThemeContext.Provider value={{ dark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
