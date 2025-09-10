import topSites from 'top-sites'
import { parse } from 'tldts'

export interface Service {
  name: string
  keywords: string[]
  category: string
  icon: string
  domain: string
}

const ignore = new Set([
  'googleusercontent.com',
  'wa.me',
  't.me',
  'blogspot.com',
  'youtu.be',
])

function toTitle(str: string) {
  return str.replace(/\b\w/g, (s) => s.toUpperCase())
}

function generateServices(): Service[] {
  const seen = new Set<string>()
  const services: Service[] = []

  for (const site of topSites as Array<{ rootDomain: string }>) {
    const parsed = parse(site.rootDomain)
    const domain = parsed.domain
    if (!domain || seen.has(domain) || ignore.has(domain)) continue

    seen.add(domain)
    const namePart = domain.split('.')[0]
    const name = toTitle(namePart)

    services.push({
      name,
      keywords: [name.toLowerCase()],
      category: 'Popular',
      icon: `https://logo.clearbit.com/${domain}?size=128`,
      domain,
    })

    if (services.length >= 100) break
  }

  return services
}

export const popularServices = generateServices()
