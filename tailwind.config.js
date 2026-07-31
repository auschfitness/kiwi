/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', card: 'var(--card)', card2: 'var(--card2)',
        ink: 'var(--ink)', muted: 'var(--muted)', line: 'var(--line)',
        brand: 'var(--brand)', brand2: 'var(--brand2)',
        good: 'var(--good)', hard: 'var(--hard)', again: 'var(--again)',
        gold: 'var(--gold)',
        onBrand: 'var(--on-brand)', onGood: 'var(--on-good)',
        onHard: 'var(--on-hard)', onAgain: 'var(--on-again)',
      },
      borderRadius: { card: '20px' },
    },
  },
  plugins: [],
}
