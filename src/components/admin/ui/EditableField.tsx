'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, X, Edit2 } from 'lucide-react'

interface EditableFieldProps {
  value: string
  onSave: (newValue: string) => void
  placeholder?: string
  className?: string
  multiline?: boolean
}

export function EditableField({ 
  value, 
  onSave, 
  placeholder = 'Click to edit',
  className = '',
  multiline = false
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = () => {
    onSave(editValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-h-[60px] p-2 border rounded-md resize-none"
            placeholder={placeholder}
          />
        ) : (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
            placeholder={placeholder}
          />
        )}
        <Button size="sm" onClick={handleSave} className="h-8 w-8 p-0">
          <Check className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={handleCancel} className="h-8 w-8 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div 
      className={`flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded-md group ${className}`}
      onClick={() => setIsEditing(true)}
    >
      <span className="flex-1 text-sm text-gray-900 min-w-0">
        {value || <span className="text-gray-400 italic">{placeholder}</span>}
      </span>
      <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </div>
  )
}
