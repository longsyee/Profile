import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import crystalFallbackUrl from '../../assets/portfolio-crystal.png'
import styles from './WebGLShowcase.module.css'

export function WebGLShowcase() {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
    camera.position.set(0, 0, 5.1)

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
    } catch {
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0x000000, 0)
    host.appendChild(renderer.domElement)

    const sculpture = new THREE.Group()
    const geometry = new THREE.IcosahedronGeometry(1.18, 2)
    const shell = new THREE.Mesh(
      geometry,
      new THREE.MeshPhysicalMaterial({
        color: 0xdca86f,
        metalness: 0.66,
        roughness: 0.24,
        transparent: true,
        opacity: 0.36,
        transmission: 0.18,
        thickness: 0.4,
      }),
    )
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry, 16),
      new THREE.LineBasicMaterial({ color: 0xe9c89e, transparent: true, opacity: 0.86 }),
    )
    const orbit = new THREE.Mesh(
      new THREE.TorusGeometry(1.55, 0.006, 8, 180),
      new THREE.MeshBasicMaterial({ color: 0xe2b47f, transparent: true, opacity: 0.7 }),
    )
    orbit.rotation.set(0.95, 0.2, -0.35)
    sculpture.add(shell, edges, orbit)
    scene.add(sculpture)

    const fillLight = new THREE.PointLight(0xf0c794, 22, 12)
    fillLight.position.set(-2.3, 2.4, 3.4)
    const rimLight = new THREE.PointLight(0x798b9b, 14, 10)
    rimLight.position.set(2.5, -1.2, -2)
    scene.add(fillLight, rimLight, new THREE.AmbientLight(0xf6ede1, 1.2))

    const resize = () => {
      const { width, height } = host.getBoundingClientRect()
      if (!width || !height) return
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
      renderer.render(scene, camera)
      renderer.domElement.dataset.ready = 'true'
    }

    let frame = 0
    let running = false
    const render = () => {
      if (!running) return
      sculpture.rotation.y += 0.0025
      sculpture.rotation.x = Math.sin(performance.now() * 0.00025) * 0.12
      renderer.render(scene, camera)
      frame = window.requestAnimationFrame(render)
    }

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => {
      running = !motionQuery.matches
      window.cancelAnimationFrame(frame)
      if (running) frame = window.requestAnimationFrame(render)
      else renderer.render(scene, camera)
    }

    const onContextLost = (event: Event) => {
      event.preventDefault()
      running = false
      window.cancelAnimationFrame(frame)
      renderer.domElement.dataset.lost = 'true'
    }
    const onContextRestored = () => {
      delete renderer.domElement.dataset.lost
      resize()
      updateMotion()
    }
    renderer.domElement.addEventListener('webglcontextlost', onContextLost)
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored)

    const observer = new ResizeObserver(resize)
    observer.observe(host)
    motionQuery.addEventListener('change', updateMotion)
    resize()
    updateMotion()

    return () => {
      observer.disconnect()
      motionQuery.removeEventListener('change', updateMotion)
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored)
      window.cancelAnimationFrame(frame)
      geometry.dispose()
      edges.geometry.dispose()
      shell.material.dispose()
      edges.material.dispose()
      orbit.geometry.dispose()
      orbit.material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return (
    <div className={styles.stage} ref={hostRef} role="img" aria-label="A softly rotating faceted 3D sculpture">
      <img className={styles.fallbackArtwork} src={crystalFallbackUrl} alt="" aria-hidden="true" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none' }} />
    </div>
  )
}
