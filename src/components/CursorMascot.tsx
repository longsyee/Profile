import { useEffect, useRef } from 'react'
import mascotUrl from '../../assets/portfolio-mascot.png'
import mascotHeadUrl from '../../assets/portfolio-mascot-head.png'
import styles from './CursorMascot.module.css'

export function CursorMascot() {
  const headRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const head = headRef.current
    if (!head) return

    const pointer = window.matchMedia('(pointer: fine)')
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!pointer.matches || motion.matches) return

    let frame = 0
    let x = 0
    let y = 0
    let tilt = 0
    const paint = () => {
      head.style.setProperty('--head-x', `${x}px`)
      head.style.setProperty('--head-y', `${y}px`)
      head.style.setProperty('--head-tilt', `${tilt}deg`)
      frame = 0
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || motion.matches) return
      const bounds = head.getBoundingClientRect()
      const dx = (event.clientX - (bounds.left + bounds.width / 2)) / bounds.width
      const dy = (event.clientY - (bounds.top + bounds.height / 2)) / bounds.height
      x = Math.max(-13, Math.min(13, dx * 20))
      y = Math.max(-9, Math.min(9, dy * 14))
      tilt = Math.max(-3, Math.min(3, dx * 5))
      if (!frame) frame = requestAnimationFrame(paint)
    }
    const leave = () => {
      x = 0
      y = 0
      tilt = 0
      if (!frame) frame = requestAnimationFrame(paint)
    }
    const onMotionChange = (event: MediaQueryListEvent) => {
      if (event.matches) leave()
    }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerleave', leave)
    motion.addEventListener('change', onMotionChange)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerleave', leave)
      motion.removeEventListener('change', onMotionChange)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className={styles.mascot} aria-hidden="true">
      <img className={styles.body} src={mascotUrl} alt="" />
      <span className={styles.headMask} />
      <img ref={headRef} className={styles.head} src={mascotHeadUrl} alt="" />
    </div>
  )
}
