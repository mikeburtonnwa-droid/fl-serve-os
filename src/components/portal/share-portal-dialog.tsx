/**
 * Share Portal Dialog Component (F10.1)
 *
 * Dialog for generating and sharing magic link with clients.
 *
 * User Stories: US-035
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  X,
  Link as LinkIcon,
  Mail,
  Copy,
  Check,
  Loader2,
  Send,
  Calendar,
} from 'lucide-react'

interface SharePortalDialogProps {
  engagementId: string
  engagementName: string
  clientName: string
  onClose: () => void
}

export function SharePortalDialog({
  engagementId,
  engagementName,
  clientName,
  onClose,
}: SharePortalDialogProps) {
  const [clientEmail, setClientEmail] = useState('')
  const [clientNameInput, setClientNameInput] = useState('')
  const [expirationDays, setExpirationDays] = useState(7)
  const [sendEmail, setSendEmail] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [portalUrl, setPortalUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/portal/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engagementId,
          clientEmail,
          clientName: clientNameInput || undefined,
          expirationDays,
          sendEmail,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setPortalUrl(data.magicLink.portalUrl)
      } else {
        setError(data.error || 'Failed to create portal link')
      }
    } catch {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (portalUrl) {
      await navigator.clipboard.writeText(portalUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <LinkIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Share with Client</CardTitle>
                <p className="text-sm text-slate-500 mt-0.5">{engagementName}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Client Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Client Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Client Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Client Name (optional)
                </label>
                <Input
                  value={clientNameInput}
                  onChange={(e) => setClientNameInput(e.target.value)}
                  placeholder={clientName}
                />
              </div>

              {/* Expiration */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Link Expires In
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(parseInt(e.target.value))}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value={1}>1 day</option>
                    <option value={3}>3 days</option>
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                  </select>
                  <Calendar className="h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* Send Email Option */}
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="h-4 w-4"
                />
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    Send email invitation
                  </div>
                  <div className="text-xs text-slate-500">
                    The client will receive an email with the portal link
                  </div>
                </div>
              </label>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Create Link
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Success State */}
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Portal Link Created!
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {sendEmail
                    ? `An email has been sent to ${clientEmail}`
                    : 'Copy the link below to share with your client'}
                </p>
              </div>

              {/* Portal URL */}
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">Portal Link</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm text-slate-700 truncate">
                    {portalUrl}
                  </code>
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Expiration Notice */}
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar className="h-4 w-4" />
                Expires in {expirationDays} days
              </div>

              {/* Close Button */}
              <Button variant="outline" className="w-full" onClick={onClose}>
                Done
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
