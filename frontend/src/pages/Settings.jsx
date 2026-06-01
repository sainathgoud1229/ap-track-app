import { useState } from 'react'
import { User, Bell, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../supabase/config'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { useDocument } from '../hooks/useDocument'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { getDisplayName } from '../lib/utils'

function ProfileForm({ user, profile }) {
  const resolved = getDisplayName(user, profile)
  const initial = resolved === 'User' ? '' : resolved
  const [displayName, setDisplayName] = useState(initial)

  const saveProfile = async () => {
    try {
      if (!user) return
      const name = displayName.trim()
      const { error } = await supabase.auth.updateUser({ data: { full_name: name } })
      if (error) throw error
      
      if (supabase) {
        await supabase.from('users').update({ displayName: name }).eq('id', user.id)
      }
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-4">
      <Input label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      <p className="text-sm text-zinc-500">Email: {user?.email}</p>
      <Button onClick={saveProfile}>Save profile</Button>
    </div>
  )
}

export default function Settings() {
  const { user } = useAuth()
  const { data: profile, loading } = useDocument(user?.id ? ['users', user.id] : null)
  const { dark, toggleTheme } = useTheme()
  const [notifications, setNotifications] = useState(true)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <User size={18} className="text-indigo-400" />
          <h2 className="font-semibold text-white">Profile</h2>
        </div>
        {!loading && user && (
          <ProfileForm key={`${user.id}-${profile?.displayName ?? ''}`} user={user} profile={profile} />
        )}
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Bell size={18} className="text-indigo-400" />
          <h2 className="font-semibold text-white">Appearance & notifications</h2>
        </div>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">Dark mode</span>
            <button
              type="button"
              onClick={toggleTheme}
              className={`relative h-6 w-11 rounded-full transition ${dark ? 'bg-indigo-600' : 'bg-zinc-600'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${dark ? 'left-5' : 'left-0.5'}`} />
            </button>
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">Toast notifications</span>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              className="accent-indigo-500"
            />
          </label>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Shield size={18} className="text-indigo-400" />
          <h2 className="font-semibold text-white">Security</h2>
        </div>
        <p className="text-sm text-zinc-400">
          Password reset is available from the login page. Data is secured with Supabase Auth and per-user RLS policies.
        </p>
      </Card>
    </div>
  )
}
