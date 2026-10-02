import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import styles from './WebGLShowcase.module.css'

const WebGLShowcase = lazy(() => import('./WebGLShowcase').then((module) => ({ default: module.WebGLShowcase })))

export function DeferredWebGLShowcase() {
  const hostRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    if (!('IntersectionObserver' in window)) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        observer.disconnect()
      }
    }, { rootMargin: '320px 0px' })
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  return (
    <div className={styles.slot} ref={hostRef}>
      {visible ? (
        <Suspense fallback={<div className={styles.placeholder} aria-hidden="true" />}>
          <WebGLShowcase />
        </Suspense>
      ) : (
        <div className={styles.placeholder} aria-hidden="true" />
      )}
    </div>
  )
}
