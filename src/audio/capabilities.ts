type WindowWithSpeech = Window & {
  SpeechRecognition?: unknown
  webkitSpeechRecognition?: unknown
}

export function speechSynthesisAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speechRecognitionAvailable(): boolean {
  if (typeof window === 'undefined') return false
  const w = window as WindowWithSpeech
  return Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition)
}
