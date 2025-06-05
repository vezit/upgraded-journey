import { useState } from 'react'
import { useVault } from '@/contexts/VaultStore'
import { useGraph } from '@/contexts/GraphStore'
import { parseVault } from '@/lib/parseVault'
import { EyeIcon, EyeSlashIcon, PlusIcon, TrashIcon, StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'

type Props = { index: number; onClose: () => void }

export default function EditItemModal({ index, onClose }: Props) {
  const { vault, setVault } = useVault()
  if (!vault) return null
  const original = vault.items?.[index]
  if (!original) return null

  const [item, setItem] = useState<any>(() => JSON.parse(JSON.stringify(original)))
  const [showPassword, setShowPassword] = useState(false)
  const [showTotp, setShowTotp] = useState(false)
  const [newFieldType, setNewFieldType] = useState('0')

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


  const handleSave = () => {
    const items = [...vault.items]
    items[index] = item
    const updatedVault = { ...vault, items }
    setVault(updatedVault)
    setGraph(parseVault(updatedVault))
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-md shadow-md w-full max-w-xl p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-4">Edit Item</h2>
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
            <button
              type="button"
              onClick={() => {
                const items = vault.items.filter((_: any, i: number) => i !== index)
                setVault({ ...vault, items })
                onClose()
              }}
            >
              <TrashIcon className="h-6 w-6 text-red-600 hover:text-red-800" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
