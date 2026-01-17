'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarInset } from '@/components/ui/sidebar'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface QueuedSchool {
  id: string
  name: string
  area: string | null
  extraction_status: string
  extraction_started_at: string | null
  extraction_completed_at: string | null
  extraction_progress: number
  current_step: string | null
  created_at: string
}

export default function SchoolsQueuePage() {
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const [schools, setSchools] = useState<QueuedSchool[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated) {
      loadQueue()
      // Auto-refresh every 5 seconds
      const interval = setInterval(loadQueue, 5000)
      return () => clearInterval(interval)
    }
  }, [isHydrated])

  const loadQueue = async () => {
    try {
      const response = await fetch('/api/admin/schools/queue')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load queue')
      }

      setSchools(data.schools || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        )
      case 'processing':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Processing
          </Badge>
        )
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        )
      case 'queued':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Queued
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeSince = (dateString: string | null) => {
    if (!dateString) return null
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  if (!isHydrated) {
    return (
      <SidebarInset>
        <AdminPageHeader
          title="Extraction Queue"
          description="Monitor school extraction progress"
          breadcrumbs={[
            { label: 'Schools', href: '/admin/schools' },
            { label: 'Queue' }
          ]}
        />
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </SidebarInset>
    )
  }

  return (
    <SidebarInset>
      <AdminPageHeader
        title="Extraction Queue"
        description="Monitor school extraction progress"
        breadcrumbs={[
          { label: 'Schools', href: '/admin/schools' },
          { label: 'Queue' }
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={loadQueue}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <div className="flex flex-1 flex-col gap-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Queued Schools ({schools.length})
            </CardTitle>
            <p className="text-sm text-gray-500">Auto-refreshes every 5 seconds</p>
          </CardHeader>
          <CardContent>
            {loading && schools.length === 0 ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={loadQueue}>Retry</Button>
              </div>
            ) : schools.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No schools in queue</p>
                <p className="text-sm">Add a school to start extraction</p>
                <Button
                  className="mt-4"
                  onClick={() => router.push('/admin/schools/add')}
                >
                  Add School
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Current Step</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schools.map((school) => (
                      <TableRow
                        key={school.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => router.push(`/admin/schools/${school.id}/review`)}
                      >
                        <TableCell className="font-medium">
                          {school.name}
                          {school.area && (
                            <div className="text-sm text-gray-500">{school.area}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(school.extraction_status)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {school.current_step ? (
                            <span className="capitalize">
                              {school.current_step.replace(/_/g, ' ')}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${school.extraction_progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                              {school.extraction_progress}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm">
                          {formatDate(school.extraction_started_at)}
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm">
                          {getTimeSince(school.extraction_started_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/admin/schools/${school.id}/review`)
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  )
}