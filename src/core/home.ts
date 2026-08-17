export function greeting(now: number): string {
  const h = new Date(now).getHours()
  if (h < 5) return 'Studying late? Nice work 🌙'
  if (h < 12) return 'Good morning — a few cards with your coffee ☕'
  if (h < 18) return 'Good afternoon — perfect time for a quick session'
  return 'Good evening — ten minutes still counts 🌙'
}

export function studyButtonLabel(due: number, newAvailable: number): string {
  if (due > 0) return `Review ${due} card${due === 1 ? '' : 's'}`
  if (newAvailable > 0) return 'Learn new words'
  return 'All done for now'
}
