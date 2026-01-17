'use client'

import { useState, useEffect } from 'react'
import { SidebarInset } from '@/components/ui/sidebar'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Search,
  RefreshCw,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  ExternalLink,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Loader2,
  Inbox,
} from 'lucide-react'
import { toast } from 'sonner'

interface Submission {
  id: string
  created_at: string
  updated_at: string
  status: 'pending' | 'in_review' | 'approved' | 'rejected'
  reviewed_at: string | null
  reviewed_by: string | null
  admin_notes: string | null
  business_name: string
  category: string
  website: string | null
  google_maps_url: string | null
  address: string | null
  area: string | null
  governorate: string
  phone: string | null
  email: string | null
  instagram: string | null
  submitter_name: string
  submitter_email: string
  submitter_phone: string | null
  relationship: string
  description: string | null
  why_best: string | null
}

interface Counts {
  all: number
  pending: number
  in_review: number
  approved: number
  rejected: number
}

type FilterStatus = 'all' | 'pending' | 'in_review' | 'approved' | 'rejected'

const categoryLabels: Record<string, string> = {
  restaurant: 'Restaurant',
  hotel: 'Hotel',
  mall: 'Mall',
  attraction: 'Attraction',
  fitness: 'Fitness',
  school: 'School',
}

const categoryColors: Record<string, string> = {
  restaurant: 'bg-orange-100 text-orange-800',
  hotel: 'bg-blue-100 text-blue-800',
  mall: 'bg-purple-100 text-purple-800',
  attraction: 'bg-green-100 text-green-800',
  fitness: 'bg-red-100 text-red-800',
  school: 'bg-yellow-100 text-yellow-800',
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  in_review: { label: 'In Review', color: 'bg-blue-100 text-blue-800', icon: Eye },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
}

