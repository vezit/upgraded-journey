
export type TemplateName = 'corporate'

export interface VaultItem {
  id: string
  /** Bitwarden cipher type (1 = login) */
  type: number
  name: string
  folderId?: string
  login: {
    username?: string
    password?: string
    uris?: { uri: string; match: null | string }[]
  }
  fields?: { name: string; value: string; type: number }[]
}

export interface VaultData {
  items: VaultItem[]
  folders?: { id: string; name: string; parentId?: string }[]
}

const corporateTemplate: VaultData = {
    folders: [
      { id: 'personal', name: 'Corporate Template' },
    ],
    items: [
      {
        id: '5812e279-62f3-4cd6-a3b2-e01058b7c3fb',
        type: 1,
        name: 'Postman',
        folderId: 'personal',
        login: {
          username: 'john.doe@domain.com',
          password: '',
          uris: [{ uri: 'https://postman.com', match: null }],
        },
        fields: [
          {
            name: 'vaultdiagram',
            value: JSON.stringify({
              id: 'postman-c3fb',
              logoUrl: 'https://postman.com/favicon.ico',
              recoveryMap: { recovered_by: ['corporate-mail-1863'] },
              twofaMap: { providers: ['phone-pixel-7a-2b11', 'postman-2fa-1111'] },
            }),
            type: 0,
          },
        ],
      },
      {
        id: 'af4a6fe3-9213-4b0f-8d83-0bf5cf251863',
        type: 1,
        name: 'Company Mail',
        folderId: 'personal',
        login: {
          username: 'john.doe@domain.com',
          password: '',
          uris: [{ uri: 'https://mail.domain.com', match: null }],
        },
        fields: [
          {
            name: 'vaultdiagram',
            value: JSON.stringify({
              id: 'corporate-mail-1863',
              logoUrl: 'https://microsoft.com/favicon.ico',
              recoveryNode: true,
              recoveryMap: {
                recovers: ['postman-c3fb', 'microsoft-7845', 'coolify-30a1', 'vaultwarden-dev-2431'],
                recovered_by: ['phone-pixel-7a-2b11'],
              },
            }),
            type: 0,
          },
        ],
      },
      {
        id: 'a17ed712-5dcc-4b78-b9a7-9109a3567845',
        type: 1,
        name: 'Microsoft 365',
        folderId: 'personal',
        login: {
          username: 'john.doe@domain.com',
          password: '',
          uris: [{ uri: 'https://office.com', match: null }],
        },
        fields: [
          {
            name: 'vaultdiagram',
            value: JSON.stringify({
              id: 'microsoft-7845',
              logoUrl: 'https://microsoft.com/favicon.ico',
              recoveryMap: { recovered_by: ['corporate-mail-1863'] },
              twofaMap: {
                providers: ['phone-pixel-7a-2b11', 'corporate-mail-1863', 'microsoft-2fa-2222'],
              },
            }),
            type: 0,
          },
        ],
      },
      {
        id: 'f9e5bffb-7fdc-4ec0-ae19-390940c730a1',
        type: 1,
        name: 'Coolify',
        folderId: 'personal',
        login: {
          username: 'john.doe@domain.com',
          password: '',
          uris: [{ uri: 'https://coolify.io', match: null }],
        },
        fields: [
          {
            name: 'vaultdiagram',
            value: JSON.stringify({
              id: 'coolify-30a1',
              logoUrl: 'https://coolify.io/favicon.ico',
              recoveryMap: { recovered_by: ['corporate-mail-1863'] },
            }),
            type: 0,
          },
        ],
      },
      {
        id: '4a88069c-df55-404b-8421-8d9ad7092b11',
        type: 1,
        name: 'Phone Pixel 7a (+45 12345678)',
        folderId: 'personal',
        login: {
          uris: [
            { uri: 'https://www.android.com/', match: null },
            { uri: 'tel:+4512345678', match: null }
          ],
        },
        fields: [
          {
            name: 'vaultdiagram',
            value: JSON.stringify({
              id: 'phone-pixel-7a-2b11',
              recoveryNode: true,
              logoUrl: '/img/phone.svg',
              nestedDomain: '2fas.com',
              recoveryMap: { recovers: ['corporate-mail-1863'] },
            }),
            type: 0,
          },
          { name: 'phone_number', value: '+45 12345678', type: 0 },
        ],
      },
    ],
};

export function createTemplate(): VaultData {
  return JSON.parse(JSON.stringify(corporateTemplate))
}
