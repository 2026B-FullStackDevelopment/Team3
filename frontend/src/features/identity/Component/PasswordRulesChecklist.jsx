import { cn } from '@/shared/utils/cn.js'
import { checkPasswordRules } from '@/shared/utils/validators.js'

/**
 * Live password-policy checklist (presentation only). Each of the four backend
 * rules turns green with a check when met, driven by checkPasswordRules (the
 * returned array lists the UNMET rule keys). Tailwind inlined.
 */

const RULES = [
  { key: 'minLength', label: 'At least 8 characters' },
  { key: 'requireNumber', label: 'At least 1 number' },
  { key: 'requireSpecial', label: 'At least 1 special character (e.g., $#@!)' },
  { key: 'requireUppercase', label: 'At least 1 capitalized letter' },
]

export function PasswordRulesChecklist({ password = '' }) {
  const unmet = new Set(checkPasswordRules(password))
  return (
    <ul className="space-y-1.5">
      {RULES.map((rule) => {
        const met = !unmet.has(rule.key)
        return (
          <li key={rule.key} className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                'flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                met ? 'bg-primary text-white' : 'border border-khaki-strong bg-surface',
              )}
            >
              {met && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </span>
            <span className={met ? 'text-ink' : 'text-muted'}>{rule.label}</span>
          </li>
        )
      })}
    </ul>
  )
}
