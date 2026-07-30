import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'good' | 'again'
type Size = 'lg' | 'md'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-[#04263a] font-extrabold',
  ghost: 'bg-card2 text-ink border border-line',
  good: 'bg-good text-[#04291d] font-bold',
  again: 'bg-again text-[#3b0713] font-bold',
}

const SIZES: Record<Size, string> = {
  lg: 'min-h-[52px] text-base px-5',
  md: 'min-h-[44px] text-sm px-4',
}

export function Button({
  variant = 'primary', size = 'lg', className = '', children, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; children: ReactNode }) {
  return (
    <button
      {...rest}
      className={`w-full rounded-2xl transition active:scale-[0.98] disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {children}
    </button>
  )
}
