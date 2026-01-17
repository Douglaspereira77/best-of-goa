'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Eye, Settings, BarChart3, Users, FileText } from 'lucide-react'
import Link from 'next/link'

interface QuickActionsProps {
  pendingCount?: number
  processingCount?: number
}

export function QuickActions({ pendingCount = 0, processingCount = 0 }: QuickActionsProps) {
  const actions = [
    {
      title: 'Add Restaurant',
      description: 'Import a new restaurant from Google Places',
      icon: <Plus className="h-5 w-5" />,
      href: '/admin/restaurants/add',
      variant: 'default' as const,
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'View Queue',
      description: 'Manage import queue and processing status',
      icon: <BarChart3 className="h-5 w-5" />,
      href: '/admin/restaurants/queue',
      variant: 'outline' as const,
      color: 'bg-white hover:bg-gray-50',
      badge: processingCount > 0 ? processingCount : undefined
    },
    {
      title: 'Review Restaurants',
      description: 'Review and publish pending restaurants',
      icon: <Eye className="h-5 w-5" />,
      href: '/admin/restaurants',
      variant: 'outline' as const,
      color: 'bg-white hover:bg-gray-50',
      badge: pendingCount > 0 ? pendingCount : undefined
    },
    {
      title: 'Analytics',
      description: 'View site analytics and performance',
      icon: <BarChart3 className="h-5 w-5" />,
      href: '/admin/analytics',
      variant: 'outline' as const,
      color: 'bg-white hover:bg-gray-50'
    },
    {
      title: 'Settings',
      description: 'Configure system settings and preferences',
      icon: <Settings className="h-5 w-5" />,
      href: '/admin/settings',
      variant: 'outline' as const,
      color: 'bg-white hover:bg-gray-50'
    },
    {
      title: 'Documentation',
      description: 'View admin guides and documentation',
      icon: <FileText className="h-5 w-5" />,
      href: '/admin/docs',
      variant: 'outline' as const,
      color: 'bg-white hover:bg-gray-50'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Common tasks and navigation shortcuts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Button
                variant={action.variant}
                className={`w-full h-auto p-4 flex flex-col items-start gap-3 ${action.color}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    {action.icon}
                    <span className="font-medium">{action.title}</span>
                  </div>
                  {action.badge && (
                    <Badge variant="secondary" className="ml-2">
                      {action.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-left opacity-80">
                  {action.description}
                </p>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

