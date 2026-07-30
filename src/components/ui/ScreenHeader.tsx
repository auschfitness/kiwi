export function ScreenHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <header className="flex items-center gap-2 pt-6 pb-4">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink transition active:scale-[0.98]"
        >
          <svg
            width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}
      <h1 className="text-lg font-bold text-ink">{title}</h1>
    </header>
  )
}
