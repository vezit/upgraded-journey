export type TemplateName = 'mail' | 'linkedin' | 'netflix'

export interface VaultItem {
  id: string
  name: string
  login: {
    username?: string
    password?: string
    uris?: { uri: string; match: null | string }[]
  }
}

export interface VaultData {
  items: VaultItem[]
}

const templates: Record<TemplateName, VaultData> = {
  mail: {
    items: [
      {
        id: '1',
        name: 'Gmail',
        login: {
          username: 'john.doe@gmail.com',
          password: 'SuperSecret123',
          uris: [{ uri: 'https://mail.google.com', match: null }],
        },
      },
    ],
  },
  linkedin: {
    items: [
      {
        id: '2',
        name: 'LinkedIn',
        login: {
          username: 'johndoe',
          password: 'Pa$$w0rd!',
          uris: [{ uri: 'https://www.linkedin.com', match: null }],
        },
      },
    ],
  },
  netflix: {
    items: [
      {
        id: '3',
        name: 'Netflix',
        login: {
          username: 'john@doe.com',
          password: 'password123',
          uris: [{ uri: 'https://www.netflix.com', match: null }],
        },
      },
    ],
  },
}

export function createTemplate(name: TemplateName): VaultData {
  // deep clone to avoid accidental mutations
  return JSON.parse(JSON.stringify(templates[name]))
}
