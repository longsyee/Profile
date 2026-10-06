import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import styles from './BuildInMotionStory.module.css'

const phases = [
  { id: 'notice', number: '01', label: 'Notice', title: 'Find the real question.', copy: 'Good work starts by paying attention: to people, small frictions, and what could work better.' },
  { id: 'prototype', number: '02', label: 'Prototype', title: 'Give the idea a shape.', copy: 'I make a simple version, test the flow, and learn what the idea needs before adding polish.' },
  { id: 'refine', number: '03', label: 'Refine', title: 'Make every detail count.', copy: 'Clear interfaces, thoughtful motion, and useful feedback turn a working idea into a good experience.' },
  { id: 'ship', number: '04', label: 'Ship', title: 'Put it to work.', copy: 'The result is ready to meet real people, solve a real need, and keep getting better.' },
] as const

type BuildPhase = typeof phases[number]['id']

export function BuildInMotionStory() {
  const sectionRef = useRef<HTMLElement>(null)
  const stepRefs = useRef<Array<HTMLElement | null>>([])
  const [phase, setPhase] = useState<BuildPhase>('notice')
  const selectPhase = (next: BuildPhase, shouldScroll = false) => {
    setPhase(next)
    if (shouldScroll) stepRefs.current[phases.findIndex((item) => item.id === next)]?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' })
  }

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const reducedMotion = motionQuery.matches
    let entrance: gsap.core.Tween | undefined
    const context = gsap.context(() => {
      phases.forEach(({ id }, index) => {
        const step = stepRefs.current[index]
        if (!step) return
        ScrollTrigger.create({
          trigger: step,
          start: 'top 62%',
          end: 'bottom 38%',
          onEnter: () => setPhase(id),
          onEnterBack: () => setPhase(id),
        })
      })
      if (!reducedMotion) entrance = gsap.fromTo('[data-story-layer]', { y: 24 }, {
        y: 0, duration: 0.85, stagger: 0.12, ease: 'power3.out',
        onComplete: () => gsap.set('[data-story-layer]', { clearProps: 'transform' }),
        scrollTrigger: { trigger: sectionRef.current, start: 'top 72%', once: true },
      })
    }, sectionRef)
    const onMotionChange = (event: MediaQueryListEvent) => {
      if (!event.matches) return
      entrance?.progress(1).kill()
      gsap.set('[data-story-layer]', { clearProps: 'all' })
    }
    motionQuery.addEventListener('change', onMotionChange)
    return () => { motionQuery.removeEventListener('change', onMotionChange); context.revert() }
  }, [])

  return (
    <section className={styles.story} id="process" ref={sectionRef} aria-labelledby="story-title">
      <div className={styles.storyHeader} data-reveal>
        <p className={styles.eyebrow}>02 / HOW IDEAS BECOME REAL</p>
        <h2 id="story-title">Notice.<br /><em>Then make.</em></h2>
        <p>Good work moves from a real question to something useful in the world.</p>
        <div className={styles.controls} role="group" aria-label="Choose a build phase">
          {phases.map((item) => <button key={item.id} type="button" onClick={() => selectPhase(item.id, true)} aria-pressed={phase === item.id}><span className={styles.controlNumber}>{item.number}</span><span>{item.label}</span></button>)}
        </div>
      </div>
      <div className={styles.storyLayout}>
        <div className={styles.sceneWrap}>
          <div className={`${styles.storyScene} ${styles[`phase-${phase}`]}`} role="img" aria-label={`Build phase: ${phases.find((item) => item.id === phase)?.label}`}>
            <div className={styles.sceneGrid} aria-hidden="true" />
            <div className={styles.codePlane} data-story-layer aria-hidden="true"><i>const</i> question = <b>notice</b>(<em>people</em>)<span>01</span><span>02</span><span>03</span><span>04</span></div>
            <div className={styles.wirePlane} data-story-layer aria-hidden="true"><i /><i /><i /><span>TEST / LEARN / SHAPE</span></div>
            <div className={styles.productPlane} data-story-layer aria-hidden="true"><div><span>FIELD NOTES - 001</span><b>Make room<br />for good ideas.</b><i>Explore the collection <strong>&#8599;</strong></i></div><aside /></div>
            <div className={styles.shipStamp} aria-hidden="true">READY TO MEET THE WORLD <span>04 / 04</span></div>
            <div className={styles.sceneIndex}><span>{phases.find((item) => item.id === phase)?.number}</span> / 04</div>
          </div>
          <p className={styles.sceneCaption}>ONE IDEA, FOUR MOVES</p>
        </div>
        <div className={styles.steps}>
          {phases.map((item, index) => <article key={item.id} ref={(node) => { stepRefs.current[index] = node }} className={`${styles.step} ${phase === item.id ? styles.stepActive : ''}`}>
            <p><span>{item.number}</span> / {item.label}</p><h3>{item.title}</h3><p className={styles.stepCopy}>{item.copy}</p>
          </article>)}
        </div>
      </div>
    </section>
  )
}
