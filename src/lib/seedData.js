import { collection, doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../firebase/config'

function daysAgoISO(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function daysAgoDate(n) {
  return daysAgoISO(n).slice(0, 10)
}

export async function seedSampleData(userId) {
  if (!db || !userId) return

  const batch = writeBatch(db)
  const now = serverTimestamp()

  ;[
    { title: 'Review weekly goals', status: 'in_progress', tag: 'Planning', order: 0, dueDate: daysAgoDate(0) },
    { title: 'Complete React module', status: 'todo', tag: 'Learning', order: 1, dueDate: daysAgoDate(-2) },
    { title: 'Morning workout', status: 'done', tag: 'Health', order: 2 },
  ].forEach((t) => {
    const ref = doc(collection(db, 'users', userId, 'tasks'))
    batch.set(ref, { ...t, createdAt: now, updatedAt: now })
  })

  ;[
    { title: 'Launch side project', progress: 45, target: 100, unit: '%' },
    { title: 'Read 24 books this year', progress: 8, target: 24, unit: 'books' },
  ].forEach((g) => {
    const ref = doc(collection(db, 'users', userId, 'goals'))
    batch.set(ref, { ...g, createdAt: now, updatedAt: now })
  })

  const skillDefs = [
    { name: 'React', level: 75, category: 'Development', history: [55, 60, 68, 72, 75] },
    { name: 'TypeScript', level: 60, category: 'Development', history: [45, 50, 55, 58, 60] },
    { name: 'UI Design', level: 50, category: 'Design', history: [40, 44, 47, 50] },
  ]

  const skillRefs = []
  skillDefs.forEach((s) => {
    const ref = doc(collection(db, 'users', userId, 'skills'))
    skillRefs.push({ ref, ...s })
    batch.set(ref, {
      name: s.name,
      level: s.level,
      category: s.category,
      createdAt: now,
      updatedAt: now,
    })
  })

  ;[
    { title: 'Welcome to AP Track', content: '<p>Your productivity hub — track tasks, skills, goals, and spending in one place.</p>', pinned: true },
    { title: 'Weekly focus', content: '<p><strong>Priority:</strong> Ship features and maintain daily habits.</p>', pinned: false },
  ].forEach((n) => {
    const ref = doc(collection(db, 'users', userId, 'notes'))
    batch.set(ref, { ...n, createdAt: now, updatedAt: now })
  })

  ;[
    { title: 'Groceries', amount: 850, category: 'Food & Groceries', date: daysAgoDate(2) },
    { title: 'Netflix', amount: 649, category: 'Entertainment', date: daysAgoDate(5) },
    { title: 'Auto ride', amount: 320, category: 'Transport', date: daysAgoDate(1) },
    { title: 'Electric bill', amount: 2100, category: 'Bills & Utilities', date: daysAgoDate(8) },
  ].forEach((e) => {
    const ref = doc(collection(db, 'users', userId, 'expenses'))
    batch.set(ref, { ...e, createdAt: now, updatedAt: now })
  })

  await batch.commit()

  const metricsBatch = writeBatch(db)
  skillRefs.forEach(({ ref, name, history }) => {
    history.forEach((level, i) => {
      const prev = i > 0 ? history[i - 1] : null
      const mRef = doc(collection(db, 'users', userId, 'metrics'))
      metricsBatch.set(mRef, {
        type: 'skill',
        refId: ref.id,
        label: name,
        value: level,
        previousValue: prev,
        delta: prev != null ? level - prev : 0,
        recordedAt: daysAgoISO((history.length - i) * 5),
      })
    })
  })

  ;[14, 10, 7, 5, 3, 1, 0].forEach((days, i) => {
    const mRef = doc(collection(db, 'users', userId, 'metrics'))
    metricsBatch.set(mRef, {
      type: 'task',
      refId: `seed-task-${i}`,
      label: 'Task completed',
      value: 1 + (i % 2),
      previousValue: null,
      delta: 0,
      recordedAt: daysAgoISO(days),
    })
  })

  await metricsBatch.commit()

  await setDoc(
    doc(db, 'users', userId),
    {
      seeded: true,
      streak: 1,
      lastLogin: now,
      theme: 'dark',
      createdAt: now,
    },
    { merge: true }
  )
}
