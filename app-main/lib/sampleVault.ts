
export type TemplateName = 'personal' | 'organization'

export interface VaultItem {
  id: string
  /** Bitwarden cipher type (1 = login) */
  type: number
  name: string
  folderId?: string
  organizationId?: string
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

const templates: Record<TemplateName, VaultData> = {
  personal: {
    folders: [
      { id: 'personal', name: 'Personal' },
      { id: 'vault.reipur.dk', name: 'vault.reipur.dk', parentId: 'personal' },
      { id: 'family', name: 'Family', parentId: 'vault.reipur.dk' },
      { id: '2favault.reipur.dk', name: '2favault.reipur.dk', parentId: 'vault.reipur.dk' },
    ],
    items: [
      {
        id: '5812e279-62f3-4cd6-a3b2-e01058b7c3fb',
        type: 1,
        name: 'Facebook',
        folderId: 'vault.reipur.dk',
        login: {
          username: 'john.doe@example.com',
          password: '',
          uris: [{ uri: 'https://facebook.com', match: null }],
        },
        fields: [
          { name: 'vaultdiagram-id', value: 'facebook-c3fb', type: 0 },
          { name: 'vaultdiagram-recovery-map', value: '{"recovered_by":["gmail-1863"]}', type: 0 },
          { name: 'vaultdiagram-2fa-map', value: '{"providers":["sms-9604","facebook-2fa-1111"]}', type: 0 },
        ],
      },
      {
        id: 'af4a6fe3-9213-4b0f-8d83-0bf5cf251863',
        type: 1,
        name: 'Gmail',
        folderId: 'vault.reipur.dk',
        login: {
          username: 'john.doe@example.com',
          password: '',
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
        folderId: 'vault.reipur.dk',
        login: {
          username: 'john.doe@example.com',
          password: '',
          uris: [{ uri: 'https://linkedin.com', match: null }],
        },
        fields: [
          { name: 'vaultdiagram-id', value: 'linkedin-7845', type: 0 },
          { name: 'vaultdiagram-recovery-map', value: '{"recovered_by":["gmail-1863"]}', type: 0 },
          { name: 'vaultdiagram-2fa-map', value: '{"providers":["sms-9604","gmail-1863","phone-pixel-7a-2b11","linkedin-2fa-2222"]}', type: 0 },
        ],
      },
      {
        id: 'f9e5bffb-7fdc-4ec0-ae19-390940c730a1',
        type: 1,
        name: 'Netflix',
        folderId: 'family',
        login: {
          username: 'john.doe@example.com',
          password: '',
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
        name: '+45 12345678',
        login: {
          uris: [{ uri: 'tel:+4512345678', match: null }],
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
        folderId: 'vault.reipur.dk',
        login: {
          username: 'john.doe@example.com',
          password: '',
          uris: [{ uri: 'https://vault.example.com', match: null }],
        },
        fields: [
          { name: 'vaultdiagram-id', value: 'vaultwarden-dev-2431', type: 0 },
          { name: 'vaultdiagram-recovery-map', value: '{"recovered_by":["gmail-1863"]}', type: 0 },
        ],
      },
      {
        id: '8cf2d705-2fa1-4c0e-a111-111111111111',
        type: 1,
        name: 'Facebook 2FA',
        folderId: '2favault.reipur.dk',
        login: {},
        fields: [
          { name: 'vaultdiagram-id', value: 'facebook-2fa-1111', type: 0 },
        ],
      },
      {
        id: '9df2d705-2fa1-4c0e-a222-222222222222',
        type: 1,
        name: 'LinkedIn 2FA',
        folderId: '2favault.reipur.dk',
        login: {},
        fields: [
          { name: 'vaultdiagram-id', value: 'linkedin-2fa-2222', type: 0 },
        ],
      },
    ],
  },
  organization: {
    folders: [
      { id: 'organization', name: 'Organization' },
      { id: 'acme', name: 'Acme Corp', parentId: 'organization' },
    ],
    items: [
      {
        id: '11111111-2222-4333-8444-555555555555',
        type: 1,
        name: 'Slack',
        folderId: 'acme',
        organizationId: 'org-demo',
        login: {
          username: 'john.doe@acme.com',
          password: '',
          uris: [{ uri: 'https://slack.com', match: null }],
        },
        fields: [
          { name: 'vaultdiagram-id', value: 'slack-org', type: 0 },
          { name: 'vaultdiagram-recovery-map', value: '{"recovered_by":["yubikey-org"]}', type: 0 },
        ],
      },
      {
        id: '22222222-3333-4444-8555-666666666666',
        type: 1,
        name: 'GitHub',
        folderId: 'acme',
        organizationId: 'org-demo',
        login: {
          username: 'jdoe',
          password: '',
          uris: [{ uri: 'https://github.com', match: null }],
        },
        fields: [
          { name: 'vaultdiagram-id', value: 'github-org', type: 0 },
          { name: 'vaultdiagram-recovery-map', value: '{"recovered_by":["yubikey-org"]}', type: 0 },
        ],
      },
      {
        id: '33333333-4444-5555-8666-777777777777',
        type: 1,
        name: 'YubiKey',
        folderId: 'acme',
        organizationId: 'org-demo',
        login: {},
        fields: [
          { name: 'vaultdiagram-id', value: 'yubikey-org', type: 0 },
          { name: 'recovery_node', value: 'true', type: 0 },
        ],
      },
    ],
  },
}

export function createTemplate(name: TemplateName): VaultData {
  // deep clone to avoid accidental mutations
  return JSON.parse(JSON.stringify(templates[name]))
}
