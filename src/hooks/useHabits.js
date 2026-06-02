import { useState, useEffect, useCallback } from 'react'
import { format, subDays, isToday, parseISO } from 'date-fns'

const STORAGE_KEY = 'habits_data_v2'

const DEFAULT_HABITS = [
  { id: '1', name: 'Morning run', emoji: '🏃', color: '#a3e635', createdAt: format(new Date(), 'yyyy-MM-dd') },
  { id: '2', name: 'Read 30 min', emoji: '📚', color: '#38bdf8', createdAt: format(new Date(), 'yyyy-MM-dd') },
  { id: '3', name: 'Meditate', emoji: '🧘', color: '#f472b6', createdAt: format(new Date(), 'yyyy-MM-dd') },
]

function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function save(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

export function useHabits() {
  const [habits, setHabits] = useState([])
  const [completions, setCompletions] = useState({}) // { 'habitId-YYYY-MM-DD': true }

  useEffect(() => {
    const stored = load()
    if (stored) {
      setHabits(stored.habits || DEFAULT_HABITS)
      setCompletions(stored.completions || {})
    } else {
      setHabits(DEFAULT_HABITS)
      setCompletions({})
    }
  }, [])

  useEffect(() => {
    if (habits.length > 0) {
      save({ habits, completions })
    }
  }, [habits, completions])

  const toggleCompletion = useCallback((habitId, date) => {
    const key = `${habitId}-${date}`
    setCompletions(prev => {
      const next = { ...prev }
      if (next[key]) delete next[key]
      else next[key] = true
      return next
    })
  }, [])

  const isCompleted = useCallback((habitId, date) => {
    return !!completions[`${habitId}-${date}`]
  }, [completions])

  const addHabit = useCallback((name, emoji, color) => {
    const newHabit = {
      id: generateId(),
      name,
      emoji,
      color,
      createdAt: format(new Date(), 'yyyy-MM-dd')
    }
    setHabits(prev => [...prev, newHabit])
    return newHabit.id
  }, [])

  const deleteHabit = useCallback((id) => {
    setHabits(prev => prev.filter(h => h.id !== id))
    setCompletions(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(k => {
        if (k.startsWith(`${id}-`)) delete next[k]
      })
      return next
    })
  }, [])

  const updateHabit = useCallback((id, updates) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h))
  }, [])

  // Get streak for a habit
  const getStreak = useCallback((habitId) => {
    let streak = 0
    let d = new Date()
    // if today not done, start from yesterday
    const todayKey = `${habitId}-${format(d, 'yyyy-MM-dd')}`
    if (!completions[todayKey]) {
      d = subDays(d, 1)
    }
    while (true) {
      const key = `${habitId}-${format(d, 'yyyy-MM-dd')}`
      if (completions[key]) {
        streak++
        d = subDays(d, 1)
      } else break
    }
    return streak
  }, [completions])

  // Get last N days completion data for a habit (for heatmap)
  const getCompletionHistory = useCallback((habitId, days = 91) => {
    const result = []
    for (let i = days - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
      result.push({ date, done: !!completions[`${habitId}-${date}`] })
    }
    return result
  }, [completions])

  // Today's completion count
  const todayDate = format(new Date(), 'yyyy-MM-dd')
  const todayCount = habits.filter(h => completions[`${h.id}-${todayDate}`]).length

  return {
    habits,
    completions,
    toggleCompletion,
    isCompleted,
    addHabit,
    deleteHabit,
    updateHabit,
    getStreak,
    getCompletionHistory,
    todayDate,
    todayCount,
  }
}
