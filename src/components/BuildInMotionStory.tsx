import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import styles from './BuildInMotionStory.module.css'

const phases = [
  { id: 'code', number: '01', label: 'Code', title: 'Start with a spark.', copy: 'Every strong experience begins with a question, a sketch, or a small thing that feels worth making.', token: '< idea />' },
  { id: 'wireframe', number: '02', label: 'Structure', title: 'Find the shape.', copy: 'I test the flow, connect the pieces, and make sure the idea works before the finish goes on.', token: '□ → □ → □' },
  { id: 'product', number: '03', label: 'Product', title: 'Make it feel alive.', copy: 'Then the details come together: clear interfaces, useful motion, and a product ready to meet the world.', token: 'made for people' },
] as const

export type BuildPhase = typeof phases[number]['id']

export function BuildInMotionStory() {
  const sectionRef = useRef<HTMLElement>(null)
  const stepRefs = useRef<Array<HTMLElement | null>>([])
  const [phase, setPhase] = useState<BuildPhase>('code')
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
        <h2 id="story-title">Build in<br /><em>motion.</em></h2>
        <p>From the first line of code to the last small detail, the process is part of the product.</p>
        <div className={styles.controls} role="group" aria-label="Choose a build phase">
          {phases.map((item) => <button key={item.id} type="button" onClick={() => selectPhase(item.id, true)} aria-pressed={phase === item.id}>{item.number}<span>{item.label}</span></button>)}
        </div>
      </div>
      <div className={styles.storyLayout}>
        <div className={styles.sceneWrap}>
          <div className={`${styles.storyScene} ${styles[`phase-${phase}`]}`} role="img" aria-label={`Build phase: ${phases.find((item) => item.id === phase)?.label}`}>
            <div className={styles.sceneGrid} aria-hidden="true" />
            <div className={styles.codePlane} data-story-layer aria-hidden="true"><i>const</i> idea = <b>make</b>(<em>meaning</em>)<span>01</span><span>02</span><span>03</span><span>04</span></div>
            <div className={styles.wirePlane} data-story-layer aria-hidden="true"><i /><i /><i /><span>FORM / FLOW / FEEL</span></div>
            <div className={styles.productPlane} data-story-layer aria-hidden="true"><div><span>FIELD NOTES — 001</span><b>Make room<br />for good ideas.</b><i>Explore the collection <strong>↗</strong></i></div><aside /></div>
            <div className={styles.sceneIndex}><span>{phases.find((item) => item.id === phase)?.number}</span> / 03</div>
          </div>
          <p className={styles.sceneCaption}>ONE IDEA, THREE STATES <span>·</span> SCROLL TO TRANSFORM</p>
        </div>
        <div className={styles.steps}>
          {phases.map((item, index) => <article key={item.id} ref={(node) => { stepRefs.current[index] = node }} className={`${styles.step} ${phase === item.id ? styles.stepActive : ''}`}>
            <p><span>{item.number}</span> / {item.label}</p><h3>{item.title}</h3><p className={styles.stepCopy}>{item.copy}</p>
          </article>)}
        </div>
      </div>
      <div className={styles.storyMarquee} aria-hidden="true"><span>THINK · SHAPE · BUILD · REFINE · </span><span>THINK · SHAPE · BUILD · REFINE · </span></div>
    </section>
  )
}
