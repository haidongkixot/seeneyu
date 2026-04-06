'use client'

import { useState, useEffect, useCallback } from 'react'

interface ElementRect {
  top: number
  left: number
  width: number
  height: number
}

export function useElementHighlight(selector: string | null) {
  const [rect, setRect] = useState<ElementRect | null>(null)

  const update = useCallback(() => {
    if (!selector) { setRect(null); return }
    const el = document.querySelector(selector)
    if (!el) { setRect(null); return }
    const r = el.getBoundingClientRect()
    setRect({
      top: r.top + window.scrollY,
      left: r.left + window.scrollX,
      width: r.width,
      height: r.height,
    })
  }, [selector])

  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    const observer = new MutationObserver(update)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
      observer.disconnect()
    }
  }, [update])

  return rect
}
