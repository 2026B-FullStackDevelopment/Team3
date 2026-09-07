/**
 * Join conditional class names. Falsy values are dropped.
 * Keeps Tailwind class composition readable in *.styles.js maps and components.
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
