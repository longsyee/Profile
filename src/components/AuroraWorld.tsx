import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import buildWorldUrl from '../../assets/build-in-motion-world.png'
import floatingBuildingUrl from '../../assets/portfolio-floating-building.png'
import styles from './AuroraWorld.module.css'

export function AuroraWorld() {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reducedMotion = motionQuery.matches
    const mobile = window.innerWidth < 760
    const canvas = document.createElement('canvas')
    let renderer: THREE.WebGLRenderer
    let frame = 0
    let contextLost = false
    let inViewport = true
    let pageVisible = document.visibilityState !== 'hidden'
    function schedule() {
      if (frame || contextLost || !inViewport || !pageVisible) return
      frame = window.requestAnimationFrame(tick)
    }
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: window.innerWidth > 760, powerPreference: 'high-performance' })
    } catch {
      return
    }
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    host.appendChild(canvas)

    const scene = new THREE.Scene()
    const loader = new THREE.TextureLoader()
    const background = loader.load(
      buildWorldUrl,
      (texture) => { scene.background = texture },
      undefined,
      () => { scene.background = null },
    )
    background.colorSpace = THREE.SRGBColorSpace
    scene.background = background

    const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.set(0, 1.05, mobile ? 24 : 21)
    const target = new THREE.Vector3(0, 0.45, 0)
    camera.lookAt(target)

    const buildingTexture = loader.load(floatingBuildingUrl, undefined, undefined, () => {
      canvas.dataset.failed = 'true'
      window.cancelAnimationFrame(frame)
      frame = 0
    })
    buildingTexture.colorSpace = THREE.SRGBColorSpace
    buildingTexture.anisotropy = 8
    const buildingMaterial = new THREE.MeshBasicMaterial({
      map: buildingTexture,
      transparent: true,
      alphaTest: 0.008,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
    const building = new THREE.Mesh(new THREE.PlaneGeometry(9.8, 6.55, 1, 1), buildingMaterial)
    building.renderOrder = 3
    const buildingGroup = new THREE.Group()
    const buildingBase = { x: mobile ? 1.2 : 4.45, y: mobile ? -4.1 : 0.08 }
    buildingGroup.position.set(buildingBase.x, buildingBase.y, 0)
    buildingGroup.scale.setScalar(mobile ? 0.43 : 0.94)
    buildingGroup.rotation.set(-0.025, -0.035, 0.012)
    buildingGroup.add(building)
    scene.add(buildingGroup)

    const fragments: Array<{ mesh: THREE.Mesh; home: THREE.Vector3; phase: number; speed: number; lift: number }> = []
    const fragmentSpecs = [
      { kind: 'crystal', x: -3.6, y: 2.1, z: 1.8, size: 0.24, color: 0xd2fa62 },
      { kind: 'crystal', x: -2.9, y: -2.8, z: 2.3, size: 0.17, color: 0xff5b45 },
      { kind: 'crystal', x: 4.5, y: 2.8, z: 1.4, size: 0.28, color: 0xa19aff },
      { kind: 'crystal', x: 4.9, y: -2.0, z: 2.1, size: 0.18, color: 0xff5b45 },
      { kind: 'crystal', x: 1.1, y: 3.8, z: 1.7, size: 0.14, color: 0xf8f1e6 },
      { kind: 'rock', x: -3.1, y: -3.6, z: 1.5, size: 0.21, color: 0x39234b },
      { kind: 'rock', x: 3.4, y: -3.7, z: 1.8, size: 0.26, color: 0x5a405f },
      { kind: 'rock', x: 5.3, y: 0.1, z: 1.2, size: 0.15, color: 0x4c3561 },
    ]
    fragmentSpecs.forEach((spec, index) => {
      const geometry = spec.kind === 'crystal'
        ? new THREE.OctahedronGeometry(spec.size, 0)
        : new THREE.DodecahedronGeometry(spec.size, 0)
      const material = new THREE.MeshPhysicalMaterial({
        color: spec.color,
        emissive: spec.kind === 'crystal' ? spec.color : 0x17221f,
        emissiveIntensity: spec.kind === 'crystal' ? 0.48 : 0.34,
        metalness: spec.kind === 'crystal' ? 0.12 : 0.42,
        roughness: spec.kind === 'crystal' ? 0.2 : 0.84,
        transmission: 0,
        thickness: 0.8,
        iridescence: spec.kind === 'crystal' ? 0.46 : 0.1,
        iridescenceIOR: 1.3,
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(spec.x, spec.y, spec.z)
      mesh.rotation.set(index * 0.8, index * 1.2, index * 0.55)
      mesh.renderOrder = 4
      buildingGroup.add(mesh)
      fragments.push({ mesh, home: new THREE.Vector3(spec.x, spec.y, spec.z), phase: index * 1.7, speed: 0.48 + (index % 4) * 0.1, lift: 0.18 + (index % 3) * 0.1 })
    })

    const starsPosition = new Float32Array(190 * 3)
    let seed = 9817
    const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
    for (let i = 0; i < 190; i += 1) {
      starsPosition[i * 3] = -22 + random() * 44
      starsPosition[i * 3 + 1] = -9 + random() * 19
      starsPosition[i * 3 + 2] = -12 - random() * 8
    }
    const starsGeometry = new THREE.BufferGeometry()
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPosition, 3))
    const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0xd2fa62, size: 0.035, transparent: true, opacity: 0.7, sizeAttenuation: true }))
    scene.add(stars)

    const keyLight = new THREE.PointLight(0xa19aff, 18, 25)
    keyLight.position.set(6, 4, 4)
    scene.add(keyLight)
    const fillLight = new THREE.HemisphereLight(0xf8f1e6, 0x21102f, 1.7)
    scene.add(fillLight)
    const violetLight = new THREE.PointLight(0xff5b45, 12, 18)
    violetLight.position.set(8, 1, 2)
    scene.add(violetLight)

    const pointer = { x: 0, y: 0 }
    const onPointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 2
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })

    const resize = () => {
      const isMobile = window.innerWidth < 760
      camera.aspect = window.innerWidth / window.innerHeight
      camera.position.z = isMobile ? 24 : 21
      buildingBase.x = isMobile ? 1.2 : 4.45
      buildingBase.y = isMobile ? -4.1 : 0.08
      buildingGroup.position.set(buildingBase.x, buildingBase.y, 0)
      buildingGroup.scale.setScalar(isMobile ? 0.43 : 0.94)
      camera.updateProjectionMatrix()
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.2 : 1.6))
      renderer.setSize(window.innerWidth, window.innerHeight, false)
    }
    window.addEventListener('resize', resize)

    const entrance = gsap.fromTo(buildingGroup.scale,
      { x: (mobile ? 0.43 : 0.94) * 0.68, y: (mobile ? 0.43 : 0.94) * 0.68, z: (mobile ? 0.43 : 0.94) * 0.68 },
      { x: mobile ? 0.43 : 0.94, y: mobile ? 0.43 : 0.94, z: mobile ? 0.43 : 0.94, duration: reducedMotion ? 0 : 1.65, delay: reducedMotion ? 0 : 0.16, ease: 'elastic.out(1, 0.48)' },
    )

    resize()
    function tick(now: number) {
      if (contextLost || canvas.dataset.failed === 'true') return
      const time = now * 0.001
      const motionScale = reducedMotion ? 0 : 1
      buildingGroup.position.y = buildingBase.y + Math.sin(time * 0.68) * 0.17 * motionScale
      buildingGroup.rotation.x += ((-0.025 - pointer.y * 0.045 * motionScale) - buildingGroup.rotation.x) * 0.035
      buildingGroup.rotation.y += ((-0.035 + pointer.x * 0.075 * motionScale + Math.sin(time * 0.22) * 0.024 * motionScale) - buildingGroup.rotation.y) * 0.035
      buildingGroup.rotation.z += ((0.012 + pointer.x * 0.012 * motionScale) - buildingGroup.rotation.z) * 0.035
      stars.rotation.y = Math.sin(time * 0.05) * 0.015 * motionScale
      fragments.forEach(({ mesh, home, phase, speed, lift }, index) => {
        mesh.position.y = home.y + Math.sin(time * speed + phase) * lift * motionScale
        mesh.position.x = home.x + Math.sin(time * speed * 0.42 + phase) * 0.13 * motionScale
        mesh.rotation.x += (Math.sin(time * 0.54 + phase) * 0.55 - mesh.rotation.x) * 0.035 * motionScale
        mesh.rotation.y += (time * 0.22 + index - mesh.rotation.y) * 0.018 * motionScale
      })
      renderer.render(scene, camera)
      frame = 0
      if (!reducedMotion) schedule()
    }

    const onContextLost = (event: Event) => {
      event.preventDefault()
      contextLost = true
      canvas.dataset.lost = 'true'
      window.cancelAnimationFrame(frame)
      frame = 0
    }
    const onContextRestored = () => {
      contextLost = false
      delete canvas.dataset.lost
      resize()
      schedule()
    }
    const hero = document.getElementById('top')
    const sceneObserver = hero ? new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting
      if (inViewport) schedule()
      else { window.cancelAnimationFrame(frame); frame = 0 }
    }, { threshold: 0.01 }) : undefined
    if (hero) sceneObserver?.observe(hero)
    const onVisibilityChange = () => {
      pageVisible = document.visibilityState !== 'hidden'
      if (pageVisible) schedule()
      else { window.cancelAnimationFrame(frame); frame = 0 }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    gsap.registerPlugin(ScrollTrigger)
    let fade: gsap.core.Tween | undefined
    const createFade = () => hero && !reducedMotion ? gsap.to(canvas, {
      opacity: 0,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 },
    }) : undefined
    const onMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches
      window.cancelAnimationFrame(frame)
      frame = 0
      schedule()
      if (reducedMotion) entrance.progress(1).pause()
      fade?.scrollTrigger?.kill()
      fade?.kill()
      if (reducedMotion) {
        gsap.set(canvas, { clearProps: 'opacity' })
        fade = undefined
      } else {
        fade = createFade()
      }
    }
    canvas.addEventListener('webglcontextlost', onContextLost)
    canvas.addEventListener('webglcontextrestored', onContextRestored)
    motionQuery.addEventListener('change', onMotionChange)

    fade = createFade()
    schedule()

    return () => {
      fade?.scrollTrigger?.kill()
      fade?.kill()
      entrance.kill()
      window.cancelAnimationFrame(frame)
      sceneObserver?.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      motionQuery.removeEventListener('change', onMotionChange)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      building.geometry.dispose()
      buildingMaterial.dispose()
      buildingTexture.dispose()
      background.dispose()
      fragments.forEach(({ mesh }) => {
        mesh.geometry.dispose()
        ;(mesh.material as THREE.Material).dispose()
      })
      stars.geometry.dispose()
      ;(stars.material as THREE.Material).dispose()
      keyLight.dispose()
      fillLight.dispose()
      violetLight.dispose()
      renderer.dispose()
      canvas.remove()
    }
  }, [])

  return <div className={styles.world} ref={hostRef} aria-hidden="true"><div className={styles.fallback} style={{ backgroundImage: `url(${buildWorldUrl})` }} /></div>
}
