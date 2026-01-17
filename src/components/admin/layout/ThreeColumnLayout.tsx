'use client'

import { ReactNode } from 'react'

interface ThreeColumnLayoutProps {
  leftColumn: ReactNode
  centerColumn: ReactNode
  rightColumn: ReactNode
  className?: string
}

export function ThreeColumnLayout({ 
  leftColumn, 
  centerColumn, 
  rightColumn, 
  className = '' 
}: ThreeColumnLayoutProps) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 ${className}`} suppressHydrationWarning>
      {/* Left Column - Context */}
      <div className="lg:col-span-4 space-y-6" suppressHydrationWarning>
        {leftColumn}
      </div>
      
      {/* Center Column - Extracted Data */}
      <div className="lg:col-span-4 space-y-6" suppressHydrationWarning>
        {centerColumn}
      </div>
      
      {/* Right Column - Menu/Additional Info */}
      <div className="lg:col-span-4 space-y-6" suppressHydrationWarning>
        {rightColumn}
      </div>
    </div>
  )
}

