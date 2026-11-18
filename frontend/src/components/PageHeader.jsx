import ThemeToggle from './ThemeToggle'

export default function PageHeader({ title, subtitle, actions, children }) {
  const content = children || actions
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {content}
        <ThemeToggle />
      </div>
    </div>
  )
}
