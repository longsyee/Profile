import { useEffect, useState } from 'react'
import type { Project } from '../lib/projects'
import productInterfaceUrl from '../../assets/portfolio-concepts/product-interface.png'
import scrollStudyUrl from '../../assets/portfolio-concepts/scroll-study.png'
import signalStudyUrl from '../../assets/portfolio-concepts/signal-study.png'
import { AuroraWorld } from './AuroraWorld'
import { BuildInMotionStory } from './BuildInMotionStory'
import styles from './AuroraPortfolio.module.css'

const conceptArtwork: Record<string, string> = {
  'concept-01': productInterfaceUrl,
  'concept-02': scrollStudyUrl,
  'concept-03': signalStudyUrl,
}

const navItems = [
  { id: 'process', label: 'Process' },
  { id: 'work', label: 'Work' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
]

export function AuroraPortfolio({ projects }: { projects: Project[] }) {
  const [activeChapter, setActiveChapter] = useState('top')

  useEffect(() => {
    const sections = ['top', ...navItems.map(({ id }) => id)].map((id) => document.getElementById(id)).filter((section): section is HTMLElement => Boolean(section))
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setActiveChapter((visible.target as HTMLElement).id)
    }, { rootMargin: '-20% 0px -56% 0px', threshold: [0.08, 0.25, 0.5] })
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return (
    <main className={styles.portfolio}>
      <a className={styles.skipLink} href="#main-content">Skip to content</a>
      <AuroraWorld />
      <div className={styles.shade} aria-hidden="true" />

      <header className={styles.header}>
        <a className={styles.brand} href="#top" aria-label="Edwin, home">
          <span className={styles.brandMark}>E</span>
          <span><strong>EDWIN</strong><small>DESIGN · CODE · MOTION</small></span>
        </a>
        <nav className={styles.nav} aria-label="Main navigation">
          {navItems.map(({ id, label }) => <a key={id} href={`#${id}`} aria-current={activeChapter === id ? 'location' : undefined}>{label}</a>)}
        </nav>
      </header>

      <aside className={styles.progress} aria-label="Page sections">
        {[{ id: 'top', label: 'Intro' }, ...navItems].map(({ id, label }, index) => (
          <a key={id} className={activeChapter === id ? styles.progressActive : undefined} href={`#${id}`} aria-label={label} aria-current={activeChapter === id ? 'location' : undefined}>
            <span />{index === 0 && <small>0{activeChapter === 'top' ? 1 : navItems.findIndex((item) => item.id === activeChapter) + 2}<i> / 05</i></small>}
          </a>
        ))}
      </aside>

      <div className={styles.journey} id="main-content" tabIndex={-1}>
        <section className={`${styles.chapter} ${styles.hero}`} id="top" aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span className={styles.statusDot} /> INDEPENDENT WEB DEVELOPER + DESIGNER</p>
            <h1 id="hero-title"><span>BUILDING FOR</span><br /><em>what’s next.</em></h1>
            <p className={styles.lede}>I’m Edwin. I turn ambitious ideas into expressive websites, thoughtful products, and details people remember.</p>
            <div className={styles.actions}>
              <a className={styles.primaryButton} href="#work">Explore selected work <span aria-hidden="true">↓</span></a>
              <a className={styles.textLink} href="#work">Skip to projects <span aria-hidden="true">↘</span></a>
            </div>
          </div>
          <div className={styles.heroStamp} aria-hidden="true"><span>IDEAS</span><i>IN</i><b>MOTION</b></div>
          <div className={styles.sceneLabel}><span>01 / THE ATELIER</span><i /> MALAYSIA · EVERYWHERE</div>
        </section>

        <BuildInMotionStory />

        <section className={`${styles.chapter} ${styles.work}`} id="work" aria-labelledby="work-title">
          <div className={styles.workHeading} data-reveal>
            <p className={styles.eyebrow}>03 / SELECTED WORK</p>
            <h2 id="work-title">Good ideas<br /><em>made real.</em></h2>
            <p className={styles.sectionIntro}>A few things built with curiosity, care, and a healthy respect for the details.</p>
          </div>
          {projects.length ? (
            <div className={styles.projectGrid}>
              {projects.map((project, index) => {
                const image = project.image_url || (project.concept ? conceptArtwork[String(project.id)] : undefined)
                const destination = project.live_url || project.source_url
                return (
                  <article className={`${styles.project} ${styles[`project${index % 3}`]}`} key={project.id} data-reveal>
                    <div className={styles.projectVisual}>
                      {image ? <img src={image} alt={`${project.title} project artwork`} loading="lazy" /> : <div className={styles.projectFallback} aria-hidden="true"><span>{String(index + 1).padStart(2, '0')}</span><i /></div>}
                      <span className={styles.projectNumber}>{String(index + 1).padStart(2, '0')}</span>
                    </div>
                    <div className={styles.projectMeta}>
                      <div><p>{project.category}{project.concept ? <span className={styles.conceptTag}>CONCEPT</span> : null}</p><h3>{project.title}</h3></div>
                      {destination && <a href={destination} target="_blank" rel="noreferrer" aria-label={`${project.live_url ? 'Visit' : 'View source for'} ${project.title}`}>↗</a>}
                    </div>
                    <p className={styles.projectDescription}>{project.description}</p>
                    {(project.live_url || project.source_url) && <div className={styles.projectLinks}>
                      {project.live_url && <a href={project.live_url} target="_blank" rel="noreferrer">Visit project <span>↗</span></a>}
                      {project.source_url && <a href={project.source_url} target="_blank" rel="noreferrer">Source code <span>↗</span></a>}
                    </div>}
                  </article>
                )
              })}
            </div>
          ) : (
            <div className={styles.emptyWork} data-reveal><span>THE NEXT CHAPTER IS YOURS</span><p>New work is taking shape. In the meantime, let’s talk about what you’re building.</p><a href="#contact">Start a conversation ↗</a></div>
          )}
          <div className={styles.sceneLabel}><span>03 / SELECTED WORK</span><i /> IDEAS, IN THE WILD</div>
        </section>

        <section className={`${styles.chapter} ${styles.about}`} id="about" aria-labelledby="about-title">
          <div className={styles.aboutNumber} aria-hidden="true">04</div>
          <div className={styles.aboutCopy} data-reveal>
            <p className={styles.eyebrow}>A LITTLE ABOUT HOW I WORK</p>
            <h2 id="about-title">Design eye.<br /><em>Developer hands.</em></h2>
            <p className={styles.aboutBody}>I work across the whole experience: shaping the idea, designing the interface, and building the system behind it. The best details happen when all three speak the same language.</p>
            <ul className={styles.skills} aria-label="Capabilities"><li>Web development</li><li>Interface design</li><li>Creative technology</li><li>AI experiences</li></ul>
          </div>
          <div className={styles.aboutAside} data-reveal><span>THE PRACTICE</span><p>Good work should feel as considered as it looks. I like clear thinking, useful experiments, and a little bit of magic in the margins.</p><i aria-hidden="true">✳</i></div>
          <div className={styles.sceneLabel}><span>04 / THE MAKER</span><i /> THOUGHT THROUGH · BUILT WITH CARE</div>
        </section>

        <section className={`${styles.chapter} ${styles.contact}`} id="contact" aria-labelledby="contact-title">
          <div className={styles.contactCopy} data-reveal>
            <p className={styles.eyebrow}><span className={styles.statusDot} /> HAVE A GOOD ONE IN MIND?</p>
            <h2 id="contact-title">Let’s make<br /><em>it happen.</em></h2>
            <p>One good conversation can change the shape of a project.</p>
            <a className={styles.primaryButton} href="https://zhiyuantech.ai" target="_blank" rel="noreferrer">Start a conversation <span aria-hidden="true">↗</span></a>
          </div>
          <div className={styles.contactOrb} aria-hidden="true"><span>LET’S<br />BUILD</span><i /></div>
          <div className={styles.sceneLabel}><span>05 / WHAT’S NEXT</span><i /> YOUR MOVE</div>
          <footer className={styles.footer}><a className={styles.footerBrand} href="#top">EDWIN<span>INDEPENDENT BY DESIGN</span></a><span>© 2026 · MADE WITH INTENT</span><a href="https://zhiyuantech.ai" target="_blank" rel="noreferrer">ZHIYUANTECH.AI ↗</a></footer>
        </section>
      </div>
    </main>
  )
}
