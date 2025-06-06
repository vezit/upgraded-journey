export type VaultCategory = 'personal' | 'organization'

export function filterVaultByCategory(vault: any, category: VaultCategory) {
  const familyOrgIds = new Set<string>()
  if (category === 'personal') {
    const orgs = (vault.organizations || []) as any[]
    orgs.forEach(org => {
      if (typeof org.name === 'string' && /family/i.test(org.name)) {
        familyOrgIds.add(org.id)
      }
    })
  }

  const items = (vault.items || []).filter((i: any) => {
    const hasOrg = Boolean(i.organizationId)
    const inFamily = i.organizationId && familyOrgIds.has(i.organizationId)
    return category === 'personal' ? !hasOrg || inFamily : hasOrg && !inFamily
  })
  const folderIds = new Set(items.map((i: any) => i.folderId).filter(Boolean))
  const folders = (vault.folders || []).filter((f: any) => folderIds.has(f.id))
  return { ...vault, items, folders }
}

export type VaultName = 'My Vault' | 'Family' | '2favault'

export function filterVaultByName(vault: any, name: VaultName) {
  let items: any[] = []
  if (name === '2favault') {
    items = (vault.items || []).filter(
      (i: any) => i.folderId === '2favault.reipur.dk',
    )
  } else {
    const needle = name === 'Family' ? 'Family (organization)' : name
    items = (vault.items || []).filter((i: any) => i.vault === needle)
  }
  const folderIds = new Set(items.map((i: any) => i.folderId).filter(Boolean))
  const folders = (vault.folders || []).filter((f: any) => folderIds.has(f.id))
  const orgIds = new Set(items.map((i: any) => i.organizationId).filter(Boolean))
  const organizations = (vault.organizations || []).filter((o: any) =>
    orgIds.has(o.id),
  )
  return { ...vault, items, folders, organizations }
}
