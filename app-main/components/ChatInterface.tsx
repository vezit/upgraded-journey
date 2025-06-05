'use client'
import { useEffect, useState } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STORAGE_KEY = 'openai-api-key'
const MODEL_KEY = 'openai-model'
const MODELS = ['gpt-3.5-turbo', 'gpt-4o', 'gpt-4-turbo'] as const

// -----------------------------------------------------------------------------
// 🔖  Price labels + Tailwind colour classes
// -----------------------------------------------------------------------------
const PRICE_LABELS: Record<(typeof MODELS)[number], { label: string; color: string }> = {
  'gpt-3.5-turbo': { label: 'cheapest',  color: 'text-green-600'  },
  'gpt-4o':         { label: 'cheap',     color: 'text-yellow-600' },
  'gpt-4-turbo':    { label: 'cheaplest', color: 'text-red-600'   }, // ⇠ most expensive
}

export default function ChatInterface() {
  const [apiKey, setApiKey]   = useState('')
  const [model, setModel]     = useState<(typeof MODELS)[number]>('gpt-3.5-turbo')
  const [input, setInput]     = useState('')
  const [messages, setMessages] = useState<Message[]>([])

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

  const deleteKey = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(MODEL_KEY)
    }
    setApiKey('')
    setModel('gpt-3.5-turbo')
    setMessages([])
  }

  const send = async () => {
    if (!apiKey || !input.trim()) return

    const userMsg: Message = { role: 'user', content: input }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, messages: history }),
      })
      const data  = await res.json()
      const reply = data.choices?.[0]?.message?.content
      if (reply) setMessages((m) => [...m, { role: 'assistant', content: reply }])
    } catch (err) {
      console.error(err)
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
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-600 inline-block"></span> cheapest</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-600 inline-block"></span> cheap</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-600 inline-block"></span> cheaplest</span>
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
        <button onClick={deleteKey} className="text-red-600 text-sm underline">Delete Key</button>
      </div>

      {ModelSelect}

      <div className="flex-1 overflow-y-auto mb-2 space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <div className="inline-block bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded break-words">
              {m.content}
            </div>
          </div>
        ))}
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
