import { Card } from "@/shared/components/Card.jsx";
import { Button } from "@/shared/components/Button.jsx";
import { FormField } from "@/shared/components/FormField.jsx";
import { Input } from "@/shared/components/Input.jsx";
import { Select } from "@/shared/components/Select.jsx";
import { Alert } from "@/shared/components/Alert.jsx";
import { PageHeader } from "@/shared/components/PageHeader.jsx";
import { VN_CITIES } from "@/config/constants.js";
import { usePreferenceForm } from "@/features/notification/Hook/notificationPreferencesHook.js";
import { CategoryChips } from "@/features/notification/Components/CategoryChips.jsx";

const VEGETARIAN_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "vegetarian", label: "Vegetarian only" },
];

/** Create/edit a notification preference (its own view within the page). */
export function PreferenceForm({ editing, onSaved, onCancel }) {
  const f = usePreferenceForm(editing, onSaved);

  return (
    <>
      <PageHeader
        title={
          f.isEdit
            ? "Edit Notification Preference"
            : "New Notification Preference"
        }
        subtitle="Choose what food, price range, and city you'd like real-time alerts for."
      />
      <Card>
        {f.banner && (
          <Alert variant="error" className="mb-4">
            {f.banner}
          </Alert>
        )}
        <form onSubmit={f.onSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              label="Food categories (select one or more)"
              error={f.categoryError}
            >
              <CategoryChips
                selected={f.categories}
                onToggle={f.toggleCategory}
              />
            </FormField>
            <FormField label="Vegetarian status" htmlFor="vegetarian">
              <Select
                id="vegetarian"
                options={VEGETARIAN_OPTIONS}
                {...f.register("vegetarian")}
              />
            </FormField>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              label="Price range (VND)"
              error={f.errors.min?.message || f.errors.max?.message}
            >
              <div className="flex gap-3">
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="Min · 0"
                  error={f.errors.min}
                  {...f.register("min", f.minRules)}
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="Max · 50000"
                  error={f.errors.max}
                  {...f.register("max", f.maxRules)}
                />
              </div>
            </FormField>
            <FormField
              label="City"
              htmlFor="city"
              error={f.errors.city?.message}
            >
              <Select
                id="city"
                options={VN_CITIES}
                placeholder="Select your city"
                error={f.errors.city}
                {...f.register("city", f.cityRules)}
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" loading={f.isSubmitting}>
              Save preference
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