export default function SubmissionsPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [counts, setCounts] = useState<Counts>({ all: 0, pending: 0, in_review: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')

  // Detail dialog
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated) {
      loadSubmissions()
    }
  }, [statusFilter, isHydrated])

  const loadSubmissions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await fetch(`/api/admin/submissions/list?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load submissions')
      }

      setSubmissions(data.submissions)
      setCounts(data.counts)
    } catch (error) {
      toast.error('Failed to load submissions')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadSubmissions()
  }

  const openDetail = (submission: Submission) => {
    setSelectedSubmission(submission)
    setAdminNotes(submission.admin_notes || '')
    setShowDetailDialog(true)
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, admin_notes: adminNotes }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      toast.success(`Submission ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'updated'}`)
      setShowDetailDialog(false)
      loadSubmissions()
    } catch (error) {
      toast.error('Failed to update submission')
      console.error(error)
    } finally {
      setUpdating(false)
    }
  }

  const deleteSubmission = async (id: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return

    try {
      const response = await fetch(`/api/admin/submissions/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete')
      }

      toast.success('Submission deleted')
      setShowDetailDialog(false)
      loadSubmissions()
    } catch (error) {
      toast.error('Failed to delete submission')
      console.error(error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!isHydrated) {
    return null
  }

  return (
    <SidebarInset>
      <AdminPageHeader
        title="Business Submissions"
        description="Review and manage business submissions from the public form"
      />

      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          {(['all', 'pending', 'in_review', 'approved', 'rejected'] as FilterStatus[]).map((status) => {
            const config = status === 'all'
              ? { label: 'All', color: 'bg-gray-100 text-gray-800', icon: Inbox }
              : statusConfig[status]
            const Icon = config.icon
            const isActive = statusFilter === status

            return (
              <Card
                key={status}
                className={`cursor-pointer transition-all ${isActive ? 'ring-2 ring-primary' : 'hover:bg-accent'}`}
                onClick={() => setStatusFilter(status)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{counts[status]}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Search and Refresh */}
        <div className="flex items-center gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by business or submitter name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>
          <Button variant="outline" onClick={loadSubmissions} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Submitter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No submissions found
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.map((submission) => {
                    const StatusIcon = statusConfig[submission.status].icon
                    return (
                      <TableRow
                        key={submission.id}
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => openDetail(submission)}
                      >
                        <TableCell>
                          <div className="font-medium">{submission.business_name}</div>
                          {submission.website && (
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {submission.website}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={categoryColors[submission.category]}>
                            {categoryLabels[submission.category]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>{submission.area || '-'}</div>
                          <div className="text-sm text-muted-foreground">{submission.governorate}</div>
                        </TableCell>
                        <TableCell>
                          <div>{submission.submitter_name}</div>
                          <div className="text-sm text-muted-foreground">{submission.relationship}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig[submission.status].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[submission.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(submission.created_at)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDetail(submission) }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); updateStatus(submission.id, 'approved') }}
                                className="text-green-600"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); updateStatus(submission.id, 'rejected') }}
                                className="text-red-600"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); deleteSubmission(submission.id) }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedSubmission && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {selectedSubmission.business_name}
                </DialogTitle>
                <DialogDescription>
                  Submitted {formatDate(selectedSubmission.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Current Status:</span>
                  <Badge className={statusConfig[selectedSubmission.status].color}>
                    {statusConfig[selectedSubmission.status].label}
                  </Badge>
                  <Badge className={categoryColors[selectedSubmission.category]}>
                    {categoryLabels[selectedSubmission.category]}
                  </Badge>
                </div>

                {/* Business Info */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Business Information</h4>
                  <div className="grid gap-2 text-sm">
                    {selectedSubmission.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a href={selectedSubmission.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                          {selectedSubmission.website}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {selectedSubmission.google_maps_url && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <a href={selectedSubmission.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                          View on Google Maps
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {selectedSubmission.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>{selectedSubmission.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedSubmission.area ? `${selectedSubmission.area}, ` : ''}{selectedSubmission.governorate}</span>
                    </div>
                    {selectedSubmission.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedSubmission.phone}</span>
                      </div>
                    )}
                    {selectedSubmission.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedSubmission.email}</span>
                      </div>
                    )}
                    {selectedSubmission.instagram && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">IG:</span>
                        <span>{selectedSubmission.instagram}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {selectedSubmission.description && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Description</h4>
                    <p className="text-sm text-muted-foreground">{selectedSubmission.description}</p>
                  </div>
                )}

                {/* Why Best */}
                {selectedSubmission.why_best && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Why should this be on Best of Goa?</h4>
                    <p className="text-sm text-muted-foreground">{selectedSubmission.why_best}</p>
                  </div>
                )}

                {/* Submitter Info */}
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Submitter Information
                  </h4>
                  <div className="grid gap-2 text-sm">
                    <div><strong>Name:</strong> {selectedSubmission.submitter_name}</div>
                    <div><strong>Email:</strong> {selectedSubmission.submitter_email}</div>
                    {selectedSubmission.submitter_phone && (
                      <div><strong>Phone:</strong> {selectedSubmission.submitter_phone}</div>
                    )}
                    <div><strong>Relationship:</strong> {selectedSubmission.relationship}</div>
                  </div>
                </div>

                {/* Admin Notes */}
                <div className="space-y-2 border-t pt-4">
                  <Label htmlFor="admin-notes">Admin Notes</Label>
                  <Textarea
                    id="admin-notes"
                    placeholder="Add notes about this submission..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => deleteSubmission(selectedSubmission.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <div className="flex-1" />
                <Button
                  variant="outline"
                  onClick={() => updateStatus(selectedSubmission.id, 'in_review')}
                  disabled={updating}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Mark In Review
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => updateStatus(selectedSubmission.id, 'rejected')}
                  disabled={updating}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => updateStatus(selectedSubmission.id, 'approved')}
                  disabled={updating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {updating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Approve
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </SidebarInset>
  )
}
