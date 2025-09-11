import { useState, useEffect, useRef, useCallback } from 'react'
import { useVault } from '@/contexts/VaultStore'
import { useGraph } from '@/contexts/GraphStore'
import { parseVault } from '@/lib/parseVault'
import { genericIcons, getGenericIconById } from '@/lib/genericIcons'

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

  const initialItemRef = useRef<any>(
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

  const [item, setItem] = useState<any>(() =>
    JSON.parse(JSON.stringify(initialItemRef.current))
  )
  const [showPassword, setShowPassword] = useState(false)
  const [showTotp, setShowTotp] = useState(false)
  const [newFieldType, setNewFieldType] = useState('0')
  const [mapTarget, setMapTarget] = useState('')
  const [twofaTarget, setTwofaTarget] = useState('')
  const [showIconPicker, setShowIconPicker] = useState(false)

  const handleClose = useCallback(() => {
    const hasChanges =
      JSON.stringify(item) !== JSON.stringify(initialItemRef.current)
    if (hasChanges && !window.confirm('Discard unsaved changes?')) {
      return
    }
    onClose()
  }, [item, onClose])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleClose])

  const updateItemState = (partial: any) =>
    setItem((prev: any) => ({ ...prev, ...partial }))

  const getDiagram = () => {
    const fld = item.fields?.find((f: any) => f.name === 'vaultdiagram')?.value
    if (!fld) return {} as any
    try {
      return JSON.parse(fld)
    } catch {
      return {} as any
    }
  }

  const setDiagram = (update: (d: any) => void) => {
    const diag = getDiagram()
    update(diag)
    let fields = [...(item.fields || [])]
    const idx = fields.findIndex((f: any) => f.name === 'vaultdiagram')
    const value = JSON.stringify(diag)
    if (idx > -1) fields[idx].value = value
    else fields.push({ name: 'vaultdiagram', value, type: 0 })
    updateItemState({ fields })
  }

  const diagram = getDiagram()
  const isRecovery = !!diagram.recoveryNode

  const toggleRecovery = () => {
    setDiagram((d) => {
      d.recoveryNode = !d.recoveryNode
    })
  }

  const getCurrentGenericIcon = (): string | null => {
    return diagram.genericIcon || null
  }

  const setGenericIcon = (iconId: string | null) => {
    setDiagram((d) => {
      if (iconId) {
        d.genericIcon = iconId
      } else {
        delete d.genericIcon
      }
    })
  }

  const getCurrentIcon = () => {
    const genericIconId = getCurrentGenericIcon()
    if (genericIconId) {
      const genericIcon = getGenericIconById(genericIconId)
      if (genericIcon) {
        return {
          type: 'generic' as const,
          icon: genericIcon,
          url: null
        }
      }
    }
    
    // Fallback to logo URL if no generic icon
    const logoUrl = diagram.logoUrl
    if (logoUrl) {
      return {
        type: 'logo' as const,
        icon: null,
        url: logoUrl
      }
    }

    return null
  }

  const { setGraph } = useGraph()

  const recoveryItems = vault.items.filter((it: any) => {
    const fld = it.fields?.find((f: any) => f.name === 'vaultdiagram')?.value
    if (!fld) return false
    try {
      return !!JSON.parse(fld).recoveryNode
    } catch {
      return false
    }
  })

  const slugFor = (id: string) => {
    const fld = vault.items
      .find((it: any) => String(it.id) === id)?.fields?.find((f: any) => f.name === 'vaultdiagram')
      ?.value
    if (!fld) return undefined
    try {
      return JSON.parse(fld).id
    } catch {
      return undefined
    }
  }

  const nameForSlug = (slug: string) => {
    const it = vault.items.find((it: any) => {
      const fld = it.fields?.find((f: any) => f.name === 'vaultdiagram')?.value
      if (!fld) return false
      try {
        return JSON.parse(fld).id === slug
      } catch {
        return false
      }
    })
    return it?.name || slug
  }

  const recoveredBy: string[] = Array.isArray(diagram.recoveryMap?.recovered_by)
    ? diagram.recoveryMap.recovered_by
    : []
  const providers: string[] = Array.isArray(diagram.twofaMap?.providers)
    ? diagram.twofaMap.providers
    : []


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
      setDiagram((d) => {
        const arr = Array.isArray(d.recoveryMap?.recovered_by)
          ? d.recoveryMap.recovered_by
          : []
        d.recoveryMap = { ...(d.recoveryMap || {}), recovered_by: [...arr, slug] }
      })
    }
    setMapTarget('')
  }

  const addTwofaMap = () => {
    if (!twofaTarget) return
    const slug = slugFor(twofaTarget)
    if (!slug) return
    if (!providers.includes(slug)) {
      setDiagram((d) => {
        const arr = Array.isArray(d.twofaMap?.providers)
          ? d.twofaMap.providers
          : []
        d.twofaMap = { ...(d.twofaMap || {}), providers: [...arr, slug] }
      })
    }
    setTwofaTarget('')
  }

  const removeRecoveryMap = (slug: string) => {
    setDiagram((d) => {
      const arr = Array.isArray(d.recoveryMap?.recovered_by)
        ? d.recoveryMap.recovered_by
        : []
      d.recoveryMap = { ...(d.recoveryMap || {}), recovered_by: arr.filter((s: string) => s !== slug) }
    })
  }

  const removeTwofaMap = (slug: string) => {
    setDiagram((d) => {
      const arr = Array.isArray(d.twofaMap?.providers)
        ? d.twofaMap.providers
        : []
      d.twofaMap = { ...(d.twofaMap || {}), providers: arr.filter((s: string) => s !== slug) }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleClose}>
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
          
          {/* Icon Selection */}
          <div>
            <label className="block text-sm mb-2">Icon</label>
            <div className="flex items-center gap-3">
              {(() => {
                const currentIcon = getCurrentIcon()
                if (currentIcon?.type === 'generic') {
                  return (
                    <div 
                      className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded border text-gray-600"
                      dangerouslySetInnerHTML={{ __html: currentIcon.icon.svg }}
                    />
                  )
                } else if (currentIcon?.type === 'logo') {
                  return (
                    <img 
                      src={currentIcon.url} 
                      alt="Service logo" 
                      className="w-8 h-8 rounded border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )
                } else {
                  return (
                    <div className="w-8 h-8 bg-gray-200 rounded border flex items-center justify-center text-gray-400 text-xs">
                      ?
                    </div>
                  )
                }
              })()}
              <button
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded border"
              >
                {showIconPicker ? 'Hide Icons' : 'Choose Icon'}
              </button>
              {getCurrentGenericIcon() && (
                <button
                  type="button"
                  onClick={() => setGenericIcon(null)}
                  className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded border"
                >
                  Clear Icon
                </button>
              )}
            </div>
            
            {showIconPicker && (
              <div className="mt-3 p-3 border rounded-md bg-gray-50">
                <div className="mb-3">
                  <h4 className="text-sm font-medium mb-2">Generic Icons</h4>
                  <div className="grid grid-cols-6 gap-2">
                    {genericIcons.map((icon) => (
                      <button
                        key={icon.id}
                        type="button"
                        onClick={() => {
                          setGenericIcon(icon.id)
                          setShowIconPicker(false)
                        }}
                        className={`p-2 rounded border hover:bg-white transition-colors ${
                          getCurrentGenericIcon() === icon.id 
                            ? 'bg-blue-100 border-blue-300' 
                            : 'bg-white border-gray-200'
                        }`}
                        title={icon.description}
                      >
                        <div 
                          className="w-6 h-6 text-gray-600"
                          dangerouslySetInnerHTML={{ __html: icon.svg }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Click an icon to select it, or use "Clear Icon" to remove selection and fall back to service logo.
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isRecovery}
                onChange={toggleRecovery}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              Recovery Node
              <span className="text-gray-500 text-xs">(Can recover other accounts)</span>
            </label>
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
                  {recoveryItems
                    .filter((ri: any) => {
                      const slug = slugFor(String(ri.id))
                      return slug && !providers.includes(slug)
                    })
                    .map((ri: any) => (
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
              onClick={handleClose}
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
