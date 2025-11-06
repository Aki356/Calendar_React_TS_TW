// src/App.tsx
import React from 'react'
import Calendar from './components/Calendar'

// Список языков в селекте (можешь дополнять)
const LOCALES = [
  { value: 'ru-RU', label: 'Русский (Россия)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'de-DE', label: 'Deutsch (Deutschland)' },
  { value: 'fr-FR', label: 'Français (France)' },
  { value: 'uk-UA', label: 'Українська (Україна)' },
  { value: 'es-ES', label: 'Español (España)' },
  { value: 'it-IT', label: 'Italiano (Italia)' },
  { value: 'pl-PL', label: 'Polski (Polska)' },
  { value: 'tr-TR', label: 'Türkçe (Türkiye)' },
  { value: 'ja-JP', label: '日本語 (日本)' },
  { value: 'zh-CN', label: '简体中文 (中国)' },
]

// Эвристика первого дня недели по локали (0 — вс, 1 — пн)
const inferWeekStart = (loc: string): 0 | 1 => {
  const l = loc.toLowerCase()
  // В этих локалях неделя часто начинается с воскресенья
  const sundayLocales = ['en-us', 'en-ph', 'ja', 'zh-cn', 'zh-tw', 'zh-hk', 'th', 'he-il', 'ar', 'fa', 'ms-my']
  return sundayLocales.some(x => l.startsWith(x)) ? 0 : 1
}

export default function App() {
  // Выбранная дата
  const [value, setValue] = React.useState<Date | null>(new Date())

  // Локаль: из localStorage или из браузера
  const defaultLocale = (localStorage.getItem('calendar.locale') ?? (navigator.language || 'ru-RU')) as string
  const [locale, setLocale] = React.useState<string>(defaultLocale)

  // Первый день недели — по локали
  const weekStartsOn = inferWeekStart(locale)

  // Сохраняем выбор пользователя
  React.useEffect(() => {
    localStorage.setItem('calendar.locale', locale)
  }, [locale])

  return (
    <div className="min-h-screen flex items-start justify-center p-6">
      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-semibold mb-4">Демо: Календарь</h1>

        {/* Панель настроек */}
        <div className="bg-white shadow-sm rounded-2xl p-4 mb-4">
          <label className="text-sm text-gray-600 block mb-2">Язык интерфейса</label>
          <select
            className="border rounded-xl px-3 py-2 w-full"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
          >
            {LOCALES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-2">
            Первый день недели определяется автоматически по выбранному языку.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-1">
          <div className="bg-white shadow-sm rounded-2xl p-4">
            <Calendar
              value={value}
              onChange={setValue}
              locale={locale}
              weekStartsOn={weekStartsOn}
            />
          </div>

          <div className="bg-white shadow-sm rounded-2xl p-4">
            <p className="text-sm text-gray-600 mb-2">Выбранная дата:</p>
            <p className="text-lg font-medium">
              {value
                ? value.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })
                : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
