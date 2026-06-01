import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { validateEmail } from '../../lib/auth'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const emailError = validateEmail(email)
    if (emailError) {
      toast.error(emailError)
      return
    }

    setLoading(true)
    try {
      await resetPassword(email)
      toast.success('Reset email sent!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-mesh p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass glow-accent w-full max-w-md rounded-2xl p-8"
      >
        <h1 className="mb-2 text-2xl font-bold text-white">Reset password</h1>
        <p className="mb-6 text-sm text-zinc-400">We&apos;ll send a reset link to your email.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send reset link'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
            Back to login
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
