'use client'
import { useEffect, useState } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STORAGE_KEY = 'openai-api-key'
const MODEL_KEY = 'openai-model'
const MODELS = ['gpt-3.5-turbo', 'gpt-4o', 'gpt-4-turbo'] as const

export default function ChatInterface() {
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState<(typeof MODELS)[number]>('gpt-3.5-turbo')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : ''
    if (stored) setApiKey(stored)
    const storedModel = typeof localStorage !== 'undefined' ? localStorage.getItem(MODEL_KEY) : ''
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
        body: JSON.stringify({
          model,
          messages: history,
        }),
      })
      const data = await res.json()
      const reply = data.choices?.[0]?.message?.content
      if (reply) {
        setMessages((m) => [...m, { role: 'assistant', content: reply }])
      }
    } catch (err) {
      console.error(err)
    }
  }

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
        <div className="mb-1 font-medium">Model</div>
        <select
          className="w-full border px-2 py-1 mb-2 rounded"
          value={model}
          onChange={(e) => setModel(e.target.value as (typeof MODELS)[number])}
        >
          {MODELS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
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
      <div className="mb-1 font-medium">Model</div>
      <select
        className="border px-2 py-1 mb-2 rounded"
        value={model}
        onChange={(e) => {
          const m = e.target.value as (typeof MODELS)[number]
          setModel(m)
          if (typeof localStorage !== 'undefined') localStorage.setItem(MODEL_KEY, m)
        }}
      >
        {MODELS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <div className="flex-1 overflow-y-auto mb-2 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === 'user' ? 'text-right' : 'text-left'}
          >
            <div className="inline-block bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
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

