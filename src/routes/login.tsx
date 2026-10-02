import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent } from 'react'
import type { Project } from '../lib/projects'
import styles from './login.module.css'

type Draft = {
  title: string
  category: string
  description: string
  image_url: string
  live_url: string
  source_url: string
  published: boolean
  sort_order: number
}

const emptyDraft: Draft = {
  title: '',
  category: '',
  description: '',
  image_url: '',
  live_url: '',
  source_url: '',
  published: true,
  sort_order: 0,
}

export const Route = createFileRoute('/login')({
  head: () => ({ meta: [{ title: 'Private editor | Edwin' }] }),
  component: LoginPage,
})

function LoginPage() {
  const [loading, setLoading] = useState(true)
  const [configured, setConfigured] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const loadProjects = async () => {
    const response = await fetch('/api/projects?all=1')
    const data = await response.json() as { projects?: Project[]; error?: string }
    if (!response.ok) throw new Error(data.error || 'Could not load projects.')
    setProjects(data.projects ?? [])
  }

  useEffect(() => {
    let active = true
    fetch('/api/auth/session')
      .then(async (response) => {
        const data = await response.json() as { configured?: boolean; authenticated?: boolean; error?: string }
        if (!active) return
        setConfigured(Boolean(data.configured))
        setAuthenticated(Boolean(data.authenticated))
        if (!response.ok && data.error) setMessage(data.error)
        if (data.authenticated) await loadProjects()
      })
      .catch(() => { if (active) setMessage('The editor could not reach the server.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json() as { error?: string; authenticated?: boolean }
      if (!response.ok) throw new Error(data.error || 'Sign in failed.')
      setAuthenticated(Boolean(data.authenticated))
      setPassword('')
      await loadProjects()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sign in failed.')
    } finally {
      setBusy(false)
    }
  }

  const saveProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/projects', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, id: editingId }),
      })
      const data = await response.json() as { error?: string }
      if (!response.ok) throw new Error(data.error || 'Could not save the project.')
      setDraft(emptyDraft)
      setEditingId(null)
      await loadProjects()
      setMessage('Project saved.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save the project.')
    } finally {
      setBusy(false)
    }
  }

  const uploadImage = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setMessage('Uploading image…')
    try {
      const form = new FormData()
      form.set('image', file)
      const response = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await response.json() as { image_url?: string; error?: string }
      if (!response.ok || !data.image_url) throw new Error(data.error || 'Could not upload the image.')
      setDraft((current) => ({ ...current, image_url: data.image_url! }))
      setMessage('Image uploaded. Save the project to publish the card.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not upload the image.')
    } finally {
      setBusy(false)
    }
  }

  const editProject = (project: Project) => {
    const id = Number(project.id)
    if (!Number.isSafeInteger(id) || id < 1) return
    setEditingId(id)
    setDraft({
      title: project.title,
      category: project.category,
      description: project.description,
      image_url: project.image_url ?? '',
      live_url: project.live_url ?? '',
      source_url: project.source_url ?? '',
      published: project.published,
      sort_order: project.sort_order,
    })
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteProject = async (id: number | string) => {
    const projectId = Number(id)
    if (!Number.isSafeInteger(projectId) || projectId < 1 || !window.confirm('Delete this project?')) return
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: projectId }),
      })
      const data = await response.json() as { error?: string }
      if (!response.ok) throw new Error(data.error || 'Could not delete the project.')
      await loadProjects()
      if (editingId === projectId) {
        setDraft(emptyDraft)
        setEditingId(null)
      }
      setMessage('Project deleted.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not delete the project.')
    } finally {
      setBusy(false)
    }
  }

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setAuthenticated(false)
    setProjects([])
  }

  if (loading) return <main className={styles.page}><p className={styles.loading}>Opening private editor…</p></main>

  if (!authenticated) {
    return (
      <main className={styles.page}>
        <a className={styles.back} href="/">← Edwin’s portfolio</a>
        <section className={styles.loginCard} aria-labelledby="login-title">
          <p className={styles.eyebrow}>PRIVATE WORKSPACE</p>
          <h1 id="login-title">Good to see you.</h1>
          <p className={styles.intro}>Sign in to add work, update project details, and upload cover images.</p>
          {!configured ? (
            <div className={styles.setupNotice} role="status">
              <strong>Postgres is not connected yet.</strong>
              <span>Copy the example environment file, set DATABASE_URL, then create your admin account with <code>bun run admin:create</code>.</span>
            </div>
          ) : (
            <form className={styles.loginForm} onSubmit={submitLogin}>
              <label>Email<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
              <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
              <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
            </form>
          )}
          {message && <p className={styles.message} role="alert">{message}</p>}
          <p className={styles.footnote}>This editor is private and has no public sign-up.</p>
        </section>
      </main>
    )
  }

  return (
    <main className={styles.adminPage}>
      <header className={styles.adminHeader}>
        <a className={styles.back} href="/">← View portfolio</a>
        <div><span>EDWIN</span><strong>PROJECT EDITOR</strong></div>
        <button className={styles.signOut} onClick={signOut}>Sign out</button>
      </header>
      <div className={styles.adminLayout}>
        <section className={styles.editor}>
          <p className={styles.eyebrow}>{editingId ? 'EDIT PROJECT' : 'NEW PROJECT'}</p>
          <h1>{editingId ? 'Make it sharper.' : 'Put good work out there.'}</h1>
          <form onSubmit={saveProject}>
            <label>Project title<input required maxLength={120} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
            <label>Category<input required maxLength={80} placeholder="Web experience, identity, product…" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} /></label>
            <label>Short description<textarea required maxLength={1000} rows={4} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
            <label>Cover image
              <input type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={(event) => void uploadImage(event.target.files?.[0])} />
            </label>
            {draft.image_url && <img className={styles.preview} src={draft.image_url} alt="Project cover preview" />}
            <label>Live project URL<input type="url" placeholder="https://" value={draft.live_url} onChange={(event) => setDraft({ ...draft, live_url: event.target.value })} /></label>
            <label>Source URL<input type="url" placeholder="https://" value={draft.source_url} onChange={(event) => setDraft({ ...draft, source_url: event.target.value })} /></label>
            <label>Display order<input type="number" min={-9999} max={9999} value={draft.sort_order} onChange={(event) => setDraft({ ...draft, sort_order: Number(event.target.value) })} /></label>
            <label className={styles.checkbox}><input type="checkbox" checked={draft.published} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} /> Show this card on the portfolio</label>
            <div className={styles.formActions}>
              <button type="submit" disabled={busy}>{busy ? 'Saving…' : editingId ? 'Save changes' : 'Add project'}</button>
              {editingId && <button type="button" className={styles.cancel} onClick={() => { setEditingId(null); setDraft(emptyDraft) }}>Cancel</button>}
            </div>
          </form>
          {message && <p className={styles.message} role="status">{message}</p>}
        </section>

        <section className={styles.projectList} aria-labelledby="project-list-title">
          <div className={styles.listHeading}><p className={styles.eyebrow}>THE PORTFOLIO</p><h2 id="project-list-title">Projects <span>{projects.length.toString().padStart(2, '0')}</span></h2></div>
          {projects.length === 0 ? (
            <p className={styles.noProjects}>No projects yet. Add the first one and it will appear on your public page.</p>
          ) : projects.map((project) => (
            <article className={styles.projectRow} key={project.id}>
              {project.image_url ? <img src={project.image_url} alt="" /> : <span className={styles.rowArtwork} aria-hidden="true" />}
              <div className={styles.rowInfo}><strong>{project.title}</strong><span>{project.category} · {project.published ? 'Published' : 'Hidden'}</span></div>
              <button type="button" onClick={() => editProject(project)} aria-label={`Edit ${project.title}`}>Edit</button>
              <button type="button" className={styles.delete} onClick={() => void deleteProject(project.id)} aria-label={`Delete ${project.title}`}>×</button>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
