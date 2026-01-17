'use client'

import { useState, useEffect } from 'react'
import { SidebarInset } from '@/components/ui/sidebar'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { StatsCards } from '@/components/admin/dashboard/StatsCards'
import { RecentImports } from '@/components/admin/dashboard/RecentImports'
import { QuickActions } from '@/components/admin/dashboard/QuickActions'
import { AlertCircle } from 'lucide-react'

interface DashboardStats {
  pending_review: number
  published: number
  processing: number
  failed: number
  total_restaurants: number
  recent_imports: number
}

interface RecentImport {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress_percentage: number
  current_step?: string
  created_at: string
  error_message?: string
}

export default function AdminDashboard() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentImports, setRecentImports] = useState<RecentImport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Hydration effect
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated) {
      const fetchDashboardData = async () => {
        try {
          setLoading(true)
          
          // Fetch stats and recent imports in parallel
          const [statsResponse, importsResponse] = await Promise.all([
            fetch('/api/admin/dashboard/stats'),
            fetch('/api/admin/restaurants/queue?limit=5')
          ])

          if (!statsResponse.ok || !importsResponse.ok) {
            throw new Error('Failed to fetch dashboard data')
          }

          const statsData = await statsResponse.json()
          const importsData = await importsResponse.json()

          setStats(statsData.stats)
          setRecentImports(importsData.restaurants)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard')
        } finally {
          setLoading(false)
        }
      }

      fetchDashboardData()
    }
  }, [isHydrated])

  // Show loading skeleton until hydrated
  if (!isHydrated) {
    return (
      <SidebarInset>
        <AdminPageHeader
          title="Admin Dashboard"
          description="Overview of restaurant management system"
        />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </SidebarInset>
    )
  }

  if (error) {
    return (
      <SidebarInset>
        <AdminPageHeader
          title="Admin Dashboard"
          description="Overview of restaurant management system"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </SidebarInset>
    )
  }

  return (
    <SidebarInset>
      <AdminPageHeader
        title="Admin Dashboard"
        description="Overview of restaurant management system"
      />
      
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Stats Cards */}
        <StatsCards stats={stats || {
          pending_review: 0,
          published: 0,
          processing: 0,
          failed: 0,
          total_restaurants: 0,
          recent_imports: 0
        }} loading={loading} />

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Imports */}
          <div className="md:col-span-1">
            <RecentImports imports={recentImports} loading={loading} />
          </div>
          
          {/* Quick Actions */}
          <div className="md:col-span-1">
            <QuickActions 
              pendingCount={stats?.pending_review || 0}
              processingCount={stats?.processing || 0}
            />
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <span className="text-blue-600 font-bold text-sm">T</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-900">
                  {stats?.total_restaurants || 0}
                </div>
                <div className="text-sm text-blue-700">Total Restaurants</div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <span className="text-green-600 font-bold text-sm">R</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-900">
                  {stats?.recent_imports || 0}
                </div>
                <div className="text-sm text-green-700">Imported This Week</div>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <span className="text-purple-600 font-bold text-sm">Q</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-900">
                  {(stats?.pending_review || 0) + (stats?.processing || 0)}
                </div>
                <div className="text-sm text-purple-700">In Queue</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>
  )
}
