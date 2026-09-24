import { useEffect, useRef, type ReactNode } from 'react'
import styles from './ScrollSequence.module.css'

type ScrollSequenceProps = {
  children: ReactNode
  /** Number of scroll frames to traverse. Defaults to the supplied 150-frame set. */
  frameCount?: number
  /** Base URL of the sequence, with the 3-digit frame number appended. */
  framePath?: (frame: number) => string
  /** Scroll distance in viewport heights. */
  scrollLength?: number
  /** Canvas image scaling behavior. */
  fit?: 'cover' | 'contain'
}

const DEFAULT_FRAME_COUNT = 150
const DEFAULT_SCROLL_LENGTH = 4
const LOAD_CONCURRENCY = 3
const LOAD_RADIUS = 6
const CACHE_LIMIT = 18
const EASE = 0.18
const BACKGROUND = '#15131a'

/**
 * Pins a full-screen canvas while scrolling through an image sequence.
 * Images are loaded into a small moving window around the current frame.
 */
export function ScrollSequence({
  children,
  frameCount = DEFAULT_FRAME_COUNT,
  framePath = (frame) => `/frame-${String(frame).padStart(3, '0')}.png`,
  scrollLength = DEFAULT_SCROLL_LENGTH,
  fit = 'cover',
}: ScrollSequenceProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const track = trackRef.current
    const stage = stageRef.current
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d', { alpha: false })
    if (!track || !stage || !canvas || !context) return

    const count = Math.max(1, Math.floor(frameCount))
    const images = new Map<number, HTMLImageElement>()
    const loading = new Map<number, HTMLImageElement>()
    let targetFrame = 1
    let currentFrame = 1
    let rafId = 0
    let activeLoads = 0
    let disposed = false
    let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let dpr = 1
    let canvasWidth = 0
    let canvasHeight = 0

    const normalizedProgress = () => {
      const bounds = track.getBoundingClientRect()
      const travel = Math.max(1, track.offsetHeight - window.innerHeight)
      const traveled = Math.min(travel, Math.max(0, -bounds.top))
      return traveled / travel
    }

    const frameFromProgress = (progress: number) =>
      1 + Math.min(1, Math.max(0, progress)) * (count - 1)

    const nearestLoaded = (frame: number) => {
      const rounded = Math.min(count, Math.max(1, Math.round(frame)))
      if (images.has(rounded)) return rounded

      for (let distance = 1; distance < count; distance += 1) {
        const before = rounded - distance
        const after = rounded + distance
        if (before >= 1 && images.has(before)) return before
        if (after <= count && images.has(after)) return after
      }
      return 0
    }

    const requestAroundTarget = () => {
      const center = Math.min(count, Math.max(1, Math.round(targetFrame)))
      const wanted = new Set<number>([1, center])
      for (let distance = 1; distance <= LOAD_RADIUS; distance += 1) {
        if (center + distance <= count) wanted.add(center + distance)
        if (center - distance >= 1) wanted.add(center - distance)
      }

      // Keep completed images in a bounded window so decoded frames do not
      // accumulate into hundreds of megabytes during a long scroll.
      const keep = new Set([...wanted, ...loading.keys()])
      if (images.size > CACHE_LIMIT) {
        const removable = [...images.keys()]
          .filter((frame) => !keep.has(frame))
          .sort((a, b) => Math.abs(b - targetFrame) - Math.abs(a - targetFrame))
        while (images.size > CACHE_LIMIT && removable.length) {
          const frame = removable.shift()!
          const image = images.get(frame)
          if (image) image.src = ''
          images.delete(frame)
        }
      }

      const queue = [...wanted]
        .filter((frame) => !images.has(frame) && !loading.has(frame))
        .sort((a, b) => Math.abs(a - targetFrame) - Math.abs(b - targetFrame))

      const pump = () => {
        if (disposed) return
        while (activeLoads < LOAD_CONCURRENCY && queue.length) {
          const frame = queue.shift()!
          if (images.has(frame) || loading.has(frame)) continue
          const image = new Image()
          loading.set(frame, image)
          activeLoads += 1
          image.decoding = 'async'
          image.onload = () => {
            activeLoads -= 1
            loading.delete(frame)
            if (disposed) return
            images.set(frame, image)
            requestAroundTarget()
            pump()
          }
          image.onerror = () => {
            activeLoads -= 1
            loading.delete(frame)
            if (!disposed) pump()
          }
          image.src = framePath(frame)
        }
      }

      pump()
    }

    const resizeCanvas = () => {
      const bounds = stage.getBoundingClientRect()
      dpr = Math.max(1, window.devicePixelRatio || 1)
      canvasWidth = Math.max(1, bounds.width)
      canvasHeight = Math.max(1, bounds.height)
      canvas.width = Math.round(canvasWidth * dpr)
      canvas.height = Math.round(canvasHeight * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.fillStyle = BACKGROUND
      context.fillRect(0, 0, canvasWidth, canvasHeight)
    }

    const drawFrame = (frame: number, alpha = 1) => {
      const image = images.get(frame)
      if (!image || !image.naturalWidth || !image.naturalHeight) return
      const scale =
        fit === 'cover'
          ? Math.max(canvasWidth / image.naturalWidth, canvasHeight / image.naturalHeight)
          : Math.min(canvasWidth / image.naturalWidth, canvasHeight / image.naturalHeight)
      const width = image.naturalWidth * scale
      const height = image.naturalHeight * scale
      context.globalAlpha = alpha
      context.drawImage(image, (canvasWidth - width) / 2, (canvasHeight - height) / 2, width, height)
      context.globalAlpha = 1
    }

    const draw = () => {
      context.fillStyle = BACKGROUND
      context.fillRect(0, 0, canvasWidth, canvasHeight)

      const first = Math.min(count, Math.max(1, Math.floor(currentFrame)))
      const second = Math.min(count, first + 1)
      const fraction = currentFrame - first
      const loadedFirst = nearestLoaded(first)

      if (loadedFirst) drawFrame(loadedFirst)
      if (second !== first && fraction > 0.001 && images.has(second)) {
        // Crossfade adjacent frames to soften the discrete image steps.
        drawFrame(second, fraction)
      }
    }

    const onScrollOrResize = () => {
      targetFrame = frameFromProgress(normalizedProgress())
      requestAroundTarget()
    }

    const tick = () => {
      if (disposed) return
      if (reducedMotion) {
        currentFrame = targetFrame
      } else {
        currentFrame += (targetFrame - currentFrame) * EASE
        if (Math.abs(targetFrame - currentFrame) < 0.015) currentFrame = targetFrame
      }
      draw()
      rafId = window.requestAnimationFrame(tick)
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches
      if (reducedMotion) currentFrame = targetFrame
    }

    resizeCanvas()
    targetFrame = frameFromProgress(normalizedProgress())
    currentFrame = targetFrame
    requestAroundTarget()

    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize, { passive: true })
    mediaQuery.addEventListener('change', onMotionChange)
    const resizeObserver = new ResizeObserver(resizeCanvas)
    resizeObserver.observe(stage)
    rafId = window.requestAnimationFrame(tick)

    return () => {
      disposed = true
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
      mediaQuery.removeEventListener('change', onMotionChange)
      resizeObserver.disconnect()
      for (const image of loading.values()) image.src = ''
      for (const image of images.values()) image.src = ''
      loading.clear()
      images.clear()
    }
  }, [fit, frameCount, framePath])

  return (
    <div
      ref={trackRef}
      className={styles.track}
      style={{ minHeight: `${Math.max(4, scrollLength) * 100}svh` }}
    >
      <div ref={stageRef} className={styles.stage}>
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
