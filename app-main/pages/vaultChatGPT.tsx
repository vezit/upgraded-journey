import { useState, useEffect } from 'react'
import Head from 'next/head'

const CHAT_STORAGE_KEY = 'vault-chatgpt-history'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  attachment?: {
    filename: string
    data: any
    type: string
    size: number
  }
}

const commonServices = [
  { name: 'Facebook', keywords: ['facebook', 'fb', 'social'], category: 'Social', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg' },
  { name: 'Netflix', keywords: ['netflix', 'streaming', 'movies'], category: 'Entertainment', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/netflix.svg' },
  { name: 'Microsoft', keywords: ['microsoft', 'office', 'outlook'], category: 'Work', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/microsoft.svg' },
  { name: 'Gmail', keywords: ['gmail', 'google', 'email'], category: 'Email', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/gmail.svg' },
  { name: 'LinkedIn', keywords: ['linkedin', 'link', 'professional'], category: 'Professional', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg' },
  { name: 'Instagram', keywords: ['instagram', 'insta', 'photos'], category: 'Social', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg' },
  { name: 'Twitter', keywords: ['twitter', 'tweet', 'x'], category: 'Social', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/twitter.svg' },
  { name: 'Amazon', keywords: ['amazon', 'shopping', 'aws'], category: 'Shopping', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/amazon.svg' },
  { name: 'Apple', keywords: ['apple', 'icloud', 'mac'], category: 'Tech', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/apple.svg' },
  { name: 'Spotify', keywords: ['spotify', 'music', 'audio'], category: 'Entertainment', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/spotify.svg' },
  { name: 'YouTube', keywords: ['youtube', 'video', 'watch'], category: 'Entertainment', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg' },
  { name: 'PayPal', keywords: ['paypal', 'payment', 'money'], category: 'Finance', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/paypal.svg' },
  { name: 'Discord', keywords: ['discord', 'chat', 'gaming'], category: 'Communication', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/discord.svg' },
  { name: 'Slack', keywords: ['slack', 'work', 'team'], category: 'Work', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/slack.svg' },
  { name: 'Dropbox', keywords: ['dropbox', 'storage', 'files'], category: 'Storage', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/dropbox.svg' },
  { name: 'GitHub', keywords: ['github', 'git', 'code'], category: 'Development', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/github.svg' },
]

export default function VaultChatGPT() {
  const [messages, setMessages] = useState<Array<ChatMessage>>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoadedFromCache, setHasLoadedFromCache] = useState(false)

  // Load chat history from localStorage on component mount
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(CHAT_STORAGE_KEY)
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages)
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setMessages(parsedMessages)
          setHasLoadedFromCache(true)
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
    }
  }, [])

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
    } catch (error) {
      console.error('Error saving chat history:', error)
    }
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage = { role: 'user' as const, content: input }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chatgpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI response')
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant' as const,
        content: data.message,
        attachment: data.attachment || undefined
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: ChatMessage = {
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error while processing your request. Please try again.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    setHasLoadedFromCache(false)
    localStorage.removeItem(CHAT_STORAGE_KEY)
  }

  const downloadAttachment = (attachment: { filename: string; data: any; type: string }) => {
    const dataStr = JSON.stringify(attachment.data, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', attachment.filename)
    linkElement.click()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getFilteredServices = () => {
    return commonServices
  }

  const addServiceToInput = (serviceName: string) => {
    // Only update the latest assistant message to include the selected service
    setMessages(prevMessages => {
      if (prevMessages.length === 0) return prevMessages
      
      const lastMessage = prevMessages[prevMessages.length - 1]
      if (lastMessage.role !== 'assistant') return prevMessages
      
      // Check if the service is already mentioned in the message
      const serviceNameLower = serviceName.toLowerCase()
      const contentLower = lastMessage.content.toLowerCase()
      
      if (contentLower.includes(serviceNameLower)) {
        // Service already mentioned, don't duplicate
        return prevMessages
      }
      
      // Add the service to the assistant's message
      const updatedMessage = {
        ...lastMessage,
        content: lastMessage.content + `\n\n📝 Added to mapping: ${serviceName} - I'll help you set up secure access and recovery options for this service.`
      }
      
      const updatedMessages = [...prevMessages.slice(0, -1), updatedMessage]
      
      // Save updated messages to localStorage
      try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updatedMessages))
      } catch (error) {
        console.error('Error saving updated chat history:', error)
      }
      
      return updatedMessages
    })
  }

  return (
    <>
      <Head>
        <title>Vault ChatGPT - AI Assistant</title>
        <meta name="description" content="AI-powered chat assistant for vault management" />
      </Head>
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold">Vault ChatGPT</h1>
                  <p className="text-blue-100 mt-2">AI-powered assistant for vault management and security</p>
                </div>
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Clear Chat
                  </button>
                )}
              </div>
            </div>

            {/* Chat Container */}
            <div className="flex flex-col h-[600px]">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {hasLoadedFromCache && messages.length > 0 && (
                  <div className="text-center">
                    <div className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">
                      <span className="mr-1">💾</span>
                      Chat history restored from previous session
                    </div>
                  </div>
                )}

                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-12">
                    <div className="text-6xl mb-4">🗺️</div>
                    <h3 className="text-xl font-semibold mb-2">Map Your Digital Services</h3>
                    <p>I'll help you identify all your online accounts and create a secure vault diagram you can download!</p>
                    <div className="mt-6 space-y-4 max-w-2xl mx-auto">
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-gray-900 mb-2">🎯 How This Works:</h4>
                        <div className="text-sm text-gray-700 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">1</span>
                            <span>Tell me about your online services (Netflix, Gmail, LinkedIn, etc.)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">2</span>
                            <span>I'll help organize them securely with proper 2FA and recovery</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">3</span>
                            <span>Download your personalized Bitwarden-compatible vault diagram</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <h4 className="font-medium text-gray-900 mb-3">🚀 Start Mapping Your Services:</h4>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {[
                            "Help me map out my entertainment services",
                            "I want to organize my work accounts",
                            "Show me how to secure my social media",
                            "Help me plan my banking security",
                            "Let's start with my email accounts"
                          ].map((question, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setInput(question)
                              }}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                            >
                              {question}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.attachment && (
                          <div className="mt-3 pt-3 border-t border-gray-300">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs text-gray-600">📎 Attachment:</span>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-gray-300">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-900 truncate">
                                    {message.attachment.filename}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {message.attachment.type === 'vault-json' && message.attachment.data?.items ? 
                                      `${message.attachment.data.items.length} services • ${Math.round(message.attachment.size / 1024)}KB` :
                                      `${message.attachment.type} • ${Math.round(message.attachment.size / 1024)}KB`
                                    }
                                  </p>
                                </div>
                                <button
                                  onClick={() => downloadAttachment(message.attachment!)}
                                  className="flex-shrink-0 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                >
                                  📥 Download
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 text-gray-800 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-pulse">🤖</div>
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t bg-gray-50 p-4">
                <div className="flex space-x-4">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me about vault security, 2FA setup, or password management..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    disabled={isLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isLoading ? '...' : 'Send'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </div>
          </div>

          {/* Common Services */}
          <div className="mt-6 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">
                Common Services
                <span className="text-gray-500 ml-2">Click to add to ChatGPT response</span>
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {getFilteredServices().slice(0, 12).map((service, index) => (
                  <button
                    key={index}
                    onClick={() => addServiceToInput(service.name)}
                    className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                  >
                    <img 
                      src={service.icon} 
                      alt={service.name} 
                      className="w-8 h-8 mb-1"
                      style={{ filter: 'brightness(0) saturate(100%)' }}
                    />
                    <span className="text-xs font-medium text-gray-900 group-hover:text-blue-700">
                      {service.name}
                    </span>
                    <span className="text-xs text-gray-500 group-hover:text-blue-600">
                      {service.category}
                    </span>
                  </button>
                ))}
              </div>

            </div>
          </div>
          
          {/* Info Cards */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl mb-3">�️</div>
              <h3 className="font-semibold text-gray-900 mb-2">Service Mapping</h3>
              <p className="text-sm text-gray-600">
                Identify all your online accounts and organize them into a secure, manageable structure.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl mb-3">�</div>
              <h3 className="font-semibold text-gray-900 mb-2">Security Planning</h3>
              <p className="text-sm text-gray-600">
                Get guidance on 2FA setup, recovery strategies, and password best practices for each service.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl mb-3">�</div>
              <h3 className="font-semibold text-gray-900 mb-2">Vault Generation</h3>
              <p className="text-sm text-gray-600">
                Download a Bitwarden-compatible vault diagram that you can import and visualize.
              </p>
            </div>
          </div>

          {/* Footer with utility buttons */}
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-500">
                <p>Need to clear your data? Use the buttons below to manage your stored information.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // Clear all cookies
                    document.cookie.split(";").forEach((c) => {
                      const eqPos = c.indexOf("=")
                      const name = eqPos > -1 ? c.substr(0, eqPos) : c
                      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
                      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname
                      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + window.location.hostname
                    })
                    alert('All cookies have been cleared!')
                  }}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                >
                  🍪 Delete Cookies
                </button>
                <button
                  onClick={() => {
                    // Clear all localStorage
                    localStorage.clear()
                    // Also reset the current chat
                    setMessages([])
                    setHasLoadedFromCache(false)
                    alert('All localStorage data has been cleared!')
                  }}
                  className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium"
                >
                  💾 Delete Local Storage
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
