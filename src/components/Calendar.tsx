import React from 'react'
import { clsx } from 'clsx'

// Пропсы календаря
type CalendarProps = {
  value?: Date | null            // выбранная дата
  onChange?: (date: Date) => void // колбэк выбора
  initialMonth?: Date            // стартовый месяц
  locale?: string                // локаль форматирования (по умолчанию ru-RU)
  weekStartsOn?: 0 | 1           // первый день недели (0 — вс, 1 — пн)
}

type DayCell = {
  date: Date
  isCurrentMonth: boolean
  iso: string
}

// Утилиты дат (без сторонних библиотек)
const toMidday = (d: Date) => {
  const x = new Date(d)
  x.setHours(12, 0, 0, 0)
  return x
}

const startOfMonth = (d: Date) => {
  const x = toMidday(d)
  return toMidday(new Date(x.getFullYear(), x.getMonth(), 1))
}

const addDays = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return toMidday(x)
}

const addMonths = (d: Date, n: number) => {
  const x = new Date(d)
  x.setMonth(x.getMonth() + n)
  return toMidday(x)
}

const isSameDay = (a?: Date | null, b?: Date | null) => {
  if (!a || !b) return false
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const toISO = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Метки дней недели (сдвигаем, если неделя с понедельника)
const getWeekdayLabels = (locale: string, weekStartsOn: 0 | 1): string[] => {
  const base = new Date(2023, 0, 1) // воскресенье
  const days = Array.from({ length: 7 }, (_, i) => addDays(base, i))
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  const labels = days.map((d) => fmt.format(d).replace('.', ''))
  return weekStartsOn === 1 ? [...labels.slice(1), labels[0]] : labels
}

// 6 строк по 7 дней (42 ячейки)
const getGrid = (monthDate: Date, weekStartsOn: 0 | 1): DayCell[] => {
  const start = startOfMonth(monthDate)
  const dow = start.getDay() // 0 вс ... 6 сб
  const offset = weekStartsOn === 1 ? (dow === 0 ? 6 : dow - 1) : dow
  const gridStart = addDays(start, -offset)
  const days: DayCell[] = []
  for (let i = 0; i < 42; i++) {
    const d = addDays(gridStart, i)
    days.push({ date: d, isCurrentMonth: d.getMonth() === monthDate.getMonth(), iso: toISO(d) })
  }
  return days
}

const MonthHeader: React.FC<{ month: Date; locale: string; onPrev(): void; onNext(): void }> = ({
  month,
  locale,
  onPrev,
  onNext,
}) => {
  const title = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month)
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <button aria-label="Предыдущий месяц" className="rounded-xl px-2 py-1 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-gray-400 outline-none" onClick={onPrev}>
          ◀
        </button>
        <button aria-label="Следующий месяц" className="rounded-xl px-2 py-1 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-gray-400 outline-none" onClick={onNext}>
          ▶
        </button>
      </div>
      <div className="font-medium capitalize select-none" aria-live="polite">
        {title}
      </div>
      <div className="w-[56px]" aria-hidden="true"></div>
    </div>
  )
}

const Weekdays: React.FC<{ labels: string[] }> = ({ labels }) => (
  <div className="grid grid-cols-7 text-xs text-gray-500 mb-1 select-none">
    {labels.map((w, i) => (
      <div key={i} className="text-center py-1">
        {w}
      </div>
    ))}
  </div>
)

