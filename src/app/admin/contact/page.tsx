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
  Mail,
  MessageSquare,
  Trash2,
  Loader2,
  Inbox,
  MailOpen,
  Send,
  Archive,
  User,
} from 'lucide-react'
import { toast } from 'sonner'

interface ContactSubmission {
  id: string
  created_at: string
  updated_at: string
  name: string
  email: string
  reason: string
  subject: string
  message: string
  status: 'new' | 'read' | 'responded' | 'archived'
  admin_notes: string | null
}

interface Counts {
  all: number
  new: number
  read: number
  responded: number
  archived: number
}

type FilterStatus = 'all' | 'new' | 'read' | 'responded' | 'archived'

const reasonLabels: Record<string, string> = {
  general: 'General Inquiry',
  suggestion: 'Suggest a Place',
  correction: 'Report an Error',
  partnership: 'Partnership',
  feedback: 'Feedback',
  other: 'Other',
}

const reasonColors: Record<string, string> = {
  general: 'bg-gray-100 text-gray-800',
  suggestion: 'bg-blue-100 text-blue-800',
  correction: 'bg-orange-100 text-orange-800',
  partnership: 'bg-purple-100 text-purple-800',
  feedback: 'bg-green-100 text-green-800',
  other: 'bg-slate-100 text-slate-800',
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  new: { label: 'New', color: 'bg-yellow-100 text-yellow-800', icon: Mail },
  read: { label: 'Read', color: 'bg-blue-100 text-blue-800', icon: MailOpen },
  responded: { label: 'Responded', color: 'bg-green-100 text-green-800', icon: Send },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-800', icon: Archive },
}

export default function ContactSubmissionsPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([])
  const [counts, setCounts] = useState<Counts>({ all: 0, new: 0, read: 0, responded: 0, archived: 0 })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')

  // Detail dialog
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      const response = await fetch(`/api/admin/contact/list?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load contact submissions')
      }

      setSubmissions(data.submissions)
      setCounts(data.counts)
    } catch (error) {
      toast.error('Failed to load contact submissions')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadSubmissions()
  }

  const openDetail = async (submission: ContactSubmission) => {
    setSelectedSubmission(submission)
    setAdminNotes(submission.admin_notes || '')
    setShowDetailDialog(true)

    // Mark as read if new
    if (submission.status === 'new') {
      try {
        await fetch(`/api/admin/contact/${submission.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'read' }),
        })
        loadSubmissions()
      } catch (error) {
        console.error('Failed to mark as read:', error)
      }
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/contact/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, admin_notes: adminNotes }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      toast.success(`Message marked as ${status}`)
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
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      const response = await fetch(`/api/admin/contact/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete')
      }

      toast.success('Message deleted')
      setShowDetailDialog(false)
      loadSubmissions()
    } catch (error) {
      toast.error('Failed to delete message')
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
        title="Contact Messages"
        description="Review and manage contact form submissions"
      />

      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          {(['all', 'new', 'read', 'responded', 'archived'] as FilterStatus[]).map((status) => {
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
                placeholder="Search by name, email, or subject..."
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
                  <TableHead>From</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No messages found
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.map((submission) => {
                    const StatusIcon = statusConfig[submission.status].icon
                    return (
                      <TableRow
                        key={submission.id}
                        className={`cursor-pointer hover:bg-accent ${submission.status === 'new' ? 'font-medium bg-blue-50/50' : ''}`}
                        onClick={() => openDetail(submission)}
                      >
                        <TableCell>
                          <div className={submission.status === 'new' ? 'font-semibold' : 'font-medium'}>
                            {submission.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {submission.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`truncate max-w-[250px] ${submission.status === 'new' ? 'font-semibold' : ''}`}>
                            {submission.subject}
                          </div>
                          <div className="text-sm text-muted-foreground truncate max-w-[250px]">
                            {submission.message.substring(0, 60)}...
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={reasonColors[submission.reason] || reasonColors.other}>
                            {reasonLabels[submission.reason] || submission.reason}
                          </Badge>
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
                                View Message
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); updateStatus(submission.id, 'responded') }}
                                className="text-green-600"
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Mark Responded
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); updateStatus(submission.id, 'archived') }}
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
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
                  <MessageSquare className="h-5 w-5" />
                  {selectedSubmission.subject}
                </DialogTitle>
                <DialogDescription>
                  Received {formatDate(selectedSubmission.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Status and Reason */}
                <div className="flex items-center gap-2">
                  <Badge className={statusConfig[selectedSubmission.status].color}>
                    {statusConfig[selectedSubmission.status].label}
                  </Badge>
                  <Badge className={reasonColors[selectedSubmission.reason] || reasonColors.other}>
                    {reasonLabels[selectedSubmission.reason] || selectedSubmission.reason}
                  </Badge>
                </div>

                {/* Sender Info */}
                <div className="space-y-3 bg-slate-50 rounded-lg p-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    From
                  </h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{selectedSubmission.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${selectedSubmission.email}`} className="text-blue-600 hover:underline">
                        {selectedSubmission.email}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Message</h4>
                  <div className="bg-white border rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">{selectedSubmission.message}</p>
                  </div>
                </div>

                {/* Quick Reply Link */}
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <a href={`mailto:${selectedSubmission.email}?subject=Re: ${selectedSubmission.subject}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Reply via Email
                    </a>
                  </Button>
                </div>

                {/* Admin Notes */}
                <div className="space-y-2 border-t pt-4">
                  <Label htmlFor="admin-notes">Admin Notes</Label>
                  <Textarea
                    id="admin-notes"
                    placeholder="Add notes about this message..."
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
                  onClick={() => updateStatus(selectedSubmission.id, 'archived')}
                  disabled={updating}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
                <Button
                  onClick={() => updateStatus(selectedSubmission.id, 'responded')}
                  disabled={updating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {updating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Mark Responded
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </SidebarInset>
  )
}
