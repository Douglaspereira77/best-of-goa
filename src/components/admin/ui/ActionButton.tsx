'use client'

import { Button } from '@/components/ui/button'
import { ReactNode } from 'react'

interface ActionButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  className?: string
}

export function ActionButton({ 
  children, 
  onClick, 
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = ''
}: ActionButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white'
      case 'secondary':
        return 'bg-gray-100 hover:bg-gray-200 text-gray-900'
      case 'destructive':
        return 'bg-red-600 hover:bg-red-700 text-white'
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'h-8 px-3 text-sm'
      case 'md':
        return 'h-10 px-4 text-sm'
      case 'lg':
        return 'h-12 px-6 text-base'
      default:
        return 'h-10 px-4 text-sm'
    }
  }

  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${getVariantStyles()} ${getSizeStyles()} ${className}`}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </Button>
  )
}

