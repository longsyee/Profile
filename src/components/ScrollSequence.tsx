import { useEffect, useRef, type ReactNode } from 'react'
import styles from './ScrollSequence.module.css'

type ScrollSequenceProps = {
  children: ReactNode
  frameCount?: number
  framePath?: (frame: number) => string
  scrollLength?: number
  fit?: 'cover' | 'contain'
}

const DEFAULT_FRAME_COUNT = 51
const DEFAULT_SCROLL_LENGTH = 6
const LOAD_CONCURRENCY = 3
const LOAD_AHEAD = 6
const LOAD_BEHIND = 2
const EASE_TIME_MS = 32
const CACHE_BUDGET_BYTES = 64 * 1024 * 1024
const MAX_CANVAS_PIXELS = 1920 * 1080
const MAX_CANVAS_EDGE = 1920
const BACKGROUND = '#15131a'
const defaultFramePath = (frame: number) => `/ezgif-frame-${String(frame).padStart(3, '0')}.png`

export function ScrollSequence({
  children,
  frameCount = DEFAULT_FRAME_COUNT,
  framePath = defaultFramePath,
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
    const images = new Map<number, ImageBitmap>()
    const loading = new Map<number, AbortController>()
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let targetFrame = 1
    let currentFrame = 1
    let lastTick = 0
    let rafId = 0
    let activeLoads = 0
    let pendingFrames: number[] = []
    let scrollDirection = 1
    let disposed = false
    let needsDraw = true
    let reducedMotion = mediaQuery.matches
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

    const pump = () => {
      if (disposed) return
      while (activeLoads < LOAD_CONCURRENCY && pendingFrames.length) {
        const frame = pendingFrames.shift()!
        if (images.has(frame) || loading.has(frame)) continue
        const controller = new AbortController()
        loading.set(frame, controller)
        activeLoads += 1
        void (async () => {
          try {
            const response = await fetch(framePath(frame), { signal: controller.signal })
            if (!response.ok) throw new Error(`Frame ${frame} failed to load`)
            const blob = await response.blob()
            if (disposed || controller.signal.aborted) return
            const sourceBitmap = await createImageBitmap(blob)
            const outputWidth = canvasWidth * dpr
            const outputHeight = canvasHeight * dpr
            let sx = 0
            let sy = 0
            let sw = sourceBitmap.width
            let sh = sourceBitmap.height
            if (fit === 'cover') {
              const outputAspect = canvasWidth / canvasHeight
              if (sourceBitmap.width / sourceBitmap.height > outputAspect) {
                sw = sourceBitmap.height * outputAspect
                sx = (sourceBitmap.width - sw) / 2
              } else {
                sh = sourceBitmap.width / outputAspect
                sy = (sourceBitmap.height - sh) / 2
              }
            }
            const resizeScale = Math.min(1, outputWidth / sw, outputHeight / sh)
            let bitmap: ImageBitmap
            try {
              bitmap = await createImageBitmap(sourceBitmap, sx, sy, sw, sh, {
                resizeWidth: Math.max(1, Math.round(sw * resizeScale)),
                resizeHeight: Math.max(1, Math.round(sh * resizeScale)),
                resizeQuality: 'high',
              })
            } finally {
              sourceBitmap.close()
            }
            if (disposed || controller.signal.aborted) {
              bitmap.close()
              return
            }
            images.set(frame, bitmap)
            needsDraw = true
          } catch {
            // Aborted downloads are expected when scroll direction changes quickly.
          } finally {
            activeLoads -= 1
            if (loading.get(frame) === controller) loading.delete(frame)
            if (!disposed) {
              requestAroundTarget()
              pump()
            }
          }
        })()
      }
    }

    const requestAroundTarget = () => {
      const center = Math.min(count, Math.max(1, Math.round(targetFrame)))
      const wanted = new Set<number>([center])
      for (let distance = 1; distance <= LOAD_AHEAD; distance += 1) {
        const frame = center + distance * scrollDirection
        if (frame >= 1 && frame <= count) wanted.add(frame)
      }
      for (let distance = 1; distance <= LOAD_BEHIND; distance += 1) {
        const frame = center - distance * scrollDirection
        if (frame >= 1 && frame <= count) wanted.add(frame)
      }
      // Stop spending bandwidth and decode time on frames left behind during a fast swipe.
      for (const [frame, controller] of loading) {
        if (!wanted.has(frame)) {
          loading.delete(frame)
          controller.abort()
        }
      }

      const retainedBytes = () => [...images.values()].reduce((total, bitmap) => total + bitmap.width * bitmap.height * 4, 0)
      const removable = [...images.keys()]
        .filter((frame) => frame !== center && frame !== Math.round(currentFrame))
        .sort((a, b) => Math.abs(b - targetFrame) - Math.abs(a - targetFrame))
      let cachedBytes = retainedBytes()
      while (cachedBytes > CACHE_BUDGET_BYTES && removable.length) {
        const frame = removable.shift()!
        const bitmap = images.get(frame)
        if (bitmap) cachedBytes -= bitmap.width * bitmap.height * 4
        bitmap?.close()
        images.delete(frame)
      }

      pendingFrames = [...wanted]
        .filter((frame) => !images.has(frame) && !loading.has(frame))
        .sort((a, b) => {
          if (a === center) return -1
          if (b === center) return 1
          const aIsAhead = (a - center) * scrollDirection > 0
          const bIsAhead = (b - center) * scrollDirection > 0
          if (aIsAhead !== bIsAhead) return aIsAhead ? -1 : 1
          return Math.abs(a - targetFrame) - Math.abs(b - targetFrame)
        })
      pump()
    }

    const drawFrame = (frame: number, alpha = 1) => {
      const image = images.get(frame)
      if (!image?.width || !image.height) return
      const scale = fit === 'cover'
        ? Math.max(canvasWidth / image.width, canvasHeight / image.height)
        : Math.min(canvasWidth / image.width, canvasHeight / image.height)
      const width = image.width * scale
      const height = image.height * scale
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
      if (second !== first && fraction > 0.001 && images.has(second)) drawFrame(second, fraction)
      needsDraw = false
    }

    const updateTarget = () => {
      const previous = Math.round(targetFrame)
      targetFrame = frameFromProgress(normalizedProgress())
      const next = Math.round(targetFrame)
      if (next !== previous) {
        scrollDirection = Math.sign(next - previous)
        requestAroundTarget()
      }
      needsDraw = true
    }

    const onResize = () => {
      resizeCanvas()
      updateTarget()
    }

    const resizeCanvas = () => {
      const bounds = stage.getBoundingClientRect()
      const nextWidth = Math.max(1, bounds.width)
      const nextHeight = Math.max(1, bounds.height)
      const deviceDpr = Math.max(1, window.devicePixelRatio || 1)
      const pixelDpr = Math.sqrt(MAX_CANVAS_PIXELS / (nextWidth * nextHeight))
      const edgeDpr = MAX_CANVAS_EDGE / Math.max(nextWidth, nextHeight)
      const nextDpr = Math.min(deviceDpr, pixelDpr, edgeDpr)
      if (nextWidth === canvasWidth && nextHeight === canvasHeight && nextDpr === dpr) return
      canvasWidth = nextWidth
      canvasHeight = nextHeight
      dpr = nextDpr
      canvas.width = Math.round(canvasWidth * dpr)
      canvas.height = Math.round(canvasHeight * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      for (const bitmap of images.values()) bitmap.close()
      images.clear()
      needsDraw = true
      requestAroundTarget()
    }

    const tick = (now: number) => {
      if (disposed) return
      const elapsed = lastTick ? Math.min(64, now - lastTick) : 16.67
      lastTick = now
      if (reducedMotion) {
        if (currentFrame !== targetFrame) {
          currentFrame = targetFrame
          needsDraw = true
        }
      } else {
        const previousFrame = currentFrame
        const amount = 1 - Math.exp(-elapsed / EASE_TIME_MS)
        currentFrame += (targetFrame - currentFrame) * amount
        if (Math.abs(targetFrame - currentFrame) < 0.015) currentFrame = targetFrame
        if (currentFrame !== previousFrame) needsDraw = true
      }
      if (needsDraw) draw()
      rafId = window.requestAnimationFrame(tick)
    }

    const onMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches
      if (reducedMotion) {
        currentFrame = targetFrame
        needsDraw = true
      }
    }

    resizeCanvas()
    targetFrame = frameFromProgress(normalizedProgress())
    currentFrame = targetFrame
    requestAroundTarget()
    window.addEventListener('scroll', updateTarget, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    mediaQuery.addEventListener('change', onMotionChange)
    const resizeObserver = new ResizeObserver(resizeCanvas)
    resizeObserver.observe(stage)
    rafId = window.requestAnimationFrame(tick)

    return () => {
      disposed = true
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', updateTarget)
      window.removeEventListener('resize', onResize)
      mediaQuery.removeEventListener('change', onMotionChange)
      resizeObserver.disconnect()
      for (const controller of loading.values()) controller.abort()
      for (const bitmap of images.values()) bitmap.close()
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
