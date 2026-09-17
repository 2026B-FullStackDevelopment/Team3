import { Eye } from 'lucide-react'
import { cn } from '@/shared/utils/cn.js'

export function PreviewDataBadge({ className }) {
  return (
    <span className={cn('preview-data-badge', className)}>
      <Eye aria-hidden="true" className="size-3.5" />
      Preview data
    </span>
  )
}
