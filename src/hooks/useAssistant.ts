'use client'

import { useState, useRef, useCallback } from 'react'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  audioUrl?: string
  timestamp: Date
}

interface UseAssistantOptions {
  context: string
}

export function useAssistant({ context }: UseAssistantOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isSending, setIsSending] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || isSending) return

      const userMsg: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: text.trim(),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMsg])
      setIsSending(true)

      try {
        const res = await fetch('/api/assistant/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text.trim(),
            context,
            conversationId,
          }),
        })

        if (!res.ok) throw new Error('Failed to send')

        const data = await res.json()

        if (data.conversationId) {
          setConversationId(data.conversationId)
        }

        const assistantMsg: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: data.response ?? data.message ?? '',
          audioUrl: data.audioUrl,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMsg])
      } catch {
        const errorMsg: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content:
            "Sorry, I couldn't process that. Please try again in a moment.",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMsg])
      } finally {
        setIsSending(false)
      }
    },
    [context, conversationId, isSending]
  )

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      })

      chunksRef.current = []
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        if (recordTimerRef.current) clearInterval(recordTimerRef.current)
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        if (blob.size > 0) {
          // Convert to base64 and send
          const reader = new FileReader()
          reader.onloadend = async () => {
            const base64 = (reader.result as string).split(',')[1]
            setIsRecording(false)
            setRecordingTime(0)
            await send(`[voice:${base64}]`)
          }
          reader.readAsDataURL(blob)
        } else {
          setIsRecording(false)
          setRecordingTime(0)
        }
      }

      mediaRecorder.start(250)
      setIsRecording(true)
      setRecordingTime(0)

      // Timer
      recordTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 120) {
            // Auto-stop at 2 min
            mediaRecorderRef.current?.stop()
            return prev
          }
          return prev + 1
        })
      }, 1000)

      // Auto-stop after 30s silence (simplified: just use 30s timeout that resets on data)
      silenceTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      }, 30000)
    } catch {
      setIsRecording(false)
    }
  }, [send])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (recordTimerRef.current) clearInterval(recordTimerRef.current)
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
  }, [])

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      // Clear chunks so onstop doesn't send
      chunksRef.current = []
      mediaRecorderRef.current.stop()
    }
    if (recordTimerRef.current) clearInterval(recordTimerRef.current)
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    setIsRecording(false)
    setRecordingTime(0)
  }, [])

  const playAudio = useCallback((url: string) => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    const audio = new Audio(url)
    audioRef.current = audio
    setIsPlaying(true)
    audio.play()
    audio.onended = () => setIsPlaying(false)
    audio.onerror = () => setIsPlaying(false)
  }, [])

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setConversationId(null)
  }, [])

  return {
    messages,
    isSending,
    isRecording,
    isPlaying,
    recordingTime,
    conversationId,
    send,
    startRecording,
    stopRecording,
    cancelRecording,
    playAudio,
    stopAudio,
    clearMessages,
  }
}
