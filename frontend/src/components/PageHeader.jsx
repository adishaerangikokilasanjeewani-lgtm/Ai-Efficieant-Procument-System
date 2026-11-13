export default function PageHeader({ title, subtitle, actions, children }) {
  const content = children || actions
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {content && <div className="flex items-center gap-3">{content}</div>}
    </div>
  )
}
