'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Plus, Edit2, Trash2, Save, X, Star, Utensils } from 'lucide-react'

interface MenuSection {
  id: string
  name: string
  display_order: number
  dishes: Array<{
    id: string
    name: string
    description?: string
    price?: number
    is_popular: boolean
    dietary_tags: string[]
  }>
}

interface RestaurantReviewData {
  id: string
  name: string
  menu_sections?: MenuSection[]
}

interface MenuTabProps {
  restaurant: RestaurantReviewData
  onUpdate: (updates: Partial<RestaurantReviewData>) => void
}

export function MenuTab({ restaurant, onUpdate }: MenuTabProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editingDish, setEditingDish] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, any>>({})
  const [showAddSection, setShowAddSection] = useState(false)
  const [showAddDish, setShowAddDish] = useState<string | null>(null)

  const menuSections = restaurant.menu_sections || []

  const handleEditSection = (sectionId: string, section: MenuSection) => {
    setEditingSection(sectionId)
    setEditValues({
      name: section.name,
      display_order: section.display_order
    })
  }

  const handleEditDish = (dishId: string, dish: any) => {
    setEditingDish(dishId)
    setEditValues({
      name: dish.name,
      description: dish.description || '',
      price: dish.price || '',
      dietary_tags: dish.dietary_tags || []
    })
  }

  const handleSaveSection = (sectionId: string) => {
    const updatedSections = menuSections.map(section => 
      section.id === sectionId 
        ? { ...section, ...editValues }
        : section
    )
    onUpdate({ menu_sections: updatedSections })
    setEditingSection(null)
    setEditValues({})
  }

  const handleSaveDish = (sectionId: string, dishId: string) => {
    const updatedSections = menuSections.map(section => 
      section.id === sectionId 
        ? {
            ...section,
            dishes: section.dishes.map(dish =>
              dish.id === dishId
                ? { ...dish, ...editValues, price: parseFloat(editValues.price) || 0 }
                : dish
            )
          }
        : section
    )
    onUpdate({ menu_sections: updatedSections })
    setEditingDish(null)
    setEditValues({})
  }

  const handleAddSection = () => {
    const newSection: MenuSection = {
      id: `section-${Date.now()}`,
      name: editValues.name || 'New Section',
      display_order: menuSections.length + 1,
      dishes: []
    }
    onUpdate({ menu_sections: [...menuSections, newSection] })
    setShowAddSection(false)
    setEditValues({})
  }

  const handleAddDish = (sectionId: string) => {
    const newDish = {
      id: `dish-${Date.now()}`,
      name: editValues.name || 'New Dish',
      description: editValues.description || '',
      price: parseFloat(editValues.price) || 0,
      is_popular: false,
      dietary_tags: editValues.dietary_tags || []
    }
    
    const updatedSections = menuSections.map(section =>
      section.id === sectionId
        ? { ...section, dishes: [...section.dishes, newDish] }
        : section
    )
    onUpdate({ menu_sections: updatedSections })
    setShowAddDish(null)
    setEditValues({})
  }

  const handleDeleteSection = (sectionId: string) => {
    const updatedSections = menuSections.filter(section => section.id !== sectionId)
    onUpdate({ menu_sections: updatedSections })
  }

  const handleDeleteDish = (sectionId: string, dishId: string) => {
    const updatedSections = menuSections.map(section =>
      section.id === sectionId
        ? { ...section, dishes: section.dishes.filter(dish => dish.id !== dishId) }
        : section
    )
    onUpdate({ menu_sections: updatedSections })
  }

  const toggleDishPopular = (sectionId: string, dishId: string) => {
    const updatedSections = menuSections.map(section =>
      section.id === sectionId
        ? {
            ...section,
            dishes: section.dishes.map(dish =>
              dish.id === dishId
                ? { ...dish, is_popular: !dish.is_popular }
                : dish
            )
          }
        : section
    )
    onUpdate({ menu_sections: updatedSections })
  }

  const addDietaryTag = (sectionId: string, dishId: string, tag: string) => {
    const updatedSections = menuSections.map(section =>
      section.id === sectionId
        ? {
            ...section,
            dishes: section.dishes.map(dish =>
              dish.id === dishId
                ? { ...dish, dietary_tags: [...(dish.dietary_tags || []), tag] }
                : dish
            )
          }
        : section
    )
    onUpdate({ menu_sections: updatedSections })
  }

  const removeDietaryTag = (sectionId: string, dishId: string, tag: string) => {
    const updatedSections = menuSections.map(section =>
      section.id === sectionId
        ? {
            ...section,
            dishes: section.dishes.map(dish =>
              dish.id === dishId
                ? { ...dish, dietary_tags: (dish.dietary_tags || []).filter(t => t !== tag) }
                : dish
            )
          }
        : section
    )
    onUpdate({ menu_sections: updatedSections })
  }

  return (
    <div className="space-y-6">
      {/* Menu Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Menu Management</CardTitle>
              <CardDescription>
                {menuSections.length} sections • {menuSections.reduce((total, section) => total + section.dishes.length, 0)} dishes
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddSection(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Add Section Form */}
      {showAddSection && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Section Name</Label>
              <Input
                value={editValues.name || ''}
                onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                placeholder="e.g., Appetizers, Main Courses, Desserts"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddSection}>
                <Save className="h-4 w-4 mr-2" />
                Add Section
              </Button>
              <Button variant="outline" onClick={() => setShowAddSection(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Menu Sections */}
      {menuSections.map((section) => (
        <Card key={section.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  {editingSection === section.id ? (
                    <Input
                      value={editValues.name || ''}
                      onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                      className="w-64"
                    />
                  ) : (
                    section.name
                  )}
                </CardTitle>
                <CardDescription>
                  {section.dishes.length} dishes
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {editingSection === section.id ? (
                  <>
                    <Button size="sm" onClick={() => handleSaveSection(section.id)}>
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingSection(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => handleEditSection(section.id, section)}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowAddDish(section.id)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteSection(section.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Dish Form */}
            {showAddDish === section.id && (
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Dish Name</Label>
                      <Input
                        value={editValues.name || ''}
                        onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                        placeholder="e.g., Grilled Salmon"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price (KWD)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editValues.price || ''}
                        onChange={(e) => setEditValues({ ...editValues, price: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={editValues.description || ''}
                      onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                      placeholder="Describe the dish..."
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleAddDish(section.id)}>
                      <Save className="h-4 w-4 mr-2" />
                      Add Dish
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddDish(null)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dishes List */}
            <div className="space-y-3">
              {section.dishes.map((dish) => (
                <div key={dish.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {editingDish === dish.id ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Dish Name</Label>
                              <Input
                                value={editValues.name || ''}
                                onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Price (KWD)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={editValues.price || ''}
                                onChange={(e) => setEditValues({ ...editValues, price: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                              value={editValues.description || ''}
                              onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                              rows={2}
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{dish.name}</h4>
                            {dish.is_popular && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                Popular
                              </Badge>
                            )}
                          </div>
                          {dish.description && (
                            <p className="text-sm text-gray-600 mt-1">{dish.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm font-medium">{dish.price ? `${dish.price} KWD` : 'Price not set'}</span>
                            <div className="flex gap-1">
                              {dish.dietary_tags?.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 ml-4">
                      {editingDish === dish.id ? (
                        <>
                          <Button size="sm" onClick={() => handleSaveDish(section.id, dish.id)}>
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingDish(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => handleEditDish(dish.id, dish)}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => toggleDishPopular(section.id, dish.id)}
                          >
                            <Star className={`h-3 w-3 ${dish.is_popular ? 'text-yellow-500 fill-current' : ''}`} />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteDish(section.id, dish.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Empty State */}
      {menuSections.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Menu Sections</h3>
            <p className="text-gray-600 mb-4">Start by adding your first menu section</p>
            <Button onClick={() => setShowAddSection(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Section
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

