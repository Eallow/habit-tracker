import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { format, addDays, subDays, eachDayOfInterval, isToday, isWeekend, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, ChevronDown, Plus, Check, Trash2, LayoutGrid, Palette, Pencil } from 'lucide-react'
import { useHabits } from './hooks/useHabits'
import './App.css'

const EMOJIS = ['⭐','🏃','💪','🧘','📚','💧','🥗','✨','🌿','💊','📖','🎬','✍️','🎨','🎵','🎯','❤️','🧠','🚴','🏊','😴','☕','🍎','🎸','📝','🔥','💰','🌱']

const PRESET_COLORS = [
  '#ef4444','#f97316','#f59e0b','#eab308',
  '#84cc16','#22c55e','#10b981','#14b8a6',
  '#06b6d4','#3b82f6','#6366f1','#8b5cf6',
  '#a855f7','#ec4899','#f43f5e','#ffffff',
]

// ---- Color utilities ----
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return [r, g, b]
}

// Returns color at a given streak depth (1 = lightest, 7+ = full)
function streakColor(baseColor, streakLen) {
  if (streakLen <= 0) return null
  const [r, g, b] = hexToRgb(baseColor)
  // opacity ramp: 0.25 → 1.0 over 7 steps
  const minOpacity = 0.42
  const maxOpacity = 1.0
  const steps = 7
  const t = Math.min((streakLen - 1) / (steps - 1), 1)
  const opacity = minOpacity + t * (maxOpacity - minOpacity)
  return `rgba(${r},${g},${b},${opacity})`
}

// ---- Completion Cell ----
function CompletionCell({ habitId, dateStr, habit, done, isToday, streakLen, prevDone, nextDone, onToggle }) {
  const bg = done ? streakColor(habit.color, streakLen) : null

  // "broken after" = this day is NOT done but the previous day WAS done
  // shows diagonal cut on the right side
  const brokenAfter = !done && prevDone

  // "broken before" = this day IS done but was preceded by a miss (already reset streak)
  // We show diagonal on left side of FIRST day of a streak if prev was miss
  // Actually Everyday shows diagonal on the MISSED day after a streak
  // The cell is split: top-left is colored (remnant of streak), bottom-right is dark

  return (
    <div
      className={`completion-cell ${done ? 'done' : ''} ${isToday ? 'today-col' : ''} ${brokenAfter ? 'broken' : ''}`}
      onClick={() => onToggle(habitId, dateStr)}
      style={done ? { '--cell-color': bg } : {}}
    >
      {done && (
        <div className="cell-fill" style={{ background: bg }} />
      )}
      {brokenAfter && (
        <div className="cell-broken-overlay" style={{ '--streak-color': streakColor(habit.color, 1) }} />
      )}
      {done && (
        <Check size={11} strokeWidth={3} className="cell-check-icon" />
      )}
    </div>
  )
}

// ---- Color Picker Popover ----
function ColorPicker({ currentColor, onSelect, onClose, anchorRef }) {
  useEffect(() => {
    const close = (e) => {
      if (anchorRef.current && !anchorRef.current.contains(e.target)) onClose()
    }
    setTimeout(() => document.addEventListener('mousedown', close), 0)
    return () => document.removeEventListener('mousedown', close)
  }, [onClose, anchorRef])

  return (
    <div className="color-picker-popover">
      <div className="color-picker-grid">
        {PRESET_COLORS.map(c => (
          <button
            key={c}
            className={`color-swatch ${c === currentColor ? 'selected' : ''}`}
            style={{ background: c }}
            onClick={() => { onSelect(c); onClose() }}
          />
        ))}
      </div>
      <div style={{ padding: '8px 8px 4px', borderTop: '1px solid var(--border)' }}>
        <input
          type="color"
          value={currentColor}
          className="color-native-input"
          onChange={e => onSelect(e.target.value)}
        />
      </div>
    </div>
  )
}

