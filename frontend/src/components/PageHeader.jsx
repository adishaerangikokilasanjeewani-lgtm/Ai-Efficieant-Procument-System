import ThemeToggle from './ThemeToggle'

export default function PageHeader({ title, subtitle, actions, children }) {
  const content = children || actions
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-start gap-3">
        <ThemeToggle className="mt-0.5 flex-shrink-0" />
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
      </div>
      {content && <div className="flex items-center gap-3">{content}</div>}
    </div>
  )
}
