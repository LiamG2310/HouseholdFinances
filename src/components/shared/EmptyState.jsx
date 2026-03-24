export function EmptyState({ icon, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-3">{icon}</div>
      <p className="text-slate-400 mb-4">{message}</p>
      {action}
    </div>
  )
}
