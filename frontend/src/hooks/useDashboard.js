import { useMemo } from 'react'
import { useAuth } from './useAuth'
import { useCollection } from './useCollection'
import {
  getAllSkillTrends,
  getSkillChartSeries,
  getTasksCompletedSeries,
  getGoalsChartData,
  getExpenseOverTime,
  getExpenseByCategory,
  getMonthlySpending,
} from '../lib/metrics'

export function useDashboard() {
  const { user } = useAuth()
  const uid = user?.id

  const tasksState = useCollection(uid, 'tasks')
  const goalsState = useCollection(uid, 'goals')
  const skillsState = useCollection(uid, 'skills')
  const metricsState = useCollection(uid, 'metrics', 'recordedAt')
  const expensesState = useCollection(uid, 'expenses', 'date')
  const activitiesState = useCollection(uid, 'activities')

  const tasks = tasksState.docs
  const goals = goalsState.docs
  const skills = skillsState.docs
  const metrics = metricsState.docs
  const expenses = expensesState.docs
  const activities = activitiesState.docs

  const loading =
    tasksState.loading ||
    goalsState.loading ||
    skillsState.loading ||
    metricsState.loading ||
    expensesState.loading

  const error = null

  const computed = useMemo(() => {
    const skillTrends = getAllSkillTrends(metrics, skills)
    const doneCount = tasks.filter((t) => t.status === 'done').length
    const completionRate = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0

    return {
      skillTrends,
      skillChartData: getSkillChartSeries(metrics, skills),
      skillNames: skills.map((s) => s.name),
      tasksChart: getTasksCompletedSeries(metrics),
      goalsChart: getGoalsChartData(goals),
      spendingChart: getExpenseOverTime(expenses),
      categoryChart: getExpenseByCategory(expenses),
      monthlySpend: getMonthlySpending(expenses),
      improvingCount: skillTrends.filter((t) => t.direction === 'improving').length,
      decliningCount: skillTrends.filter((t) => t.direction === 'declining').length,
      doneCount,
      completionRate,
    }
  }, [tasks, goals, skills, metrics, expenses])

  return {
    user,
    tasks,
    goals,
    skills,
    metrics,
    expenses,
    activities,
    loading,
    error,
    ...computed,
  }
}
