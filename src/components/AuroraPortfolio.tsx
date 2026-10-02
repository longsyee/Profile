import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Project } from '../lib/projects'
import interfaceArtifactUrl from '../../assets/portfolio-interface.png'
import scrollArtifactUrl from '../../assets/portfolio-scroll-ribbon.png'
import crystalArtifactUrl from '../../assets/portfolio-crystal.png'
import edwinSculptureUrl from '../../assets/portfolio-edwin-e.png'
import contactEnvironmentUrl from '../../assets/contact-environment.png'
import { AuroraWorld } from './AuroraWorld'
import { LayeredArtwork, type ArtworkCutout } from './LayeredArtwork'
import styles from './AuroraPortfolio.module.css'

const projectArtwork = [interfaceArtifactUrl, scrollArtifactUrl, crystalArtifactUrl]

const edwinCrystals: ArtworkCutout[] = [
  { id: 'crown', center: [550, 112], path: 'M465 28 L526 41 L614 112 L632 189 L579 178 L520 147 L474 108 Z' },
  { id: 'west', center: [125, 312], path: 'M67 225 L106 239 L155 302 L184 365 L163 404 L116 389 L81 331 L68 270 Z' },
  { id: 'dawn', center: [187, 1068], path: 'M116 963 L151 979 L254 1046 L264 1158 L232 1175 L179 1127 L132 1061 L115 1007 Z' },
]

const crystalSatellites: ArtworkCutout[] = [
  { id: 'west', center: [184, 450], path: 'M133 331 L169 328 L220 380 L251 490 L247 549 L208 569 L170 520 L141 459 L119 397 Z' },
  { id: 'east', center: [882, 548], path: 'M817 470 L858 454 L913 482 L948 536 L936 594 L900 641 L859 620 L831 571 Z' },
  { id: 'southwest', center: [308, 851], path: 'M245 750 L281 764 L335 823 L373 885 L375 939 L340 955 L300 918 L265 857 Z' },
  { id: 'southeast', center: [790, 915], path: 'M766 821 L805 831 L837 879 L831 940 L798 1004 L762 990 L745 936 Z' },
]

const ribbonOrbs: ArtworkCutout[] = [
  { id: 'orb-high', center: [613, 238], path: 'M613 190 A48 48 0 1 0 613 286 A48 48 0 1 0 613 190 Z' },
  { id: 'orb-low', center: [995, 556], path: 'M995 514 A42 42 0 1 0 995 598 A42 42 0 1 0 995 514 Z' },
]

