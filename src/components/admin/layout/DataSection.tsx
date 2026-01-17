'use client'

import { ReactNode } from 'react'
import { SectionCard } from './SectionCard'

interface DataField {
  label: string
  value: string | ReactNode
  copyable?: boolean
  link?: string
  className?: string
}

interface DataSectionProps {
  title: string
  icon?: ReactNode
  fields: DataField[]
  loading?: boolean
  className?: string
  badge?: string
}

export function DataSection({ 
  title, 
  icon, 
  fields, 
  loading = false,
  className = '',
  badge 
}: DataSectionProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <SectionCard
      title={title}
      icon={icon}
      className={className}
      badge={badge}
    >
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={index} className={`${field.className || ''}`}>
              <div className="flex items-start justify-between">
                <span className="text-sm text-gray-600 font-medium">
                  {field.label}
                </span>
                <div className="flex items-center space-x-2">
                  {typeof field.value === 'string' ? (
                    <span className="text-sm text-gray-900 font-medium text-right break-all">
                      {field.value}
                    </span>
                  ) : (
                    field.value
                  )}
                  {field.copyable && typeof field.value === 'string' && (
                    <button
                      onClick={() => copyToClipboard(field.value as string)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Copy
                    </button>
                  )}
                  {field.link && (
                    <a
                      href={field.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      View
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

