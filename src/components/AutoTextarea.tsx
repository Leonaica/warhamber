import { useRef, useEffect, type TextareaHTMLAttributes } from 'react'

function AutoTextarea({ value, onChange, className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      className={`${className} overflow-hidden`}
      {...rest}
    />
  )
}

export default AutoTextarea