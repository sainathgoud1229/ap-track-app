import { supabase } from '../supabase/config'

function daysAgoISO(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function daysAgoDate(n) {
  return daysAgoISO(n).slice(0, 10)
}

export async function seedSampleData(userId) {
  if (!supabase || !userId) return

  const now = new Date().toISOString()

  await supabase.from('tasks').insert([
    { user_id: userId, title: 'Review weekly goals', status: 'in_progress', tag: 'Planning', order: 0, dueDate: daysAgoDate(0), createdAt: now, updatedAt: now },
    { user_id: userId, title: 'Complete React module', status: 'todo', tag: 'Learning', order: 1, dueDate: daysAgoDate(-2), createdAt: now, updatedAt: now },
    { user_id: userId, title: 'Morning workout', status: 'done', tag: 'Health', order: 2, createdAt: now, updatedAt: now },
  ])

  await supabase.from('goals').insert([
    { user_id: userId, title: 'Launch side project', progress: 45, target: 100, unit: '%', createdAt: now, updatedAt: now },
    { user_id: userId, title: 'Read 24 books this year', progress: 8, target: 24, unit: 'books', createdAt: now, updatedAt: now },
  ])

  const skillDefs = [
    { name: 'React', level: 75, category: 'Development', history: [55, 60, 68, 72, 75] },
    { name: 'TypeScript', level: 60, category: 'Development', history: [45, 50, 55, 58, 60] },
    { name: 'UI Design', level: 50, category: 'Design', history: [40, 44, 47, 50] },
  ]

  const { data: skills } = await supabase.from('skills').insert(
    skillDefs.map(s => ({
      user_id: userId,
      name: s.name,
      level: s.level,
      category: s.category,
      createdAt: now,
      updatedAt: now,
    }))
  ).select()

  await supabase.from('notes').insert([
    { user_id: userId, title: 'Welcome to AP Track', content: '<p>Your productivity hub — track tasks, skills, goals, and spending in one place.</p>', pinned: true, createdAt: now, updatedAt: now },
    { user_id: userId, title: 'Weekly focus', content: '<p><strong>Priority:</strong> Ship features and maintain daily habits.</p>', pinned: false, createdAt: now, updatedAt: now },
  ])

  await supabase.from('expenses').insert([
    { user_id: userId, title: 'Groceries', amount: 850, category: 'Food & Groceries', date: daysAgoDate(2), createdAt: now, updatedAt: now },
    { user_id: userId, title: 'Netflix', amount: 649, category: 'Entertainment', date: daysAgoDate(5), createdAt: now, updatedAt: now },
    { user_id: userId, title: 'Auto ride', amount: 320, category: 'Transport', date: daysAgoDate(1), createdAt: now, updatedAt: now },
    { user_id: userId, title: 'Electric bill', amount: 2100, category: 'Bills & Utilities', date: daysAgoDate(8), createdAt: now, updatedAt: now },
  ])

  const metricsData = []
  
  if (skills) {
    skills.forEach((skill, idx) => {
      const history = skillDefs[idx].history
      history.forEach((level, i) => {
        const prev = i > 0 ? history[i - 1] : null
        metricsData.push({
          user_id: userId,
          type: 'skill',
          refId: skill.id,
          label: skill.name,
          value: level,
          previousValue: prev,
          delta: prev != null ? level - prev : 0,
          recordedAt: daysAgoISO((history.length - i) * 5),
        })
      })
    })
  }

  ;[14, 10, 7, 5, 3, 1, 0].forEach((days, i) => {
    metricsData.push({
      user_id: userId,
      type: 'task',
      refId: `seed-task-${i}`,
      label: 'Task completed',
      value: 1 + (i % 2),
      previousValue: null,
      delta: 0,
      recordedAt: daysAgoISO(days),
    })
  })

  await supabase.from('metrics').insert(metricsData)

  await supabase.from('users').update({
    seeded: true,
    streak: 1,
    lastLogin: now,
    theme: 'dark',
  }).eq('id', userId)
}
