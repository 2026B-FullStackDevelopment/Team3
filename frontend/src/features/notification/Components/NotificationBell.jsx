import { useEffect, useRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { cn } from "@/shared/utils/cn.js";

export function NotificationBell({
  count = 0,
  max = 99,
  size = 44,
  asChild = false,
  className,
  children,
  ...props
}) {
  const reducedMotion = useReducedMotion();
  const total = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  const rotation = useMotionValue(0);
  const previousCount = useRef(total);

  useEffect(() => {
    const increased = total > previousCount.current;
    previousCount.current = total;
    if (!increased || reducedMotion) return undefined;

    const controls = animate(rotation, [0, -16, 13, -9, 6, 0], {
      duration: 0.7,
      ease: "easeInOut",
    });
    return () => controls.stop();
  }, [reducedMotion, rotation, total]);

  const Component = asChild ? Slot : "button";
  const componentProps = asChild ? {} : { type: "button" };

  return (
    <Component
      {...componentProps}
      {...props}
      data-slot="notification-bell"
      className={cn(
        "relative grid shrink-0 place-items-center rounded-full text-white/90 outline-none",
        "transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {children}
      <span role="status" className="sr-only">
        {total > 0 ? `Notifications, ${total} unread` : "Notifications"}
      </span>
      <motion.svg
        width={size * 0.52}
        height={size * 0.52}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ rotate: rotation, transformOrigin: "50% 15%" }}
      >
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </motion.svg>
      <AnimatePresence initial={false}>
        {total > 0 && (
          <motion.span
            key="notification-count"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={
              reducedMotion
                ? { duration: 0.01 }
                : { type: "spring", stiffness: 550, damping: 22 }
            }
            className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white ring-2 ring-ink"
          >
            {total > max ? `${max}+` : total}
          </motion.span>
        )}
      </AnimatePresence>
    </Component>
  );
}
