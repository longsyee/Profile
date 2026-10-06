import { createFileRoute } from '@tanstack/react-router'
import { PersonalProfile } from '../components/PersonalProfile'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Edwin | Developer + Designer' },
      { name: 'description', content: 'Meet Edwin: an independent web developer and designer focused on thoughtful digital experiences.' },
    ],
  }),
  component: HomePage,
})

function HomePage() { return <PersonalProfile /> }
