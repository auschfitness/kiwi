import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-card border border-line p-4 ${className}`}>
      {children}
    </div>
  )
}
