import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function FirebaseConfigGate({ children }) {
  const { isFirebaseConfigured, firebaseInitError } = useAuth()

  if (isFirebaseConfigured) return children

  return (
    <div className="flex min-h-screen items-center justify-center bg-mesh p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass glow-accent max-w-md rounded-2xl p-8 text-center"
      >
        <div className="mb-4 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600">
            <Zap className="text-white" size={24} />
          </div>
        </div>
        <h1 className="text-xl font-semibold text-white">Configuration required</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Add your Firebase credentials to <code className="text-indigo-300">.env</code> (see{' '}
          <code className="text-indigo-300">.env.example</code>), then restart the dev server.
        </p>
        {firebaseInitError && (
          <p className="mt-2 text-xs text-rose-400">{firebaseInitError}</p>
        )}
      </motion.div>
    </div>
  )
}
