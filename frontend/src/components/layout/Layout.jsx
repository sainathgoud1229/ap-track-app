import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from './Sidebar'
import Header from './Header'
import GlobalSearch from '../search/GlobalSearch'
import ChatAssistant from '../ai/ChatAssistant'

const titles = {
  '/': 'Dashboard',
  '/tasks': 'Tasks',
  '/goals': 'Goals',
  '/skills': 'Skills',
  '/achievements': 'Achievements',
  '/notes': 'Notes',
  '/calendar': 'Calendar',
  '/files': 'Files & AI Summaries',
  '/finance': 'Finance & Spending (₹ INR)',
  '/activity': 'Activity Tracker',
  '/settings': 'Settings',
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const location = useLocation()
  const title = titles[location.pathname] || 'AP Track'

  return (
    <div className="flex min-h-screen bg-mesh">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col md:ml-0">
        <Header
          title={title}
          onMenuClick={() => setMobileOpen(true)}
          onSearchClick={() => setSearchOpen(true)}
        />
        <main className="flex-1 p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ChatAssistant />
    </div>
  )
}
