import { useState } from 'react'
import { format } from 'date-fns'
import { Check, Flame, Plus, Trash2, Pencil } from 'lucide-react'

const COLORS = ['#a3e635', '#38bdf8', '#f472b6', '#fb923c', '#a78bfa', '#34d399', '#fbbf24', '#f87171']
const EMOJIS = ['🏃','📚','🧘','💧','🥗','😴','✍️','🎯','💪','🎸','🌿','🧠','❤️','🚴','🏊','🎨']

function AddHabitModal({ onAdd, onClose }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🎯')
  const [color, setColor] = useState('#a3e635')

  function handleSubmit() {
    if (!name.trim()) return
    onAdd(name.trim(), emoji, color)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">New Habit</h2>

        <div className="modal-preview">
          <span className="preview-emoji">{emoji}</span>
          <input
            className="modal-input"
            placeholder="Habit name…"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
        </div>

        <div className="modal-section-label">Emoji</div>
        <div className="emoji-grid">
          {EMOJIS.map(e => (
            <button
              key={e}
              className={`emoji-btn ${emoji === e ? 'selected' : ''}`}
              onClick={() => setEmoji(e)}
            >{e}</button>
          ))}
        </div>

        <div className="modal-section-label">Color</div>
        <div className="color-grid">
          {COLORS.map(c => (
            <button
              key={c}
              className={`color-btn ${color === c ? 'selected' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-add" onClick={handleSubmit} disabled={!name.trim()}>Add Habit</button>
        </div>
      </div>
    </div>
  )
}

function HabitRow({ habit, isCompleted, onToggle, onDelete, streak }) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div
      className={`habit-row ${isCompleted ? 'completed' : ''}`}
      onContextMenu={e => { e.preventDefault(); setShowActions(!showActions) }}
    >
      <button
        className="check-btn"
        style={{ '--habit-color': habit.color }}
        onClick={() => onToggle(habit.id)}
      >
        {isCompleted && <Check size={16} strokeWidth={3} />}
      </button>

      <span className="habit-emoji">{habit.emoji}</span>
      <span className="habit-name">{habit.name}</span>

      <div className="habit-right">
        {streak > 1 && (
          <span className="streak-badge">
            <Flame size={12} />
            {streak}
          </span>
        )}
        <button
          className="delete-btn"
          onClick={() => onDelete(habit.id)}
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

export default function TodayView({ habits, isCompleted, toggleCompletion, todayDate, todayCount, addHabit, deleteHabit, getStreak }) {
  const [showAdd, setShowAdd] = useState(false)
  const dayLabel = format(new Date(), 'EEEE, MMMM d')

  const pct = habits.length > 0 ? Math.round((todayCount / habits.length) * 100) : 0

  return (
    <div className="today-view">
      <div className="today-header">
        <div>
          <div className="today-date">{dayLabel}</div>
          <div className="today-subtitle">
            {todayCount === habits.length && habits.length > 0
              ? '🎉 All done!'
              : `${todayCount} / ${habits.length} completed`}
          </div>
        </div>
        <div className="progress-ring-wrap">
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="22" fill="none" stroke="#1e1e1e" strokeWidth="4"/>
            <circle
              cx="26" cy="26" r="22" fill="none"
              stroke="#a3e635" strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 22}`}
              strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct / 100)}`}
              transform="rotate(-90 26 26)"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
            <text x="26" y="31" textAnchor="middle" className="ring-text">{pct}%</text>
          </svg>
        </div>
      </div>

      <div className="habits-list">
        {habits.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🌱</div>
            <div className="empty-text">No habits yet.<br/>Add your first one!</div>
          </div>
        )}
        {habits.map(habit => (
          <HabitRow
            key={habit.id}
            habit={habit}
            isCompleted={isCompleted(habit.id, todayDate)}
            onToggle={() => toggleCompletion(habit.id, todayDate)}
            onDelete={deleteHabit}
            streak={getStreak(habit.id)}
          />
        ))}
      </div>

      <button className="fab" onClick={() => setShowAdd(true)}>
        <Plus size={24} />
      </button>

      {showAdd && (
        <AddHabitModal
          onAdd={addHabit}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}
