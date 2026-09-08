import { StatusAlert } from '@/components/ui/status-alert.jsx'

export function AppLoadingState() {
  return (
    <main className="grid min-h-screen place-items-center px-6" id="main-content">
      <StatusAlert variant="loading" title="Loading AFF">
        Restoring your secure session…
      </StatusAlert>
    </main>
  )
}
