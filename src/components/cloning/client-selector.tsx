/**
 * Client Selector Component for Clone Wizard (F9.1)
 *
 * Allows selection of target client for the cloned engagement.
 *
 * User Stories: US-033
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Building,
  Check,
  Loader2,
} from 'lucide-react'

interface Client {
  id: string
  name: string
  industry?: string
  engagementCount?: number
}

interface ClientSelectorProps {
  selectedClientId: string | null
  sourceClientId: string
  onSelect: (clientId: string, clientName: string) => void
}

export function ClientSelector({
  selectedClientId,
  sourceClientId,
  onSelect,
}: ClientSelectorProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients?limit=100')
      const data = await response.json()

      if (data.success) {
        setClients(data.clients)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(search.toLowerCase())
  )

  // Sort to put source client first, then selected, then alphabetical
  const sortedClients = [...filteredClients].sort((a, b) => {
    if (a.id === sourceClientId) return -1
    if (b.id === sourceClientId) return 1
    if (a.id === selectedClientId) return -1
    if (b.id === selectedClientId) return 1
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Client List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : sortedClients.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          No clients found. Create a client first.
        </div>
      ) : (
        <div className="grid gap-2 max-h-80 overflow-y-auto">
          {sortedClients.map((client) => {
            const isSource = client.id === sourceClientId
            const isSelected = client.id === selectedClientId

            return (
              <Card
                key={client.id}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : isSource
                    ? 'border-amber-300 bg-amber-50'
                    : 'hover:border-slate-300 hover:bg-slate-50'
                }`}
                onClick={() => onSelect(client.id, client.name)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isSelected
                            ? 'bg-blue-100'
                            : isSource
                            ? 'bg-amber-100'
                            : 'bg-slate-100'
                        }`}
                      >
                        <Building
                          className={`h-5 w-5 ${
                            isSelected
                              ? 'text-blue-600'
                              : isSource
                              ? 'text-amber-600'
                              : 'text-slate-600'
                          }`}
                        />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">
                          {client.name}
                        </div>
                        {client.industry && (
                          <div className="text-sm text-slate-500">
                            {client.industry}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSource && (
                        <Badge variant="warning" size="sm">
                          Source Client
                        </Badge>
                      )}
                      {isSelected && (
                        <div className="p-1 bg-blue-500 rounded-full">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Helper Text */}
      <div className="text-sm text-slate-500">
        {selectedClientId === sourceClientId ? (
          <span className="text-amber-600">
            Note: You&apos;re cloning to the same client. The new engagement will appear alongside the original.
          </span>
        ) : selectedClientId ? (
          <span className="text-green-600">
            The cloned engagement will be created for the selected client.
          </span>
        ) : (
          <span>Select the client who will own the cloned engagement.</span>
        )}
      </div>
    </div>
  )
}
