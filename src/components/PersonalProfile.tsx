import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import profileArtwork from '../assets/edwin-profile-aurora.webp'
import styles from './PersonalProfile.module.css'

gsap.registerPlugin(ScrollTrigger)

const sections = [
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'process', label: 'Process' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
]

const capabilities = [
  { title: 'Web development', summary: 'Building useful, responsive experiences for the web.' },
  { title: 'Interface design', summary: 'Making digital interfaces clear and considered.' },
  { title: 'Creative technology', summary: 'Exploring ideas through code and interaction.' },
  { title: 'AI experiences', summary: 'Making emerging technology feel practical and human.' },
]

const process = [
  { label: 'Notice', title: 'Find the real question.', copy: 'Pay attention to people, small frictions, and what could work better.' },
  { label: 'Prototype', title: 'Give the idea a shape.', copy: 'Make a simple version, test the flow, and learn what the idea needs.' },
  { label: 'Refine', title: 'Make every detail count.', copy: 'Use clear interfaces and useful feedback to make the experience work well.' },
  { label: 'Ship', title: 'Put it to work.', copy: 'Share the result, learn from real use, and keep improving it.' },
]

export function PersonalProfile() {
  const [activeSection, setActiveSection] = useState('intro')
  const profileRef = useRef<HTMLElement | null>(null)
  const processRef = useRef<HTMLDivElement | null>(null)
  const processPathRef = useRef<SVGPathElement | null>(null)

  useEffect(() => {
    const targets = ['intro', ...sections.map(({ id }) => id)]
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section))
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setActiveSection((visible.target as HTMLElement).id)
    }, { rootMargin: '-20% 0px -58% 0px', threshold: [0.08, 0.25, 0.5] })
    targets.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const profile = profileRef.current
    const processRail = processRef.current
    const processPath = processPathRef.current
    if (!profile || !processRail || !processPath) return

    const media = gsap.matchMedia(profile)

    media.add('(prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        const heroCopy = profile.querySelectorAll(`.${styles.heroMotion}`)
        gsap.fromTo(heroCopy,
          { autoAlpha: 0, y: 10 },
          { autoAlpha: 1, y: 0, duration: 0.48, stagger: 0.08, ease: 'power3.out', clearProps: 'all' },
        )
      }, profile)

      return () => context.revert()
    })

    media.add('(min-width: 721px) and (prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        const pathLength = processPath.getTotalLength()
        const nodes = processRail.querySelectorAll(`.${styles.processRailNode}`)
        gsap.set(processPath, { strokeDasharray: pathLength, strokeDashoffset: pathLength })
        gsap.set(nodes, { scale: 0.72, opacity: 0.55, transformOrigin: '50% 50%' })

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: processRail,
            start: 'top 72%',
            end: 'bottom 36%',
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        })
        timeline.to(processPath, { strokeDashoffset: 0, ease: 'none' }, 0)
        timeline.to(nodes, { scale: 1, opacity: 1, ease: 'none', stagger: 0.24 }, 0)
      }, processRail)

      return () => context.revert()
    })

    return () => media.revert()
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return

    const targets = Array.from(document.querySelectorAll<HTMLElement>(`.${styles.sectionReveal}`))
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.remove(styles.sectionRevealHidden)
        entry.target.classList.add(styles.sectionRevealVisible)
        observer.unobserve(entry.target)
      })
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })

    targets.forEach((section) => {
      if (section.getBoundingClientRect().top > window.innerHeight) {
        section.classList.add(styles.sectionRevealHidden)
      }
      observer.observe(section)
    })

    return () => {
      observer.disconnect()
      targets.forEach((section) => section.classList.remove(styles.sectionRevealHidden, styles.sectionRevealVisible))
    }
  }, [])

  return (
    <main className={styles.profile} ref={profileRef}>
      <a className={styles.skipLink} href="#main-content">Skip to content</a>

      <header className={styles.header}>
        <a className={styles.wordmark} href="#intro" aria-label="Edwin, home">EDWIN <span>DEVELOPER · DESIGNER</span></a>
        <nav className={styles.navigation} aria-label="Main navigation">
          {sections.map(({ id, label }) => <a key={id} href={`#${id}`} aria-current={activeSection === id ? 'location' : undefined}>{label}</a>)}
        </nav>
      </header>

      <div className={styles.content} id="main-content" tabIndex={-1}>
        <section className={styles.intro} id="intro" aria-labelledby="intro-title">
          <p className={`${styles.eyebrow} ${styles.heroMotion}`}>INDEPENDENT WEB DEVELOPER · MALAYSIA</p>
          <h1 className={styles.heroMotion} id="intro-title">Hi, I’m <span>Edwin.</span></h1>
          <div className={`${styles.introBody} ${styles.heroMotion}`}>
            <p className={styles.role}>I design and build digital experiences.</p>
            <p className={styles.lede}>I work across the whole experience: shaping an idea, designing its interface, and building the system behind it. Thoughtful details can make technology feel clear, useful, and human.</p>
            <a className={styles.textLink} href="#contact">A little more about me <span aria-hidden="true">↓</span></a>
          </div>
          <figure className={`${styles.heroArtwork} ${styles.heroMotion}`} aria-hidden="true">
            <img src={profileArtwork} alt="" />
          </figure>
          <p className={styles.sectionNumber}>01 <span>INTRODUCTION</span></p>
        </section>

        <section className={`${styles.capabilities} ${styles.sectionReveal}`} id="capabilities" aria-labelledby="capabilities-title">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>WHAT I DO</p>
            <h2 id="capabilities-title">Capabilities</h2>
          </div>
          <ul className={styles.capabilityList}>
            {capabilities.map((capability, index) => <li key={capability.title}><span>0{index + 1}</span><strong>{capability.title}</strong><p>{capability.summary}</p></li>)}
          </ul>
          <p className={styles.sectionNumber}>02 <span>CAPABILITIES</span></p>
        </section>

        <section className={`${styles.processSection} ${styles.sectionReveal}`} id="process" aria-labelledby="process-title">
          <div>
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>HOW I WORK</p>
              <h2 id="process-title">From question<br />to something useful.</h2>
            </div>
            <p className={styles.processIntro}>A thoughtful process leaves room to learn as an idea takes shape.</p>
          </div>
          <div className={styles.processJourney} ref={processRef}>
            <svg className={styles.processRail} viewBox="0 0 1000 48" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <defs>
                <linearGradient id="processRailGradient" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="var(--cobalt)" />
                  <stop offset="36%" stopColor="var(--vermilion)" />
                  <stop offset="70%" stopColor="var(--ultraviolet)" />
                  <stop offset="100%" stopColor="var(--lime)" />
                </linearGradient>
              </defs>
              <path className={styles.processRailTrack} d="M 125 24 C 205 2, 295 2, 375 24 C 455 46, 545 46, 625 24 C 705 2, 795 2, 875 24" />
              <path className={styles.processRailProgress} ref={processPathRef} d="M 125 24 C 205 2, 295 2, 375 24 C 455 46, 545 46, 625 24 C 705 2, 795 2, 875 24" />
              <circle className={styles.processRailNode} data-step="notice" cx="125" cy="24" r="11" />
              <circle className={styles.processRailNode} data-step="prototype" cx="375" cy="24" r="11" />
              <circle className={styles.processRailNode} data-step="refine" cx="625" cy="24" r="11" />
              <circle className={styles.processRailNode} data-step="ship" cx="875" cy="24" r="11" />
            </svg>
            <ol className={styles.processList}>
              {process.map((phase, index) => <li key={phase.label}>
                <span className={styles.processStepMeta}>
                  <span className={styles.processStepNode} data-step={phase.label.toLowerCase()} aria-hidden="true" />
                  <span>0{index + 1} / {phase.label}</span>
                </span>
                <h3>{phase.title}</h3>
                <p>{phase.copy}</p>
              </li>)}
            </ol>
          </div>
          <p className={styles.sectionNumber}>03 <span>PROCESS</span></p>
        </section>

        <section className={`${styles.about} ${styles.sectionReveal}`} id="about" aria-labelledby="about-title">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>A LITTLE ABOUT ME</p>
            <h2 id="about-title">Design eye.<br />Developer hands.</h2>
          </div>
          <div className={styles.aboutCopy}>
            <p>I’m Edwin, an independent developer and designer who enjoys turning early ideas into useful, considered experiences.</p>
            <p>I like clear thinking, practical experiments, and learning by making. Working across design and development helps me connect the whole experience, from the first question to the finished detail.</p>
          </div>
          <p className={styles.sectionNumber}>04 <span>ABOUT</span></p>
        </section>

        <section className={`${styles.contact} ${styles.sectionReveal}`} id="contact" aria-labelledby="contact-title">
          <div>
            <p className={styles.eyebrow}>GET IN TOUCH</p>
            <h2 id="contact-title">Say hello.</h2>
          </div>
          <div className={styles.contactCopy}>
            <p>I’m happy to hear from people with questions, ideas, or a chance to collaborate.</p>
            <a className={styles.textLink} href="https://zhiyuantech.ai" target="_blank" rel="noreferrer">Contact Edwin <span aria-hidden="true">↗</span></a>
          </div>
          <footer className={styles.footer}><a href="#intro">EDWIN</a><span>INDEPENDENT · MALAYSIA</span><span>© 2026</span></footer>
        </section>
      </div>
    </main>
  )
}
