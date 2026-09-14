import { useMemo, useState } from "react";

export function useNotificationFilter(entries, limit) {
  const [filter, setFilter] = useState("all");
  const visibleEntries = useMemo(() => {
    const filtered = entries.filter(
      (entry) => filter === "all" || !entry.isRead,
    );
    return limit ? filtered.slice(0, limit) : filtered;
  }, [entries, filter, limit]);

  return { filter, setFilter, visibleEntries };
}