// ---- Add Modal ----
function AddModal({ categories, onAdd, onAddCategory, onClose }) {
  const [mode, setMode] = useState('habit')
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('⭐')
  const [color, setColor] = useState('#84cc16')
  const [catId, setCatId] = useState(categories[0]?.id || '')

  function handleSubmit() {
    if (!name.trim()) return
    if (mode === 'habit') onAdd(catId, name.trim(), emoji, color)
    else onAddCategory(name.trim())
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {['habit','category'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex:1, padding:'8px', borderRadius:8, fontSize:13, fontWeight:600,
              background: mode===m ? 'var(--accent)' : 'var(--bg3)',
              color: mode===m ? '#000' : 'var(--text2)',
              border:'none', cursor:'pointer', textTransform:'capitalize'
            }}>New {m}</button>
          ))}
        </div>

        <input
          className="modal-input"
          placeholder={mode === 'habit' ? 'Habit name…' : 'Category name…'}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          autoFocus
        />

        {mode === 'habit' && (
          <>
            <select className="modal-input" value={catId} onChange={e => setCatId(e.target.value)} style={{marginBottom:12}}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <div className="modal-section-label">Color</div>
            <div className="color-picker-grid" style={{marginBottom:14}}>
              {PRESET_COLORS.map(c => (
                <button key={c} className={`color-swatch ${c===color?'selected':''}`}
                  style={{background:c}} onClick={() => setColor(c)} />
              ))}
            </div>
            <div style={{marginBottom:14, display:'flex', alignItems:'center', gap:8}}>
              <span style={{fontSize:11, color:'var(--text3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em'}}>Custom</span>
              <input type="color" value={color} className="color-native-input" onChange={e => setColor(e.target.value)} />
              <span style={{width:24, height:24, borderRadius:6, background:color, display:'inline-block', border:'1px solid var(--border2)'}} />
            </div>

            <div className="modal-section-label">Emoji</div>
            <div className="emoji-grid">
              {EMOJIS.map(e => (
                <button key={e} className={`emoji-btn ${emoji===e?'selected':''}`} onClick={() => setEmoji(e)}>{e}</button>
              ))}
            </div>
          </>
        )}

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-confirm" onClick={handleSubmit} disabled={!name.trim()}>Add</button>
        </div>
      </div>
    </div>
  )
}

