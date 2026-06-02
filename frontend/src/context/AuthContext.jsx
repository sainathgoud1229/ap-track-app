import { useEffect, useState } from 'react'
import { supabase } from '../supabase/config'
import { logActivity } from '../lib/activity'
import { getAuthErrorMessage } from '../lib/auth'
import { seedSampleData } from '../lib/seedData'
import { AuthContext } from './auth-context'

export const isFirebaseConfigured = Boolean(supabase)
export const firebaseInitError = supabase ? null : 'Supabase is not configured'

async function ensureUserProfile(user, displayName) {
  if (!supabase || !user) return
  
  const { data: snap } = await supabase.from('users').select('*').eq('id', user.id).single()
  const name = displayName?.trim() || user.user_metadata?.full_name || ''
  
  if (!snap) {
    await supabase.from('users').insert({
      id: user.id,
      email: user.email ?? '',
      displayName: name,
      theme: 'dark',
      lastLogin: new Date().toISOString()
    })
    return
  }
  
  await supabase.from('users').update({
    email: user.email ?? snap.email ?? '',
    ...(name ? { displayName: name } : {}),
    lastLogin: new Date().toISOString()
  }).eq('id', user.id)
}

async function syncUserData(user) {
  if (!user || !supabase) return
  const { data: snap } = await supabase.from('users').select('*').eq('id', user.id).single()
  
  if (!snap || !snap.seeded) {
    await seedSampleData(user.id)
  } else {
    await supabase.from('users').update({ lastLogin: new Date().toISOString() }).eq('id', user.id)
  }
}

function authError(e) {
  return new Error(getAuthErrorMessage(e), { cause: e })
}

function requireFirebaseAuth() {
  if (!isFirebaseConfigured) throw new Error('Supabase is not configured')
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user || null
      setUser(u)
      if (u) {
        ensureUserProfile(u).then(() => syncUserData(u)).catch(console.error)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user || null
      setUser(u)
      if (u && event === 'SIGNED_IN') {
        try {
          await ensureUserProfile(u)
          await syncUserData(u)
        } catch (e) {
          console.error('User sync failed:', e)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signup = async (email, password, displayName) => {
    requireFirebaseAuth()
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: displayName?.trim() } }
      })
      if (error) throw error
      // If session is null, Supabase sent a confirmation email
      const needsConfirmation = !data.session
      if (data.user && !needsConfirmation) {
        await ensureUserProfile(data.user, displayName)
        await logActivity(data.user.id, 'auth', 'Account created')
      }
      return { user: data.user, needsConfirmation }
    } catch (e) {
      throw authError(e)
    }
  }

  const login = async (email, password) => {
    requireFirebaseAuth()
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })
      if (error) throw error
      await logActivity(data.user.id, 'auth', 'Logged in')
      return data.user
    } catch (e) {
      throw authError(e)
    }
  }

  const loginWithGoogle = async () => {
    requireFirebaseAuth()
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      })
      if (error) throw error
      // OAuth is a redirect flow — browser navigates to Google then back to this app
    } catch (e) {
      throw authError(e)
    }
  }

  const resetPassword = async (email) => {
    requireFirebaseAuth()
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
      if (error) throw error
    } catch (e) {
      throw authError(e)
    }
  }

  const logout = async () => {
    requireFirebaseAuth()
    try {
      if (user) await logActivity(user.id, 'auth', 'Logged out')
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (e) {
      throw authError(e)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signup,
        login,
        loginWithGoogle,
        logout,
        resetPassword,
        isFirebaseConfigured,
        firebaseInitError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
