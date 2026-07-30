import { useState } from 'react'
import { Button, Card } from '../components/ui'
import { useStore } from '../store/useStore'

export interface NameProps {
  onNext: () => void
}

/**
 * Her very first screen. Home greets her by name and cannot render before a
 * name exists, so this has to run before anything else does.
 */
export function Name({ onNext }: NameProps) {
  const setName = useStore(s => s.setName)
  const [value, setValue] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleContinue() {
    const trimmed = value.trim()
    if (submitted || trimmed.length === 0) return
    setSubmitted(true)
    setName(trimmed)
    onNext()
  }

  return (
    <div className="flex flex-col gap-6 pt-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-3xl">🥝</p>
        <h1 className="text-2xl font-extrabold text-ink">What should I call you?</h1>
      </div>

      <Card>
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-label="What should I call you?"
          placeholder="Your name"
          className="min-h-[44px] w-full rounded-2xl border border-line bg-card2 px-4 text-ink"
        />
      </Card>

      <Button variant="primary" onClick={handleContinue} disabled={value.trim().length === 0 || submitted}>
        Continue
      </Button>
    </div>
  )
}
