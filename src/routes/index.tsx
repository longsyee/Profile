import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { AuroraPortfolio } from '../components/AuroraPortfolio'
import { conceptProjects, type Project } from '../lib/projects'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Edwin | Developer + Designer' },
      { name: 'description', content: 'Edwin builds expressive websites and digital experiences, from first sketch to final interaction.' },
    ],
  }),
  component: HomePage,
})

function HomePage() {
  const [projects, setProjects] = useState<Project[]>(conceptProjects)

  useEffect(() => {
    let active = true
    fetch('/api/projects')
      .then((response) => response.ok ? response.json() as Promise<{ configured: boolean; projects: Project[] }> : null)
      .then((result) => {
        if (active && result) setProjects(result.configured ? result.projects : conceptProjects)
      })
      .catch(() => undefined)
    return () => { active = false }
  }, [])

  return <AuroraPortfolio projects={projects} />
}
