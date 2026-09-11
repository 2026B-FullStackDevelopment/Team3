import { Card } from '@/shared/components/Card.jsx'
import { Button } from '@/shared/components/Button.jsx'
import { FormField } from '@/shared/components/FormField.jsx'
import { Input } from '@/shared/components/Input.jsx'
import { Select } from '@/shared/components/Select.jsx'
import { formatVND } from '@/shared/utils/format.js'
import { cn } from '@/shared/utils/cn.js'

const METHOD_OPTIONS = [{ value: 'wallet', label: 'Local wallet top-up (simulated)' }]

/** Deposit funds form. Presentation + RHF wiring passed in from useDepositForm. */
export function DepositForm({
  register,
  onSubmit,
  errors,
  isSubmitting,
  result,
  amount,
  quickAmounts,
  selectQuickAmount,
  amountRules,
}) {
  const amountNum = Number(amount)
  const amountValid = amount !== '' && Number.isInteger(amountNum) && amountNum > 0

  let label = 'Deposit funds'
  if (result?.kind === 'error') label = 'Try again'
  else if (amountValid) label = `Deposit ${formatVND(amountNum)}`

  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Deposit funds</p>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <FormField label="Amount (VND)" htmlFor="amount" error={errors.amount?.message}>
          <Input
            id="amount"
            type="number"
            inputMode="numeric"
            placeholder="e.g. 100000"
            error={errors.amount || result?.kind === 'error'}
            {...register('amount', amountRules)}
          />
        </FormField>

        <div className="flex gap-3">
          {quickAmounts.map((value) => {
            const active = String(value) === String(amount)
            return (
              <button
                key={value}
                type="button"
                onClick={() => selectQuickAmount(value)}
                className={cn(
                  'flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors',
                  active
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-khaki-strong bg-surface text-ink hover:bg-khaki',
                )}
              >
                {formatVND(value)}
              </button>
            )
          })}
        </div>

        <FormField label="Payment method" htmlFor="method">
          <Select id="method" options={METHOD_OPTIONS} defaultValue="wallet" disabled />
        </FormField>

        <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting}>
          {label}
        </Button>
      </form>
    </Card>
  )
}
