'use client'

import { useState, useEffect } from 'react'
import { SidebarInset } from '@/components/ui/sidebar'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { StatusBadge } from '@/components/admin/ui/StatusBadge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  RefreshCw,
  ShoppingBag,
  CheckCircle,
  XCircle,
  Loader2,
  Eye
} from 'lucide-react'
import Link from 'next/link'

interface QueueMall {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress_percentage: number
  current_step?: string | null
  error_message?: string | null
  completed_steps?: number
  total_steps?: number
  created_at: string
  updated_at: string
  thumbnail_url?: string
}

type FilterStatus = 'all' | 'pending' | 'processing' | 'completed' | 'failed'

export default function MallQueuePage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [malls, setMalls] = useState<QueueMall[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated) {
      loadMalls()
      // Auto-refresh every 5 seconds if any malls are processing
      const interval = setInterval(() => {
        if (malls.some(m => m.status === 'processing')) {
          loadMalls()
        }
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [statusFilter, searchQuery, isHydrated])

  const loadMalls = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/admin/malls/queue?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load malls')
      }

      setMalls(data.malls || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load malls')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setSearchQuery(searchInput)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <ShoppingBag className="h-5 w-5 text-gray-400" />
    }
  }

  const stats = {
    total: malls.length,
    pending: malls.filter(m => m.status === 'pending').length,
    processing: malls.filter(m => m.status === 'processing').length,
    completed: malls.filter(m => m.status === 'completed').length,
    failed: malls.filter(m => m.status === 'failed').length,
  }

  if (!isHydrated) {
    return null
  }

  return (
    <SidebarInset>
      <AdminPageHeader
        title="Mall Extraction Queue"
        description="Monitor and manage mall data extraction jobs"
        breadcrumbs={[
          { label: 'Malls', href: '/admin/malls' },
          { label: 'Extraction Queue' }
        ]}
      />

      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-500">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.processing}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex flex-1 gap-2">
                <Input
                  placeholder="Search malls..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="max-w-sm"
                />
                <Button onClick={handleSearch} variant="secondary">
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as FilterStatus)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={loadMalls} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mall List */}
        <Card>
          <CardContent className="pt-6">
            {loading && malls.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="py-8 text-center text-red-500">{error}</div>
            ) : malls.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No malls found. Start by adding malls from the Add Mall page.
              </div>
            ) : (
              <div className="space-y-4">
                {malls.map((mall) => (
                  <div
                    key={mall.id}
                    className="flex items-center gap-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                  >
                    {mall.thumbnail_url ? (
                      <img
                        src={mall.thumbnail_url}
                        alt={mall.name}
                        className="h-16 w-16 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded bg-muted">
                        <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(mall.status)}
                        <h3 className="font-semibold">{mall.name}</h3>
                        <StatusBadge status={mall.status === 'processing' ? 'running' : mall.status} />
                      </div>

                      {mall.status === 'processing' && (
                        <div className="space-y-1">
                          <Progress value={mall.progress_percentage} className="h-2" />
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{mall.progress_percentage}% complete</span>
                            {mall.completed_steps !== undefined && mall.total_steps && (
                              <span>({mall.completed_steps}/{mall.total_steps} steps)</span>
                            )}
                          </div>
                          {mall.current_step && (
                            <p className="text-xs text-blue-600 font-medium">
                              Current: {mall.current_step}
                            </p>
                          )}
                        </div>
                      )}

                      {mall.status === 'failed' && mall.error_message && (
                        <div className="mt-1 rounded bg-red-50 p-2 text-xs text-red-700">
                          <span className="font-medium">Error: </span>
                          {mall.error_message}
                        </div>
                      )}

                      {mall.status === 'failed' && mall.current_step && (
                        <p className="text-xs text-red-600 font-medium">
                          {mall.current_step}
                        </p>
                      )}

                      {mall.status === 'completed' && mall.completed_steps !== undefined && (
                        <p className="text-xs text-green-600">
                          All {mall.total_steps} extraction steps completed
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(mall.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/admin/malls/${mall.id}/review`}>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  )
}
