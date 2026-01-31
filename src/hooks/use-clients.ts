'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Client } from '@/types/database'

interface UseClientsOptions {
  status?: string
  search?: string
}

export function useClients(options: UseClientsOptions = {}) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams()
    if (options.status) params.set('status', options.status)
    if (options.search) params.set('search', options.search)

    try {
      const res = await fetch(`/api/clients?${params.toString()}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch clients')
      }

      setClients(data.clients)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [options.status, options.search])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const createClient = async (clientData: Partial<Client>) => {
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientData),
    })
    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Failed to create client')
    }

    setClients((prev) => [data.client, ...prev])
    return data.client
  }

  const updateClient = async (id: string, clientData: Partial<Client>) => {
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientData),
    })
    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Failed to update client')
    }

    setClients((prev) =>
      prev.map((c) => (c.id === id ? data.client : c))
    )
    return data.client
  }

  const deleteClient = async (id: string) => {
    const res = await fetch(`/api/clients/${id}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to delete client')
    }

    setClients((prev) => prev.filter((c) => c.id !== id))
  }

  return {
    clients,
    loading,
    error,
    refetch: fetchClients,
    createClient,
    updateClient,
    deleteClient,
  }
}

export function useClient(id: string) {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClient = async () => {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/clients/${id}`)
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch client')
        }

        setClient(data.client)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchClient()
    }
  }, [id])

  return { client, loading, error }
}
