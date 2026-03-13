import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Gym AI',
    short_name: 'Gym AI',
    description: 'Tu entrenador personal inteligente.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#39ff14',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      }
    ],
  }
}
