import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useVault } from '@/contexts/VaultStore'
import { useGraph } from '@/contexts/GraphStore'
import { parseVault } from '@/lib/parseVault'
import VaultItemList from '@/components/VaultItemList'
import * as storage from '@/lib/storage'
import { MagnifyingGlassIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/solid'

const initialCommonServices = [
  {
    name: 'Facebook',
    keywords: ['facebook', 'fb', 'social'],
    category: 'Social',
    icon: 'https://facebook.com/favicon.ico',
    domain: 'facebook.com',
  },
  {
    name: 'Netflix',
    keywords: ['netflix', 'streaming', 'movies'],
    category: 'Entertainment',
    icon: 'https://netflix.com/favicon.ico',
    domain: 'netflix.com',
  },
  {
    name: 'Microsoft',
    keywords: ['microsoft', 'office', 'outlook'],
    category: 'Account',
    icon: 'https://microsoft.com/favicon.ico',
    domain: 'microsoft.com',
  },
  {
    name: 'Google',
    keywords: ['google', 'gmail', 'drive', 'account'],
    category: 'Email',
    icon: 'https://google.com/favicon.ico',
    domain: 'google.com',
  },
  {
    name: 'LinkedIn',
    keywords: ['linkedin', 'link', 'professional'],
    category: 'Professional',
    icon: 'https://linkedin.com/favicon.ico',
    domain: 'linkedin.com',
  },
  {
    name: 'Instagram',
    keywords: ['instagram', 'insta', 'photos'],
    category: 'Social',
    icon: 'https://instagram.com/favicon.ico',
    domain: 'instagram.com',
  },
  {
    name: 'Twitter',
    keywords: ['twitter', 'tweet', 'x'],
    category: 'Social',
    icon: 'https://twitter.com/favicon.ico',
    domain: 'twitter.com',
  },
  {
    name: 'Amazon',
    keywords: ['amazon', 'shopping', 'aws'],
    category: 'Shopping',
    icon: 'https://amazon.com/favicon.ico',
    domain: 'amazon.com',
  },
  {
    name: 'Apple',
    keywords: ['apple', 'icloud', 'mac'],
    category: 'Tech',
    icon: 'https://apple.com/favicon.ico',
    domain: 'apple.com',
  },
  {
    name: 'Spotify',
    keywords: ['spotify', 'music', 'audio'],
    category: 'Entertainment',
    icon: 'https://spotify.com/favicon.ico',
    domain: 'spotify.com',
  },
  {
    name: 'YouTube',
    keywords: ['youtube', 'video', 'watch'],
    category: 'Entertainment',
    icon: 'https://youtube.com/favicon.ico',
    domain: 'youtube.com',
  },
  {
    name: 'PayPal',
    keywords: ['paypal', 'payment', 'money'],
    category: 'Finance',
    icon: 'https://paypal.com/favicon.ico',
    domain: 'paypal.com',
  },
  {
    name: 'Discord',
    keywords: ['discord', 'chat', 'gaming'],
    category: 'Communication',
    icon: 'https://discord.com/favicon.ico',
    domain: 'discord.com',
  },
  {
    name: 'Slack',
    keywords: ['slack', 'work', 'team'],
    category: 'Work',
    icon: 'https://slack.com/favicon.ico',
    domain: 'slack.com',
  },
  {
    name: 'Dropbox',
    keywords: ['dropbox', 'storage', 'files'],
    category: 'Storage',
    icon: 'https://dropbox.com/favicon.ico',
    domain: 'dropbox.com',
  },
  {
    name: 'GitHub',
    keywords: ['github', 'git', 'code'],
    category: 'Development',
    icon: 'https://github.com/favicon.ico',
    domain: 'github.com',
  },
]

interface Service {
  name: string
  keywords: string[]
  category: string
  icon: string
  domain: string
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
  const [dynamicServices, setDynamicServices] = useState<Service[]>([])
  const [isSearchingServices, setIsSearchingServices] = useState(false)
  
  const { setVault } = useVault()
  const { setGraph } = useGraph()

  // Load vault items from localStorage on component mount
  useEffect(() => {
    try {
      // First, try to load from main vault data
      const mainVaultData = storage.loadVault()
      if (mainVaultData && mainVaultData.items && Array.isArray(mainVaultData.items)) {
        setVaultItems(mainVaultData.items)
        return
      }
      
      // If no main vault data, try onboarding-specific storage
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
      // Save to onboarding-specific storage for recovery
      localStorage.setItem('onboarding-vault-items', JSON.stringify(vaultItems))
      
      // Also sync with main vault storage in real-time
      if (vaultItems.length > 0) {
        const vaultData = {
          items: vaultItems,
          folders: [],
          collections: []
        }
        storage.saveVault(JSON.stringify(vaultData))
      }
    } catch (error) {
      console.error('Error saving vault items to localStorage:', error)
    }
  }, [vaultItems])

  // Sync local items with global stores so other pages stay updated
  useEffect(() => {
    const data = { items: vaultItems }
    setVault(data)
    setGraph(parseVault(data))
  }, [vaultItems, setVault, setGraph])

  // Filter services based on search query
  const filteredServices = [
    ...commonServices.filter(service =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
    ...dynamicServices.filter(service => 
      !commonServices.some(cs => cs.name.toLowerCase() === service.name.toLowerCase())
    )
  ]

  // Check if a service is already added to vault
  const isServiceAdded = (serviceName: string) => {
    return vaultItems.some(item => item.name.toLowerCase() === serviceName.toLowerCase())
  }

  // Add service to vault
  const addServiceToVault = (service: Service) => {
    if (isServiceAdded(service.name)) return

    const vaultId = service.name.toLowerCase().replace(/\s+/g, '-')
    const newItem: VaultItem = {
      id: crypto.randomUUID(),
      type: 1, // Login type
      name: service.name,
      login: {
        username: '',
        password: '',
        uris: [{ uri: `https://${service.domain}`, match: null }]
      },
      fields: [
        {
          name: 'vaultdiagram-id',
          value: vaultId,
          type: 0
        },
        {
          name: 'vaultdiagram-logo-url',
          value: service.icon,
          type: 0
        },
        {
          name: 'vaultdiagram-recovery-map',
          value: '{}',
          type: 0
        },
        {
          name: 'vaultdiagram-2fa-map',
          value: '{}',
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

  // Remove service from vault by name
  const removeServiceFromVault = (serviceName: string) => {
    const updatedItems = vaultItems.filter(item => item.name.toLowerCase() !== serviceName.toLowerCase())
    setVaultItems(updatedItems)
    getSuggestedServices(updatedItems)
  }

  // Remove service from vault by ID
  const removeServiceById = (itemId: string) => {
    const updatedItems = vaultItems.filter(item => item.id !== itemId)
    setVaultItems(updatedItems)
    getSuggestedServices(updatedItems)
  }

  // Remove selected services from vault
  const removeSelectedServices = (selectedIds: string[]) => {
    const updatedItems = vaultItems.filter(item => !selectedIds.includes(item.id))
    setVaultItems(updatedItems)
    getSuggestedServices(updatedItems)
  }

  // Clear all services from vault
  const clearAllServices = () => {
    setVaultItems([])
    setSuggestedServices([])
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
              .map((name: string) => {
                const domain = `${name.toLowerCase().replace(/\s+/g, '')}.com`
                return {
                  name,
                  keywords: [name.toLowerCase()],
                  category: 'Suggested',
                  icon: `https://${domain}/favicon.ico`,
                  domain
                }
              })
            
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

  // Dynamic service discovery for search queries
  const searchForDynamicServices = async (query: string) => {
    if (query.length < 2) {
      setDynamicServices([])
      return
    }

    // Don't search if it matches existing services
    const matchesExisting = [...commonServices, ...suggestedServices].some(
      service => service.name.toLowerCase().includes(query.toLowerCase())
    )
    if (matchesExisting) {
      setDynamicServices([])
      return
    }

    setIsSearchingServices(true)
    try {
      // Try to create a service from the search query
      const serviceName = query.charAt(0).toUpperCase() + query.slice(1).toLowerCase()
      const domain = `${query.toLowerCase()}.com`
      
      // Test if the domain exists by trying to fetch its favicon
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
      const clearbitUrl = `https://logo.clearbit.com/${domain}`
      
      const newService: Service = {
        name: serviceName,
        keywords: [query.toLowerCase()],
        category: 'Discovered',
        icon: clearbitUrl,
        domain: domain
      }
      
      setDynamicServices([newService])
    } catch (error) {
      console.error('Error discovering service:', error)
      setDynamicServices([])
    } finally {
      setIsSearchingServices(false)
    }
  }

  // Debounced search for dynamic services
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchForDynamicServices(searchQuery)
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

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
                            ? 'border-green-200 bg-green-50 hover:bg-green-100 cursor-pointer'
                            : service.category === 'Discovered'
                            ? 'border-orange-200 bg-orange-50 hover:border-orange-300 hover:bg-orange-100 cursor-pointer'
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
                        <span className={`text-xs ${
                          service.category === 'Discovered' ? 'text-orange-600 font-medium' : 'text-gray-500'
                        }`}>
                          {service.category === 'Discovered' ? '🔍 Found' : service.category}
                        </span>
                      </button>
                    ))}
                  </div>

                  {filteredServices.length === 0 && !isSearchingServices && (
                    <div className="text-center py-12 text-gray-500">
                      <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg">No services found matching "{searchQuery}"</p>
                      <p className="text-sm mt-2">Try a different search term or browse our popular services</p>
                    </div>
                  )}

                  {isSearchingServices && (
                    <div className="text-center py-12 text-gray-500">
                      <div className="animate-spin w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full mx-auto mb-4"></div>
                      <p className="text-lg">Searching for "{searchQuery}"...</p>
                      <p className="text-sm mt-2">Looking for logos and service details</p>
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

                  {/* Discovered Services */}
                  {dynamicServices.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        🔍 Discovered Services
                        <span className="text-sm font-normal text-gray-500">
                          Based on your search
                        </span>
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {dynamicServices.map((service, index) => (
                          <button
                            key={`dynamic-${index}`}
                            onClick={() => addServiceToVault(service)}
                            className="flex flex-col items-center p-3 rounded-lg border border-blue-200 bg-blue-50 hover:border-blue-300 hover:bg-blue-100 transition-colors"
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

                  {isSearchingServices && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-gray-500">
                        <div className="animate-spin w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full"></div>
                        <span className="text-sm">Searching for services...</span>
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
                <div className="p-4">
                  {vaultItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-3">🔐</div>
                      <p className="text-sm">No services added yet</p>
                      <p className="text-xs mt-1">Click on services to add them to your vault</p>
                    </div>
                  ) : (
                    <VaultItemList 
                      onEdit={() => {}} 
                      onRemove={removeServiceById} 
                      onRemoveSelected={removeSelectedServices}
                      onClearAll={clearAllServices}
                    />
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
