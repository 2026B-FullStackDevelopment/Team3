import { useMemo, useState } from "react";

export function useNotificationFilter(entries, unreadEntries, limit) {
  const [filter, setFilter] = useState("all");
  const visibleEntries = useMemo(() => {
    const filtered = filter === "unread" ? unreadEntries : entries;
    return limit ? filtered.slice(0, limit) : filtered;
  }, [entries, filter, limit, unreadEntries]);

  return { filter, setFilter, visibleEntries };
}
