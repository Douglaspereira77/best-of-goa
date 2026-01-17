'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Clock, CheckCircle, XCircle, Eye, ArrowRight, Plus } from 'lucide-react'
import Link from 'next/link'

interface RecentImport {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress_percentage: number
  current_step?: string
  created_at: string
  error_message?: string
}

interface RecentImportsProps {
  imports: RecentImport[]
  loading?: boolean
}

export function RecentImports({ imports, loading = false }: RecentImportsProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'processing':
        return <Clock className="h-4 w-4 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'failed':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'processing':
        return <Badge variant="default">Processing</Badge>
      case 'completed':
        return <Badge variant="outline">Ready for Review</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600'
      case 'processing':
        return 'text-blue-600'
      case 'completed':
        return 'text-green-600'
      case 'failed':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Imports</CardTitle>
          <CardDescription>Latest restaurant import activities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-2 bg-gray-200 rounded"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Imports</CardTitle>
            <CardDescription>Latest restaurant import activities</CardDescription>
          </div>
          <Link href="/admin/restaurants/queue">
            <Button variant="outline" size="sm">
              View All
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {imports.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Imports</h3>
            <p className="text-gray-600 mb-4">Start by adding your first restaurant</p>
            <Link href="/admin/restaurants/add">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Restaurant
              </Button>
            </Link>
          </div>
        ) : (
          imports.map((importItem) => (
            <div key={importItem.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{importItem.name}</h4>
                    {getStatusBadge(importItem.status)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{formatTimeAgo(importItem.created_at)}</span>
                    {importItem.current_step && (
                      <>
                        <span>•</span>
                        <span>{importItem.current_step}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {importItem.status === 'completed' && (
                    <Link href={`/admin/restaurants/${importItem.id}/review`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3 mr-1" />
                        Review
                      </Button>
                    </Link>
                  )}
                  {importItem.status === 'failed' && (
                    <Button variant="outline" size="sm">
                      Retry
                    </Button>
                  )}
                </div>
              </div>
              
              {importItem.status === 'processing' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{importItem.progress_percentage}%</span>
                  </div>
                  <Progress value={importItem.progress_percentage} className="h-2" />
                </div>
              )}
              
              {importItem.status === 'failed' && importItem.error_message && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-800 font-medium">Error</p>
                      <p className="text-sm text-red-700">{importItem.error_message}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