const chapters = [
  { id: 'top', label: 'Intro' },
  { id: 'work', label: 'Work' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
]

export function AuroraPortfolio({ projects }: { projects: Project[] }) {
  const journeyRef = useRef<HTMLDivElement>(null)
  const signatureRef = useRef<HTMLDivElement>(null)
  const driftTweens = useRef<gsap.core.Tween[]>([])
  const [activeChapter, setActiveChapter] = useState(0)
  const [selectedProject, setSelectedProject] = useState(0)
  const selectedProjectLink = projects[selectedProject]?.live_url || projects[selectedProject]?.source_url
  const chooseProject = (index: number, artifact?: HTMLElement) => {
    setSelectedProject(index)
    const image = artifact?.querySelector<HTMLElement>('img, [data-layered-artwork]')
    if (image && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.fromTo(image, { scale: 0.72, rotateZ: -9, rotateX: 12 }, { scale: 1.08, rotateZ: 0, rotateX: 0, duration: 1.15, ease: 'elastic.out(1, 0.34)', overwrite: true })
      const shards = artifact?.querySelectorAll<HTMLElement>('[data-shard]')
      if (shards?.length) gsap.fromTo(shards, { scale: 0.5, opacity: 0.3 }, { scale: 1.25, opacity: 1, duration: 0.85, stagger: 0.055, ease: 'back.out(2)', overwrite: true })
    }
  }

  const moveArtifact = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const artifact = event.currentTarget
    const bounds = artifact.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width - 0.5
    const y = (event.clientY - bounds.top) / bounds.height - 0.5
    const image = artifact.querySelector<HTMLElement>('img, [data-layered-artwork]')
    if (image) gsap.to(image, { x: x * 18, y: y * 14, scale: 1.12, rotateY: x * 18, rotateX: -y * 13, rotateZ: x * 2.5, duration: 0.65, ease: 'power3.out', transformPerspective: 850, overwrite: true })
    const shards = artifact.querySelectorAll<HTMLElement>('[data-shard]')
    if (shards.length) gsap.to(shards, { x: (i) => x * (16 + i * 5), y: (i) => y * (12 + i * 4), rotateZ: (i) => (i % 2 ? 1 : -1) * (12 + Math.abs(x) * 22), duration: 0.7, ease: 'power3.out', overwrite: true })
  }

  const resetArtifact = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const artifact = event.currentTarget
    const image = artifact.querySelector<HTMLElement>('img, [data-layered-artwork]')
    if (image) gsap.to(image, { x: 0, y: 0, scale: 1, rotateX: 0, rotateY: 0, rotateZ: 0, duration: 1, ease: 'elastic.out(1, 0.6)', overwrite: true })
    const shards = artifact.querySelectorAll<HTMLElement>('[data-shard]')
    if (shards.length) gsap.to(shards, { x: 0, y: 0, rotateZ: 0, scale: 1, duration: 0.95, ease: 'elastic.out(1, 0.65)', overwrite: true })
  }

  const startCrystalDrift = () => {
    const shards = signatureRef.current?.querySelectorAll<SVGGElement>('[data-shard]')
    if (!shards?.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    driftTweens.current = Array.from(shards, (shard, index) => gsap.to(shard, {
      y: index % 2 ? -8 : 7,
      rotation: index % 2 ? -2.5 : 3,
      duration: 3.3 + index * 0.65,
      repeat: -1,
      yoyo: true,
      delay: index * 0.3,
      ease: 'sine.inOut',
    }))
  }

  const pauseCrystalDrift = () => {
    driftTweens.current.forEach((tween) => tween.pause())
  }

  const moveCrystals = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width - 0.5
    const y = (event.clientY - bounds.top) / bounds.height - 0.5
    const shards = signatureRef.current?.querySelectorAll<SVGGElement>('[data-shard]')
    if (!shards?.length) return
    pauseCrystalDrift()
    gsap.to(shards, {
      x: (index) => x * (16 + index * 5),
      y: (index) => y * (13 + index * 4),
      rotation: (index) => (index % 2 ? -1 : 1) * (7 + Math.abs(x) * 12),
      scale: (index) => 1.035 + index * 0.018,
      duration: 0.55,
      ease: 'power3.out',
      overwrite: 'auto',
    })
  }

  const settleCrystals = () => {
    const shards = signatureRef.current?.querySelectorAll<SVGGElement>('[data-shard]')
    if (!shards?.length) return
    gsap.to(shards, {
      x: 0, y: 0, rotation: 0, scale: 1,
      duration: 0.7,
      ease: 'power3.out',
      overwrite: 'auto',
      onComplete: () => {
        driftTweens.current.forEach((tween) => tween.resume())
        if (!driftTweens.current.length) startCrystalDrift()
      },
    })
  }

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const sections = chapters.map(({ id }) => document.getElementById(id)).filter((section): section is HTMLElement => Boolean(section))
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setActiveChapter(sections.indexOf(visible.target as HTMLElement))
    }, { rootMargin: '-22% 0px -38% 0px', threshold: [0.12, 0.3, 0.55] })
    sections.forEach(section => observer.observe(section))

    gsap.registerPlugin(ScrollTrigger)
    const context = gsap.context(() => {
      startCrystalDrift()
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
        gsap.fromTo(element, { y: 34 }, {
          y: 0, duration: 1.05, ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 82%', once: true },
        })
      })
      gsap.utils.toArray<HTMLElement>('[data-artifact]').forEach((element, index) => {
        const artwork = element.querySelector<HTMLElement>('[data-artwork]')
        if (artwork) gsap.fromTo(artwork, { y: 52, scale: 0.78, rotationY: index % 2 ? 14 : -14, autoAlpha: 0 }, {
          y: 0, scale: 1, rotationY: 0, autoAlpha: 1, duration: reducedMotion ? 0 : 1.35, delay: reducedMotion ? 0 : index * 0.12, ease: 'power4.out',
          scrollTrigger: { trigger: element, start: 'top 87%', once: true },
        })
        if (!reducedMotion) element.querySelectorAll<HTMLElement>('[data-shard]').forEach((shard, shardIndex) => {
          gsap.fromTo(shard, { y: 20, scale: 0.4, autoAlpha: 0 }, { y: -8 - shardIndex * 2, scale: 1, autoAlpha: 0.95, duration: 2.3 + shardIndex * 0.3, delay: index * 0.16 + shardIndex * 0.12, repeat: -1, yoyo: true, ease: 'sine.inOut' })
        })
      })
    }, journeyRef)
    return () => { observer.disconnect(); context.revert() }
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
          <a href="#work">Selected work</a>
          <a href="#about">About</a>
          <a className={styles.navContact} href="#contact">Let’s talk <span>↗</span></a>
        </nav>
      </header>

      <aside className={styles.progress} aria-label="Page sections">
        {chapters.map((chapter, index) => (
          <a key={chapter.id} className={index === activeChapter ? styles.progressActive : ''} href={`#${chapter.id}`} aria-label={chapter.label} aria-current={index === activeChapter ? 'location' : undefined}>
            <span />
          </a>
        ))}
        <small>0{activeChapter + 1}<i> / 04</i></small>
      </aside>

      <div className={styles.journey} ref={journeyRef} id="main-content">
        <section className={`${styles.chapter} ${styles.hero}`} id="top" aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span className={styles.statusDot} /> INDEPENDENT WEB DEVELOPER + DESIGNER</p>
            <h1 id="hero-title"><span className={styles.heroFirstLine}>Make the web</span><br /><em>feel alive.</em></h1>
            <p className={styles.lede}>I’m Edwin. I bring ambitious ideas to life through expressive websites, thoughtful products, and details people remember.</p>
            <div className={styles.actions}>
              <a className={styles.primaryButton} href="#work">Explore selected work <span>↓</span></a>
              <span className={styles.location}><i /> AVAILABLE FOR SELECT PROJECTS</span>
            </div>
          </div>
          <div className={styles.sceneLabel}><span>01 / THE ATELIER</span><i /> A WORLD IN MOTION</div>
          <div className={styles.scrollCue}><span>SCROLL TO EXPLORE</span><b /></div>
        </section>

        <section className={`${styles.chapter} ${styles.work}`} id="work" aria-labelledby="work-title">
          <div className={styles.workScene}>
            <div className={styles.workCopy} data-reveal>
              <p className={styles.eyebrow}>02 / SELECTED WORK</p>
              <h2 id="work-title">Ideas made<br /><em>tangible.</em></h2>
              <a className={styles.workLink} href={selectedProjectLink || '#contact'} target={selectedProjectLink ? '_blank' : undefined} rel={selectedProjectLink ? 'noreferrer' : undefined}><span aria-hidden="true" /> VIEW PROJECT <i /></a>
            </div>
            <div className={styles.artifactStage} role="group" aria-label="Three floating project sculptures">
              {projects.slice(0, 3).map((project, index) => (
                <article className={`${styles.artifact} ${selectedProject === index ? styles.artifactSelected : ''}`} key={project.id} data-artifact>
                  <button className={styles.artifactButton} type="button" onClick={(event) => chooseProject(index, event.currentTarget)} onPointerMove={moveArtifact} onPointerLeave={resetArtifact} aria-label={`Select ${project.title}`} aria-pressed={selectedProject === index}>
                    <span className={`${styles.artifactOrbit} ${styles[`artifactOrbit${index + 1}`]}`} />
                    <span className={styles.artifactAura} />
                    <span className={styles.artifactVisual} data-artwork>
                      {index === 2 ? (
                        <LayeredArtwork src={projectArtwork[index]} viewBox="0 0 1024 1536" width={1024} height={1536} id="crystal-project" cutouts={crystalSatellites} />
                      ) : index === 1 ? (
                        <LayeredArtwork src={projectArtwork[index]} viewBox="0 0 1609 977" width={1609} height={977} id="ribbon-project" cutouts={ribbonOrbs} />
                      ) : (
                        <img src={projectArtwork[index % projectArtwork.length]} alt="" loading="eager" />
                      )}
                    </span>
                    <span className={`${styles.shard} ${styles.shardA}`} data-shard />
                    <span className={`${styles.shard} ${styles.shardB}`} data-shard />
                    <span className={`${styles.shard} ${styles.shardC}`} data-shard />
                    <span className={`${styles.shard} ${styles.shardD}`} data-shard />
                  </button>
                  <div className={styles.artifactCaption}>
                    <p><span>0{index + 1}</span> / {project.category}</p>
                    <h3>{project.title}</h3>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className={styles.sceneLabel}><span>02 / INTERACTIVE PROJECTS</span><i /> MOVE THROUGH THE OBJECTS</div>
        </section>

        <section className={`${styles.chapter} ${styles.about}`} id="about" aria-labelledby="about-title">
          <div className={styles.aboutCopy} data-reveal>
            <p className={styles.eyebrow}>A LITTLE ABOUT HOW I WORK</p>
            <h2 id="about-title">Design eye.<br /><em>Developer hands.</em></h2>
            <p className={styles.aboutBody}>I work across the whole experience: shaping the idea, designing the interface, and building the system behind it. The best details happen when all three speak the same language.</p>
            <div className={styles.skills}><span>WEB DEVELOPMENT</span><span>INTERFACE DESIGN</span><span>CREATIVE TECHNOLOGY</span><span>AI EXPERIENCES</span></div>
          </div>
          <div className={styles.aboutSignature} ref={signatureRef} aria-hidden="true" onPointerEnter={pauseCrystalDrift} onPointerMove={moveCrystals} onPointerLeave={settleCrystals}>
            <LayeredArtwork src={edwinSculptureUrl} viewBox="0 0 1215 1295" width={1215} height={1295} id="edwin-signature" cutouts={edwinCrystals} />
            <i>EST. WITH INTENT</i>
          </div>
          <div className={styles.sceneLabel}><span>03 / THE MAKER</span><i /> MALAYSIA · EVERYWHERE</div>
        </section>

        <section className={`${styles.chapter} ${styles.contact}`} id="contact" aria-labelledby="contact-title">
          <div className={styles.contactWorld} aria-hidden="true" style={{ backgroundImage: `url(${contactEnvironmentUrl})` }} />
          <div className={styles.contactCopy} data-reveal>
            <p className={styles.eyebrow}><span className={styles.statusDot} /> HAVE A GOOD ONE IN MIND?</p>
            <h2 id="contact-title">Let’s make<br /><em>it happen.</em></h2>
            <p>One good conversation can change the shape of a project.</p>
            <a className={styles.primaryButton} href="https://zhiyuantech.ai" target="_blank" rel="noreferrer">Start a conversation <span>↗</span></a>
          </div>
          <div className={styles.sceneLabel}><span>04 / WHAT’S NEXT</span><i /> YOUR MOVE</div>
          <footer className={styles.footer}><a className={styles.footerBrand} href="#top">EDWIN<span>INDEPENDENT BY DESIGN</span></a><span>© 2026 · MADE WITH INTENT</span><a href="https://zhiyuantech.ai" target="_blank" rel="noreferrer">ZHIYUANTECH.AI ↗</a></footer>
        </section>
      </div>
    </main>
  )
}
