import { useCallback, useEffect, useRef, useState } from "react";

export function useNotificationPanel() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((current) => !current), []);

  useEffect(() => {
    if (!open) return undefined;
    panelRef.current?.focus();

    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) close();
    };
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      close();
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, open]);

  return { open, close, toggle, wrapperRef, triggerRef, panelRef };
}
