import { format, subDays } from 'date-fns'
import { Flame, TrendingUp, Calendar, CheckCircle } from 'lucide-react'

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ color }}>{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function WeeklyBar({ habits, isCompleted }) {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = subDays(new Date(), i)
    const dateStr = format(d, 'yyyy-MM-dd')
    const count = habits.filter(h => isCompleted(h.id, dateStr)).length
    days.push({ label: format(d, 'EEE'), date: dateStr, count, pct: habits.length ? count / habits.length : 0 })
  }

  return (
    <div className="weekly-card">
      <div className="weekly-title">This Week</div>
      <div className="weekly-bars">
        {days.map(day => (
          <div key={day.date} className="weekly-bar-col">
            <div className="weekly-bar-wrap">
              <div
                className="weekly-bar-fill"
                style={{ height: `${Math.max(4, day.pct * 100)}%`, background: day.pct === 1 ? '#a3e635' : '#38bdf8' }}
              />
            </div>
            <div className="weekly-bar-label">{day.label}</div>
            <div className="weekly-bar-count">{day.count}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HabitStats({ habit, getStreak, getCompletionHistory }) {
  const streak = getStreak(habit.id)
  const history = getCompletionHistory(habit.id, 30)
  const total30 = history.filter(d => d.done).length
  const pct = Math.round((total30 / 30) * 100)

  return (
    <div className="habit-stat-row">
      <span className="habit-stat-emoji">{habit.emoji}</span>
      <div className="habit-stat-info">
        <div className="habit-stat-name">{habit.name}</div>
        <div className="habit-stat-bar-wrap">
          <div
            className="habit-stat-bar"
            style={{ width: `${pct}%`, background: habit.color }}
          />
        </div>
      </div>
      <div className="habit-stat-nums">
        <span className="habit-stat-pct">{pct}%</span>
        {streak > 0 && (
          <span className="habit-stat-streak">🔥 {streak}</span>
        )}
      </div>
    </div>
  )
}

export default function StatsView({ habits, isCompleted, getStreak, getCompletionHistory }) {
  const todayDate = format(new Date(), 'yyyy-MM-dd')
  const todayCount = habits.filter(h => isCompleted(h.id, todayDate)).length

  // Best streak across all habits
  const bestStreak = habits.reduce((best, h) => Math.max(best, getStreak(h.id)), 0)

  // Total completions last 30 days
  const last30 = habits.reduce((total, h) => {
    const hist = getCompletionHistory(h.id, 30)
    return total + hist.filter(d => d.done).length
  }, 0)

  // Overall consistency last 30 days
  const possible30 = habits.length * 30
  const consistency = possible30 > 0 ? Math.round((last30 / possible30) * 100) : 0

  return (
    <div className="stats-view">
      <div className="stats-grid">
        <StatCard icon={<CheckCircle size={22} />} label="Today" value={`${todayCount}/${habits.length}`} color="#a3e635" />
        <StatCard icon={<Flame size={22} />} label="Best streak" value={`${bestStreak}d`} color="#fb923c" />
        <StatCard icon={<Calendar size={22} />} label="Last 30d" value={last30} color="#38bdf8" />
        <StatCard icon={<TrendingUp size={22} />} label="Consistency" value={`${consistency}%`} color="#f472b6" />
      </div>

      <WeeklyBar habits={habits} isCompleted={isCompleted} />

      <div className="habits-stats-list">
        <div className="habits-stats-title">Last 30 days</div>
        {habits.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <div className="empty-text">No habits to track yet</div>
          </div>
        )}
        {habits.map(habit => (
          <HabitStats
            key={habit.id}
            habit={habit}
            getStreak={getStreak}
            getCompletionHistory={getCompletionHistory}
          />
        ))}
      </div>
    </div>
  )
}
