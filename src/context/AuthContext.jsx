import { useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, googleProvider, isFirebaseConfigured, firebaseInitError } from '../firebase/config'
import { logActivity } from '../lib/activity'
import { getAuthErrorMessage, requireFirebaseAuth } from '../lib/auth'
import { seedSampleData } from '../lib/seedData'
import { AuthContext } from './auth-context'

async function ensureUserProfile(user, displayName) {
  if (!db || !user) return
  const userRef = doc(db, 'users', user.uid)
  const snap = await getDoc(userRef)
  const name = displayName?.trim() || user.displayName || ''
  if (!snap.exists()) {
    await setDoc(userRef, {
      email: user.email ?? '',
      displayName: name,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      theme: 'dark',
    })
    return
  }
  await setDoc(
    userRef,
    {
      email: user.email ?? snap.data()?.email ?? '',
      ...(name ? { displayName: name } : {}),
      lastLogin: serverTimestamp(),
    },
    { merge: true }
  )
}

async function syncUserData(user) {
  if (!user || !db) return
  const userRef = doc(db, 'users', user.uid)
  const snap = await getDoc(userRef)
  if (!snap.exists() || !snap.data()?.seeded) {
    await seedSampleData(user.uid)
  } else {
    await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true })
  }
}

function authError(e) {
  return new Error(getAuthErrorMessage(e), { cause: e })
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        try {
          await ensureUserProfile(u)
          await syncUserData(u)
        } catch (e) {
          console.error('User sync failed:', e)
        }
      }
      setLoading(false)
    })

    return unsub
  }, [])

  const signup = async (email, password, displayName) => {
    requireFirebaseAuth(auth, isFirebaseConfigured)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
      if (displayName?.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim() })
      }
      await ensureUserProfile(cred.user, displayName)
      await logActivity(cred.user.uid, 'auth', 'Account created')
      return cred.user
    } catch (e) {
      throw authError(e)
    }
  }

  const login = async (email, password) => {
    requireFirebaseAuth(auth, isFirebaseConfigured)
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
      await logActivity(cred.user.uid, 'auth', 'Logged in')
      return cred.user
    } catch (e) {
      throw authError(e)
    }
  }

  const loginWithGoogle = async () => {
    requireFirebaseAuth(auth, isFirebaseConfigured)
    try {
      const cred = await signInWithPopup(auth, googleProvider)
      await ensureUserProfile(cred.user)
      await logActivity(cred.user.uid, 'auth', 'Logged in with Google')
      return cred.user
    } catch (e) {
      throw authError(e)
    }
  }

  const resetPassword = async (email) => {
    requireFirebaseAuth(auth, isFirebaseConfigured)
    try {
      await sendPasswordResetEmail(auth, email.trim())
    } catch (e) {
      throw authError(e)
    }
  }

  const logout = async () => {
    requireFirebaseAuth(auth, isFirebaseConfigured)
    try {
      if (user) await logActivity(user.uid, 'auth', 'Logged out')
      await signOut(auth)
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
