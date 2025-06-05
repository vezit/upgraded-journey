
export type TemplateName = 'mail' | 'linkedin' | 'netflix' | 'demo'

export interface VaultItem {
  id: string
  /** Bitwarden cipher type (1 = login) */
  type: number
  name: string
  login: {
    username?: string
    password?: string
    uris?: { uri: string; match: null | string }[]
  }
  fields?: { name: string; value: string; type: number }[]
}

export interface VaultData {
  items: VaultItem[]
}

const templates: Record<TemplateName, VaultData> = {
  mail: {
    items: [
      {
        id: '1',
        type: 1,
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
        type: 1,
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
        type: 1,
        name: 'Netflix',
        login: {
          username: 'john@doe.com',
          password: 'password123',
          uris: [{ uri: 'https://www.netflix.com', match: null }],
        },
        fields: [{ name: 'recovery', value: 'af4a6fe3-9213-4b0f-8d83-0bf5cf251863', type: 0 }],
      },
    ],
  },
  demo: {
    items: [
      {
        id: '5812e279-62f3-4cd6-a3b2-e01058b7c3fb',
        type: 1,
        name: 'Facebook',
        login: {
          username: 'test@reipur.dk',
          password: 'LEhWnF75hP50CX',
          uris: [{ uri: 'https://facebook.com', match: null }],
        },
        fields: [
          { name: 'recovery', value: 'af4a6fe3-9213-4b0f-8d83-0bf5cf251863', type: 0 },
        ],
      },
      {
        id: 'af4a6fe3-9213-4b0f-8d83-0bf5cf251863',
        type: 1,
        name: 'Gmail',
        login: {
          username: 'victor@reipur.dk',
          password: 'INWkgD5Fj4xXRX',
          uris: [{ uri: 'https://gmail.com', match: null }],
        },
        fields: [
          { name: 'recovery_node', value: 'true', type: 0 },
          { name: 'recovery', value: '4a88069c-df55-404b-8421-8d9ad7092b11', type: 0 },
        ],
      },
      {
        id: 'a17ed712-5dcc-4b78-b9a7-9109a3567845',
        type: 1,
        name: 'LinkedIn',
        login: {
          username: 'test@reipur.dk',
          password: 'LEhWnF75hP50CX',
          uris: [{ uri: 'https://linkedin.com', match: null }],
        },
        fields: [
          { name: 'recovery', value: 'af4a6fe3-9213-4b0f-8d83-0bf5cf251863', type: 0 },
        ],
      },
      {
        id: 'f9e5bffb-7fdc-4ec0-ae19-390940c730a1',
        type: 1,
        name: 'Netflix',
        login: {
          username: 'test@reipur.dk',
          password: 'LEhWnF75hP50CX',
          uris: [{ uri: 'https://netflix.com', match: null }],
        },
        fields: [
          { name: 'recovery', value: 'af4a6fe3-9213-4b0f-8d83-0bf5cf251863', type: 0 },
        ],
      },
      {
        id: '4a88069c-df55-404b-8421-8d9ad7092b11',
        type: 1,
        name: 'Phone Pixel 7a',
        login: {
          uris: [{ uri: 'https://www.android.com/', match: null }],
        },
        fields: [
          { name: 'recovery_node', value: 'true', type: 0 },
          { name: 'phone number', value: '004526129604', type: 0 },
        ],
      },
      {
        id: '5bdd19e4-9973-41a5-9b5f-08e54ec42431',
        type: 1,
        name: 'Vaultwarden Dev',
        login: {
          username: 'victor@reipur.dk',
          password: 'Disarray8-Unified-Abdomen',
          uris: [{ uri: 'vault.reipur.dk', match: null }],
        },
        fields: [
          { name: 'recovery', value: 'af4a6fe3-9213-4b0f-8d83-0bf5cf251863', type: 0 },
        ],
      },
    ],
  },
}

export function createTemplate(name: TemplateName): VaultData {
  // deep clone to avoid accidental mutations
  return JSON.parse(JSON.stringify(templates[name]))
}
