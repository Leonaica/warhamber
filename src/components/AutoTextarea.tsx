import { useRef, useEffect, type TextareaHTMLAttributes } from 'react'

interface AutoTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxRows?: number
}

function AutoTextarea({
  value,
  onChange,
  className = '',
  rows = 1,
  maxRows = 16,
  ...rest
}: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    const maxHeight = maxRows * parseFloat(getComputedStyle(el).lineHeight)
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [value, rows, maxRows])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      rows={rows}
      className={`${className} resize-none`}
      {...rest}
    />
  )
}

export default AutoTextarea