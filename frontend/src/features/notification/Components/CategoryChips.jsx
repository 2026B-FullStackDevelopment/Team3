import { FOOD_CATEGORIES } from "@/config/constants.js";
import { cn } from "@/shared/utils/cn.js";

/** Multi-select category chips. `selected` = array of labels; `onToggle(label)`. */
export function CategoryChips({ selected, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {FOOD_CATEGORIES.map((label) => {
        const active = selected.includes(label);
        return (
          <button
            key={label}
            type="button"
            onClick={() => onToggle(label)}
            aria-pressed={active}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-primary-soft text-primary"
                : "border-khaki-strong bg-surface text-ink hover:bg-khaki",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
