import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { conceptProjects, type Project } from '../lib/projects'
import styles from './PersonalProfile.module.css'

gsap.registerPlugin(ScrollTrigger)

const sections = [
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'work', label: 'Selected work' },
  { id: 'process', label: 'Process' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
]

const capabilities = [
  { verb: 'BUILD', title: 'Web development', summary: 'Useful, responsive experiences for the web.' },
  { verb: 'SHAPE', title: 'Interface design', summary: 'Digital interfaces that feel clear and considered.' },
  { verb: 'EXPLORE', title: 'Creative technology', summary: 'Ideas through code and interaction.' },
  { verb: 'HUMANISE', title: 'AI experiences', summary: 'Emerging technology made practical and human.' },
]

const process = [
  { label: 'Notice', title: 'Find the real question.', copy: 'Pay attention to people, small frictions, and what could work better.' },
  { label: 'Prototype', title: 'Give the idea a shape.', copy: 'Make a simple version, test the flow, and learn what the idea needs.' },
  { label: 'Refine', title: 'Make every detail count.', copy: 'Use clear interfaces and useful feedback to make the experience work well.' },
  { label: 'Ship', title: 'Put it to work.', copy: 'Share the result, learn from real use, and keep improving it.' },
]

type ProjectsResponse = { projects?: Project[] }

