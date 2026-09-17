import { cn } from '@/shared/utils/cn.js'

// Always show the first/last 4 pages; if the current page would otherwise
// be hidden in the collapsed middle, show it (and its neighbours) too.
const EDGE_COUNT = 4

function getPageItems(currentPage, totalPages) {
  if (totalPages <= EDGE_COUNT * 2) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const startPages = Array.from({ length: EDGE_COUNT }, (_, i) => i + 1)
  const endPages = Array.from({ length: EDGE_COUNT }, (_, i) => totalPages - EDGE_COUNT + 1 + i)

  const middlePages = []
  if (currentPage > EDGE_COUNT && currentPage <= totalPages - EDGE_COUNT) {
    for (let page = currentPage - 1; page <= currentPage + 1; page++) {
      if (page > EDGE_COUNT && page <= totalPages - EDGE_COUNT) middlePages.push(page)
    }
  }

  if (middlePages.length > 0) {
    return [...startPages, 'ellipsis-start', ...middlePages, 'ellipsis-end', ...endPages]
  }
  return [...startPages, 'ellipsis-start', ...endPages]
}

/**
 * Shared page-number footer (Prev / numbers with a collapsed middle / Next).
 * The only piece extracted into `shared/` per the Admin UI design decision —
 * it's pure page-number math with no domain data, unlike the tables it sits
 * under, which stay local to each page since their columns all differ.
 */
export function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const items = getPageItems(currentPage, totalPages)

  return (
    <nav className="flex items-center justify-center gap-3 py-4 text-sm" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="text-ink disabled:text-muted disabled:cursor-not-allowed"
      >
        ← Prev
      </button>

      {items.map((item, index) =>
        typeof item === 'string' ? (
          <span key={`${item}-${index}`} className="text-muted">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-current={item === currentPage ? 'page' : undefined}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-card text-sm',
              item === currentPage ? 'bg-primary font-semibold text-white' : 'text-ink hover:bg-khaki',
            )}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="text-ink disabled:text-muted disabled:cursor-not-allowed"
      >
        Next →
      </button>
    </nav>
  )
}
