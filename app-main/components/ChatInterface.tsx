'use client'
import { useEffect, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { useVault } from '@/contexts/VaultStore'
import { useGraph } from '@/contexts/GraphStore'
import { parseVault } from '@/lib/parseVault'
import * as storage from '@/lib/storage'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

const STORAGE_KEY = 'openai-api-key'
const MODEL_KEY = 'openai-model'
const MODELS = ['gpt-3.5-turbo', 'gpt-4o', 'gpt-4-turbo'] as const

// -----------------------------------------------------------------------------
// 🧭  System prompt describing mapping rules
// -----------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are a helpful assistant that guides users in mapping two-factor authentication (2FA) and recovery relationships between Bitwarden items.

Always begin by asking whether the user has a Bitwarden or Vaultwarden account. If they do, guide them through importing their vault. If they don't, wait until the mapping is complete and then explain how to create a Bitwarden account (vault.reipur.dk is recommended).

When the user provides the name of a service and an email address, automatically use the create_item function to add it to the vault before continuing the conversation.

If no URL is specified for the service, infer a sensible default from the name
(for example "instagram.com" for "Instagram").

Each item has a custom field “vaultdiagram-id” that uniquely identifies it. Relationships are stored in two JSON based fields:
  • “vaultdiagram-recovery-map” with optional “recovers” and “recovered_by” arrays of vaultdiagram-id values.
  • “vaultdiagram-2fa-map” with a “providers” array referencing vaultdiagram-id values of recovery methods.

Inform the user that nodes can be marked as lost using the “Lost Access” option. When something like a phone providing 2FA is lost, help identify which services are affected and remind the user to store their 2FA recovery codes in a separate vault such as https://2favault.reipur.dk.

When helping the user, explain how to create or edit these fields so the application can automatically create edges between items. Never request or store passwords or other sensitive secrets.`

// -----------------------------------------------------------------------------
// 👋  Initial assistant prompt shown to new users
// -----------------------------------------------------------------------------
const WELCOME_PROMPT =
  'Do you use a password manager like Bitwarden or Vaultwarden? If so, I can help you import your vault. If not, we will create an account on Bitwarden (or vault.reipur.dk) after we finish diagramming. Which service would you like to map first and what is the associated email?'

// -----------------------------------------------------------------------------
// 🔖  Price labels + Tailwind colour classes
// -----------------------------------------------------------------------------
const PRICE_LABELS: Record<(typeof MODELS)[number], { label: string; color: string }> = {
  'gpt-3.5-turbo': { label: 'costleast',  color: 'text-green-600'  },
  'gpt-4o':        { label: 'costing',    color: 'text-yellow-600' },
  'gpt-4-turbo':   { label: 'costiest',   color: 'text-red-600'    }, // ⇠ most expensive
}

type Props = { onClose?: () => void }

export default function ChatInterface({ onClose }: Props) {
  const [apiKey, setApiKey]   = useState('')
  const [model, setModel]     = useState<(typeof MODELS)[number]>('gpt-4o')
  const [input, setInput]     = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'assistant', content: WELCOME_PROMPT },
  ])
  const [isTyping, setIsTyping] = useState(false)

  // ---------------------------------------------------------------------------
  // 🔄  Load stored API‑key / model on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const storedKey   = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : ''
    const storedModel = typeof localStorage !== 'undefined' ? localStorage.getItem(MODEL_KEY)   : ''

    if (storedKey)   setApiKey(storedKey)
    if (storedModel && MODELS.includes(storedModel as (typeof MODELS)[number])) {
      setModel(storedModel as (typeof MODELS)[number])
    }
  }, [])

  const saveKey = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, apiKey)
      localStorage.setItem(MODEL_KEY, model)
    }
  }

  // Persist key/model when they change so they survive page reloads
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      if (apiKey) localStorage.setItem(STORAGE_KEY, apiKey)
      if (model) localStorage.setItem(MODEL_KEY, model)
    }
  }, [apiKey, model])

  const deleteKey = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(MODEL_KEY)
    }
    setApiKey('')
    setModel('gpt-4o')
    setMessages([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'assistant', content: WELCOME_PROMPT },
    ])
  }

  const { vault, setVault, addRecoverySlug, addTwofa, createItem, updateItemBySlug } = useVault()
  const { setGraph } = useGraph()

  const updateGraph = (v: any) => {
    setGraph(parseVault(v))
    storage.saveVault(JSON.stringify(v))
  }

const extractPassword = (text: string) => {
    const match = text.match(/password\s*(?:is|:|=)\s*([^\s]+)/i)
    return match ? match[1].replace(/^['"]|['"]$/g, '') : null
  }

  const stripPassword = (text: string) =>
    text.replace(/password\s*(?:is|:|=)\s*([^\s]+)/gi, 'password: [REDACTED]')

  const lastPassword = {
    current: null as string | null,
  }
  const extractTotp = (text: string) => {
    const match = text.match(/totp\s*(?:key|code)?\s*(?:is|:|=)\s*([^\s]+)/i)
    return match ? match[1].replace(/^['"]|['"]$/g, '') : null
  }

  const stripTotp = (text: string) =>
    text.replace(/totp\s*(?:key|code)?\s*(?:is|:|=)\s*([^\s]+)/gi, 'totp: [REDACTED]')

  const lastTotp = {
    current: null as string | null,
  }

const FUNCTIONS = [

    {
      type: 'function',
      function: {
        name: 'create_item',
        description: 'Create a new item in the vault',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            slug: { type: 'string' },
            username: { type: 'string' },
            password: { type: 'string' },
            totp: { type: 'string' },
            uri: { type: 'string' },
            notes: { type: 'string' },
            isRecovery: { type: 'boolean' }
          },
          required: ['name', 'slug']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'edit_item',
        description: 'Edit a field on an existing item identified by its slug',
        parameters: {
          type: 'object',
          properties: {
            slug: { type: 'string' },
            field: { type: 'string', enum: ['name', 'username', 'password', 'totp', 'uri', 'notes'] },
            value: { type: 'string' }
          },
          required: ['slug', 'field', 'value']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'map_recovery',
        description: 'Map a recovery item to recover another item',
        parameters: {
          type: 'object',
          properties: {
            source_slug: { type: 'string' },
            target_slug: { type: 'string' }
          },
          required: ['source_slug', 'target_slug']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'map_2fa',
        description: 'Map a 2FA provider to an item',
        parameters: {
          type: 'object',
          properties: {
            service_slug: { type: 'string' },
            provider_slug: { type: 'string' }
          },
          required: ['service_slug', 'provider_slug']
        }
      }
    }
  ] as const

  const handleToolCalls = (calls: any[]) => {
    if (!vault) return
    calls.forEach((c) => {
      try {
        const { name, arguments: args } = c.function
        const data = JSON.parse(args || '{}')
        if (name === 'create_item') {
          if (!data.password && lastPassword.current) {
            data.password = lastPassword.current
          }
          if (!data.totp && lastTotp.current) {
            data.totp = lastTotp.current
          }
          createItem(data)
          lastPassword.current = null
          lastTotp.current = null
          const updated = { ...useVault.getState().vault }
          if (updated) {
            setVault(updated)
            updateGraph(updated)
          }
          const gmailItem = updated?.items?.find((i: any) =>
            /gmail/i.test(i.name),
          )
          const follow = gmailItem
            ? ` Is \"${gmailItem.name}\" the recovery for ${data.name}?`
            : ` Do you want to add a recovery method for ${data.name}?`
          setMessages((m) => [
            ...m,
            { role: 'assistant', content: `Item \"${data.name}\" added.` + follow },
          ])
        } else if (name === 'edit_item') {
          const value =
            data.field === 'password' && !data.value && lastPassword.current
              ? lastPassword.current
              : data.field === 'totp' && !data.value && lastTotp.current
              ? lastTotp.current
              : data.value
          updateItemBySlug(data.slug, data.field, value)
          if (data.field === 'password') lastPassword.current = null
          if (data.field === 'totp') lastTotp.current = null
          const updated = { ...useVault.getState().vault }
          if (updated) {
            setVault(updated)
            updateGraph(updated)
          }
        } else if (name === 'map_recovery') {
          addRecoverySlug(data.source_slug, data.target_slug)
          const updated = { ...useVault.getState().vault }
          if (updated) {
            setVault(updated)
            updateGraph(updated)
          }
        } else if (name === 'map_2fa') {
          addTwofa(data.service_slug, data.provider_slug)
          const updated = { ...useVault.getState().vault }
          if (updated) {
            setVault(updated)
            updateGraph(updated)
          }
        }
      } catch (err) {
        console.error('tool call error', err)
      }
    })
  }

  const send = async () => {
    if (!apiKey || !input.trim()) return

    lastPassword.current = extractPassword(input)
    lastTotp.current = extractTotp(input)

    const sanitized = stripTotp(stripPassword(input))
    const userMsg: Message = { role: 'user', content: sanitized }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setIsTyping(true)

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, messages: history, tools: FUNCTIONS, tool_choice: 'auto' }),
      })
      const data = await res.json()
      const msg = data.choices?.[0]?.message
      if (msg?.tool_calls) handleToolCalls(msg.tool_calls)
      const reply = msg?.content
      if (reply) setMessages((m) => [...m, { role: 'assistant', content: reply }])
    } catch (err) {
      console.error(err)
    } finally {
      setIsTyping(false)
    }
  }

  // ---------------------------------------------------------------------------
  // 🖍  Re‑usable model <select> with coloured price labels + legend
  // ---------------------------------------------------------------------------
  const ModelSelect = (
    <>
      <div className="mb-1 font-medium">Model</div>
      <select
        className="border px-2 py-1 mb-2 rounded w-full bg-white dark:bg-gray-800"
        value={model}
        onChange={(e) => {
          const m = e.target.value as (typeof MODELS)[number]
          setModel(m)
          if (typeof localStorage !== 'undefined') localStorage.setItem(MODEL_KEY, m)
        }}
      >
        {MODELS.map((m) => (
          <option key={m} value={m} className={PRICE_LABELS[m].color}>
            {m} — {PRICE_LABELS[m].label}
          </option>
        ))}
      </select>
      <div className="flex gap-3 text-sm mb-3">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-600 inline-block"></span> costleast</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-600 inline-block"></span> costing</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-600 inline-block"></span> costiest</span>
      </div>
    </>
  )

  // ---------------------------------------------------------------------------
  // 📋  Render – two states: key form vs chat view
  // ---------------------------------------------------------------------------
  if (!apiKey) {
    return (
      <div className="border rounded p-4 w-full md:w-80">
        <div className="mb-2 font-medium">Enter OpenAI API Key</div>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full border px-2 py-1 mb-2 rounded"
        />
        {ModelSelect}
        <button
          onClick={saveKey}
          className="px-3 py-1 bg-indigo-600 text-white rounded w-full"
        >
          Save Key
        </button>
      </div>
    )
  }

  return (
    <div className="border rounded p-4 w-full md:w-80 flex flex-col h-[80vh]">
      {/* Header with Delete‑key action */}
      <div className="flex justify-between items-center mb-1">
        <span className="font-medium">API Key saved</span>
        <div className="flex items-center gap-2">
          <button onClick={deleteKey} className="text-red-600 text-sm underline">Delete Key</button>
          {onClose && (
            <XMarkIcon onClick={onClose} className="h-5 w-5 cursor-pointer" />
          )}
        </div>
      </div>

      {ModelSelect}

      <div className="flex-1 overflow-y-auto mb-2 space-y-2">
        {messages.filter((m) => m.role !== 'system').map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <div className="inline-block bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded break-words">
              {m.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="text-left">
            <div className="inline-block bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
              <div className="typing-indicator">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border px-2 py-1 rounded"
          onKeyDown={(e) => {
            if (e.key === 'Enter') send()
          }}
        />
        <button onClick={send} className="px-3 py-1 bg-indigo-600 text-white rounded">
          Send
        </button>
      </div>
    </div>
  )
}
