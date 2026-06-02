import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, MailCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { validateDisplayName, validateEmail, validatePassword } from '../../lib/auth'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const { signup, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nameError = validateDisplayName(name)
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    if (nameError || emailError || passwordError) {
      toast.error(nameError || emailError || passwordError)
      return
    }

    setLoading(true)
    try {
      const { needsConfirmation } = await signup(email, password, name)
      if (needsConfirmation) {
        // Supabase sent a confirmation email — show message, don't navigate yet
        setEmailSent(true)
      } else {
        // Email confirmation is disabled — session is active, go to dashboard
        toast.success('Account created!')
        navigate('/')
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    try {
      await loginWithGoogle()
      // Browser will redirect to Google — no navigate needed here.
      // On return, onAuthStateChange fires and ProtectedRoute handles routing.
      toast.success('Redirecting to Google…')
    } catch (err) {
      toast.error(err.message)
    }
  }

  // Show confirmation-sent screen
  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mesh p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass glow-accent w-full max-w-md rounded-2xl p-8 text-center"
        >
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/40">
              <MailCheck className="text-white" size={28} />
            </div>
          </div>
          <h1 className="text-xl font-bold text-white">Check your email</h1>
          <p className="mt-3 text-sm text-zinc-400">
            We sent a confirmation link to{' '}
            <span className="font-medium text-indigo-300">{email}</span>.
            <br />Click it to activate your account, then come back to sign in.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 transition-colors"
          >
            Go to Sign In
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-mesh p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass glow-accent w-full max-w-md rounded-2xl p-8"
      >
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
            <Zap className="text-white" size={20} />
          </div>
          <span className="text-2xl font-bold text-white">Create account</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Sign Up'}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-zinc-500">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <Button variant="secondary" className="w-full" onClick={handleGoogle}>
          Continue with Google
        </Button>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
