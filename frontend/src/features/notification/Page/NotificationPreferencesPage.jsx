import { PageHeader } from "@/shared/components/PageHeader.jsx";
import { Button } from "@/shared/components/Button.jsx";
import { Alert } from "@/shared/components/Alert.jsx";
import { Modal } from "@/shared/components/Modal/Modal.jsx";
import { useNotificationPreferences } from "@/features/notification/Hook/notificationPreferencesHook.js";
import { PreferenceCard } from "@/features/notification/Components/PreferenceCard.jsx";
import { PreferenceForm } from "@/features/notification/Components/PreferenceForm.jsx";
import { PreferencesEmptyState } from "@/features/notification/Components/PreferencesEmptyState.jsx";
import { PremiumGate } from "@/features/notification/Components/PremiumGate.jsx";

/**
 * Recipient Notification Preferences (route: /notification-preferences). Premium-gated;
 * lists preferences with inline create/edit and delete-confirm.
 */
export function NotificationPreferencesPage() {
  const p = useNotificationPreferences();

  if (p.status === "loading") return null;
  if (p.status === "nonpremium") return <PremiumGate />;
  if (p.status === "error") {
    return (
      <Alert variant="error">
        Couldn&apos;t load your notification preferences. Please refresh the
        page.
      </Alert>
    );
  }

  if (p.mode === "create" || p.mode === "edit") {
    return (
      <PreferenceForm
        editing={p.editing}
        onSaved={p.applySaved}
        onCancel={p.cancelForm}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Notification Preferences"
        subtitle="Get real-time alerts when a food listing matches what you're looking for."
      />

      {p.preferences.length === 0 ? (
        <PreferencesEmptyState onAdd={p.startCreate} />
      ) : (
        <>
          <div className="space-y-4">
            {p.preferences.map((pref, i) => (
              <PreferenceCard
                key={pref.id}
                preference={pref}
                index={i + 1}
                onEdit={() => p.startEdit(pref)}
                onDelete={() => p.requestDelete(pref)}
              />
            ))}
          </div>
          <Button
            className="mt-6"
            onClick={p.startCreate}
            leftIcon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            }
          >
            Add preference
          </Button>
        </>
      )}

      <Modal
        open={Boolean(p.deleteTarget)}
        title="Delete this preference?"
        onClose={p.cancelDelete}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={p.cancelDelete}>
              Cancel
            </Button>
            <Button variant="danger" onClick={p.confirmDelete}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted">
          This notification preference will be removed. You can add it again
          later.
        </p>
      </Modal>
    </>
  );
}
