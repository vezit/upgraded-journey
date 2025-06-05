
export type TemplateName = 'demo'

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
          { name: 'vaultdiagram-id', value: 'facebook-c3fb', type: 0 },
          { name: 'vaultdiagram-recovery-map', value: '{"recovered_by":["gmail-1863"]}', type: 0 },
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
          { name: 'vaultdiagram-id', value: 'gmail-1863', type: 0 },
          { name: 'recovery_node', value: 'true', type: 0 },
          { name: 'vaultdiagram-recovery-map', value: '{"recovers":["facebook-c3fb","linkedin-7845","netflix-30a1","vaultwarden-dev-2431"],"recovered_by":["phone-pixel-7a-2b11","sms-9604"]}', type: 0 },
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
          { name: 'vaultdiagram-id', value: 'linkedin-7845', type: 0 },
          { name: 'vaultdiagram-recovery-map', value: '{"recovered_by":["gmail-1863"]}', type: 0 },
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
          { name: 'vaultdiagram-id', value: 'netflix-30a1', type: 0 },
          { name: 'vaultdiagram-recovery-map', value: '{"recovered_by":["gmail-1863"]}', type: 0 },
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
          { name: 'vaultdiagram-id', value: 'phone-pixel-7a-2b11', type: 0 },
          { name: 'recovery_node', value: 'true', type: 0 },
          { name: 'vaultdiagram-logo-url', value: '/img/phone.svg', type: 0 },
          { name: 'vaultdiagram-nested-domain', value: '2fas.com', type: 0 },
          { name: 'vaultdiagram-recovery-map', value: '{"recovers":["gmail-1863"]}', type: 0 },
        ],
      },
      {
        id: '01c1349c-35c0-4c54-ae82-42df42a5786b',
        type: 1,
        name: '+45 26129604',
        login: {
          uris: [{ uri: 'tel:+4526129604', match: null }],
        },
        fields: [
          { name: 'vaultdiagram-id', value: 'sms-9604', type: 0 },
          { name: 'recovery_node', value: 'true', type: 0 },
          { name: 'vaultdiagram-logo-url', value: '/img/phone.svg', type: 0 },
          { name: 'vaultdiagram-recovery-map', value: '{"recovers":["gmail-1863"]}', type: 0 },
        ],
      },
      {
        id: '5bdd19e4-9973-41a5-9b5f-08e54ec42431',
        type: 1,
        name: 'Vaultwarden Dev',
        login: {
          username: 'victor@reipur.dk',
          password: 'Disarray8-Unified-Abdomen',
          uris: [{ uri: 'https://vault.reipur.dk', match: null }],
        },
        fields: [
          { name: 'vaultdiagram-id', value: 'vaultwarden-dev-2431', type: 0 },
          { name: 'vaultdiagram-recovery-map', value: '{"recovered_by":["gmail-1863"]}', type: 0 },
        ],
      },
    ],
  },
}

export function createTemplate(name: TemplateName): VaultData {
  // deep clone to avoid accidental mutations
  return JSON.parse(JSON.stringify(templates[name]))
}
