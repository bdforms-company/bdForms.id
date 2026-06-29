import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/create', '/auth/', '/api/'],
      }
    ],
    sitemap: 'https://www.bdforms.id/sitemap.xml',
  }
}