'use client'

import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'

export type StatusVariant = 'pending' | 'running' | 'processing' | 'completed' | 'failed' | 'published' | 'draft'

interface StatusBadgeProps {
  status: StatusVariant
  className?: string
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const getStatusConfig = (status: StatusVariant) => {
    switch (status) {
      case 'completed':
      case 'published':
        return {
          label: status === 'completed' ? 'Completed' : 'Published',
          icon: <CheckCircle className="w-3 h-3" />,
          className: 'bg-green-100 text-green-800 border-green-200'
        }
      case 'failed':
        return {
          label: 'Failed',
          icon: <XCircle className="w-3 h-3" />,
          className: 'bg-red-100 text-red-800 border-red-200'
        }
      case 'running':
      case 'processing':
        return {
          label: status === 'running' ? 'Running' : 'Processing',
          icon: <Loader2 className="w-3 h-3 animate-spin" />,
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        }
      case 'pending':
        return {
          label: 'Pending',
          icon: <Clock className="w-3 h-3" />,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        }
      case 'draft':
        return {
          label: 'Draft',
          icon: <Clock className="w-3 h-3" />,
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        }
      default:
        return {
          label: 'Unknown',
          icon: <Clock className="w-3 h-3" />,
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <Badge 
      variant="outline" 
      className={`flex items-center space-x-1 ${config.className} ${className}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  )
}

