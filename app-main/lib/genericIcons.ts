/**
 * Generic icons for vault items that don't have or need specific service logos
 */

export interface GenericIcon {
  id: string
  name: string
  description: string
  category: 'device' | 'auth' | 'storage' | 'network' | 'generic'
  svg: string
}

export const genericIcons: GenericIcon[] = [
  // Device icons
  {
    id: 'phone',
    name: 'Phone',
    description: 'Mobile phone or smartphone',
    category: 'device',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
    </svg>`
  },
  {
    id: 'laptop',
    name: 'Laptop',
    description: 'Laptop computer',
    category: 'device',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
    </svg>`
  },
  {
    id: 'desktop',
    name: 'Desktop',
    description: 'Desktop computer',
    category: 'device',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7l-2 3v1h8v-1l-2-3h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 12H3V4h18v10z"/>
    </svg>`
  },
  {
    id: 'tablet',
    name: 'Tablet',
    description: 'Tablet device',
    category: 'device',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 4H3c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 15H3V6h18v13z"/>
    </svg>`
  },
  {
    id: 'server',
    name: 'Server',
    description: 'Server or NAS device',
    category: 'device',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 1h16c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2zm0 8h16c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-6c0-1.1.9-2 2-2zm14-6h-2v2h2V3zm0 8h-2v2h2v-2z"/>
    </svg>`
  },
  
  // Authentication icons
  {
    id: 'authenticator',
    name: 'Authenticator',
    description: 'Two-factor authentication app',
    category: 'auth',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm3 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
    </svg>`
  },
  {
    id: '2fas',
    name: '2FAS',
    description: '2FAS authenticator app',
    category: 'auth',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 12l2 2 4-4" stroke="white" stroke-width="2" fill="none"/>
    </svg>`
  },
  {
    id: 'google-authenticator',
    name: 'Google Authenticator',
    description: 'Google Authenticator app',
    category: 'auth',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
    </svg>`
  },
  {
    id: 'authy',
    name: 'Authy',
    description: 'Authy authenticator app',
    category: 'auth',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>`
  },
  
  // Storage icons
  {
    id: 'synology',
    name: 'Synology',
    description: 'Synology NAS device',
    category: 'storage',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="4" width="18" height="3" rx="1"/>
      <rect x="3" y="9" width="18" height="3" rx="1"/>
      <rect x="3" y="14" width="18" height="3" rx="1"/>
      <circle cx="6" cy="5.5" r="0.5"/>
      <circle cx="6" cy="10.5" r="0.5"/>
      <circle cx="6" cy="15.5" r="0.5"/>
    </svg>`
  },
  {
    id: 'nas',
    name: 'NAS',
    description: 'Network Attached Storage',
    category: 'storage',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
      <circle cx="6" cy="7" r="1"/>
      <circle cx="6" cy="12" r="1"/>
      <circle cx="6" cy="17" r="1"/>
    </svg>`
  },
  {
    id: 'hard-drive',
    name: 'Hard Drive',
    description: 'External hard drive or storage device',
    category: 'storage',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/>
    </svg>`
  },
  
  // Network icons
  {
    id: 'router',
    name: 'Router',
    description: 'Network router or gateway',
    category: 'network',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 4.2C19.9 5.5 23 9.1 23 13.5c0 .8-.1 1.6-.3 2.3l-2-.7c.2-.5.3-1.1.3-1.6 0-3.1-2.1-5.6-5-6.4V4.2zM3.3 15.8c-.2-.7-.3-1.5-.3-2.3C3 9.1 6.1 5.5 10 4.2v2.9c-2.9.8-5 3.3-5 6.4 0 .5.1 1.1.3 1.6l-2 .7zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-12c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
    </svg>`
  },
  {
    id: 'firewall',
    name: 'Firewall',
    description: 'Network firewall or security appliance',
    category: 'network',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,17.4 15.4,18 14.8,18H9.2C8.6,18 8,17.4 8,16V13C8,12.4 8.6,11.5 9.2,11.5V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,10V11.5H13.5V10C13.5,8.7 12.8,8.2 12,8.2Z"/>
    </svg>`
  },
  
  // Generic icons
  {
    id: 'key',
    name: 'Key',
    description: 'Generic key or password',
    category: 'generic',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 14c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm0-4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm12.78-4.05L13.06 12.06 16 15l1.27-1.27 4.32-4.32c.39-.39.39-1.02 0-1.41-.39-.4-1.02-.4-1.41-.01zM7 12c-1.1 0-2 .9-2 2v5c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-5c0-1.1-.9-2-2-2H7z"/>
    </svg>`
  },
  {
    id: 'shield',
    name: 'Shield',
    description: 'Security or protection',
    category: 'generic',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1Z"/>
    </svg>`
  },
  {
    id: 'cloud',
    name: 'Cloud',
    description: 'Cloud service or storage',
    category: 'generic',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
    </svg>`
  },
  {
    id: 'database',
    name: 'Database',
    description: 'Database or data storage',
    category: 'generic',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>`
  },
  {
    id: 'gear',
    name: 'Settings',
    description: 'Settings or configuration',
    category: 'generic',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
    </svg>`
  }
]

export const getGenericIconById = (id: string): GenericIcon | null => {
  return genericIcons.find(icon => icon.id === id) || null
}

export const getGenericIconsByCategory = (category: GenericIcon['category']): GenericIcon[] => {
  return genericIcons.filter(icon => icon.category === category)
}

export const getAllGenericIcons = (): GenericIcon[] => {
  return genericIcons
}
