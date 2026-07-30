import { useEffect, useRef } from 'react'

const AUTO_DISMISS_MS = 4000

export function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  // Keep the latest callback in a ref so the timer is set up once, regardless
  // of how often the parent passes a new onDismiss function identity.
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  useEffect(() => {
    const timer = setTimeout(() => onDismissRef.current(), AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-50 rounded-2xl border border-line bg-card2 p-4 text-sm text-ink shadow-lg"
    >
      {message}
    </div>
  )
}
