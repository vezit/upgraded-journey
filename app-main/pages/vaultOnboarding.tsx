import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import { useVault } from '@/contexts/VaultStore'
import { useGraph } from '@/contexts/GraphStore'
import { parseVault } from '@/lib/parseVault'
import VaultItemList from '@/components/VaultItemList'
import * as storage from '@/lib/storage'
import { MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/solid'
import ServiceIcon from '@/components/ServiceIcon'
import { popularServices, Service } from '@/lib/popularServices'

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
  const commonServices = popularServices
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([])
  const [suggestedServices, setSuggestedServices] = useState<Service[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [dynamicServices, setDynamicServices] = useState<Service[]>([])
  const [isSearchingServices, setIsSearchingServices] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [isGeneratingFromText, setIsGeneratingFromText] = useState(false)
  
  const { setVault } = useVault()
  const { setGraph } = useGraph()

  // Load vault items from localStorage on component mount
  useEffect(() => {
    try {
      // Clean up legacy data
      storage.cleanupLegacyData()
      
      // Load from main vault data only
      const mainVaultData = storage.loadVault()
      if (mainVaultData && mainVaultData.items && Array.isArray(mainVaultData.items)) {
        setVaultItems(mainVaultData.items)
      }
    } catch (error) {
      console.error('Error loading vault items from localStorage:', error)
    }
  }, [])

  // Save vault items to localStorage whenever they change
  useEffect(() => {
    try {
      // Always save to main vault storage in real-time
      const vaultData = {
        items: vaultItems,
        folders: [],
        collections: []
      }
      storage.saveVault(JSON.stringify(vaultData))
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

  // Check if a service is already added to vault
  const isServiceAdded = (serviceName: string) => {
    return vaultItems.some(item => item.name.toLowerCase() === serviceName.toLowerCase())
  }

  // Filter services based on search query and exclude already added services
  const filteredPopularServices = useMemo(() => {
    // First filter by search query and exclude already added services
    const availableServices = commonServices.filter(service => 
      !vaultItems.some(item => item.name.toLowerCase() === service.name.toLowerCase()) && (
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    )
    
    // If we have a search query, return all matching results
    if (searchQuery.length > 0) {
      return availableServices
    }
    
    // Otherwise, return only 16 most relevant services
    return availableServices.slice(0, 16)
  }, [commonServices, searchQuery, vaultItems])

  const filteredServices = [
    ...filteredPopularServices,
    ...dynamicServices.filter(service => 
      !commonServices.some(cs => cs.name.toLowerCase() === service.name.toLowerCase()) &&
      !vaultItems.some(item => item.name.toLowerCase() === service.name.toLowerCase())
    )
  ]

  // Generate realistic credentials for a service
  const generateCredentialsForService = (serviceName: string, domain: string) => {
    // Generate realistic username patterns
    const patterns = [
      `user@${domain}`,
      `${serviceName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      `${serviceName.toLowerCase().replace(/\s+/g, '')}user@outlook.com`,
      `john.doe@${domain}`,
      `${serviceName.toLowerCase().replace(/\s+/g, '')}123@gmail.com`
    ]
    
    const username = patterns[Math.floor(Math.random() * patterns.length)]
    
    // Generate secure but memorable passwords
    const adjectives = ['Quick', 'Smart', 'Bright', 'Swift', 'Strong', 'Clear', 'Sharp', 'Bold']
    const nouns = ['Tiger', 'Eagle', 'Storm', 'Ocean', 'Mountain', 'River', 'Forest', 'Star']
    const numbers = ['123', '456', '789', '2024', '2025', '100', '200', '999']
    const symbols = ['!', '@', '#', '$', '%']
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    const number = numbers[Math.floor(Math.random() * numbers.length)]
    const symbol = symbols[Math.floor(Math.random() * symbols.length)]
    
    const password = `${adjective}${noun}${number}${symbol}`
    
    return { username, password }
  }

  // Add service to vault
  const addServiceToVault = (service: Service) => {
    if (isServiceAdded(service.name)) return

    const vaultId = service.name.toLowerCase().replace(/\s+/g, '-')
    
    // Use AI-generated credentials if available, otherwise generate them
    let username: string
    let password: string
    
    if (service.username && service.password) {
      username = service.username
      password = service.password
    } else {
      const generated = generateCredentialsForService(service.name, service.domain)
      username = generated.username
      password = generated.password
    }
    
    const newItem: VaultItem = {
      id: crypto.randomUUID(),
      type: 1, // Login type
      name: service.name,
      login: {
        username: username,
        password: password,
        uris: [{ uri: `https://${service.domain}`, match: null }]
      },
      fields: [
        {
          name: 'vaultdiagram',
          value: JSON.stringify({
            id: vaultId,
            logoUrl: service.icon,
            recoveryMap: {},
            twofaMap: {}
          }),
          type: 0
        }
      ],
      notes: `Added from onboarding - ${service.category} service with ${service.username ? 'AI-generated' : 'random'} credentials`
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

  // Generate vault items from free-form text using AI
  const generateVaultItemsFromText = async () => {
    if (!textInput.trim()) return

    setIsGeneratingFromText(true)
    try {
      const response = await fetch('/api/chatgpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `From the following text, extract online services and create vault items with realistic usernames and passwords. Respond with ONLY a JSON array of objects with this structure: [{"name": "ServiceName", "username": "realistic.email@domain.com", "password": "SecurePass123!", "domain": "service.com"}]. Make usernames realistic (use common patterns like firstname.lastname, firstnamelastname, or simple usernames) and passwords secure but memorable: ${textInput}`
          }]
        })
      })

      const data = await response.json()

      if (response.ok && data.message) {
        try {
          const services = JSON.parse(data.message.replace(/```json\n?|\n?```/g, ''))

          if (Array.isArray(services)) {
            const newItems: VaultItem[] = services
              .filter((service: any) => 
                service.name && typeof service.name === 'string' && 
                !isServiceAdded(service.name)
              )
              .map((service: any) => {
                const domain = service.domain || `${service.name.toLowerCase().replace(/\s+/g, '')}.com`
                const username = service.username || `user@${domain}`
                const password = service.password || 'SecurePassword123!'
                
                return {
                  id: crypto.randomUUID(),
                  type: 1,
                  name: service.name,
                  login: {
                    username: username,
                    password: password,
                    uris: [{ uri: `https://${domain}`, match: null }]
                  },
                  fields: [
                    {
                      name: 'vaultdiagram',
                      value: JSON.stringify({
                        id: service.name.toLowerCase().replace(/\s+/g, '-'),
                        logoUrl: `https://logo.clearbit.com/${domain}?size=128`,
                        recoveryMap: {},
                        twofaMap: {}
                      }),
                      type: 0
                    }
                  ],
                  notes: 'Added from text input with AI-generated credentials'
                } as VaultItem
              })

            if (newItems.length > 0) {
              const updatedItems = [...vaultItems, ...newItems]
              setVaultItems(updatedItems)
              getSuggestedServices(updatedItems)
            }
          }
        } catch (parseError) {
          console.error('Failed to parse generated services:', parseError)
        }
      }
    } catch (error) {
      console.error('Error generating services from text:', error)
    } finally {
      setIsGeneratingFromText(false)
    }
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
            content: `Based on these services: ${serviceNames}, suggest 4 additional popular online services with realistic credentials. Focus on major platforms and services, not sub-services like "Google Drive" (just use "Google"). Respond with ONLY a JSON array: [{"name": "ServiceName", "username": "realistic.email@domain.com", "password": "SecurePass123!", "domain": "service.com"}]. Make usernames realistic and passwords secure but memorable.`
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
              .filter((service: any) => 
                service.name && typeof service.name === 'string' && 
                !isServiceAdded(service.name) &&
                !commonServices.some(s => s.name.toLowerCase() === service.name.toLowerCase())
              )
              .slice(0, 4)
              .map((service: any) => {
                const domain = service.domain || `${service.name.toLowerCase().replace(/\s+/g, '')}.com`
                return {
                  name: service.name,
                  keywords: [service.name.toLowerCase()],
                  category: 'Suggested',
                  icon: `https://logo.clearbit.com/${domain}?size=128`,
                  domain: domain,
                  username: service.username,
                  password: service.password
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
      // Common TLDs to try for the search query
      const commonTlds = ['.com', '.org', '.io', '.net', '.co', '.app', '.dev', '.ai', '.tech', '.cloud']
      const serviceName = query.charAt(0).toUpperCase() + query.slice(1).toLowerCase()
      const baseQuery = query.toLowerCase()
      
      const discoveredServices: Service[] = commonTlds.map((tld, index) => {
        const domain = `${baseQuery}${tld}`
        return {
          name: `${serviceName}${tld}`,
          keywords: [baseQuery, domain],
          category: 'Discovered',
          icon: `https://logo.clearbit.com/${domain}?size=128`,
          domain: domain
        }
      })
      
      setDynamicServices(discoveredServices)
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
            <div className="bg-white rounded-lg shadow-sm p-4 max-w-2xl mx-auto mt-4">
              <textarea
                placeholder="Paste any text that mentions the services you use (emails, documents, etc.) and AI will extract them and generate realistic usernames and passwords..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={4}
                className="w-full border border-gray-200 rounded-md p-2"
              />
              <button
                onClick={generateVaultItemsFromText}
                disabled={isGeneratingFromText}
                className="mt-3 w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {isGeneratingFromText ? 'Generating Services & Credentials...' : 'Generate Services with Credentials'}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                AI will create realistic usernames and secure passwords for each service
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Common Services */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {searchQuery ? 'Search Results' : 'Popular Services'}
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
                          <ServiceIcon
                            domain={service.domain}
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
                        {!isServiceAdded(service.name) && (
                          <span className="text-xs text-blue-600 font-medium">
                            + credentials
                          </span>
                        )}
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
                            onClick={() => {
                              // Add service with AI-generated credentials if available
                              if (service.username && service.password) {
                                const vaultId = service.name.toLowerCase().replace(/\s+/g, '-')
                                const newItem: VaultItem = {
                                  id: crypto.randomUUID(),
                                  type: 1,
                                  name: service.name,
                                  login: {
                                    username: service.username,
                                    password: service.password,
                                    uris: [{ uri: `https://${service.domain}`, match: null }]
                                  },
                                  fields: [
                                    {
                                      name: 'vaultdiagram',
                                      value: JSON.stringify({
                                        id: vaultId,
                                        logoUrl: service.icon,
                                        recoveryMap: {},
                                        twofaMap: {}
                                      }),
                                      type: 0
                                    }
                                  ],
                                  notes: `AI-suggested service with generated credentials`
                                }
                                const updatedItems = [...vaultItems, newItem]
                                setVaultItems(updatedItems)
                                getSuggestedServices(updatedItems)
                              } else {
                                addServiceToVault(service)
                              }
                            }}
                            className="flex flex-col items-center p-3 rounded-lg border border-purple-200 bg-purple-50 hover:border-purple-300 hover:bg-purple-100 transition-colors"
                          >
                            <ServiceIcon
                              domain={service.domain}
                              alt={service.name}
                              className="w-8 h-8 mb-1"
                            />
                            <span className="text-xs font-medium text-gray-900 text-center">
                              {service.name}
                            </span>
                            {service.username && (
                              <span className="text-xs text-purple-600 text-center">
                                + credentials
                              </span>
                            )}
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
                            <ServiceIcon
                              domain={service.domain}
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
