import { useState, useEffect, useCallback } from 'react'
import { format, subDays } from 'date-fns'

const STORAGE_KEY = 'habits_data_v4'

const DEFAULT_DATA = {
  categories: [
    {
      id: 'sports', name: 'SPORTS', collapsed: false,
      habits: [
        { id: 'running', name: 'Running', emoji: '🏃', color: '#ef4444' },
        { id: 'calisthenics', name: 'Calisthenics / Muscu / Climbing', emoji: '💪', color: '#f97316' },
        { id: 'stretching', name: 'Stretching / gainage', emoji: '🧘', color: '#eab308' },
      ]
    },
    {
      id: 'mind', name: 'MIND', collapsed: false,
      habits: [
        { id: 'read', name: 'Read', emoji: '📚', color: '#3b82f6' },
      ]
    },
    {
      id: 'health', name: 'HEALTH', collapsed: false,
      habits: [
        { id: 'water', name: 'Drink water', emoji: '💧', color: '#06b6d4' },
        { id: 'macro', name: 'Macro check', emoji: '🥗', color: '#a855f7' },
        { id: 'skincare', name: 'Skincare Soir', emoji: '✨', color: '#ec4899' },
        { id: 'brld', name: 'BRLD', emoji: '🌿', color: '#8b5cf6' },
        { id: 'fina', name: 'Fina', emoji: '💊', color: '#a855f7' },
      ]
    },
    {
      id: 'skills', name: 'SKILLS', collapsed: false,
      habits: [
        { id: 'es', name: 'ES', emoji: '📖', color: '#10b981' },
        { id: 'film', name: 'FILM / PHOTO', emoji: '🎬', color: '#f59e0b' },
        { id: 'journaling', name: 'Journaling', emoji: '✍️', color: '#6366f1' },
        { id: 'video', name: 'Video Creative / Photo shop / After...', emoji: '🎨', color: '#84cc16' },
        { id: 'flstudio', name: 'FL STUDIO', emoji: '🎵', color: '#14b8a6' },
      ]
    },
  ],
  completions: {},
  skips: {}
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

function genId() {
  return Math.random().toString(36).substr(2, 9)
}

export function useHabits() {
  const [categories, setCategories] = useState([])
  const [completions, setCompletions] = useState({})
  const [skips, setSkips] = useState({})

  useEffect(() => {
    const stored = load()
    if (stored) {
      setCategories(stored.categories || DEFAULT_DATA.categories)
      setCompletions(stored.completions || {})
      setSkips(stored.skips || {})
    } else {
      setCategories(DEFAULT_DATA.categories)
      setCompletions({})
      setSkips({})
    }
  }, [])

  useEffect(() => {
    if (categories.length > 0) save({ categories, completions, skips })
  }, [categories, completions, skips])

  const toggleCompletion = useCallback((habitId, date) => {
    const key = `${habitId}-${date}`
    const isCurrentlyDone = !!completions[key]
    setCompletions(prev => {
      const next = { ...prev }
      if (isCurrentlyDone) delete next[key]
      else next[key] = true
      return next
    })
    if (!isCurrentlyDone) {
      setSkips(prev => {
        if (!prev[key]) return prev
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }, [completions])

  const isCompleted = useCallback((habitId, date) => {
    return !!completions[`${habitId}-${date}`]
  }, [completions])

  const isSkipped = useCallback((habitId, date) => {
    return !!skips[`${habitId}-${date}`]
  }, [skips])

  const toggleSkip = useCallback((habitId, date) => {
    const key = `${habitId}-${date}`
    const isCurrentlySkipped = !!skips[key]
    setSkips(prev => {
      const next = { ...prev }
      if (isCurrentlySkipped) delete next[key]
      else next[key] = true
      return next
    })
    if (!isCurrentlySkipped) {
      setCompletions(prev => {
        if (!prev[key]) return prev
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }, [skips])

  const toggleCategory = useCallback((catId) => {
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, collapsed: !c.collapsed } : c))
  }, [])

  const addCategory = useCallback((name) => {
    const newCat = { id: genId(), name: name.toUpperCase(), collapsed: false, habits: [] }
    setCategories(prev => [...prev, newCat])
    return newCat.id
  }, [])

  const addHabit = useCallback((catId, name, emoji = '⭐', color = '#84cc16') => {
    const newHabit = { id: genId(), name, emoji, color }
    setCategories(prev => prev.map(c =>
      c.id === catId ? { ...c, habits: [...c.habits, newHabit] } : c
    ))
    return newHabit.id
  }, [])

  const updateHabitColor = useCallback((catId, habitId, color) => {
    setCategories(prev => prev.map(c =>
      c.id === catId
        ? { ...c, habits: c.habits.map(h => h.id === habitId ? { ...h, color } : h) }
        : c
    ))
  }, [])

  const renameCategory = useCallback((catId, name) => {
    setCategories(prev => prev.map(c =>
      c.id === catId ? { ...c, name: name.toUpperCase() } : c
    ))
  }, [])

  const renameHabit = useCallback((catId, habitId, name) => {
    setCategories(prev => prev.map(c =>
      c.id === catId
        ? { ...c, habits: c.habits.map(h => h.id === habitId ? { ...h, name } : h) }
        : c
    ))
  }, [])

  const deleteHabit = useCallback((catId, habitId) => {
    setCategories(prev => prev.map(c =>
      c.id === catId ? { ...c, habits: c.habits.filter(h => h.id !== habitId) } : c
    ))
    setCompletions(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(k => { if (k.startsWith(`${habitId}-`)) delete next[k] })
      return next
    })
    setSkips(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(k => { if (k.startsWith(`${habitId}-`)) delete next[k] })
      return next
    })
  }, [])

  const deleteCategory = useCallback((catId) => {
    setCategories(prev => {
      const cat = prev.find(c => c.id === catId)
      if (cat) {
        setCompletions(prev2 => {
          const next = { ...prev2 }
          cat.habits.forEach(h => {
            Object.keys(next).forEach(k => { if (k.startsWith(`${h.id}-`)) delete next[k] })
          })
          return next
        })
        setSkips(prev2 => {
          const next = { ...prev2 }
          cat.habits.forEach(h => {
            Object.keys(next).forEach(k => { if (k.startsWith(`${h.id}-`)) delete next[k] })
          })
          return next
        })
      }
      return prev.filter(c => c.id !== catId)
    })
  }, [])

  // Streak at a date: counts done days, skips are transparent (max 2 consecutive skips)
  const getStreakAt = useCallback((habitId, dateStr) => {
    let streak = 0
    let consecutiveSkips = 0
    let d = new Date(dateStr + 'T12:00:00')
    while (true) {
      const dStr = format(d, 'yyyy-MM-dd')
      if (completions[`${habitId}-${dStr}`]) {
        streak++
        consecutiveSkips = 0
        d = subDays(d, 1)
      } else if (skips[`${habitId}-${dStr}`]) {
        consecutiveSkips++
        if (consecutiveSkips > 2) break
        d = subDays(d, 1)
      } else {
        break
      }
    }
    return streak
  }, [completions, skips])

  const getStreak = useCallback((habitId) => {
    let streak = 0
    let consecutiveSkips = 0
    let d = new Date()
    const todayStr = format(d, 'yyyy-MM-dd')
    if (!completions[`${habitId}-${todayStr}`] && !skips[`${habitId}-${todayStr}`]) {
      d = subDays(d, 1)
    }
    while (true) {
      const dStr = format(d, 'yyyy-MM-dd')
      if (completions[`${habitId}-${dStr}`]) {
        streak++
        consecutiveSkips = 0
        d = subDays(d, 1)
      } else if (skips[`${habitId}-${dStr}`]) {
        consecutiveSkips++
        if (consecutiveSkips > 2) break
        d = subDays(d, 1)
      } else {
        break
      }
    }
    return streak
  }, [completions, skips])

  const getLongestStreak = useCallback((habitId) => {
    let longest = 0
    let current = 0
    let consecutiveSkips = 0
    for (let i = 364; i >= 0; i--) {
      const dStr = format(subDays(new Date(), i), 'yyyy-MM-dd')
      if (completions[`${habitId}-${dStr}`]) {
        current++
        consecutiveSkips = 0
        longest = Math.max(longest, current)
      } else if (skips[`${habitId}-${dStr}`]) {
        consecutiveSkips++
        if (consecutiveSkips > 2) { current = 0; consecutiveSkips = 0 }
      } else {
        current = 0
        consecutiveSkips = 0
      }
    }
    return longest
  }, [completions, skips])

  const getTotalCount = useCallback((habitId) => {
    return Object.keys(completions).filter(k => k.startsWith(`${habitId}-`)).length
  }, [completions])

  const wasPrevDayDone = useCallback((habitId, dateStr) => {
    const prev = format(subDays(new Date(dateStr + 'T12:00:00'), 1), 'yyyy-MM-dd')
    return !!completions[`${habitId}-${prev}`] || !!skips[`${habitId}-${prev}`]
  }, [completions, skips])

  const isNextDayDone = useCallback((habitId, dateStr) => {
    const next = format(new Date(new Date(dateStr + 'T12:00:00').getTime() + 86400000), 'yyyy-MM-dd')
    return !!completions[`${habitId}-${next}`]
  }, [completions])

  return {
    categories, completions, skips,
    toggleCompletion, isCompleted,
    isSkipped, toggleSkip,
    toggleCategory, addCategory, addHabit, deleteHabit, deleteCategory,
    updateHabitColor, renameCategory, renameHabit,
    getStreak, getLongestStreak, getTotalCount,
    getStreakAt, wasPrevDayDone, isNextDayDone,
    todayDate: format(new Date(), 'yyyy-MM-dd'),
  }
}
