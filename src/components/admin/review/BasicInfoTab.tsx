'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, XCircle, Edit2, Save, X } from 'lucide-react'

interface RestaurantReviewData {
  id: string
  name: string
  slug: string
  address: string
  area: string
  phone?: string
  website?: string
  hours?: Record<string, any>
  description?: string
  short_description?: string
}

interface BasicInfoTabProps {
  restaurant: RestaurantReviewData
  onUpdate: (updates: Partial<RestaurantReviewData>) => void
}

export function BasicInfoTab({ restaurant, onUpdate }: BasicInfoTabProps) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})

  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field)
    setEditValues({ ...editValues, [field]: currentValue || '' })
  }

  const handleSave = (field: string) => {
    if (editValues[field] !== undefined) {
      onUpdate({ [field]: editValues[field] })
    }
    setEditingField(null)
    setEditValues({})
  }

  const handleCancel = () => {
    setEditingField(null)
    setEditValues({})
  }

  const renderEditableField = (
    field: string,
    label: string,
    value: string | undefined,
    type: 'text' | 'textarea' = 'text',
    placeholder?: string
  ) => {
    const isEditing = editingField === field
    const currentValue = isEditing ? editValues[field] : (value || '')

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              {type === 'textarea' ? (
                <Textarea
                  value={currentValue}
                  onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value })}
                  placeholder={placeholder}
                  className="flex-1"
                  rows={3}
                />
              ) : (
                <Input
                  value={currentValue}
                  onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value })}
                  placeholder={placeholder}
                  className="flex-1"
                />
              )}
              <Button size="sm" onClick={() => handleSave(field)}>
                <Save className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <>
              <div className="flex-1 p-2 bg-gray-50 rounded border min-h-[40px]">
                {value || <span className="text-gray-400 italic">Not provided</span>}
              </div>
              <Button size="sm" variant="ghost" onClick={() => handleEdit(field, value || '')}>
                <Edit2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  const renderHours = () => {
    if (!restaurant.hours) {
      return (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Opening Hours</Label>
          <div className="p-2 bg-gray-50 rounded border min-h-[40px]">
            <span className="text-gray-400 italic">Not provided</span>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">Opening Hours</Label>
        <div className="space-y-1">
          {Object.entries(restaurant.hours).map(([day, hours]) => (
            <div key={day} className="flex justify-between text-sm">
              <span className="font-medium capitalize">{day}</span>
              <span>{hours as string}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Core restaurant details that will be displayed publicly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderEditableField('name', 'Restaurant Name', restaurant.name, 'text', 'Enter restaurant name')}
          {renderEditableField('slug', 'URL Slug', restaurant.slug, 'text', 'restaurant-name')}
          {renderEditableField('address', 'Address', restaurant.address, 'text', 'Full address')}
          {renderEditableField('area', 'Area', restaurant.area, 'text', 'Goa City, Salmiya, etc.')}
          {renderEditableField('phone', 'Phone Number', restaurant.phone, 'text', '+965 XXXX XXXX')}
          {renderEditableField('website', 'Website', restaurant.website, 'text', 'https://restaurant.com')}
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
          <CardDescription>
            Descriptions and content for SEO and user experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderEditableField('short_description', 'Short Description', restaurant.short_description, 'textarea', 'Brief description for cards and previews (100-150 characters)')}
          {renderEditableField('description', 'Full Description', restaurant.description, 'textarea', 'Detailed description for the restaurant page (500-800 characters)')}
        </CardContent>
      </Card>

      {/* Operating Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Operating Hours</CardTitle>
          <CardDescription>
            Restaurant opening and closing times
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderHours()}
        </CardContent>
      </Card>

      {/* Cuisines & Features */}
      <Card>
        <CardHeader>
          <CardTitle>Cuisines & Features</CardTitle>
          <CardDescription>
            Categories and features for filtering and discovery
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Cuisines</Label>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">American</Badge>
              <Badge variant="outline">Italian</Badge>
              <Badge variant="outline">Desserts</Badge>
              <Button size="sm" variant="ghost">
                + Add Cuisine
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Features</Label>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">WiFi</Badge>
              <Badge variant="outline">Parking</Badge>
              <Badge variant="outline">Outdoor Seating</Badge>
              <Badge variant="outline">Vegan Options</Badge>
              <Button size="sm" variant="ghost">
                + Add Feature
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Status */}
      <Card>
        <CardHeader>
          <CardTitle>Validation Status</CardTitle>
          <CardDescription>
            Required fields and their completion status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {restaurant.name ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
              <span className="text-sm">Restaurant Name</span>
            </div>
            <div className="flex items-center gap-2">
              {restaurant.address ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
              <span className="text-sm">Address</span>
            </div>
            <div className="flex items-center gap-2">
              {restaurant.area ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
              <span className="text-sm">Area</span>
            </div>
            <div className="flex items-center gap-2">
              {restaurant.phone ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
              <span className="text-sm">Phone Number</span>
            </div>
            <div className="flex items-center gap-2">
              {restaurant.description ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
              <span className="text-sm">Description</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

