import { Target, Wallet, Sparkles, CheckSquare, BookOpen, Calendar } from 'lucide-react'

export function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/** Shown on Home when you have no tasks yet — actionable focus list */
export const HOME_FOCUS_TASKS = [
  { title: 'Review your top 3 goals for this week', tag: 'Planning', icon: Target },
  { title: 'Complete one important task before noon', tag: 'Focus', icon: CheckSquare },
  { title: 'Log today’s spending in ₹ (Finance)', tag: 'Money', icon: Wallet },
  { title: 'Update one skill level (+5 quick add)', tag: 'Growth', icon: Sparkles },
  { title: 'Write a short note: what went well today?', tag: 'Reflect', icon: BookOpen },
  { title: 'Check calendar for deadlines this week', tag: 'Schedule', icon: Calendar },
]

export const HOME_TIPS = [
  'Break big goals into tasks under 30 minutes each.',
  'Track expenses in ₹ daily — small amounts add up fast.',
  'Update skills weekly to see improvement trends on charts.',
  'Use the AI assistant (bottom-right) for planning and advice.',
]
