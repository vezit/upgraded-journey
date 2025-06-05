export type VaultCategory = 'personal' | 'organization'

export function filterVaultByCategory(vault: any, category: VaultCategory) {
  const items = (vault.items || []).filter((i: any) => {
    const hasOrg = Boolean(i.organizationId)
    return category === 'personal' ? !hasOrg : hasOrg
  })
  const folderIds = new Set(items.map((i: any) => i.folderId).filter(Boolean))
  const folders = (vault.folders || []).filter((f: any) => folderIds.has(f.id))
  return { ...vault, items, folders }
}
