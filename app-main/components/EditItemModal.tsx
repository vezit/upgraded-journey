import { useState } from 'react'
import { useVault } from '@/contexts/VaultStore'
import { useGraph } from '@/contexts/GraphStore'
import { parseVault } from '@/lib/parseVault'
import * as storage from '@/lib/storage'
import {
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  TrashIcon,
  StarIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'

type Props = { index?: number; onClose: () => void }

export default function EditItemModal({ index, onClose }: Props) {
  const { vault, setVault } = useVault()
  if (!vault) return null

  const original =
    index !== undefined && index > -1 ? vault.items?.[index] : null

  const [item, setItem] = useState<any>(() =>
    original
      ? JSON.parse(JSON.stringify(original))
      : {
          id: (crypto as any).randomUUID(),
          type: 1,
          name: '',
          login: {},
          fields: [],
        }
  )
  const [showPassword, setShowPassword] = useState(false)
  const [showTotp, setShowTotp] = useState(false)
  const [newFieldType, setNewFieldType] = useState('0')
  const [mapTarget, setMapTarget] = useState('')
  const [twofaTarget, setTwofaTarget] = useState('')

  const updateItemState = (partial: any) =>
    setItem((prev: any) => ({ ...prev, ...partial }))

  const isRecovery = item.fields?.some(
    (f: any) => f.name === 'recovery_node' && String(f.value).toLowerCase() === 'true'
  )

  const toggleRecovery = () => {
    const fields = [...(item.fields || [])]
    const idx = fields.findIndex((f) => f.name === 'recovery_node')
    if (idx > -1) fields.splice(idx, 1)
    else fields.push({ name: 'recovery_node', value: 'true', type: 0 })
    updateItemState({ fields })
  }

  const { setGraph } = useGraph()

  const recoveryItems = vault.items.filter((it: any) =>
    it.fields?.some(
      (f: any) => f.name === 'recovery_node' && String(f.value).toLowerCase() === 'true'
    )
  )

  const slugFor = (id: string) =>
    vault.items
      .find((it: any) => String(it.id) === id)?.fields?.find((f: any) => f.name === 'vaultdiagram-id')
      ?.value

  const nameForSlug = (slug: string) =>
    vault.items.find((it: any) =>
      it.fields?.some((f: any) => f.name === 'vaultdiagram-id' && f.value === slug)
    )?.name || slug

  const parseMapField = (name: string, key: string): string[] => {
    const fld = item.fields?.find((f: any) => f.name === name)?.value
    if (!fld) return []
    try {
      const m = JSON.parse(fld)
      return Array.isArray(m[key]) ? m[key] : []
    } catch {
      return []
    }
  }

  const updateMapField = (name: string, key: string, values: string[]) => {
    let field = item.fields?.find((f: any) => f.name === name)
    if (!field) {
      field = { name, value: '{}', type: 0 }
      updateItemState({ fields: [...(item.fields || []), field] })
    }
    try {
      const map = JSON.parse(field.value || '{}')
      map[key] = values
      field.value = JSON.stringify(map)
      updateItemState({ fields: [...(item.fields || [])] })
    } catch {
      field.value = JSON.stringify({ [key]: values })
      updateItemState({ fields: [...(item.fields || [])] })
    }
  }

  const recoveredBy = parseMapField('vaultdiagram-recovery-map', 'recovered_by')
  const providers = parseMapField('vaultdiagram-2fa-map', 'providers')


  const handleSave = () => {
    const items = [...vault.items]
    if (index !== undefined && index > -1) {
      items[index] = item
    } else {
      items.push(item)
    }
    const updatedVault = { ...vault, items }
    setVault(updatedVault)
    setGraph(parseVault(updatedVault))
    storage.saveVault(JSON.stringify(updatedVault))
    onClose()
  }

  const addUri = () => {
    const uris = item.login?.uris ? [...item.login.uris, { uri: '', match: null }] : [{ uri: '', match: null }]
    updateItemState({ login: { ...item.login, uris } })
  }

  const removeUri = (idx: number) => {
    const uris = item.login?.uris?.filter((_: any, i: number) => i !== idx) || []
    updateItemState({ login: { ...item.login, uris } })
  }

  const addField = () => {
    const typeNum = Number(newFieldType)
    const newField = { name: '', value: typeNum === 2 ? false : '', type: typeNum }
    updateItemState({ fields: [...(item.fields || []), newField] })
  }

  const removeField = (idx: number) => {
    const fields = item.fields?.filter((_: any, i: number) => i !== idx) || []
    updateItemState({ fields })
  }

  const addRecoveryMap = () => {
    if (!mapTarget) return
    const slug = slugFor(mapTarget)
    if (!slug) return
    if (!recoveredBy.includes(slug)) {
      updateMapField('vaultdiagram-recovery-map', 'recovered_by', [...recoveredBy, slug])
    }
    setMapTarget('')
  }

  const addTwofaMap = () => {
    if (!twofaTarget) return
    const slug = slugFor(twofaTarget)
    if (!slug) return
    if (!providers.includes(slug)) {
      updateMapField('vaultdiagram-2fa-map', 'providers', [...providers, slug])
    }
    setTwofaTarget('')
  }

  const removeRecoveryMap = (slug: string) => {
    const filtered = recoveredBy.filter((s) => s !== slug)
    updateMapField('vaultdiagram-recovery-map', 'recovered_by', filtered)
  }

  const removeTwofaMap = (slug: string) => {
    const filtered = providers.filter((s) => s !== slug)
    updateMapField('vaultdiagram-2fa-map', 'providers', filtered)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-md shadow-md w-full max-w-xl p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-4">
          {index !== undefined && index > -1 ? 'Edit Item' : 'New Item'}
        </h2>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Name</label>
              <input
                type="text"
                value={item.name || ''}
                onChange={e => updateItemState({ name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Folder</label>
              <input
                type="text"
                value={item.folderId || ''}
                onChange={e => updateItemState({ folderId: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Username</label>
              <input
                type="text"
                value={item.login?.username || ''}
                onChange={e => updateItemState({ login: { ...item.login, username: e.target.value } })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={item.login?.password || ''}
                  onChange={e => updateItemState({ login: { ...item.login, password: e.target.value } })}
                  className="w-full pr-10 border border-gray-300 rounded-md px-3 py-2"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Authenticator Key (TOTP)</label>
            <div className="relative">
              <input
                type={showTotp ? 'text' : 'password'}
                value={item.login?.totp || ''}
                onChange={e => updateItemState({ login: { ...item.login, totp: e.target.value } })}
                className="w-full pr-10 border border-gray-300 rounded-md px-3 py-2"
              />
              <button
                type="button"
                onClick={() => setShowTotp(v => !v)}
                className="absolute inset-y-0 right-0 px-3 flex items-center"
              >
                {showTotp ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-600" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URIs</label>
            {(item.login?.uris || []).map((u: any, idx: number) => (
              <div key={idx} className="flex items-center space-x-2 mb-2">
                <input
                  type="url"
                  placeholder={`URI ${idx + 1}`}
                  value={u.uri}
                  onChange={e => {
                    const uris = [...item.login.uris]
                    uris[idx].uri = e.target.value
                    updateItemState({ login: { ...item.login, uris } })
                  }}
                  className="flex-1 border border-gray-300 rounded-md px-2 py-1"
                />
                <select
                  value={u.match || ''}
                  onChange={e => {
                    const uris = [...item.login.uris]
                    uris[idx].match = e.target.value || null
                    updateItemState({ login: { ...item.login, uris } })
                  }}
                  className="border border-gray-300 rounded-md px-2 py-1"
                >
                  <option value="">Default</option>
                  <option value="baseDomain">Base Domain</option>
                  <option value="host">Host</option>
                  <option value="startsWith">Starts With</option>
                  <option value="exact">Exact</option>
                  <option value="regex">Regex</option>
                </select>
                <button type="button" onClick={() => removeUri(idx)}>
                  <TrashIcon className="h-5 w-5 text-red-600" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addUri} className="text-blue-600 hover:underline mt-1">
              + New URI
            </button>
          </div>
          <div>
            <label className="block text-sm mb-1">Notes</label>
            <textarea
              value={item.notes || ''}
              onChange={e => updateItemState({ notes: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              rows={4}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="recovery-method"
              type="checkbox"
              checked={isRecovery}
              onChange={toggleRecovery}
              className="h-4 w-4"
            />
          <label htmlFor="recovery-method" className="text-sm">
            Recovery Method
          </label>
        </div>
        {!isRecovery && (
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium mb-1">Recovery Items</label>
              {recoveredBy.map((slug) => (
                <div key={slug} className="flex items-center gap-2 mb-1">
                  <span className="flex-1 text-sm">{nameForSlug(slug)}</span>
                  <button type="button" onClick={() => removeRecoveryMap(slug)}>
                    <TrashIcon className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <select
                  value={mapTarget}
                  onChange={(e) => setMapTarget(e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1 flex-1"
                >
                  <option value="">Select item…</option>
                  {recoveryItems.map((ri: any) => (
                    <option key={ri.id} value={ri.id}>
                      {ri.name}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={addRecoveryMap} className="p-1 bg-gray-100 rounded hover:bg-gray-200">
                  Add
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">2FA Providers</label>
              {providers.map((slug) => (
                <div key={slug} className="flex items-center gap-2 mb-1">
                  <span className="flex-1 text-sm">{nameForSlug(slug)}</span>
                  <button type="button" onClick={() => removeTwofaMap(slug)}>
                    <TrashIcon className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <select
                  value={twofaTarget}
                  onChange={(e) => setTwofaTarget(e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1 flex-1"
                >
                  <option value="">Select item…</option>
                  {recoveryItems.map((ri: any) => (
                    <option key={ri.id} value={ri.id}>
                      {ri.name}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={addTwofaMap} className="p-1 bg-gray-100 rounded hover:bg-gray-200">
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-2">Custom Fields</label>
            <div className="flex items-center space-x-2 mb-2">
              <select
                value={newFieldType}
                onChange={e => setNewFieldType(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1"
              >
                <option value="0">Text</option>
                <option value="1">Hidden</option>
                <option value="2">Boolean</option>
              </select>
              <button type="button" onClick={addField} className="p-1 bg-gray-100 rounded hover:bg-gray-200">
                <PlusIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            {(item.fields || []).map((f: any, idx: number) => (
              <div key={idx} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  placeholder="Field name"
                  value={f.name}
                  onChange={e => {
                    const fields = [...item.fields]
                    fields[idx].name = e.target.value
                    updateItemState({ fields })
                  }}
                  className="border border-gray-300 rounded-md px-2 py-1"
                />
                {f.type === 2 ? (
                  <input
                    type="checkbox"
                    checked={!!f.value}
                    onChange={e => {
                      const fields = [...item.fields]
                      fields[idx].value = e.target.checked
                      updateItemState({ fields })
                    }}
                    className="h-4 w-4"
                  />
                ) : f.type === 1 ? (
                  <div className="relative flex-1">
                    <input
                      type={f.show ? 'text' : 'password'}
                      value={f.value}
                      onChange={e => {
                        const fields = [...item.fields]
                        fields[idx].value = e.target.value
                        updateItemState({ fields })
                      }}
                      className="w-full pr-8 border border-gray-300 rounded-md px-2 py-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const fields = [...item.fields]
                        fields[idx].show = !fields[idx].show
                        updateItemState({ fields })
                      }}
                      className="absolute inset-y-0 right-0 flex items-center pr-2"
                    >
                      {f.show ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-600" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-600" />
                      )}
                    </button>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={f.value}
                    onChange={e => {
                      const fields = [...item.fields]
                      fields[idx].value = e.target.value
                      updateItemState({ fields })
                    }}
                    className="flex-1 border border-gray-300 rounded-md px-2 py-1"
                  />
                )}
                <button type="button" onClick={() => removeField(idx)}>
                  <TrashIcon className="h-5 w-5 text-red-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div>
            <button
              type="button"
              onClick={handleSave}
              className="bg-blue-600 text-white font-medium px-4 py-2 rounded hover:bg-blue-700"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="ml-3 bg-gray-300 text-gray-800 font-medium px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => updateItemState({ favorite: !item.favorite })}
              className="mr-3"
            >
              {item.favorite ? (
                <StarSolid className="h-6 w-6 text-yellow-500" />
              ) : (
                <StarIcon className="h-6 w-6 text-gray-400" />
              )}
            </button>
            {index !== undefined && index > -1 && (
              <button
                type="button"
                onClick={() => {
                  const items = vault.items.filter((_: any, i: number) => i !== index)
                  const updated = { ...vault, items }
                  setVault(updated)
                  setGraph(parseVault(updated))
                  storage.saveVault(JSON.stringify(updated))
                  onClose()
                }}
              >
                <TrashIcon className="h-6 w-6 text-red-600 hover:text-red-800" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
