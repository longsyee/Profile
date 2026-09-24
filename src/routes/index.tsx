import { createFileRoute } from '@tanstack/react-router'
import { ScrollSequence } from '../components/ScrollSequence'
import styles from './index.module.css'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <ScrollSequence>
      <div className={styles.pageShell}>
        <main className={styles.hero} aria-labelledby="zyt-title">
          <nav className={styles.serviceStrip} aria-label="Product capabilities">
            <span>AI-POWERED WEBSITES <b>&middot;</b></span>
            <span>PRODUCT EXPERIENCES <b>&middot;</b></span>
            <span>INTELLIGENT AUTOMATION <b>&middot;</b></span>
            <span>FROM IDEA TO LAUNCH</span>
          </nav>

          <div className={styles.identity}>
            <strong>ZYT</strong>
            <span>AI web development</span>
          </div>
          <div className={styles.tagline}>
            Digital experiences.<span>Built to think ahead.</span>
          </div>
          <div className={styles.reviewLabel}>A NEW KIND OF CANVAS&nbsp; &middot; &nbsp;01 / 01</div>

          <h1 className={styles.brand} id="zyt-title">ZYT</h1>

          <div className={styles.socials} aria-label="ZYT links">
            <span className={styles.social}>
              <span className={styles.socialMark}>&#10022;</span> ZYT Studio
            </span>
            <span className={styles.social}>
              <span className={styles.socialMark}>&#9678;</span>{' '}
              <a href="https://zhiyuantech.ai">zhiyuantech.ai</a>
            </span>
          </div>

          <div className={styles.artifactNote}>
            <strong>AI WEB<br />DEVELOPMENT</strong>
            <span>STRATEGY &middot; DESIGN &middot; ENGINEERING</span>
          </div>
          <p className={styles.description}>
            We build intelligent websites and digital products that pair thoughtful design with AI&mdash;turning complex ideas into useful, distinctive experiences.
          </p>
        </main>
      </div>
    </ScrollSequence>
  )
}
