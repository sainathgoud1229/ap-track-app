import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
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
      await signup(email, password, name)
      toast.success('Account created!')
      navigate('/')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    try {
      await loginWithGoogle()
      toast.success('Signed in with Google')
      navigate('/')
    } catch (err) {
      toast.error(err.message)
    }
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
