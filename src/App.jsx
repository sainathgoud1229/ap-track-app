import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import GuestRoute from './components/auth/GuestRoute'
import Layout from './components/layout/Layout'
import { PageSkeleton } from './components/ui/Skeleton'

const Login = lazy(() => import('./pages/auth/Login'))
const Signup = lazy(() => import('./pages/auth/Signup'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Tasks = lazy(() => import('./pages/Tasks'))
const Goals = lazy(() => import('./pages/Goals'))
const Skills = lazy(() => import('./pages/Skills'))
const Achievements = lazy(() => import('./pages/Achievements'))
const Notes = lazy(() => import('./pages/Notes'))
const Calendar = lazy(() => import('./pages/Calendar'))
const Files = lazy(() => import('./pages/Files'))
const Finance = lazy(() => import('./pages/Finance'))
const Activity = lazy(() => import('./pages/Activity'))
const Settings = lazy(() => import('./pages/Settings'))

function PageLoader() {
  return <PageSkeleton />
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#18181b',
                color: '#e4e4e7',
                border: '1px solid rgba(255,255,255,0.08)',
              },
            }}
          />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<GuestRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              </Route>
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="tasks" element={<Tasks />} />
                  <Route path="goals" element={<Goals />} />
                  <Route path="skills" element={<Skills />} />
                  <Route path="achievements" element={<Achievements />} />
                  <Route path="notes" element={<Notes />} />
                  <Route path="calendar" element={<Calendar />} />
                  <Route path="files" element={<Files />} />
                  <Route path="finance" element={<Finance />} />
                  <Route path="activity" element={<Activity />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  )
}
