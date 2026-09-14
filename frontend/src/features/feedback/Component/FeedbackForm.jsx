import { useState } from 'react'
import { Button } from '@/shared/components/Button.jsx'
import { Textarea } from '@/shared/components/Textarea.jsx'

const MAX_LENGTH = 1000

/** Inline textarea + submit button for leaving feedback on one collected reservation. */
export function FeedbackForm({ onSubmit, isSubmitting, error }) {
  const [text, setText] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="How was this donation? Leave feedback for the donor…"
        maxLength={MAX_LENGTH}
        rows={2}
        disabled={isSubmitting}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button
        type="submit"
        size="sm"
        variant="secondary"
        disabled={!text.trim() || isSubmitting}
        loading={isSubmitting}
      >
        Submit feedback
      </Button>
    </form>
  )
}
