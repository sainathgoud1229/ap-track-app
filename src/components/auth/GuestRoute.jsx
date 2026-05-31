import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { PageSkeleton } from '../ui/Skeleton'
import FirebaseConfigGate from './FirebaseConfigGate'

export default function GuestRoute() {
  const { user, loading } = useAuth()

  if (loading) return <PageSkeleton />
  if (user) return <Navigate to="/" replace />

  return (
    <FirebaseConfigGate>
      <Outlet />
    </FirebaseConfigGate>
  )
}
