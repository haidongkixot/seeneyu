'use client'

import { useState, useRef, useEffect } from 'react'
import { X, GraduationCap, Send, Loader2, Play, Pause } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAssistant, type ChatMessage } from '@/hooks/useAssistant'
import { VoiceRecorder } from './VoiceRecorder'

interface AssistantPanelProps {
  context: string
  open: boolean
  onClose: () => void
}

const LESSON_SUGGESTIONS = [
  'Explain this technique',
  'Tips for practice',
  'Review my last attempt',
  'What should I focus on?',
]

const ARCADE_SUGGESTIONS = [
  'How do I do this expression?',
  'Tips for this challenge',
  'What am I doing wrong?',
]

function getSuggestions(context: string) {
  if (context.startsWith('arcade:')) return ARCADE_SUGGESTIONS
  return LESSON_SUGGESTIONS
}

function TypingIndicator() {
  return (
    <div className="flex gap-2.5 items-start">
      <div className="w-7 h-7 rounded-full bg-accent-400/15 flex items-center justify-center flex-shrink-0">
        <GraduationCap size={14} className="text-accent-400" />
      </div>
      <div className="bg-bg-elevated border border-black/6 rounded-2xl rounded-tl-md px-4 py-3">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-text-tertiary"
              style={{
                animation: 'bounce-dot 1.4s ease-in-out infinite',
                animationDelay: `${i * 150}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  isFirstInSequence,
  onPlayAudio,
  isPlaying,
}: {
  message: ChatMessage
  isFirstInSequence: boolean
  onPlayAudio?: (url: string) => void
  isPlaying?: boolean
}) {
  if (message.role === 'assistant') {
    return (
      <div className="flex gap-2.5 items-start">
        {isFirstInSequence ? (
          <div className="w-7 h-7 rounded-full bg-accent-400/15 flex items-center justify-center flex-shrink-0">
            <GraduationCap size={14} className="text-accent-400" />
          </div>
        ) : (
          <div className="w-7 flex-shrink-0" />
        )}
        <div className="max-w-[85%]">
          {isFirstInSequence && (
            <p className="text-[10px] font-semibold text-accent-400/70 uppercase tracking-wider mb-1">
              Coach Ney
            </p>
          )}
          <div className="bg-bg-elevated border border-black/6 rounded-2xl rounded-tl-md px-4 py-3">
            {/* Audio player if available */}
            {message.audioUrl && onPlayAudio && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-bg-inset rounded-lg">
                <button
                  onClick={() => onPlayAudio(message.audioUrl!)}
                  className="w-7 h-7 rounded-full bg-accent-400/20 text-accent-400 flex items-center justify-center hover:bg-accent-400/30 transition-colors"
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                </button>
                <div className="flex-1 h-1 bg-black/5 rounded-full overflow-hidden">
                  <div className="h-full bg-accent-400 rounded-full w-0 transition-all" />
                </div>
              </div>
            )}
            <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-end">
      <div className="bg-accent-400/15 border border-accent-400/20 rounded-2xl rounded-tr-md px-4 py-3 max-w-[85%]">
        <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
          {message.content.startsWith('[voice:') ? '(Voice message)' : message.content}
        </p>
      </div>
    </div>
  )
}

export function AssistantPanel({ context, open, onClose }: AssistantPanelProps) {
  const {
    messages,
    isSending,
    isRecording,
    isPlaying,
    recordingTime,
    send,
    startRecording,
    stopRecording,
    cancelRecording,
    playAudio,
    stopAudio,
  } = useAssistant({ context })

  const [input, setInput] = useState('')
  const [closing, setClosing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const suggestions = getSuggestions(context)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  // Focus input when opened
  useEffect(() => {
    if (open && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 300)
    }
  }, [open])

  function handleClose() {
    setClosing(true)
    setTimeout(() => {
      setClosing(false)
      onClose()
    }, 200)
  }

  async function handleSend() {
    const text = input.trim()
    if (!text) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    await send(text)
  }

  function handleSuggestion(text: string) {
    send(text)
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }

  if (!open) return null

  const showWelcome = messages.length === 0

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/40 z-[49] lg:hidden transition-opacity duration-200',
          closing ? 'opacity-0' : 'opacity-100'
        )}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={cn(
          // Mobile: full-width bottom sheet, above bottom tab bar (h-16 = 4rem)
          'fixed inset-x-0 bottom-16 z-modal h-[65vh] max-h-[540px]',
          'bg-bg-surface border-t border-black/8 rounded-t-3xl shadow-xl',
          'flex flex-col overflow-hidden',
          // Desktop: side panel
          'lg:inset-x-auto lg:right-6 lg:bottom-24 lg:h-[560px] lg:w-[380px] lg:max-h-[560px]',
          'lg:rounded-2xl lg:border lg:border-black/8',
          // Animation
          closing
            ? 'opacity-0 translate-y-full lg:translate-y-4 lg:scale-95'
            : 'animate-panel-up lg:animate-panel-scale'
        )}
        style={{ transformOrigin: 'bottom right' }}
      >
        {/* Drag handle (mobile) */}
        <div className="w-12 h-1 bg-black/10 rounded-full mx-auto mt-3 mb-2 lg:hidden" />

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-black/6">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-400/30 to-accent-600/20 border border-accent-400/30 flex items-center justify-center">
            <GraduationCap size={18} className="text-accent-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-primary">
              Coach Ney
            </p>
            <p className="text-xs text-text-tertiary">
              Your personal communication coach
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-overlay rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
          {/* Welcome message */}
          {showWelcome && (
            <div className="flex gap-2.5 items-start animate-fade-in">
              <div className="w-7 h-7 rounded-full bg-accent-400/15 flex items-center justify-center flex-shrink-0">
                <GraduationCap size={14} className="text-accent-400" />
              </div>
              <div className="max-w-[85%]">
                <p className="text-[10px] font-semibold text-accent-400/70 uppercase tracking-wider mb-1">
                  Coach Ney
                </p>
                <div className="bg-bg-elevated border border-black/6 rounded-2xl rounded-tl-md px-4 py-3">
                  <p className="text-sm text-text-primary leading-relaxed">
                    Hi there! I&apos;m Coach Ney, your personal communication
                    coach.
                  </p>
                  <p className="text-sm text-text-primary leading-relaxed mt-2">
                    I can help you with:
                  </p>
                  <ul className="text-sm text-text-primary leading-relaxed mt-1 space-y-0.5">
                    <li>&bull; Explain key techniques in this lesson</li>
                    <li>&bull; Give you tips before you practice</li>
                    <li>&bull; Review your recent performance</li>
                  </ul>
                  <p className="text-sm text-text-primary leading-relaxed mt-2">
                    Just ask or tap a suggestion below!
                  </p>
                </div>
                {/* Suggestions */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSuggestion(s)}
                      className={cn(
                        'px-3 py-1.5 text-xs font-medium',
                        'bg-bg-inset border border-black/8 rounded-pill',
                        'text-text-secondary',
                        'hover:text-accent-400 hover:border-accent-400/30 hover:bg-accent-400/5',
                        'active:scale-95 transition-all duration-150 cursor-pointer'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.map((msg, i) => {
            const isFirstInSeq =
              i === 0 || messages[i - 1].role !== msg.role
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isFirstInSequence={isFirstInSeq}
                onPlayAudio={msg.audioUrl ? playAudio : undefined}
                isPlaying={isPlaying}
              />
            )
          })}

          {/* Show suggestions after last assistant message */}
          {messages.length > 0 &&
            messages[messages.length - 1].role === 'assistant' &&
            !isSending && (
              <div className="flex flex-wrap gap-2 ml-9 animate-fade-in">
                {suggestions.slice(0, 3).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium',
                      'bg-bg-inset border border-black/8 rounded-pill',
                      'text-text-secondary',
                      'hover:text-accent-400 hover:border-accent-400/30 hover:bg-accent-400/5',
                      'active:scale-95 transition-all duration-150 cursor-pointer'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

          {/* Typing indicator */}
          {isSending && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="px-4 py-3 border-t border-black/6 bg-bg-surface">
          {isRecording ? (
            <VoiceRecorder
              isRecording={isRecording}
              recordingTime={recordingTime}
              onStart={startRecording}
              onStop={stopRecording}
              onCancel={cancelRecording}
            />
          ) : (
            <div className="flex items-end gap-2">
              <VoiceRecorder
                isRecording={false}
                recordingTime={0}
                onStart={startRecording}
                onStop={stopRecording}
                onCancel={cancelRecording}
              />
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                placeholder="Type a message..."
                rows={1}
                className={cn(
                  'flex-1 bg-bg-inset border border-black/8 rounded-xl px-3 py-2 text-sm text-text-primary',
                  'placeholder:text-text-tertiary',
                  'focus:outline-none focus:border-accent-400/40 transition-colors',
                  'min-h-[36px] max-h-[120px] resize-none'
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isSending}
                className={cn(
                  'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200',
                  input.trim()
                    ? 'bg-accent-400 text-text-inverse hover:bg-accent-500 shadow-glow-sm'
                    : 'bg-bg-overlay text-text-tertiary cursor-not-allowed'
                )}
                aria-label="Send message"
              >
                {isSending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
