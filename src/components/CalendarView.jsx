import { useState } from 'react'
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths, isSameDay, parseISO } from 'date-fns'

function Heatmap({ habit, getCompletionHistory }) {
  const history = getCompletionHistory(habit.id, 91)
  // Group into weeks
  const weeks = []
  let week = []
  // Pad start
  const firstDay = parseISO(history[0].date)
  const startPad = getDay(firstDay)
  for (let i = 0; i < startPad; i++) week.push(null)
  for (const day of history) {
    week.push(day)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }

  const total = history.filter(d => d.done).length

  return (
    <div className="heatmap-card">
      <div className="heatmap-header">
        <span className="heatmap-emoji">{habit.emoji}</span>
        <span className="heatmap-name">{habit.name}</span>
        <span className="heatmap-count">{total} days</span>
      </div>
      <div className="heatmap-grid">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className="heatmap-day-label">{d}</div>
        ))}
        {weeks.map((week, wi) =>
          week.map((day, di) => (
            <div
              key={`${wi}-${di}`}
              className={`heatmap-cell ${day?.done ? 'done' : ''} ${day === null ? 'empty' : ''}`}
              style={day?.done ? { background: habit.color, opacity: 0.85 } : {}}
              title={day?.date || ''}
            />
          ))
        )}
      </div>
    </div>
  )
}

function MonthCalendar({ habit, isCompleted, toggleCompletion, month, onPrev, onNext }) {
  const start = startOfMonth(month)
  const end = endOfMonth(month)
  const days = eachDayOfInterval({ start, end })
  const startPad = getDay(start)

  return (
    <div className="month-card">
      <div className="month-header">
        <button className="month-nav" onClick={onPrev}>‹</button>
        <div className="month-title">{format(month, 'MMMM yyyy')}</div>
        <button className="month-nav" onClick={onNext}>›</button>
      </div>
      <div className="month-grid">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="month-label">{d}</div>
        ))}
        {Array(startPad).fill(null).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const done = isCompleted(habit.id, dateStr)
          const isToday = isSameDay(day, new Date())
          return (
            <button
              key={dateStr}
              className={`month-day ${done ? 'done' : ''} ${isToday ? 'today' : ''}`}
              style={done ? { background: habit.color } : {}}
              onClick={() => toggleCompletion(habit.id, dateStr)}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function CalendarView({ habits, isCompleted, toggleCompletion, getCompletionHistory }) {
  const [month, setMonth] = useState(new Date())
  const [view, setView] = useState('heatmap') // 'heatmap' | 'calendar'
  const [selectedHabit, setSelectedHabit] = useState(null)

  return (
    <div className="calendar-view">
      <div className="cal-header">
        <div className="view-toggle">
          <button className={view === 'heatmap' ? 'active' : ''} onClick={() => setView('heatmap')}>Heatmap</button>
          <button className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}>Calendar</button>
        </div>
      </div>

      {view === 'heatmap' && (
        <div className="heatmaps">
          {habits.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <div className="empty-text">Add habits to see your progress</div>
            </div>
          )}
          {habits.map(habit => (
            <Heatmap key={habit.id} habit={habit} getCompletionHistory={getCompletionHistory} />
          ))}
        </div>
      )}

      {view === 'calendar' && (
        <div className="cal-content">
          {habits.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <div className="empty-text">Add habits first</div>
            </div>
          )}
          {habits.length > 0 && (
            <>
              <div className="habit-selector">
                {habits.map(h => (
                  <button
                    key={h.id}
                    className={`habit-chip ${selectedHabit === h.id ? 'selected' : ''}`}
                    style={selectedHabit === h.id ? { background: h.color, color: '#000' } : {}}
                    onClick={() => setSelectedHabit(h.id === selectedHabit ? null : h.id)}
                  >
                    {h.emoji} {h.name}
                  </button>
                ))}
              </div>
              {habits
                .filter(h => !selectedHabit || h.id === selectedHabit)
                .map(habit => (
                  <MonthCalendar
                    key={habit.id}
                    habit={habit}
                    isCompleted={isCompleted}
                    toggleCompletion={toggleCompletion}
                    month={month}
                    onPrev={() => setMonth(m => subMonths(m, 1))}
                    onNext={() => setMonth(m => addMonths(m, 1))}
                  />
                ))
              }
            </>
          )}
        </div>
      )}
    </div>
  )
}
