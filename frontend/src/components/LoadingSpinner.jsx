export default function LoadingSpinner({ text = 'Loading data...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-slate-700/60 border-t-sky-500 animate-spin"></div>
        <div className="w-6 h-6 rounded-full bg-sky-500/20 animate-pulse absolute"></div>
      </div>
      <p className="text-slate-400 text-sm font-medium animate-pulse">{text}</p>
    </div>
  )
}