export function PersonalProfile() {
  const [activeSection, setActiveSection] = useState('intro')
  const [projects, setProjects] = useState<Project[]>(conceptProjects)
  const profileRef = useRef<HTMLElement | null>(null)
  const processRef = useRef<HTMLDivElement | null>(null)
  const processPathRef = useRef<SVGPathElement | null>(null)

  useEffect(() => {
    let mounted = true
    fetch('/api/projects')
      .then((response) => response.ok ? response.json() as Promise<ProjectsResponse> : null)
      .then((data) => {
        if (mounted && Array.isArray(data?.projects) && data.projects.length > 0) {
          setProjects(data.projects.filter((project) => project.published))
        }
      })
      .catch(() => undefined)
    return () => { mounted = false }
  }, [])

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
      let cleanupPointer = () => undefined
      const context = gsap.context(() => {
        const intro = gsap.timeline({ defaults: { ease: 'power4.out' } })
        intro.fromTo(`.${styles.heroMotion}`, { y: 26, autoAlpha: 0 }, {
          y: 0, autoAlpha: 1, duration: 0.72, stagger: 0.1, clearProps: 'all',
        })
        intro.fromTo(`.${styles.poster}`, { scale: 0.88, rotation: -5, autoAlpha: 0 }, {
          scale: 1, rotation: 2, autoAlpha: 1, duration: 0.9, clearProps: 'all',
        }, 0.18)
        intro.fromTo(`.${styles.starburst}`, { scale: 0.65, rotation: -24 }, {
          scale: 1, rotation: -9, duration: 0.72, ease: 'back.out(1.5)', clearProps: 'transform',
        }, 0.5)
        intro.fromTo(`.${styles.posterTag}, .${styles.sideStamp}`, { scale: 0, rotation: 12 }, {
          scale: 1, rotation: (index) => index ? -7 : 5, duration: 0.4, stagger: 0.1, clearProps: 'transform',
        }, 0.7)

        gsap.to(`.${styles.starburst}`, { rotation: '+=8', duration: 4, ease: 'sine.inOut', yoyo: true, repeat: -1 })

        profile.querySelectorAll<HTMLElement>(`.${styles.reveal}`).forEach((element) => {
          gsap.fromTo(element, { y: 24, autoAlpha: 0 }, {
            y: 0, autoAlpha: 1, duration: 0.65, ease: 'power3.out', clearProps: 'all',
            scrollTrigger: { trigger: element, start: 'top 84%', once: true },
          })
        })
        gsap.fromTo(`.${styles.capability}`, { y: 18, autoAlpha: 0 }, {
          y: 0, autoAlpha: 1, duration: 0.55, stagger: 0.08, clearProps: 'all',
          scrollTrigger: { trigger: `.${styles.capabilityList}`, start: 'top 82%', once: true },
        })

        const pathLength = processPath.getTotalLength()
        const nodes = processRail.querySelectorAll(`.${styles.processRailNode}`)
        gsap.set(processPath, { strokeDasharray: pathLength, strokeDashoffset: pathLength })
        gsap.set(nodes, { scale: 0.72, opacity: 0.55, transformOrigin: '50% 50%' })
        const timeline = gsap.timeline({
          scrollTrigger: { trigger: processRail, start: 'top 72%', end: 'bottom 36%', scrub: 0.6, invalidateOnRefresh: true },
        })
        timeline.to(processPath, { strokeDashoffset: 0, ease: 'none' }, 0)
        timeline.to(nodes, { scale: 1, opacity: 1, ease: 'none', stagger: 0.24 }, 0)

        if (window.matchMedia('(min-width: 980px) and (pointer: fine)').matches) {
          const poster = profile.querySelector<HTMLElement>(`.${styles.poster}`)
          if (poster) {
            const rotateX = gsap.quickTo(poster, 'rotationX', { duration: 0.45, ease: 'power3.out' })
            const rotateY = gsap.quickTo(poster, 'rotationY', { duration: 0.45, ease: 'power3.out' })
            const onMove = (event: PointerEvent) => {
              const bounds = poster.getBoundingClientRect()
              rotateY(((event.clientX - bounds.left) / bounds.width - 0.5) * 7)
              rotateX(-((event.clientY - bounds.top) / bounds.height - 0.5) * 6)
            }
            const onLeave = () => { rotateX(0); rotateY(0) }
            poster.addEventListener('pointermove', onMove)
            poster.addEventListener('pointerleave', onLeave)
            cleanupPointer = () => {
              poster.removeEventListener('pointermove', onMove)
              poster.removeEventListener('pointerleave', onLeave)
            }
          }
        }
      }, profile)
      return () => { context.revert(); cleanupPointer() }
    })
    return () => media.revert()
  }, [])

  return (
    <main className={styles.profile} ref={profileRef}>
      <a className={styles.skipLink} href="#main-content">Skip to content</a>
      <header className={styles.header}>
        <a className={styles.wordmark} href="#intro" aria-label="Edwin, home"><strong>EDWIN</strong><span>Developer / Designer</span></a>
        <nav className={styles.navigation} aria-label="Main navigation">
          {sections.map(({ id, label }) => <a key={id} href={`#${id}`} aria-current={activeSection === id ? 'location' : undefined}>{label}</a>)}
        </nav>
      </header>

      <div className={styles.content} id="main-content" tabIndex={-1}>
        <section className={`${styles.section} ${styles.intro}`} id="intro" aria-labelledby="intro-title">
          <div className={styles.heroCopy}>
            <p className={`${styles.eyebrow} ${styles.heroMotion}`}>Independent web developer <b>/</b> Malaysia</p>
            <h1 className={styles.heroMotion} id="intro-title">Hi, I&apos;m<span>Edwin!</span></h1>
            <p className={`${styles.role} ${styles.heroMotion}`}>I design and build digital experiences.</p>
            <p className={`${styles.lede} ${styles.heroMotion}`}>I work across the whole experience: shaping an idea, designing its interface, and building the system behind it. Thoughtful details can make technology feel clear, useful, and human.</p>
            <div className={`${styles.actions} ${styles.heroMotion}`}>
              <a className={styles.button} href="#work">Explore selected work <span aria-hidden="true">↓</span></a>
              <a className={styles.underlink} href="#about">A little more about me</a>
            </div>
          </div>
          <div className={`${styles.posterWrap} ${styles.heroMotion}`}>
            <div className={styles.poster} role="img" aria-label="A bright cobalt poster with a coral starburst and Edwin initial">
              <div className={styles.posterGrid} aria-hidden="true" />
              <div className={styles.starburst} aria-hidden="true" />
              <span className={styles.posterLetter} aria-hidden="true">E</span>
              <span className={styles.posterSticker} aria-hidden="true">MAKE<br />THINGS<br />MATTER</span>
              <span className={styles.posterIndex} aria-hidden="true">PRINT STUDY / 01</span>
            </div>
            <span className={styles.posterTag} aria-hidden="true">IDEAS IN MOTION</span>
            <span className={styles.sideStamp} aria-hidden="true">DIGITAL<br />PLAYGROUND</span>
          </div>
        </section>

        <div className={styles.marquee} aria-label="Creative practice"><div className={styles.marqueeTrack} aria-hidden="true">
          {['Build', 'Shape', 'Explore', 'Humanise', 'Build', 'Shape', 'Explore', 'Humanise'].map((word, index) => <span key={`${word}-${index}`}>{word}</span>)}
        </div></div>

        <section className={`${styles.section} ${styles.capabilities}`} id="capabilities" aria-labelledby="capabilities-title">
          <div className={`${styles.sectionHead} ${styles.reveal}`}><div><p className={styles.eyebrow}>Practice / 02</p><h2 id="capabilities-title">A mind for<br /><span>systems!</span></h2></div><p>From the first sketch to the working system: a connected practice for ideas that deserve to be useful.</p></div>
          <div className={styles.capabilityList}>{capabilities.map((capability, index) => <article className={styles.capability} key={capability.title}>
            <small>0{index + 1} / {capability.verb}</small><h3>{capability.title}</h3><p>{capability.summary}</p>
          </article>)}</div>
        </section>

        <section className={`${styles.section} ${styles.work}`} id="work" aria-labelledby="work-title">
          <div className={`${styles.workHead} ${styles.reveal}`}><div><p className={styles.eyebrow}>Selected work / 03</p><h2 id="work-title">Ideas made<br /><span>useful.</span></h2></div><p>Selected projects from the studio. Titles, descriptions, imagery, and links come from Edwin&apos;s published project list.</p></div>
          <div className={styles.projectList}>
            {projects.map((project, index) => {
              return <article className={styles.project} key={project.id}>
                <span className={styles.projectNo}>0{index + 1}</span>
                <div className={styles.projectCopy}><h3 className={styles.projectTitle}>{project.title}</h3><p>{project.description}</p></div>
                {project.image_url ? <img className={styles.projectImage} src={project.image_url} alt="" loading="lazy" /> : <span className={styles.projectArt} aria-hidden="true" />}
                <span className={styles.projectKind}>{project.category}{project.concept ? ' / Concept' : ''}</span>
                <div className={styles.projectLinks}>
                  {project.live_url && <a className={styles.projectLink} href={project.live_url} target="_blank" rel="noreferrer" aria-label={`View ${project.title}`} title="View project">↗</a>}
                  {project.source_url && <a className={styles.projectLink} href={project.source_url} target="_blank" rel="noreferrer" aria-label={`${project.title} source code`} title="Source code">⌘</a>}
                  {!project.live_url && !project.source_url && <span className={styles.projectLink} aria-hidden="true">✳</span>}
                </div>
              </article>
            })}
          </div>
        </section>

        <section className={`${styles.section} ${styles.processSection}`} id="process" aria-labelledby="process-title">
          <div className={`${styles.processHead} ${styles.reveal}`}><div><p className={styles.eyebrow}>Approach / 04</p><h2 id="process-title">From question<br />to <span>something useful.</span></h2></div><p>A thoughtful process leaves room to learn as an idea takes shape. The steps remain clear without motion.</p></div>
          <div className={styles.processJourney} ref={processRef}>
            <svg className={styles.processRail} viewBox="0 0 1000 48" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <defs><linearGradient id="processRailGradient" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="var(--cobalt)" /><stop offset="36%" stopColor="var(--coral)" /><stop offset="70%" stopColor="var(--violet)" /><stop offset="100%" stopColor="var(--lime)" /></linearGradient></defs>
              <path className={styles.processRailTrack} d="M 125 24 C 205 2, 295 2, 375 24 C 455 46, 545 46, 625 24 C 705 2, 795 2, 875 24" />
              <path className={styles.processRailProgress} ref={processPathRef} d="M 125 24 C 205 2, 295 2, 375 24 C 455 46, 545 46, 625 24 C 705 2, 795 2, 875 24" />
              {[125, 375, 625, 875].map((x, index) => <circle key={x} className={styles.processRailNode} data-step={process[index].label.toLowerCase()} cx={x} cy="24" r="11" />)}
            </svg>
            <ol className={styles.processList}>{process.map((phase, index) => <li key={phase.label}>
              <span className={styles.processStepMeta}><span className={styles.processStepNode} aria-hidden="true" /><span>0{index + 1} / {phase.label}</span></span>
              <h3>{phase.title}</h3><p>{phase.copy}</p>
            </li>)}</ol>
          </div>
        </section>

        <section className={`${styles.section} ${styles.about}`} id="about" aria-labelledby="about-title">
          <div className={styles.reveal}><p className={styles.eyebrow}>A little about me / 05</p><h2 id="about-title">Design eye.<br /><span>Developer hands.</span></h2></div>
          <div className={`${styles.aboutCopy} ${styles.reveal}`}><p>I&apos;m Edwin, an independent developer and designer who enjoys turning early ideas into useful, considered experiences.</p><p>Clear thinking, practical experiments, and learning by making connect the first question to the finished detail.</p><div className={styles.aboutMeta}><span>Independent</span><span>Malaysia</span></div></div>
        </section>

        <section className={`${styles.section} ${styles.contact}`} id="contact" aria-labelledby="contact-title">
          <div className={styles.reveal}><p className={styles.eyebrow}>Get in touch / 06</p><h2 id="contact-title">Say hello.</h2></div>
          <div className={`${styles.contactCopy} ${styles.reveal}`}><p>Questions, ideas, or a chance to collaborate? Get in touch.</p><a className={styles.button} href="https://zhiyuantech.ai" target="_blank" rel="noreferrer">Contact Edwin <span aria-hidden="true">↗</span></a></div>
          <footer className={styles.footer}><a href="#intro">EDWIN</a><span>Independent / Malaysia</span><span>© 2026</span></footer>
        </section>
      </div>
    </main>
  )
}
