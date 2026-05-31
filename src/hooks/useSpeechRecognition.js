import { useCallback, useEffect, useRef, useState } from 'react'

export function useSpeechRecognition({ onResult, lang = 'en-IN' } = {}) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)

  const supported =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)

  useEffect(() => {
    if (!supported) return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = lang

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(' ')
        .trim()
      if (transcript && onResult) onResult(transcript)
    }

    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognitionRef.current = recognition

    return () => {
      recognition.abort()
      recognitionRef.current = null
    }
  }, [supported, lang, onResult])

  const toggle = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition) return
    if (listening) {
      recognition.stop()
      setListening(false)
    } else {
      recognition.start()
      setListening(true)
    }
  }, [listening])

  return { listening, supported: Boolean(supported), toggle }
}
