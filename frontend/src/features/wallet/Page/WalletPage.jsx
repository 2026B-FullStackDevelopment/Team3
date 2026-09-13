import { PageHeader } from '@/shared/components/PageHeader.jsx'
import { Alert } from '@/shared/components/Alert.jsx'
import { useWallet, useDepositForm } from '@/features/wallet/Hook/walletHook.js'
import { BalanceCard } from '@/features/wallet/Component/BalanceCard.jsx'
import { DepositForm } from '@/features/wallet/Component/DepositForm.jsx'
import { TransactionList } from '@/features/wallet/Component/TransactionList.jsx'
import { DepositResultBanner } from '@/features/wallet/Component/DepositResultBanner.jsx'

/**
 * Recipient Wallet page (route: /wallet). Balance + deposit + transaction
 * history. A successful deposit updates balance and prepends the new row
 * optimistically (no refetch).
 */
export function WalletPage() {
  const { balance, transactions, status, applyDeposit } = useWallet()
  const deposit = useDepositForm(applyDeposit)

  if (status === 'loading') return null

  return (
    <>
      <PageHeader
        title="Wallet & Deposit"
        subtitle="Deposit funds to pay for food collections or your Premium subscription."
      />

      {status === 'error' ? (
        <Alert variant="error">Couldn&apos;t load your wallet. Please refresh the page.</Alert>
      ) : (
        <>
          <DepositResultBanner result={deposit.result} onDismiss={deposit.dismissResult} />
          <BalanceCard balance={balance} />
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <DepositForm
              register={deposit.register}
              onSubmit={deposit.onSubmit}
              errors={deposit.errors}
              isSubmitting={deposit.isSubmitting}
              result={deposit.result}
              amount={deposit.amount}
              quickAmounts={deposit.quickAmounts}
              selectQuickAmount={deposit.selectQuickAmount}
              amountRules={deposit.amountRules}
            />
            <TransactionList transactions={transactions} />
          </div>
        </>
      )}
    </>
  )
}
