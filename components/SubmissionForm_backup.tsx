'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface SubmissionFormProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function SubmissionForm({ isOpen, onOpenChange }: SubmissionFormProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Test Dialog</DialogTitle>
        </DialogHeader>
        <div>Test content</div>
      </DialogContent>
    </Dialog>
  )
}
