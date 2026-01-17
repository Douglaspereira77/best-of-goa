'use client'

import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface AdminPageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
}

export function AdminPageHeader({ 
  title, 
  description, 
  breadcrumbs = [], 
  actions 
}: AdminPageHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b bg-white px-6 py-4" suppressHydrationWarning>
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
      </div>
      <div className="flex-1" suppressHydrationWarning>
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center space-x-1 text-sm text-gray-500 mb-2" suppressHydrationWarning>
            <Link href="/admin" className="flex items-center hover:text-gray-700">
              <Home className="w-4 h-4 mr-1" />
              Admin
            </Link>
            {breadcrumbs.map((item, index) => (
              <div key={index} className="flex items-center" suppressHydrationWarning>
                <ChevronRight className="w-4 h-4 mx-1" />
                {item.href ? (
                  <Link href={item.href} className="hover:text-gray-700">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-gray-900 font-medium">{item.label}</span>
                )}
              </div>
            ))}
          </nav>
        )}
        
        {/* Title and Description */}
        <div suppressHydrationWarning>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      </div>
      
      {/* Actions */}
      {actions && (
        <div className="flex items-center space-x-3" suppressHydrationWarning>
          {actions}
        </div>
      )}
    </div>
  )
}

