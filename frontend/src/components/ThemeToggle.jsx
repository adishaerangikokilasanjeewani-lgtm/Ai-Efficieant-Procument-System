import { useTheme } from '../context/ThemeContext'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
      className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all duration-200 border cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 ${
        isDark
          ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700 shadow-sm'
          : 'bg-white hover:bg-slate-100 text-amber-500 border-slate-200 shadow-sm'
      } ${className}`}
    >
      {isDark ? (
        <Sun size={18} className="transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon size={18} className="text-indigo-600 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  )
}