// ---- Context Menu ----
function CtxMenu({ x, y, items, onClose }) {
  useEffect(() => {
    const close = () => onClose()
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [onClose])

  return (
    <div className="ctx-menu" style={{ left:x, top:y }} onMouseDown={e => e.stopPropagation()}>
      {items.map((item, i) => (
        <button key={i} className={`ctx-item ${item.danger?'danger':''}`}
          onClick={() => { item.action(); onClose() }}>
          {item.icon}{item.label}
        </button>
      ))}
    </div>
  )
}

// ---- MAIN ----
export default function App() {
  const DAYS_SHOWN = 24
  const [windowStart, setWindowStart] = useState(() => subDays(new Date(), 18))
  const dates = useMemo(() =>
    eachDayOfInterval({ start: windowStart, end: addDays(windowStart, DAYS_SHOWN - 1) }),
    [windowStart]
  )

  const {
    categories, completions,
    toggleCompletion, isCompleted,
    toggleCategory, addCategory, addHabit, deleteHabit, deleteCategory,
    updateHabitColor, renameCategory, renameHabit,
    getStreak, getLongestStreak, getTotalCount,
    getStreakAt, wasPrevDayDone, isNextDayDone,
    todayDate,
  } = useHabits()

  const [showAdd, setShowAdd] = useState(false)
  const [ctxMenu, setCtxMenu] = useState(null)
  const [colorPicker, setColorPicker] = useState(null) // { catId, habitId, color, ref }
  const [renamingCatId, setRenamingCatId] = useState(null)
  const [renamingHabitId, setRenamingHabitId] = useState(null)
  const colorPickerRef = useRef(null)

  const sidebarRef = useRef(null)
  const gridBodyRef = useRef(null)

  function shiftWindow(days) { setWindowStart(d => addDays(d, days)) }
  function goToToday() { setWindowStart(subDays(new Date(), 18)) }

  function openCtx(e, items) {
    e.preventDefault()
    setCtxMenu({ x: e.clientX, y: e.clientY, items })
  }

  function handleSidebarScroll(e) {
    if (gridBodyRef.current) gridBodyRef.current.scrollTop = e.target.scrollTop
  }
  function handleGridScroll(e) {
    if (sidebarRef.current) sidebarRef.current.scrollTop = e.target.scrollTop
  }

  return (
    <div className="app">
      {/* TOP BAR */}
      <div className="topbar">
        <div className="topbar-logo">
          <div className="topbar-icon">
            <span /><span /><span /><span />
          </div>
          habits
        </div>
        <div className="topbar-sep" />
        <button className="topbar-btn active">
          <LayoutGrid size={14} />
          All Habits
          <ChevronDown size={12} />
        </button>
        <div className="topbar-spacer" />
        <button className="topbar-btn" onClick={() => shiftWindow(-7)}><ChevronLeft size={14} /></button>
        <button className="topbar-btn" onClick={goToToday}>Today</button>
        <button className="topbar-btn" onClick={() => shiftWindow(7)}><ChevronRight size={14} /></button>
        <button className="topbar-btn" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Add
        </button>
      </div>

      <div className="grid-container">
        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="sidebar-date-header">
            <button className="sidebar-filter">
              <span style={{fontSize:11, fontWeight:700, color:'var(--text2)'}}>ALL HABITS</span>
              <ChevronDown size={12} style={{marginLeft:'auto'}} />
            </button>
          </div>

          <div className="sidebar-scroll-sync" ref={sidebarRef} onScroll={handleSidebarScroll}>
            {categories.map(cat => (
              <div key={cat.id}>
                <div
                  className="cat-row-sidebar"
                  onClick={() => renamingCatId !== cat.id && toggleCategory(cat.id)}
                  onContextMenu={e => openCtx(e, [
                    { label:'Rename', icon:<Pencil size={13}/>, action: () => setRenamingCatId(cat.id) },
                    { label:'Add habit', icon:<Plus size={13}/>, action: () => setShowAdd(true) },
                    { label:'Delete category', icon:<Trash2 size={13}/>, danger:true, action: () => deleteCategory(cat.id) }
                  ])}
                >
                  {renamingCatId === cat.id ? (
                    <input
                      className="cat-rename-input"
                      defaultValue={cat.name}
                      autoFocus
                      onClick={e => e.stopPropagation()}
                      onBlur={e => { renameCategory(cat.id, e.target.value); setRenamingCatId(null) }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { renameCategory(cat.id, e.target.value); setRenamingCatId(null) }
                        if (e.key === 'Escape') setRenamingCatId(null)
                      }}
                    />
                  ) : (
                    <span
                      className="cat-name"
                      onDoubleClick={e => { e.stopPropagation(); setRenamingCatId(cat.id) }}
                    >{cat.name}</span>
                  )}
                  <span className={`cat-collapse-btn ${cat.collapsed?'collapsed':''}`}>
                    <ChevronDown size={12} />
                  </span>
                </div>

                {!cat.collapsed && cat.habits.map(habit => (
                  <div
                    key={habit.id}
                    className="habit-row-sidebar"
                    onContextMenu={e => openCtx(e, [
                      { label:'Rename', icon:<Pencil size={13}/>, action: () => setRenamingHabitId(habit.id) },
                      {
                        label:'Change color',
                        icon:<Palette size={13}/>,
                        action: () => {
                          setColorPicker({ catId: cat.id, habitId: habit.id, color: habit.color })
                        }
                      },
                      { label:'Delete habit', icon:<Trash2 size={13}/>, danger:true, action: () => deleteHabit(cat.id, habit.id) }
                    ])}
                  >
                    <span
                      className="habit-color-dot"
                      style={{ background: habit.color }}
                      onClick={e => {
                        e.stopPropagation()
                        setColorPicker({ catId: cat.id, habitId: habit.id, color: habit.color })
                      }}
                    />
                    <span className="habit-row-emoji">{habit.emoji}</span>
                    {renamingHabitId === habit.id ? (
                      <input
                        className="habit-rename-input"
                        defaultValue={habit.name}
                        autoFocus
                        onClick={e => e.stopPropagation()}
                        onBlur={e => { renameHabit(cat.id, habit.id, e.target.value); setRenamingHabitId(null) }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { renameHabit(cat.id, habit.id, e.target.value); setRenamingHabitId(null) }
                          if (e.key === 'Escape') setRenamingHabitId(null)
                        }}
                      />
                    ) : (
                      <span
                        className="habit-row-name"
                        onDoubleClick={e => { e.stopPropagation(); setRenamingHabitId(habit.id) }}
                      >{habit.name}</span>
                    )}
                    <button className="habit-delete-btn" onClick={e => { e.stopPropagation(); deleteHabit(cat.id, habit.id) }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            ))}

            <button className="add-habit-row" onClick={() => setShowAdd(true)}>
              <Plus size={13} /> Add habit
            </button>
          </div>
        </div>

        {/* GRID */}
        <div className="grid-scroll-area">
          <div className="grid-inner">
            {/* DATE HEADER */}
            <div className="date-header-row">
              {dates.map(date => {
                const dateStr = format(date, 'yyyy-MM-dd')
                const today = isToday(date)
                const weekend = isWeekend(date)
                return (
                  <div key={dateStr} className={`date-cell ${today?'today':''} ${weekend&&!today?'weekend':''}`}>
                    <span className="date-month">{format(date,'MMM')}</span>
                    <span className="date-num">{format(date,'d')}</span>
                    <span className="date-day">{format(date,'EEE').toUpperCase()}</span>
                  </div>
                )
              })}

              <div className="stats-header">
                {['current streak','longest streak','total count'].map(l => (
                  <div key={l} className="stats-col-header">
                    <span className="stats-col-label">{l.split(' ').join('\n')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* GRID BODY */}
            <div
              className="grid-body"
              ref={gridBodyRef}
              onScroll={handleGridScroll}
              style={{ overflowY:'auto', maxHeight:'calc(100dvh - 48px - 52px)', scrollbarWidth:'none' }}
            >
              {categories.map(cat => (
                <div key={cat.id}>
                  {/* Category row */}
                  <div className="cat-row-grid">
                    {dates.map(date => (
                      <div key={format(date,'yyyy-MM-dd')} className="cat-cell-grid" />
                    ))}
                    <div className="cat-stats-grid">
                      {[0,1,2].map(i => (
                        <div key={i} className="cat-stats-cell">
                          {i===0 && cat.collapsed && (
                            <span className="cat-stat-count">{cat.habits.length} <ChevronRight size={10}/></span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Habit rows */}
                  {!cat.collapsed && cat.habits.map(habit => (
                    <div key={habit.id} className="habit-row-grid">
                      {dates.map(date => {
                        const dateStr = format(date, 'yyyy-MM-dd')
                        const done = isCompleted(habit.id, dateStr)
                        const today = isToday(date)
                        const streakLen = done ? getStreakAt(habit.id, dateStr) : 0
                        const prevDone = wasPrevDayDone(habit.id, dateStr)

                        return (
                          <CompletionCell
                            key={dateStr}
                            habitId={habit.id}
                            dateStr={dateStr}
                            habit={habit}
                            done={done}
                            isToday={today}
                            streakLen={streakLen}
                            prevDone={prevDone}
                            onToggle={toggleCompletion}
                          />
                        )
                      })}

                      <div className="habit-stats-cells">
                        {[getStreak(habit.id), getLongestStreak(habit.id), getTotalCount(habit.id)].map((val, i) => (
                          <div key={i} className="stat-cell">
                            <span className={`stat-num ${val===0?'zero':''} ${i===0&&val>0?'highlight':''}`}
                              style={i===0&&val>0 ? {color: habit.color} : {}}>
                              {val}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {/* Bottom count row */}
              <div className="bottom-count-row">
                {dates.map(date => {
                  const dateStr = format(date, 'yyyy-MM-dd')
                  const count = categories.flatMap(c => c.habits).filter(h => isCompleted(h.id, dateStr)).length
                  return (
                    <div key={dateStr} className={`bottom-count-cell ${isToday(date)?'today-col':''}`}>
                      <span className="bottom-count-num">{count > 0 ? count : ''}</span>
                    </div>
                  )
                })}
                <div className="bottom-stats-spacer" />
              </div>

              <div style={{height:40}} />
            </div>
          </div>
        </div>
      </div>

      {/* COLOR PICKER */}
      {colorPicker && (
        <div
          className="modal-overlay"
          style={{background:'rgba(0,0,0,0.4)'}}
          onClick={() => setColorPicker(null)}
        >
          <div className="modal" style={{maxWidth:260}} onClick={e => e.stopPropagation()}>
            <div className="modal-title" style={{marginBottom:12}}>Choose color</div>
            <div className="color-picker-grid" style={{marginBottom:12}}>
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  className={`color-swatch ${c===colorPicker.color?'selected':''}`}
                  style={{background:c}}
                  onClick={() => {
                    updateHabitColor(colorPicker.catId, colorPicker.habitId, c)
                    setColorPicker(p => ({...p, color:c}))
                  }}
                />
              ))}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10, padding:'8px 0'}}>
              <span style={{fontSize:11,color:'var(--text3)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em'}}>Custom</span>
              <input
                type="color"
                value={colorPicker.color}
                className="color-native-input"
                onChange={e => {
                  updateHabitColor(colorPicker.catId, colorPicker.habitId, e.target.value)
                  setColorPicker(p => ({...p, color: e.target.value}))
                }}
              />
              <span style={{width:28,height:28,borderRadius:6,background:colorPicker.color,display:'inline-block',border:'1px solid var(--border2)',transition:'background 0.1s'}} />
            </div>
            <button className="btn-confirm" style={{width:'100%',marginTop:12}} onClick={() => setColorPicker(null)}>Done</button>
          </div>
        </div>
      )}

      {showAdd && (
        <AddModal
          categories={categories}
          onAdd={addHabit}
          onAddCategory={addCategory}
          onClose={() => setShowAdd(false)}
        />
      )}

      {ctxMenu && (
        <CtxMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxMenu.items} onClose={() => setCtxMenu(null)} />
      )}
    </div>
  )
}
