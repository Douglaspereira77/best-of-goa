'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Clock, CheckCircle, XCircle, Eye, Plus } from 'lucide-react'

interface DashboardStats {
  pending_review: number
  published: number
  processing: number
  failed: number
  total_restaurants: number
  recent_imports: number
}

interface StatsCardsProps {
  stats: DashboardStats
  loading?: boolean
}

export function StatsCards({ stats, loading = false }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const statCards = [
    {
      title: 'Pending Review',
      value: stats.pending_review,
      description: 'Awaiting admin review',
      icon: <Clock className="h-4 w-4" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      trend: '+12%'
    },
    {
      title: 'Published',
      value: stats.published,
      description: 'Live on the site',
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      trend: '+8%'
    },
    {
      title: 'Processing',
      value: stats.processing,
      description: 'Extracting data',
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: '+3%'
    },
    {
      title: 'Failed',
      value: stats.failed,
      description: 'Need attention',
      icon: <XCircle className="h-4 w-4" />,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      trend: '-2%'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${stat.bgColor}`}>
              <div className={stat.color}>
                {stat.icon}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
            <div className="flex items-center mt-2">
              <Badge variant="outline" className="text-xs">
                {stat.trend}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

