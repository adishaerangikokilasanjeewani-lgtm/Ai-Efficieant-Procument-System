export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-10 h-10 border-4 border-slate-600 border-t-sky-500 rounded-full animate-spin"></div>
      <p className="text-slate-400 text-sm">{text}</p>
    </div>
  )
}
