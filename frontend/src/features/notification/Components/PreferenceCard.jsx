import { Card } from "@/shared/components/Card.jsx";
import { Badge } from "@/shared/components/Badge.jsx";
import { formatVnd } from "@/shared/utils/formatters.js";

function priceLabel(min, max) {
  return min === 0
    ? `Free – ${formatVnd(max)}`
    : `${formatVnd(min)} – ${formatVnd(max)}`;
}

function vegetarianLabel(value) {
  if (value == null) return "Any dietary status";
  return value ? "Vegetarian only" : "Non-vegetarian only";
}

/** One preference row: chips + edit + delete. `index` is 1-based for the title. */
export function PreferenceCard({ preference, index, onEdit, onDelete }) {
  const { categories, isVegetarian, priceRangeMin, priceRangeMax, city } =
    preference;
  return (
    <Card className="flex items-start justify-between">
      <div>
        <p className="font-semibold text-ink">Preference #{index}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Badge key={c} variant="success">
              {c}
            </Badge>
          ))}
          <Badge variant="khaki">{vegetarianLabel(isVegetarian)}</Badge>
          <Badge variant="khaki">
            {priceLabel(priceRangeMin, priceRangeMax)}
          </Badge>
          <Badge variant="success">{city}</Badge>
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit preference"
          className="rounded-full p-2 text-muted transition-colors hover:bg-khaki hover:text-ink"
        >
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
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete preference"
          className="rounded-full p-2 text-muted transition-colors hover:bg-danger-soft hover:text-danger"
        >
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
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </Card>
  );
}
