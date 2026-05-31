import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'

import { PageSkeleton } from '../ui/Skeleton'



export default function ProtectedRoute() {

  const { user, loading, isFirebaseConfigured } = useAuth()



  if (loading) return <PageSkeleton />

  if (!isFirebaseConfigured) return <Navigate to="/login" replace />

  if (!user) return <Navigate to="/login" replace state={{ from: 'protected' }} />



  return <Outlet />

}

