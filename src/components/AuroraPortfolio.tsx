import { useEffect, useState } from 'react'
import type { Project } from '../lib/projects'
import heroArtworkUrl from '../../assets/portfolio-print-studio.webp'
import { BuildInMotionStory } from './BuildInMotionStory'
import styles from './AuroraPortfolio.module.css'

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
          <div className={styles.heroArtwork} aria-hidden="true">
            <img src={heroArtworkUrl} alt="" fetchPriority="high" />
            <span>STUDY 01 <i /> IDEAS IN MOTION</span>
          </div>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span className={styles.statusDot} /> INDEPENDENT WEB DEVELOPER + DESIGNER</p>
            <h1 id="hero-title"><span>BUILDING FOR</span><br /><em>what’s next.</em></h1>
            <p className={styles.lede}>I’m Edwin. I shape ambitious ideas into expressive websites and digital experiences people remember.</p>
            <div className={styles.actions}>
              <a className={styles.primaryButton} href="#work">Explore selected work <span aria-hidden="true">↓</span></a>
            </div>
          </div>
          <div className={styles.sceneLabel}><span>01 / INTRODUCTION</span><i /> MALAYSIA · INDEPENDENT BY DESIGN</div>
        </section>

        <BuildInMotionStory />

        <section className={`${styles.chapter} ${styles.work}`} id="work" aria-labelledby="work-title">
          <div className={styles.workHeading} data-reveal>
            <p className={styles.eyebrow}>03 / SELECTED WORK</p>
            <h2 id="work-title">Good ideas<br /><em>made real.</em></h2>
            <p className={styles.sectionIntro}>A selection of thoughtful experiments and useful things, made with care.</p>
          </div>
          {projects.length ? (
            <div className={styles.projectGrid}>
              {projects.map((project, index) => {
                const image = project.image_url
                const destination = project.live_url || project.source_url
                return (
                  <article className={`${styles.project} ${styles[`project${index % 3}`]}`} key={project.id} data-reveal>
                    <div className={styles.projectVisual}>
                      {image ? <img src={image} alt={`${project.title} project artwork`} loading="lazy" /> : <div className={styles.projectFallback} aria-hidden="true"><span>{project.concept ? 'FIELD STUDY' : String(index + 1).padStart(2, '0')}</span><i /></div>}
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
          <div className={styles.sceneLabel}><span>03 / SELECTED WORK</span><i /> MADE TO MEET THE WORLD</div>
        </section>

        <section className={`${styles.chapter} ${styles.about}`} id="about" aria-labelledby="about-title">
          <div className={styles.aboutCopy} data-reveal>
            <p className={styles.eyebrow}>A LITTLE ABOUT HOW I WORK</p>
            <h2 id="about-title">Design eye.<br /><em>Developer hands.</em></h2>
            <p className={styles.aboutBody}>I shape the idea, design the interface, and build the system behind it. The best details happen when all three work together.</p>
            <ul className={styles.skills} aria-label="Capabilities"><li>Web development</li><li>Interface design</li><li>Creative technology</li><li>AI experiences</li></ul>
          </div>
          <div className={styles.aboutAside} data-reveal><span>THE PRACTICE</span><p>Clear thinking, useful experiments, and a little magic in the margins.</p><i aria-hidden="true">✳</i></div>
          <div className={styles.sceneLabel}><span>04 / THE MAKER</span><i /> DESIGN · CODE · CURIOSITY</div>
        </section>

        <section className={`${styles.chapter} ${styles.contact}`} id="contact" aria-labelledby="contact-title">
          <div className={styles.contactCopy} data-reveal>
            <p className={styles.eyebrow}><span className={styles.statusDot} /> HAVE A GOOD ONE IN MIND?</p>
            <h2 id="contact-title">Let’s make<br /><em>it happen.</em></h2>
            <p>One good conversation can change the shape of a project.</p>
            <a className={styles.primaryButton} href="https://zhiyuantech.ai" target="_blank" rel="noreferrer">Start a conversation <span aria-hidden="true">↗</span></a>
          </div>
          <div className={styles.contactOrb} aria-hidden="true"><span>LET’S<br />BUILD</span><i /></div>
          <div className={styles.sceneLabel}><span>05 / CONTACT</span><i /> LET’S MAKE SOMETHING MATTER</div>
          <footer className={styles.footer}><a className={styles.footerBrand} href="#top">EDWIN<span>INDEPENDENT BY DESIGN</span></a><span>© 2026 · MADE WITH INTENT</span><a href="https://zhiyuantech.ai" target="_blank" rel="noreferrer">ZHIYUANTECH.AI ↗</a></footer>
        </section>
      </div>
    </main>
  )
}
