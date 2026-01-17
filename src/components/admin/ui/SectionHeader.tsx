'use client'

import { ReactNode } from 'react'

interface SectionHeaderProps {
  title: string
  icon?: ReactNode
  subtitle?: string
  className?: string
}

export function SectionHeader({ 
  title, 
  icon, 
  subtitle, 
  className = '' 
}: SectionHeaderProps) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {icon && (
        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
          {icon}
        </div>
      )}
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-600">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

