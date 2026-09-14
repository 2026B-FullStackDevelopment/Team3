import { Card } from "@/shared/components/Card.jsx";
import { Button } from "@/shared/components/Button.jsx";

/** Shown when a non-premium recipient opens the page (backend 403). */
export function PremiumGate() {
  return (
    <Card className="flex flex-col items-center justify-center py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cream text-ink">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </span>
      <p className="mt-4 text-lg font-semibold text-ink">
        Notification preferences are a Premium feature
      </p>
      <p className="mt-1 max-w-sm text-sm text-muted">
        Upgrade to Premium for $5/month to get real-time alerts on food matching
        exactly what you need.
      </p>
      <Button to="/premium" className="mt-6">
        Upgrade to Premium
      </Button>
    </Card>
  );
}
