import type { Project } from '../lib/projects'
import styles from './ProjectGallery.module.css'

export function ProjectGallery({ projects }: { projects: Project[] }) {
  const hasConcepts = projects.some((project) => project.concept)

  return (
    <section className={styles.section} id="work" aria-labelledby="work-title">
      <div className={styles.heading}>
        <p>SELECTED WORK / PERSONAL EXPERIMENTS</p>
        <h2 id="work-title">Built with a sense<br /><em>of wonder.</em></h2>
        <span>
          {hasConcepts
            ? 'Starter concepts are here until you add your own work in the private editor.'
            : 'A small selection of things made with care, curiosity, and a little bit of nerve.'}
        </span>
      </div>

      <div className={styles.grid}>
        {projects.map((project, index) => {
          const sizeClass = index === 0
            ? styles.featuredCard
            : index === 1
              ? styles.secondaryCard
              : index === 2
                ? styles.tertiaryCard
                : ''

          return (
            <article className={`${styles.card} ${sizeClass}`} key={project.id}>
              <div className={styles.artwork} data-art={index % 3}>
                {project.image_url ? (
                  <img src={project.image_url} alt={`${project.title} project`} loading="lazy" />
                ) : (
                  <div className={styles.artworkGraphic} aria-hidden="true">
                    <span className={styles.artworkOrb} />
                    <span className={styles.artworkFrame} />
                    <span className={styles.artworkLine} />
                  </div>
                )}
                {project.concept && <span className={styles.conceptTag}>CONCEPT STUDY</span>}
                <div className={styles.cardDetails}>
                  <div>
                    <p>{project.category}</p>
                    <h3>{project.title}</h3>
                    <span>{project.description}</span>
                  </div>
                  {project.live_url && (
                    <a href={project.live_url} target="_blank" rel="noreferrer" aria-label={`Visit ${project.title}`}>
                      ↗
                    </a>
                  )}
                </div>
              </div>
            </article>
          )
        })}

        {projects.length === 0 && (
          <article className={`${styles.infoTile} ${styles.emptyState}`}>
            <p>No projects are published yet.</p>
            <span>Add a project and cover image in the private editor.</span>
          </article>
        )}

        <article className={`${styles.infoTile} ${styles.practiceTile}`}>
          <p className={styles.tileEyebrow}>FROM FIRST SKETCH TO FINAL DETAIL</p>
          <h3>Design eye.<br /><em>Developer hands.</em></h3>
          <div className={styles.skillList}>
            <span>Web development</span>
            <span>Visual design</span>
            <span>Creative code</span>
          </div>
          <span className={styles.tileStar} aria-hidden="true">✳</span>
        </article>

        <a className={`${styles.infoTile} ${styles.contactTile}`} href="#contact">
          <span className={styles.tileEyebrow}>HAVE AN IDEA IN ORBIT?</span>
          <h3>Let’s bring<br />it a little closer.</h3>
          <span className={styles.tileLink}>Start a conversation <span aria-hidden="true">↗</span></span>
          <span className={styles.contactPlanet} aria-hidden="true" />
        </a>
      </div>
    </section>
  )
}
