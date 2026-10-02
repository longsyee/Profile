export type Project = {
  id: number | string
  title: string
  category: string
  description: string
  image_url: string | null
  live_url: string | null
  source_url: string | null
  published: boolean
  sort_order: number
  concept?: boolean
}

export const conceptProjects: Project[] = [
  {
    id: 'concept-01',
    title: 'A softer kind of software',
    category: 'PRODUCT CONCEPT',
    description: 'An interface study for making thoughtful tools feel clear, tactile, and human.',
    image_url: null,
    live_url: null,
    source_url: null,
    published: true,
    sort_order: 1,
    concept: true,
  },
  {
    id: 'concept-02',
    title: 'The scroll becomes the story',
    category: 'WEB EXPERIMENT',
    description: 'A cinematic landing page concept where movement sets the pace and the mood.',
    image_url: null,
    live_url: null,
    source_url: null,
    published: true,
    sort_order: 2,
    concept: true,
  },
  {
    id: 'concept-03',
    title: 'A signal in the noise',
    category: 'AI + IDENTITY',
    description: 'A visual direction for a creative assistant built to work alongside its maker.',
    image_url: null,
    live_url: null,
    source_url: null,
    published: true,
    sort_order: 3,
    concept: true,
  },
]
