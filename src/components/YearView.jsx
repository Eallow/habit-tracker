import { useMemo } from 'react'
import { format, subDays } from 'date-fns'

const WEEKS = 26

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return [r, g, b]
}

function cellColor(habit, days, completions) {
  const done = days.filter(d => completions[`${habit.id}-${d}`]).length
  if (done === 0) return null
  const [r, g, b] = hexToRgb(habit.color)
  const opacity = done === 1 ? 0.28 : done <= 3 ? 0.52 : done <= 5 ? 0.78 : 1.0
  return `rgba(${r},${g},${b},${opacity})`
}

export default function YearView({ categories, completions }) {
  const weeks = useMemo(() => {
    const today = new Date()
    return Array.from({ length: WEEKS }, (_, i) => {
      const weekEnd = subDays(today, (WEEKS - 1 - i) * 7)
      return Array.from({ length: 7 }, (_, d) =>
        format(subDays(weekEnd, 6 - d), 'yyyy-MM-dd')
      )
    })
  }, [])

  const allHabits = useMemo(() => categories.flatMap(c => c.habits), [categories])
  const totalHabits = allHabits.length
  const totalCount = Object.keys(completions).length
  const windowDays = WEEKS * 7
  const dailyAvg = totalHabits > 0 ? (totalCount / windowDays).toFixed(1) : '0.0'
  const completionRate = totalHabits > 0
    ? Math.round((totalCount / (totalHabits * windowDays)) * 100)
    : 0

  return (
    <div className="year-view">
      <div className="year-heading">Overview</div>

      <div className="year-grid-section">
        {categories.map(cat => cat.habits.length > 0 && (
          <div key={cat.id} className="year-cat-block">
            <div className="year-cat-name">{cat.name}</div>
            {cat.habits.map(habit => (
              <div key={habit.id} className="year-habit-row">
                <div className="year-habit-label">
                  <span style={{ color: habit.color, fontSize: 9 }}>●</span>
                  <span className="year-habit-name">{habit.name}</span>
                </div>
                <div className="year-habit-cells">
                  {weeks.map((days, wi) => {
                    const bg = cellColor(habit, days, completions)
                    return <div key={wi} className="year-cell" style={bg ? { background: bg } : {}} />
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="year-legend">
        <span className="year-legend-text">Less</span>
        {[null, 0.28, 0.52, 0.78, 1.0].map((op, i) => (
          <div key={i} className="year-legend-cell"
            style={op !== null ? { background: `rgba(132,204,22,${op})` } : {}}
          />
        ))}
        <span className="year-legend-text">More</span>
      </div>

      <div className="year-stats">
        <div className="year-stat">
          <span className="year-stat-num">{totalHabits}</span>
          <span className="year-stat-label">HABITS</span>
        </div>
        <div className="year-stat">
          <span className="year-stat-num">{totalCount}</span>
          <span className="year-stat-label">{'TOTAL\nCOUNT'}</span>
        </div>
        <div className="year-stat">
          <span className="year-stat-num">{dailyAvg}</span>
          <span className="year-stat-label">{'DAILY\nAVERAGE'}</span>
        </div>
        <div className="year-stat">
          <span className="year-stat-num" style={{ color: completionRate < 30 ? '#ef4444' : 'var(--text)' }}>
            {completionRate}%
          </span>
          <span className="year-stat-label">{'AVERAGE\nCOMPLETION\nRATE'}</span>
        </div>
      </div>
    </div>
  )
}
