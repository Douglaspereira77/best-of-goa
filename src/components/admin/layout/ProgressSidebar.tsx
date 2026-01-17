'use client'

import { CheckCircle, XCircle, Circle, Loader2 } from 'lucide-react'
import { SectionCard } from './SectionCard'

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed'

interface ExtractionStep {
  name: string
  displayName: string
  status: StepStatus
  startedAt?: string
  completedAt?: string
  error?: string
  progress?: {
    current: number
    total: number
    cost: number
  }
}

interface ProgressSidebarProps {
  steps: ExtractionStep[]
  currentStep?: string
  className?: string
  onRetryImages?: () => void
}

export function ProgressSidebar({
  steps,
  currentStep,
  className = '',
  onRetryImages
}: ProgressSidebarProps) {
  const getStepIcon = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
      default:
        return <Circle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStepStatusColor = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return 'text-green-600'
      case 'failed':
        return 'text-red-600'
      case 'running':
        return 'text-blue-600'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <SectionCard
        title="Extraction Progress"
        icon="⚡"
        defaultCollapsed={false}
      >
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.name} className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getStepIcon(step.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${getStepStatusColor(step.status)}`}>
                    {step.displayName}
                    {step.progress && step.progress.total > 0 && (
                      <span className="text-xs font-normal ml-2 text-gray-600">
                        ({step.progress.current}/{step.progress.total}) - ${step.progress.cost.toFixed(2)}
                      </span>
                    )}
                  </p>
                  {step.status === 'running' && (
                    <span className="text-xs text-blue-600">Running...</span>
                  )}
                </div>
                {step.progress && step.status === 'running' && step.progress.total > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${(step.progress.current / step.progress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                {step.error && (
                  <div className="mt-1">
                    <p className="text-xs text-red-600">{step.error}</p>
                    {step.name === 'process_images' && onRetryImages && (
                      <button
                        onClick={onRetryImages}
                        className="text-xs text-blue-600 hover:text-blue-800 underline mt-1"
                      >
                        Retry Image Extraction
                      </button>
                    )}
                  </div>
                )}
                {step.completedAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    Completed: {new Date(step.completedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

