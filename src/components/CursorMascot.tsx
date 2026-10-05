import { useEffect, useRef } from 'react'
import mascotUrl from '../../assets/portfolio-mascot.png'
import styles from './CursorMascot.module.css'

export function CursorMascot() {
  const screenRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const screen = screenRef.current
    if (!screen) return

    const pointer = window.matchMedia('(pointer: fine)')
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!pointer.matches || motion.matches) return

    let frame = 0
    let gazeX = 0
    let gazeY = 0
    const paint = () => {
      screen.style.setProperty('--gaze-x', `${gazeX}px`)
      screen.style.setProperty('--gaze-y', `${gazeY}px`)
      frame = 0
    }
    const move = (event: PointerEvent) => {
      const bounds = screen.getBoundingClientRect()
      gazeX = Math.max(-5, Math.min(5, (event.clientX - (bounds.left + bounds.width / 2)) / bounds.width * 10))
      gazeY = Math.max(-4, Math.min(4, (event.clientY - (bounds.top + bounds.height / 2)) / bounds.height * 8))
      if (!frame) frame = requestAnimationFrame(paint)
    }
    const leave = () => {
      gazeX = 0
      gazeY = 0
      if (!frame) frame = requestAnimationFrame(paint)
    }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerleave', leave)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className={styles.mascot} aria-hidden="true">
      <img src={mascotUrl} alt="" />
      <div className={styles.screen} ref={screenRef}>
        <svg className={styles.eyes} viewBox="0 0 160 110" role="presentation">
          <defs><clipPath id="mascot-screen-clip"><rect x="3" y="3" width="154" height="104" rx="19" /></clipPath></defs>
          <g clipPath="url(#mascot-screen-clip)">
            <ellipse cx="53" cy="55" rx="18" ry="25" fill="#fffdf2" />
            <ellipse cx="107" cy="55" rx="18" ry="25" fill="#fffdf2" />
            <g className={styles.pupils}>
              <circle cx="57" cy="58" r="9" fill="#21102f" />
              <circle cx="111" cy="58" r="9" fill="#21102f" />
              <circle cx="60" cy="54" r="2.5" fill="#fffdf2" />
              <circle cx="114" cy="54" r="2.5" fill="#fffdf2" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  )
}
