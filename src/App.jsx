import { useState } from 'react'
import { CheckSquare, BarChart2, Calendar } from 'lucide-react'
import { useHabits } from './hooks/useHabits'
import TodayView from './components/TodayView'
import CalendarView from './components/CalendarView'
import StatsView from './components/StatsView'
import './App.css'

const TABS = [
  { id: 'today', label: 'Today', icon: CheckSquare },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'stats', label: 'Stats', icon: BarChart2 },
]

export default function App() {
  const [tab, setTab] = useState('today')
  const {
    habits, completions,
    toggleCompletion, isCompleted,
    addHabit, deleteHabit, updateHabit,
    getStreak, getCompletionHistory,
    todayDate, todayCount
  } = useHabits()

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">
          <span className="logo-dot" />
          <span className="logo-text">habits</span>
        </div>
        <nav className="app-nav desktop-nav">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`nav-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {tab === 'today' && (
          <TodayView
            habits={habits}
            isCompleted={isCompleted}
            toggleCompletion={toggleCompletion}
            todayDate={todayDate}
            todayCount={todayCount}
            addHabit={addHabit}
            deleteHabit={deleteHabit}
            getStreak={getStreak}
          />
        )}
        {tab === 'calendar' && (
          <CalendarView
            habits={habits}
            isCompleted={isCompleted}
            toggleCompletion={toggleCompletion}
            getCompletionHistory={getCompletionHistory}
          />
        )}
        {tab === 'stats' && (
          <StatsView
            habits={habits}
            isCompleted={isCompleted}
            getStreak={getStreak}
            getCompletionHistory={getCompletionHistory}
          />
        )}
      </main>

      <nav className="bottom-nav">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`bottom-nav-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <t.icon size={20} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
