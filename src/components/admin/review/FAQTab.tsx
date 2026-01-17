'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Edit2, Trash2, Plus, Star, Check, X } from 'lucide-react'

export interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  relevance_score: number
  is_featured: boolean
  source: 'ai_generated' | 'review_based' | 'manual'
  display_order: number
}

interface FAQTabProps {
  restaurantId: string
  faqs: FAQ[]
  onUpdate: (faqId: string, updates: Partial<FAQ>) => Promise<void>
  onDelete: (faqId: string) => Promise<void>
  onAdd: (faq: Omit<FAQ, 'id' | 'display_order'>) => Promise<void>
}

const FAQ_CATEGORIES = [
  { value: 'reservations', label: 'Reservations' },
  { value: 'hours', label: 'Operating Hours' },
  { value: 'parking', label: 'Parking' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'dietary', label: 'Dietary Options' },
  { value: 'payment', label: 'Payment Methods' },
  { value: 'service', label: 'Service & Wait Times' },
  { value: 'menu', label: 'Menu & Dishes' },
  { value: 'atmosphere', label: 'Atmosphere' },
  { value: 'delivery', label: 'Delivery & Takeout' },
  { value: 'dress_code', label: 'Dress Code' },
  { value: 'general', label: 'General' }
]

export function FAQTab({ restaurantId, faqs, onUpdate, onDelete, onAdd }: FAQTabProps) {
  const [isAddingFAQ, setIsAddingFAQ] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [newFAQ, setNewFAQ] = useState({
    question: '',
    answer: '',
    category: 'general',
    relevance_score: 50,
    is_featured: false
  })

  const [editingFAQ, setEditingFAQ] = useState<Partial<FAQ> | null>(null)

  const handleAddFAQ = async () => {
    if (!newFAQ.question.trim() || !newFAQ.answer.trim()) {
      alert('Please fill in both question and answer')
      return
    }

    setLoading(true)
    try {
      await onAdd({
        ...newFAQ,
        source: 'manual'
      })
      setNewFAQ({ question: '', answer: '', category: 'general', relevance_score: 50, is_featured: false })
      setIsAddingFAQ(false)
    } catch (error) {
      console.error('Failed to add FAQ:', error)
      alert('Failed to add FAQ')
    } finally {
      setLoading(false)
    }
  }

  const handleEditStart = (faq: FAQ) => {
    setEditingId(faq.id)
    setEditingFAQ({ ...faq })
  }

  const handleEditSave = async () => {
    if (!editingFAQ || !editingId) return

    if (!editingFAQ.question?.trim() || !editingFAQ.answer?.trim()) {
      alert('Please fill in both question and answer')
      return
    }

    setLoading(true)
    try {
      await onUpdate(editingId, editingFAQ)
      setEditingId(null)
      setEditingFAQ(null)
    } catch (error) {
      console.error('Failed to update FAQ:', error)
      alert('Failed to update FAQ')
    } finally {
      setLoading(false)
    }
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditingFAQ(null)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return

    setLoading(true)
    try {
      await onDelete(deleteId)
      setDeleteId(null)
    } catch (error) {
      console.error('Failed to delete FAQ:', error)
      alert('Failed to delete FAQ')
    } finally {
      setLoading(false)
    }
  }

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'ai_generated':
        return 'bg-blue-100 text-blue-800'
      case 'review_based':
        return 'bg-purple-100 text-purple-800'
      case 'manual':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      reservations: 'bg-orange-100 text-orange-800',
      hours: 'bg-blue-100 text-blue-800',
      parking: 'bg-yellow-100 text-yellow-800',
      pricing: 'bg-green-100 text-green-800',
      dietary: 'bg-pink-100 text-pink-800',
      payment: 'bg-indigo-100 text-indigo-800',
      service: 'bg-red-100 text-red-800',
      menu: 'bg-cyan-100 text-cyan-800',
      atmosphere: 'bg-violet-100 text-violet-800',
      delivery: 'bg-lime-100 text-lime-800',
      dress_code: 'bg-amber-100 text-amber-800',
      general: 'bg-gray-100 text-gray-800'
    }
    return colors[category] || colors.general
  }

  const sortedFAQs = [...faqs].sort((a, b) => b.relevance_score - a.relevance_score)

  return (
    <div className="space-y-6">
      {/* FAQ Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle>FAQ Overview</CardTitle>
          <CardDescription>
            Manage frequently asked questions for this restaurant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{faqs.length}</div>
              <div className="text-sm text-gray-600">Total FAQs</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{faqs.filter(f => f.source === 'ai_generated').length}</div>
              <div className="text-sm text-blue-700">AI Generated</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{faqs.filter(f => f.source === 'review_based').length}</div>
              <div className="text-sm text-purple-700">Review-Based</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{faqs.filter(f => f.is_featured).length}</div>
              <div className="text-sm text-green-700">Featured</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New FAQ Button */}
      {!isAddingFAQ && (
        <Button onClick={() => setIsAddingFAQ(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add New FAQ
        </Button>
      )}

      {/* Add FAQ Form */}
      {isAddingFAQ && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Create New FAQ</CardTitle>
            <CardDescription>
              Add a new question and answer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-question">Question</Label>
              <Input
                id="new-question"
                placeholder="e.g., Do you accept reservations?"
                value={newFAQ.question}
                onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-answer">Answer</Label>
              <Textarea
                id="new-answer"
                placeholder="e.g., Yes, we accept reservations through our website or by calling..."
                value={newFAQ.answer}
                rows={4}
                onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-category">Category</Label>
                <Select value={newFAQ.category} onValueChange={(value) => setNewFAQ({ ...newFAQ, category: value })}>
                  <SelectTrigger id="new-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FAQ_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-relevance">Relevance Score</Label>
                <Input
                  id="new-relevance"
                  type="number"
                  min="0"
                  max="100"
                  value={newFAQ.relevance_score}
                  onChange={(e) => setNewFAQ({ ...newFAQ, relevance_score: parseInt(e.target.value) || 50 })}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newFAQ.is_featured}
                    onChange={(e) => setNewFAQ({ ...newFAQ, is_featured: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span>Featured</span>
                </Label>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleAddFAQ} disabled={loading}>
                {loading ? 'Creating...' : 'Create FAQ'}
              </Button>
              <Button variant="outline" onClick={() => setIsAddingFAQ(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAQs List */}
      {sortedFAQs.length > 0 ? (
        <div className="space-y-3">
          {sortedFAQs.map((faq) => (
            <Card key={faq.id} className={editingId === faq.id ? 'border-blue-300 bg-blue-50' : ''}>
              <CardContent className="pt-6">
                {editingId === faq.id && editingFAQ ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`edit-question-${faq.id}`}>Question</Label>
                      <Input
                        id={`edit-question-${faq.id}`}
                        value={editingFAQ.question || ''}
                        onChange={(e) => setEditingFAQ({ ...editingFAQ, question: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`edit-answer-${faq.id}`}>Answer</Label>
                      <Textarea
                        id={`edit-answer-${faq.id}`}
                        value={editingFAQ.answer || ''}
                        rows={4}
                        onChange={(e) => setEditingFAQ({ ...editingFAQ, answer: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`edit-category-${faq.id}`}>Category</Label>
                        <Select value={editingFAQ.category} onValueChange={(value) => setEditingFAQ({ ...editingFAQ, category: value })}>
                          <SelectTrigger id={`edit-category-${faq.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FAQ_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`edit-relevance-${faq.id}`}>Relevance Score</Label>
                        <Input
                          id={`edit-relevance-${faq.id}`}
                          type="number"
                          min="0"
                          max="100"
                          value={editingFAQ.relevance_score || 50}
                          onChange={(e) => setEditingFAQ({ ...editingFAQ, relevance_score: parseInt(e.target.value) || 50 })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingFAQ.is_featured || false}
                            onChange={(e) => setEditingFAQ({ ...editingFAQ, is_featured: e.target.checked })}
                            className="w-4 h-4"
                          />
                          <span>Featured</span>
                        </Label>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleEditSave} disabled={loading} size="sm">
                        <Check className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button onClick={handleEditCancel} variant="outline" size="sm">
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="space-y-4">
                    {/* Question and Featured Badge */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900">{faq.question}</h3>
                      </div>
                      {faq.is_featured && (
                        <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          Featured
                        </Badge>
                      )}
                    </div>

                    {/* Answer */}
                    <p className="text-gray-700 text-sm leading-relaxed">{faq.answer}</p>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <Badge className={`${getCategoryBadgeColor(faq.category)} text-xs`}>
                        {FAQ_CATEGORIES.find(c => c.value === faq.category)?.label || faq.category}
                      </Badge>

                      <Badge className={`${getSourceBadgeColor(faq.source)} text-xs`}>
                        {faq.source === 'ai_generated' ? 'AI Generated' : faq.source === 'review_based' ? 'Review-Based' : 'Manual'}
                      </Badge>

                      <Badge variant="outline" className="text-xs">
                        Score: {faq.relevance_score}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditStart(faq)}
                        disabled={editingId !== null}
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteId(faq.id)}
                        disabled={editingId !== null}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <div className="space-y-4">
              <div className="text-gray-400">
                <Star className="h-12 w-12 mx-auto opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No FAQs Yet</h3>
              <p className="text-gray-600">
                FAQs will appear here once they're generated from reviews or added manually.
              </p>
              <Button onClick={() => setIsAddingFAQ(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add First FAQ
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this FAQ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-gray-50 p-4 rounded-lg my-4 text-sm">
            <p className="font-medium text-gray-900 mb-1">
              {faqs.find(f => f.id === deleteId)?.question}
            </p>
            <p className="text-gray-600">
              {faqs.find(f => f.id === deleteId)?.answer}
            </p>
          </div>
          <div className="flex gap-3">
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={loading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {loading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
