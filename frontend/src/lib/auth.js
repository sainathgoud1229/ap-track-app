const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email) {
  const value = String(email ?? '').trim()
  if (!value) return 'Email is required'
  if (!EMAIL_RE.test(value)) return 'Enter a valid email address'
  return null
}

export function validatePassword(password, { minLength = 6 } = {}) {
  const value = String(password ?? '')
  if (!value) return 'Password is required'
  if (value.length < minLength) return `Password must be at least ${minLength} characters`
  return null
}

export function validateDisplayName(name) {
  const value = String(name ?? '').trim()
  if (!value) return 'Name is required'
  if (value.length > 80) return 'Name must be 80 characters or fewer'
  return null
}

const AUTH_ERROR_MESSAGES = {
  'auth/invalid-email': 'Invalid email address.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found':
    'No account with this email. Use Sign up to create one, or try Google sign-in.',
  'auth/wrong-password': 'Wrong password. Try again or use Forgot password.',
  'auth/invalid-credential':
    'Wrong email or password — or no account yet. Use Sign up if this is your first time.',
  'auth/email-already-in-use': 'An account already exists with this email.',
  'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Try again later.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase.',
}

export function getAuthErrorMessage(error) {
  if (!error) return 'Something went wrong. Please try again.'
  const code = error.code || ''
  return AUTH_ERROR_MESSAGES[code] || error.message || 'Something went wrong. Please try again.'
}

export function requireFirebaseAuth(auth, isFirebaseConfigured) {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured. Add credentials to .env and restart.')
  }
  if (!auth) {
    throw new Error('Firebase Auth is unavailable. Check your project settings.')
  }
}
