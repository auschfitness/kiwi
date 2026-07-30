import { useEffect, useState } from 'react'
import { warmUp } from './audio/speak'

export type Screen =
  | 'home' | 'name' | 'placement' | 'session' | 'dashboard'
  | 'plan' | 'dialogues' | 'shadowing' | 'settings' | 'done'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')

  useEffect(() => {
    const unlock = () => { warmUp(); document.removeEventListener('pointerdown', unlock) }
    document.addEventListener('pointerdown', unlock)
    return () => document.removeEventListener('pointerdown', unlock)
  }, [])

  return (
    <div className="min-h-full bg-bg text-ink safe-top safe-bottom">
      <main className="mx-auto w-full max-w-md px-4 pb-8">
        {screen === 'home' && <div className="pt-8">Kia ora 🥝</div>}
        {screen !== 'home' && <button onClick={() => setScreen('home')}>Home</button>}
      </main>
    </div>
  )
}
