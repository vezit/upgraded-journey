import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useVault } from '@/contexts/VaultStore'
import { useGraph } from '@/contexts/GraphStore'
import { parseVault } from '@/lib/parseVault'
import * as storage from '@/lib/storage'
import { MagnifyingGlassIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/solid'

const initialCommonServices = [
  { name: 'Facebook', keywords: ['facebook', 'fb', 'social'], category: 'Social', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg' },
  { name: 'Netflix', keywords: ['netflix', 'streaming', 'movies'], category: 'Entertainment', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/netflix.svg' },
  { name: 'Microsoft', keywords: ['microsoft', 'office', 'outlook'], category: 'Account', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/microsoft.svg' },
  { name: 'Google', keywords: ['google', 'gmail', 'drive', 'account'], category: 'Email', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/google.svg' },
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

interface Service {
  name: string
  keywords: string[]
  category: string
  icon: string
}

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

export default function VaultOnboarding() {
  const [searchQuery, setSearchQuery] = useState('')
  const [commonServices, setCommonServices] = useState<Service[]>(initialCommonServices)
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([])
  const [suggestedServices, setSuggestedServices] = useState<Service[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  
  const { setVault } = useVault()
  const { setGraph } = useGraph()

  // Load vault items from localStorage on component mount
  useEffect(() => {
    try {
      const savedVaultItems = localStorage.getItem('onboarding-vault-items')
      if (savedVaultItems) {
        const parsedItems = JSON.parse(savedVaultItems)
        if (Array.isArray(parsedItems)) {
          setVaultItems(parsedItems)
        }
      }
    } catch (error) {
      console.error('Error loading vault items from localStorage:', error)
    }
  }, [])

  // Save vault items to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('onboarding-vault-items', JSON.stringify(vaultItems))
    } catch (error) {
      console.error('Error saving vault items to localStorage:', error)
    }
  }, [vaultItems])

  // Filter services based on search query
  const filteredServices = commonServices.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Check if a service is already added to vault
  const isServiceAdded = (serviceName: string) => {
    return vaultItems.some(item => item.name.toLowerCase() === serviceName.toLowerCase())
  }

  // Add service to vault
  const addServiceToVault = (service: Service) => {
    if (isServiceAdded(service.name)) return

    const newItem: VaultItem = {
      id: crypto.randomUUID(),
      type: 1, // Login type
      name: service.name,
      login: {
        username: '',
        password: '',
        uris: [{ uri: '', match: null }]
      },
      fields: [
        {
          name: 'vaultdiagram-id',
          value: service.name.toLowerCase().replace(/\s+/g, '-'),
          type: 0
        }
      ],
      notes: `Added from onboarding - ${service.category} service`
    }

    const updatedItems = [...vaultItems, newItem]
    setVaultItems(updatedItems)
    
    // Trigger AI suggestions based on the new service
    getSuggestedServices(updatedItems)
  }

  // Remove service from vault
  const removeServiceFromVault = (serviceName: string) => {
    const updatedItems = vaultItems.filter(item => item.name.toLowerCase() !== serviceName.toLowerCase())
    setVaultItems(updatedItems)
    getSuggestedServices(updatedItems)
  }

  // Get AI-powered service suggestions
  const getSuggestedServices = async (currentItems: VaultItem[]) => {
    if (currentItems.length === 0) return
    
    setIsLoadingSuggestions(true)
    try {
      const serviceNames = currentItems.map(item => item.name).join(', ')
      const response = await fetch('/api/chatgpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Based on these services: ${serviceNames}, suggest 4 additional popular online services that users typically use alongside these. Focus on major platforms and services, not sub-services like "Google Drive" (just use "Google"). Respond with ONLY a JSON array of service names, no explanation. Example: ["Zoom", "Trello", "WhatsApp", "Notion"]`
          }]
        }),
      })

      const data = await response.json()
      
      if (response.ok && data.message) {
        try {
          // Try to parse the AI response as JSON
          const suggestions = JSON.parse(data.message.replace(/```json\n?|\n?```/g, ''))
          
          if (Array.isArray(suggestions)) {
            // Convert suggestions to service objects
            const newSuggestions: Service[] = suggestions
              .filter((name: string) => 
                typeof name === 'string' && 
                !isServiceAdded(name) &&
                !commonServices.some(s => s.name.toLowerCase() === name.toLowerCase())
              )
              .slice(0, 4)
              .map((name: string) => ({
                name,
                keywords: [name.toLowerCase()],
                category: 'Suggested',
                icon: `https://www.google.com/s2/favicons?domain=${name.toLowerCase().replace(/\s+/g, '')}.com&sz=32`
              }))
            
            setSuggestedServices(newSuggestions)
          }
        } catch (parseError) {
          console.error('Failed to parse AI suggestions:', parseError)
        }
      }
    } catch (error) {
      console.error('Error getting service suggestions:', error)
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  // Save vault and continue
  const saveAndContinue = () => {
    if (vaultItems.length === 0) return

    const vaultData = {
      items: vaultItems,
      folders: [],
      collections: []
    }
    
    setVault(vaultData)
    setGraph(parseVault(vaultData))
    storage.saveVault(JSON.stringify(vaultData))
    
    // Clear temporary onboarding storage
    localStorage.removeItem('onboarding-vault-items')
    
    // Redirect to main vault page
    window.location.href = '/vaultDiagram'
  }

  return (
    <>
      <Head>
        <title>Vault Onboarding - Setup Your Digital Services</title>
        <meta name="description" content="Set up your digital vault by selecting your commonly used services" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Your Digital Vault</h1>
            <p className="text-xl text-gray-600 mb-6">Let's start by adding your commonly used services</p>
            <div className="bg-white rounded-lg shadow-sm p-4 max-w-2xl mx-auto">
              <div className="flex items-center gap-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for services (e.g., Gmail, Netflix, LinkedIn...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border-0 focus:ring-0 focus:outline-none text-lg"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Common Services */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Popular Services
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({filteredServices.length} services)
                    </span>
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {filteredServices.map((service, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (isServiceAdded(service.name)) {
                            removeServiceFromVault(service.name)
                          } else {
                            addServiceToVault(service)
                          }
                        }}
                        className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all duration-200 ${
                          isServiceAdded(service.name)
                            ? 'border-green-200 bg-green-50 hover:border-red-300 hover:bg-red-50 cursor-pointer'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                        }`}
                      >
                        <div className="relative">
                          <img 
                            src={service.icon} 
                            alt={service.name} 
                            className="w-12 h-12 mb-2"
                            style={{ filter: isServiceAdded(service.name) ? 'grayscale(50%)' : 'none' }}
                          />
                          {isServiceAdded(service.name) && (
                            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                              <CheckIcon className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-900 text-center">
                          {service.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {service.category}
                        </span>
                      </button>
                    ))}
                  </div>

                  {filteredServices.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg">No services found matching "{searchQuery}"</p>
                      <p className="text-sm mt-2">Try a different search term or browse our popular services</p>
                    </div>
                  )}

                  {/* AI Suggested Services */}
                  {suggestedServices.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        🤖 AI Suggested Services
                        <span className="text-sm font-normal text-gray-500">
                          Based on your selections
                        </span>
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {suggestedServices.map((service, index) => (
                          <button
                            key={`suggested-${index}`}
                            onClick={() => addServiceToVault(service)}
                            className="flex flex-col items-center p-3 rounded-lg border border-purple-200 bg-purple-50 hover:border-purple-300 hover:bg-purple-100 transition-colors"
                          >
                            <img 
                              src={service.icon} 
                              alt={service.name} 
                              className="w-8 h-8 mb-1"
                            />
                            <span className="text-xs font-medium text-gray-900 text-center">
                              {service.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {isLoadingSuggestions && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-gray-500">
                        <div className="animate-spin w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full"></div>
                        <span className="text-sm">AI is suggesting additional services...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Services */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden sticky top-8">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Your Vault
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({vaultItems.length} services)
                    </span>
                  </h3>
                </div>
                <div className="p-4 max-h-96 overflow-y-auto">
                  {vaultItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-3">🔐</div>
                      <p className="text-sm">No services added yet</p>
                      <p className="text-xs mt-1">Click on services to add them to your vault</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {vaultItems.map((item, index) => {
                        const service = [...commonServices, ...suggestedServices].find(s => 
                          s.name.toLowerCase() === item.name.toLowerCase()
                        )
                        return (
                          <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <img 
                              src={service?.icon || `https://www.google.com/s2/favicons?domain=${item.name.toLowerCase()}.com&sz=32`}
                              alt={item.name}
                              className="w-6 h-6"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900">{item.name}</span>
                              <div className="text-xs text-gray-500">Login item</div>
                            </div>
                            <button
                              onClick={() => removeServiceFromVault(item.name)}
                              className="text-red-500 hover:text-red-700 text-sm"
                              title="Remove from vault"
                            >
                              ×
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                
                {vaultItems.length > 0 && (
                  <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={saveAndContinue}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Continue to Vault ({vaultItems.length} services)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span>Step 1: Select Services</span>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span>Step 2: Configure Security</span>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span>Step 3: Review & Export</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
