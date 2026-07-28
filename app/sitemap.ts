import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://www.bdforms.id', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://www.bdforms.id/pricing', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://www.bdforms.id/auth/login', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    { url: 'https://www.bdforms.id/auth/signup', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
  ]
}