'use client'

import { SectionCard } from '../layout/SectionCard'
import { Badge } from '@/components/ui/badge'

interface MenuItem {
  id?: string
  name: string
  description?: string
  price?: string
  mentions: number
  category: 'popular' | 'main' | 'side' | 'appetizer' | 'dessert' | 'beverage'
  is_popular?: boolean
  confidence_score?: number
  source?: string
}

interface MenuSection {
  name: string
  dishes: MenuItem[]
  display_order?: number
}

interface MenuMetadata {
  source?: string
  last_updated?: string
  total_dishes?: number
  popular_dishes?: number
  sections?: number
}

interface Category {
  name: string
  type: 'cuisine' | 'feature'
}

interface MenuViewProps {
  menuItems?: MenuItem[]
  menuSections?: MenuSection[]
  menuMetadata?: MenuMetadata
  categories?: Category[]
  loading?: boolean
  className?: string
}

export function MenuView({ menuItems = [], menuSections = [], menuMetadata, categories = [], loading = false, className = '' }: MenuViewProps) {
  const popularDishes = menuItems.filter(item => item.category === 'popular' || item.is_popular)
  const mainCourses = menuItems.filter(item => item.category === 'main')
  const sides = menuItems.filter(item => item.category === 'side')
  const appetizers = menuItems.filter(item => item.category === 'appetizer')
  const desserts = menuItems.filter(item => item.category === 'dessert')
  const beverages = menuItems.filter(item => item.category === 'beverage')

  const renderMenuItem = (item: MenuItem) => (
    <div key={item.id || item.name} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900">{item.name}</span>
          {item.is_popular && (
            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
              Popular
            </Badge>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-gray-600 mt-1">{item.description}</p>
        )}
        <div className="flex items-center space-x-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {item.mentions} mentions
          </Badge>
          {item.confidence_score && (
            <Badge variant="outline" className="text-xs">
              {Math.round(item.confidence_score * 100)}% confidence
            </Badge>
          )}
          {item.source && (
            <Badge variant="outline" className="text-xs">
              {item.source}
            </Badge>
          )}
        </div>
      </div>
      {item.price && (
        <div className="text-sm font-medium text-gray-900 ml-4">
          {item.price}
        </div>
      )}
    </div>
  )

  const renderMenuSection = (section: MenuSection) => (
    <div key={section.name} className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700 border-b pb-1">{section.name}</h4>
      <div className="space-y-1">
        {section.dishes.map(renderMenuItem)}
      </div>
    </div>
  )

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Menu Metadata */}
      {menuMetadata && (
        <SectionCard
          title="Menu Information"
          icon="📊"
          defaultCollapsed={false}
        >
          <div className="grid grid-cols-2 gap-4">
            {menuMetadata.total_dishes && (
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="text-2xl font-bold text-blue-600">{menuMetadata.total_dishes}</div>
                <div className="text-xs text-blue-600">Total Dishes</div>
              </div>
            )}
            {menuMetadata.popular_dishes && (
              <div className="text-center p-3 bg-yellow-50 rounded">
                <div className="text-2xl font-bold text-yellow-600">{menuMetadata.popular_dishes}</div>
                <div className="text-xs text-yellow-600">Popular Dishes</div>
              </div>
            )}
            {menuMetadata.sections && (
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-600">{menuMetadata.sections}</div>
                <div className="text-xs text-green-600">Menu Sections</div>
              </div>
            )}
            {menuMetadata.source && (
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-sm font-medium text-gray-600">Source</div>
                <div className="text-xs text-gray-500">{menuMetadata.source}</div>
              </div>
            )}
          </div>
          {menuMetadata.last_updated && (
            <div className="mt-3 text-xs text-gray-500 text-center">
              Last updated: {new Date(menuMetadata.last_updated).toLocaleDateString()}
            </div>
          )}
        </SectionCard>
      )}

      {/* Menu Sections (if available) */}
      {menuSections.length > 0 ? (
        <SectionCard
          title="Menu Sections"
          icon="📋"
          defaultCollapsed={false}
        >
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                  <div className="space-y-2">
                    {Array.from({ length: 2 }).map((_, j) => (
                      <div key={j} className="flex items-center justify-between py-2">
                        <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                        <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {menuSections.map(renderMenuSection)}
            </div>
          )}
        </SectionCard>
      ) : (
        <>
          {/* Popular Dishes */}
          <SectionCard
            title="Popular Dishes"
            icon="🍽️"
            defaultCollapsed={false}
          >
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : popularDishes.length > 0 ? (
              <div className="space-y-1">
                {popularDishes.map(renderMenuItem)}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No popular dishes found</p>
              </div>
            )}
          </SectionCard>

          {/* Appetizers */}
          {appetizers.length > 0 && (
            <SectionCard
              title="Appetizers"
              icon="🥗"
              defaultCollapsed={false}
            >
              <div className="space-y-1">
                {appetizers.map(renderMenuItem)}
              </div>
            </SectionCard>
          )}

          {/* Main Courses */}
          <SectionCard
            title="Main Courses"
            icon="🍖"
            defaultCollapsed={false}
          >
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : mainCourses.length > 0 ? (
              <div className="space-y-1">
                {mainCourses.map(renderMenuItem)}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No main courses found</p>
              </div>
            )}
          </SectionCard>

          {/* Sides */}
          <SectionCard
            title="Sides"
            icon="🥔"
            defaultCollapsed={false}
          >
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : sides.length > 0 ? (
              <div className="space-y-1">
                {sides.map(renderMenuItem)}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No sides found</p>
              </div>
            )}
          </SectionCard>

          {/* Desserts */}
          {desserts.length > 0 && (
            <SectionCard
              title="Desserts"
              icon="🍰"
              defaultCollapsed={false}
            >
              <div className="space-y-1">
                {desserts.map(renderMenuItem)}
              </div>
            </SectionCard>
          )}

          {/* Beverages */}
          {beverages.length > 0 && (
            <SectionCard
              title="Beverages"
              icon="🥤"
              defaultCollapsed={false}
            >
              <div className="space-y-1">
                {beverages.map(renderMenuItem)}
              </div>
            </SectionCard>
          )}
        </>
      )}

      {/* Categories */}
      <SectionCard
        title="Categories"
        icon="🏷️"
        defaultCollapsed={false}
      >
        {loading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {categories.map((category, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {category.name}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">No categories found</p>
          </div>
        )}
      </SectionCard>
    </div>
  )
}

