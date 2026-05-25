import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Quản Lý Chi Tiêu',
    short_name: 'Chi Tiêu',
    description: 'Quản lý tài chính cá nhân thông minh',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FBFBFD',
    theme_color: '#7C4DFF',
    categories: ['finance', 'productivity'],
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
