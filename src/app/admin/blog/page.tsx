'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SidebarInset } from '@/components/ui/sidebar'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Trash2,
  Star,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'

interface BlogArticle {
  id: string
  slug: string
  category: string
  title: string
  excerpt: string | null
  status: 'draft' | 'published'
  featured: boolean
  featuredImage: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

const categoryLabels: Record<string, string> = {
  restaurants: 'Restaurants',
  hotels: 'Hotels',
  malls: 'Shopping',
  attractions: 'Attractions',
  fitness: 'Fitness',
  schools: 'Schools',
  guides: 'Guides',
}

const categoryColors: Record<string, string> = {
  restaurants: 'bg-orange-100 text-orange-700',
  hotels: 'bg-blue-100 text-blue-700',
  malls: 'bg-purple-100 text-purple-700',
  attractions: 'bg-green-100 text-green-700',
  fitness: 'bg-cyan-100 text-cyan-700',
  schools: 'bg-yellow-100 text-yellow-700',
  guides: 'bg-slate-100 text-slate-700',
}

export default function BlogAdminPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [articles, setArticles] = useState<BlogArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [totalCount, setTotalCount] = useState(0)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [articleToUnpublish, setArticleToUnpublish] = useState<BlogArticle | null>(null)
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false)
  const [articleToDelete, setArticleToDelete] = useState<BlogArticle | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated) {
      loadArticles()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter, isHydrated])

  const loadArticles = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      params.append('limit', '100')

      const response = await fetch(`/api/admin/blog/list?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load articles')
      }

      setArticles(data.articles || [])
      setTotalCount(data.pagination?.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load articles')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadArticles()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handlePublish = async (article: BlogArticle) => {
    try {
      setPublishingId(article.id)

      const response = await fetch(`/api/admin/blog/${article.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to publish article')
      }

      toast.success('Article published successfully')
      loadArticles()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish')
    } finally {
      setPublishingId(null)
    }
  }

  const handleUnpublish = async () => {
    if (!articleToUnpublish) return

    try {
      setPublishingId(articleToUnpublish.id)

      const response = await fetch(`/api/admin/blog/${articleToUnpublish.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unpublish' })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to unpublish article')
      }

      toast.success('Article unpublished successfully')
      loadArticles()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to unpublish')
    } finally {
      setPublishingId(null)
      setShowUnpublishDialog(false)
      setArticleToUnpublish(null)
    }
  }

  const handleDelete = async () => {
    if (!articleToDelete) return

    try {
      const response = await fetch(`/api/admin/blog/${articleToDelete.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete article')
      }

      toast.success('Article deleted successfully')
      loadArticles()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setShowDeleteDialog(false)
      setArticleToDelete(null)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <SidebarInset>
      <AdminPageHeader
        title="Blog Articles"
        description="Manage blog articles and guides"
        breadcrumbs={[{ label: 'Blog' }]}
        actions={
          <Button variant="outline" onClick={loadArticles}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        }
      />

      <div className="p-6">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="restaurants">Restaurants</SelectItem>
                  <SelectItem value="hotels">Hotels</SelectItem>
                  <SelectItem value="malls">Shopping</SelectItem>
                  <SelectItem value="attractions">Attractions</SelectItem>
                  <SelectItem value="fitness">Fitness</SelectItem>
                  <SelectItem value="schools">Schools</SelectItem>
                  <SelectItem value="guides">Guides</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch}>Search</Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totalCount}</div>
              <p className="text-sm text-gray-500">Total Articles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {articles.filter(a => a.status === 'published').length}
              </div>
              <p className="text-sm text-gray-500">Published</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">
                {articles.filter(a => a.status === 'draft').length}
              </div>
              <p className="text-sm text-gray-500">Drafts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {articles.filter(a => a.featured).length}
              </div>
              <p className="text-sm text-gray-500">Featured</p>
            </CardContent>
          </Card>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-500">
              Run the blog generation script to create articles.
            </p>
            <code className="mt-4 block text-sm bg-gray-100 px-4 py-2 rounded">
              node scripts/generate-blog-articles.js
            </code>
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell>
                      {article.featuredImage ? (
                        <div className="relative w-16 h-12 rounded overflow-hidden bg-gray-100">
                          <Image
                            src={article.featuredImage}
                            alt={article.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-12 rounded bg-gray-100 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{article.title}</span>
                        {article.featured && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      {article.excerpt && (
                        <p className="text-sm text-gray-500 truncate max-w-md">
                          {article.excerpt}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={categoryColors[article.category] || 'bg-gray-100'}>
                        {categoryLabels[article.category] || article.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={article.status === 'published' ? 'default' : 'secondary'}
                        className={
                          article.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }
                      >
                        {article.status === 'published' ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(article.publishedAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {/* View published */}
                        {article.status === 'published' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link
                              href={`/blog/${article.category}/${article.slug}`}
                              target="_blank"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </Button>
                        )}

                        {/* Publish/Unpublish */}
                        {article.status === 'published' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setArticleToUnpublish(article)
                              setShowUnpublishDialog(true)
                            }}
                            disabled={publishingId === article.id}
                          >
                            {publishingId === article.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-yellow-600" />
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePublish(article)}
                            disabled={publishingId === article.id}
                          >
                            {publishingId === article.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Eye className="w-4 h-4 text-green-600" />
                            )}
                          </Button>
                        )}

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setArticleToDelete(article)
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Unpublish Dialog */}
      <AlertDialog open={showUnpublishDialog} onOpenChange={setShowUnpublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unpublish Article?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove &quot;{articleToUnpublish?.title}&quot; from the public blog.
              The article will be saved as a draft and can be republished later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setArticleToUnpublish(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleUnpublish}>
              Unpublish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{articleToDelete?.title}&quot;.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setArticleToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarInset>
  )
}
