/**
 * PracticeAssistant — reusable hook for guided practice steps.
 *
 * Provides voice playback, step navigation, and sound cleanup.
 * Use in any component that has a multi-step practice flow:
 * - MicroPracticeFlow (library practice)
 * - HandsFreePracticeFlow (hands-free mode)
 * - Arcade challenges (future)
 * - Any recording-based feature with guided steps
 */

'use client'

import { useRef, useCallback } from 'react'

export interface AssistantStep {
  stepNumber: number
  skillFocus: string
  instruction: string
  tip?: string | null
  targetDurationSec: number
  demoImageUrl?: string | null
  voiceUrl?: string | null
  subSteps?: { order: number; text: string; imageUrl?: string | null }[] | null
}

export function usePracticeAssistant() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  /** Stop all currently playing sounds (speech synthesis + audio elements) */
  const stopAllSounds = useCallback(() => {
    // Cancel any queued or in-progress speech synthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    // Stop any playing audio element
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.src = ''
      audioRef.current = null
    }
  }, [])

  /** Speak text using browser's SpeechSynthesis API */
  const speakText = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        resolve()
        return
      }
      window.speechSynthesis.cancel() // clear queue first
      const utter = new SpeechSynthesisUtterance(text)
      utter.rate = 0.9
      utter.onend = () => resolve()
      utter.onerror = () => resolve()
      window.speechSynthesis.speak(utter)
    })
  }, [])

  /** Play an audio file URL (e.g., ElevenLabs voice). Trackable and stoppable. */
  const playAudio = useCallback((url: string): Promise<void> => {
    return new Promise((resolve) => {
      // Stop previous audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => { audioRef.current = null; resolve() }
      audio.onerror = () => { audioRef.current = null; resolve() }
      audio.play().catch(() => { audioRef.current = null; resolve() })
    })
  }, [])

  /** Play a step's instruction — uses voiceUrl if available, falls back to speech synthesis */
  const playStepInstruction = useCallback(async (step: AssistantStep) => {
    if (step.voiceUrl) {
      await playAudio(step.voiceUrl)
    } else {
      await speakText(step.instruction)
    }
  }, [playAudio, speakText])

  /** Play countdown: "3... 2... 1... Go!" using speech synthesis */
  const playCountdown = useCallback(async () => {
    for (let i = 3; i >= 1; i--) {
      await speakText(String(i))
      await new Promise((r) => setTimeout(r, 300))
    }
    await speakText('Go!')
  }, [speakText])

  /** Announce a result using speech synthesis */
  const announceResult = useCallback(async (score: number, headline: string) => {
    await speakText(`Score: ${score}. ${headline}`)
  }, [speakText])

  return {
    stopAllSounds,
    speakText,
    playAudio,
    playStepInstruction,
    playCountdown,
    announceResult,
  }
}
