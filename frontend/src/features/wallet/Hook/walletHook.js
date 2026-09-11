import { useCallback, useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { walletService } from '@/features/wallet/Service/walletService.js'
import { formatTransaction, formatTransactions } from '@/features/wallet/Model/walletModel.js'

/**
 * Wallet module hooks (one hook file per module, FE_ARCHITECTURE F11).
 */

const MIN_DEPOSIT = 1000
const MAX_DEPOSIT = 100_000_000
const QUICK_AMOUNTS = [50_000, 100_000, 200_000]

const vnd = new Intl.NumberFormat('vi-VN')

/* ---- Load balance + transactions --------------------------------------------- */

export function useWallet() {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let active = true
    Promise.all([walletService.getWallet(), walletService.listTransactions()]).then(
      ([walletRes, txRes]) => {
        if (!active) return
        if (walletRes.ok && txRes.ok) {
          setBalance(walletRes.data.wallet.balance)
          setTransactions(formatTransactions(txRes.data.transactions))
          setStatus('ready')
        } else {
          setStatus('error')
        }
      },
    )
    return () => {
      active = false
    }
  }, [])

  // Optimistic ledger update: set balance from the deposit response and prepend
  // the new (formatted) row — no refetch (the response already carries both).
  const applyDeposit = useCallback(({ wallet, transaction }) => {
    setBalance(wallet.balance)
    setTransactions((prev) => [formatTransaction(transaction), ...prev])
  }, [])

  return { balance, transactions, status, applyDeposit }
}

/* ---- Deposit form ------------------------------------------------------------ */

export function useDepositForm(applyDeposit) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { amount: '' } })

  const [result, setResult] = useState(null)
  const amount = useWatch({ control, name: 'amount' })

  const onSubmit = handleSubmit(async (values) => {
    setResult(null)
    const amountNum = Number(values.amount)

    const res = await walletService.deposit(amountNum)
    if (res.ok) {
      applyDeposit(res.data)
      setResult({ kind: 'success', amount: amountNum })
      reset({ amount: '' })
      return
    }
    if (res.status === 400) {
      setResult({
        kind: 'error',
        message: res.error?.message ?? res.data?.message ?? 'That amount is not allowed.',
      })
      return
    }
    setResult({
      kind: 'error',
      message: 'Something went wrong on our end. No funds were deducted. Please try again.',
    })
  })

  const selectQuickAmount = (value) => setValue('amount', String(value), { shouldValidate: true })

  return {
    register,
    onSubmit,
    errors,
    isSubmitting,
    result,
    amount,
    quickAmounts: QUICK_AMOUNTS,
    selectQuickAmount,
    dismissResult: () => setResult(null),
    amountRules: {
      required: 'Enter an amount to deposit.',
      validate: (v) => {
        const n = Number(v)
        if (!Number.isInteger(n)) return 'Enter a whole number of VND — e.g. 100000.'
        if (n < MIN_DEPOSIT) return `Minimum deposit is ${vnd.format(MIN_DEPOSIT)} ₫.`
        if (n > MAX_DEPOSIT) return `Maximum deposit is ${vnd.format(MAX_DEPOSIT)} ₫.`
        return true
      },
    },
  }
}