const Calendar: React.FC<CalendarProps> = ({
  value = null,
  onChange,
  initialMonth,
  locale = typeof navigator !== 'undefined' ? (navigator.language || 'ru-RU') : 'ru-RU',
  weekStartsOn = 1,
}) => {
  const today = toMidday(new Date())
  const [month, setMonth] = React.useState<Date>(startOfMonth(initialMonth ?? value ?? today))
  const [focus, setFocus] = React.useState<Date>(value ?? month)

  const labels = React.useMemo(() => getWeekdayLabels(locale, weekStartsOn), [locale, weekStartsOn])
  const days = React.useMemo(() => getGrid(month, weekStartsOn), [month, weekStartsOn])

  // ref на грид, чтобы программно фокусировать нужную ячейку
  const gridRef = React.useRef<HTMLDivElement>(null)

  // Переключение месяцев кнопками: фокус всегда на 1-е число нового месяца
  const go = (n: number) => {
    const next = startOfMonth(addMonths(month, n))
    setMonth(next)
    setFocus(next)
  }

  // Клавиатура — без "дёрганий" и с точной синхронизацией месяца/фокуса
  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    let handled = true
    let nextFocus = focus
    let nextMonth: Date | null = null

    if (e.key === 'ArrowLeft') nextFocus = addDays(focus, -1)
    else if (e.key === 'ArrowRight') nextFocus = addDays(focus, 1)
    else if (e.key === 'ArrowUp') nextFocus = addDays(focus, -7)
    else if (e.key === 'ArrowDown') nextFocus = addDays(focus, 7)
    else if (e.key === 'PageUp') {
      nextMonth = startOfMonth(addMonths(month, e.shiftKey ? -12 : -1))
      nextFocus = nextMonth // переносим фокус на 1-е число
    } else if (e.key === 'PageDown') {
      nextMonth = startOfMonth(addMonths(month, e.shiftKey ? 12 : 1))
      nextFocus = nextMonth
    } else if (e.key === 'Home') {
      // к началу недели (для недели с понедельника)
      const mondayIndex = (focus.getDay() + 6) % 7
      nextFocus = addDays(focus, -mondayIndex)
    } else if (e.key === 'End') {
      const mondayIndex = (focus.getDay() + 6) % 7
      nextFocus = addDays(focus, 6 - mondayIndex)
    } else if (e.key === 'Enter' || e.key === ' ') {
      onChange?.(focus)
    } else {
      handled = false
    }

    if (handled) {
      e.preventDefault()

      // Если фокус ушёл в другой месяц — синхронизируем отображаемый месяц
      const showMonth = startOfMonth(nextFocus)
      setFocus(nextFocus)
      if (nextMonth) setMonth(nextMonth)
      else if (!isSameDay(showMonth, month)) setMonth(showMonth)
    }
  }

  // Всегда после смены focus/месяца переносим реальный DOM-фокус на нужную кнопку
  React.useEffect(() => {
    const iso = toISO(focus)
    const btn = gridRef.current?.querySelector<HTMLButtonElement>(`button[data-iso="${iso}"]`)
    btn?.focus()
  }, [focus, month])

  // Если извне меняют value — показываем соответствующий месяц
  React.useEffect(() => {
    if (value) {
      const m = startOfMonth(value)
      setMonth(m)
      setFocus(value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.getFullYear(), value?.getMonth(), value?.getDate()])

  return (
    <div className="select-none" role="application" aria-label="Календарь выбора даты">
      <MonthHeader month={month} locale={locale} onPrev={() => go(-1)} onNext={() => go(1)} />
      <Weekdays labels={labels} />
      <div
        ref={gridRef}
        role="grid"
        aria-label={new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month)}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="grid grid-cols-7 gap-1 p-1 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
      >
        {days.map(({ date, isCurrentMonth, iso }) => {
          const selected = isSameDay(value, date)
          const isToday = isSameDay(date, today)
          const focused = isSameDay(date, focus)
          return (
            <button
              key={iso}
              id={`cell-${iso}`}
              role="gridcell"
              aria-selected={selected}
              data-iso={iso}
              onClick={() => onChange?.(date)}
              className={clsx(
                'aspect-square rounded-xl text-sm flex items-center justify-center outline-none',
                'transition',
                'focus-visible:ring-2 focus-visible:ring-gray-400',
                isCurrentMonth ? 'text-gray-900' : 'text-gray-400',
                selected && 'bg-gray-900 text-white',
                !selected && isToday && 'ring-1 ring-gray-400',
                !selected && 'hover:bg-gray-100',
                focused && 'ring-2 ring-gray-400' // страховка: визуальный фокус даже если браузер не применил :focus-visible
              )}
              tabIndex={-1} // Tab остаётся на гриде, мы двигаем фокус стрелками
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
      <div className="mt-2 text-xs text-gray-500">
        Управление с клавиатуры: ← → ↑ ↓, PageUp/PageDown (с Shift — год), Home/End, Enter — выбрать.
      </div>
    </div>
  )
}

export default Calendar
