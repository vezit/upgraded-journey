'use client'
import React, { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { useVault } from '@/contexts/VaultStore'
import { useGraph } from '@/contexts/GraphStore'
import { parseVault } from '@/lib/parseVault'
import * as storage from '@/lib/storage'
import VaultItemList from '@/components/VaultItemList'
import EditItemModal from '@/components/EditItemModal'
import {
  PlusIcon,
  TrashIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline'

interface VaultItem {
  id: string
  type: number
  name: string
  login: {
    username?: string
    password?: string
    uris?: Array<{ uri: string; match?: string | null }>
  }
  fields: Array<{
    name: string
    value: any
    type: number
  }>
  notes?: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface Chat {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

const CHATS_STORAGE_KEY = 'vault-onboarding-chats'

export default function VaultOnboardingV2() {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([])
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  
  const { setVault } = useVault()
  const { setGraph } = useGraph()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load chats and vault items from localStorage
  useEffect(() => {
    try {
      // Load chats
      const savedChats = localStorage.getItem(CHATS_STORAGE_KEY)
      if (savedChats) {
        const parsedChats = JSON.parse(savedChats)
        if (Array.isArray(parsedChats)) {
          setChats(parsedChats)
          if (parsedChats.length > 0) {
            setCurrentChatId(parsedChats[0].id)
          }
        }
      }

      // Load vault items
      storage.cleanupLegacyData()
      const mainVaultData = storage.loadVault()
      if (mainVaultData && mainVaultData.items && Array.isArray(mainVaultData.items)) {
        setVaultItems(mainVaultData.items)
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error)
    }
  }, [])

  // Save chats to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats))
    } catch (error) {
      console.error('Error saving chats to localStorage:', error)
    }
  }, [chats])

  // Save vault items and sync with stores
  useEffect(() => {
    try {
      const vaultData = {
        items: vaultItems,
        folders: [],
        collections: []
      }
      storage.saveVault(JSON.stringify(vaultData))
      setVault(vaultData)
      setGraph(parseVault(vaultData))
    } catch (error) {
      console.error('Error saving vault items:', error)
    }
  }, [vaultItems, setVault, setGraph])

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chats, currentChatId])

  const getCurrentChat = () => {
    return chats.find(chat => chat.id === currentChatId) || null
  }

  const createNewChat = () => {
    const newChat: Chat = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    setChats(prev => [newChat, ...prev])
    setCurrentChatId(newChat.id)
  }

  const deleteChat = (chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId))
    if (currentChatId === chatId) {
      const remainingChats = chats.filter(chat => chat.id !== chatId)
      setCurrentChatId(remainingChats.length > 0 ? remainingChats[0].id : null)
    }
  }

  const updateChatTitle = (chatId: string, newTitle: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, title: newTitle, updatedAt: Date.now() }
        : chat
    ))
  }

  const generateVaultItemsFromText = async (text: string) => {
    try {
      const response = await fetch('/api/parse-vault', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to parse vault data')
      }

      const { data } = await response.json()
      
      if (data.items && Array.isArray(data.items)) {
        const newItems: VaultItem[] = data.items
          .filter((item: any) => 
            item.name && typeof item.name === 'string' && 
            !vaultItems.some(existing => existing.name.toLowerCase() === item.name.toLowerCase())
          )
          .map((item: any) => ({
            id: item.id || crypto.randomUUID(),
            type: 1,
            name: item.name,
            login: {
              username: item.login?.username || '',
              password: item.login?.password || '',
              uris: item.login?.uris || []
            },
            fields: item.fields || [],
            notes: 'Added from chat with AI-generated data'
          } as VaultItem))

        if (newItems.length > 0) {
          setVaultItems(prev => [...prev, ...newItems])
          return `✅ Added ${newItems.length} services to your vault: ${newItems.map(item => item.name).join(', ')}`
        }
      }
    } catch (error) {
      console.error('Error generating services from text:', error)
      return `❌ Failed to parse services: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
    return null
  }

  const sendMessage = async () => {
    if (!input.trim()) return

    let currentChat = getCurrentChat()
    if (!currentChat) {
      createNewChat()
      currentChat = chats[0] // Will be the newly created chat
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    }

    // Add user message to current chat
    setChats(prev => prev.map(chat => 
      chat.id === currentChatId 
        ? { 
            ...chat, 
            messages: [...chat.messages, userMessage],
            title: chat.title === 'New Chat' ? input.slice(0, 30) + (input.length > 30 ? '...' : '') : chat.title,
            updatedAt: Date.now()
          }
        : chat
    ))

    const inputText = input
    setInput('')
    setIsLoading(true)

    try {
      // Check if the message seems to be about extracting services
      const extractionKeywords = ['extract', 'services', 'accounts', 'logins', 'from this text', 'generate', 'create vault']
      const isExtractionRequest = extractionKeywords.some(keyword => 
        inputText.toLowerCase().includes(keyword)
      )

      let assistantContent = ''

      if (isExtractionRequest) {
        // Try to extract vault items first
        const extractionResult = await generateVaultItemsFromText(inputText)
        if (extractionResult) {
          assistantContent = extractionResult
        }
      }

      // Always get AI response as well
      const allMessages = getCurrentChat()?.messages || []
      const response = await fetch('/api/chatgpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...allMessages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      })

      const data = await response.json()

      if (response.ok && data.message) {
        if (assistantContent) {
          assistantContent += '\n\n' + data.message
        } else {
          assistantContent = data.message
        }
      } else {
        assistantContent = assistantContent || 'Sorry, I encountered an error. Please try again.'
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: assistantContent,
        timestamp: Date.now()
      }

      // Add assistant message to current chat
      setChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? { 
              ...chat, 
              messages: [...chat.messages, assistantMessage],
              updatedAt: Date.now()
            }
          : chat
      ))

    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: Date.now()
      }
      
      setChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? { 
              ...chat, 
              messages: [...chat.messages, errorMessage],
              updatedAt: Date.now()
            }
          : chat
      ))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const removeServiceById = (itemId: string) => {
    setVaultItems(prev => prev.filter(item => item.id !== itemId))
  }

  const removeSelectedServices = (selectedIds: string[]) => {
    setVaultItems(prev => prev.filter(item => !selectedIds.includes(item.id)))
  }

  const clearAllServices = () => {
    setVaultItems([])
  }

  const currentChat = getCurrentChat()

  return (
    <>
      <Head>
        <title>Vault Onboarding V2 - AI-Powered Setup</title>
        <meta name="description" content="Set up your digital vault with AI assistance" />
      </Head>
      
      <div className="h-screen bg-gray-50 flex">
        {/* Left Sidebar - Chat List */}
        <div className="w-64 bg-gray-900 text-white flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <button
              onClick={createNewChat}
              className="w-full flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              New Chat
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                <ChatBubbleLeftIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No chats yet</p>
                <p className="text-xs">Create your first chat to get started</p>
              </div>
            ) : (
              <div className="p-2">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                      currentChatId === chat.id
                        ? 'bg-gray-700'
                        : 'hover:bg-gray-800'
                    }`}
                    onClick={() => setCurrentChatId(chat.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{chat.title}</p>
                      <p className="text-xs text-gray-400">
                        {chat.messages.length} messages
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteChat(chat.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 rounded transition-opacity"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center - Chat Interface */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {currentChat ? currentChat.title : 'Vault Setup Assistant'}
            </h1>
            <p className="text-sm text-gray-500">
              Tell me about your digital services and I'll help you set up a secure vault
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {!currentChat || currentChat.messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-12">
                <div className="text-6xl mb-4">🛡️</div>
                <h3 className="text-xl font-semibold mb-2">Welcome to Vault Setup</h3>
                <p className="mb-6">I'll help you identify and organize your digital services into a secure vault.</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
                  <h4 className="font-medium text-blue-900 mb-2">Try saying:</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• "I use Gmail, Netflix, and LinkedIn"</p>
                    <p>• "Extract services from this email: [paste text]"</p>
                    <p>• "Help me set up 2FA for my accounts"</p>
                    <p>• "I need to organize my passwords"</p>
                  </div>
                </div>
              </div>
            ) : (
              currentChat.messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-2xl px-4 py-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 text-gray-800 max-w-2xl px-4 py-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-gray-200 p-6">
            <div className="flex space-x-4">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe your digital services or ask about vault security..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>

        {/* Right Sidebar - Vault Items */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="bg-gray-50 px-4 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Your Vault</h3>
            <p className="text-sm text-gray-500">{vaultItems.length} items</p>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <VaultItemList
              onEdit={(index) => setEditIndex(index)}
              onCreate={() => setCreating(true)}
              onRemove={removeServiceById}
              onRemoveSelected={removeSelectedServices}
              onClearAll={clearAllServices}
            />
          </div>
        </div>
      </div>

      {/* Edit/Create Item Modals */}
      {editIndex !== null && (
        <EditItemModal index={editIndex} onClose={() => setEditIndex(null)} />
      )}
      {creating && <EditItemModal onClose={() => setCreating(false)} />}
    </>
  )
}
