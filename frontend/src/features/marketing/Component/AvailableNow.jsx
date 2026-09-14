import { useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/shared/utils/cn.js'
import { Button } from '@/shared/components/Button.jsx'

/**
 * Landing "Available Now" section. The card grid is populated from live
 * Donation listings later; for this phase it renders static placeholder cards
 * so the section matches the sketch. Presentation only, no service calls.
 * Tailwind classes inlined (single-file rule).
 */

// Placeholder listings — replaced by real Donation data in a future pass. The
// gradient `swatch` stays as a fallback behind the image if it fails to load.
const LISTINGS = [
  {
    id: 'p1',
    title: 'Mixed Garden Greens',
    donor: 'Green Valley Market',
    distance: '1.2 km',
    price: '15,000₫',
    category: 'Vegetable',
    tone: 'bg-emerald-100 text-emerald-700',
    swatch: 'from-[#8fae5a] to-[#5f7d1f]',
    image:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=640&q=60&auto=format&fit=crop',
  },
  {
    id: 'p2',
    title: 'Day-Old Sourdough Loaves',
    donor: 'Anh’s Bakery',
    distance: '0.8 km',
    price: 'Free',
    category: 'Baked Goods',
    tone: 'bg-khaki-strong text-ink',
    swatch: 'from-[#d8b483] to-[#a9793f]',
    image:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=640&q=60&auto=format&fit=crop',
  },
  {
    id: 'p3',
    title: 'Vegetarian Cơm Tấm Set',
    donor: 'Cơm Chay Kitchen',
    distance: '2.1 km',
    price: '15,000₫',
    category: 'Cooked Dish',
    tone: 'bg-danger-soft text-danger',
    swatch: 'from-[#d98a5a] to-[#b3402f]',
    image:
      'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=640&q=60&auto=format&fit=crop',
  },
  {
    id: 'p4',
    title: 'Ripe Mango Crates',
    donor: 'Mekong Fresh Co.',
    distance: '3.1 km',
    price: '8,000₫/kg',
    category: 'Fruit',
    tone: 'bg-[#f6e6c9] text-[#a9793f]',
    swatch: 'from-[#e0b352] to-[#c88a2e]',
    image:
      'https://images.unsplash.com/photo-1553279768-865429fa0078?w=640&q=60&auto=format&fit=crop',
  },
]

function ListingCard({ listing }) {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <article className="overflow-hidden rounded-card border border-khaki-strong/50 bg-surface">
      {/* Gradient swatch is the fallback; the photo covers it when it loads. */}
      <div className={cn('relative h-32 bg-linear-to-br', listing.swatch)}>
        {listing.image && !imageFailed && (
          <img
            src={listing.image}
            alt={listing.title}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <span
          className={cn(
            'absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold',
            listing.tone,
          )}
        >
          {listing.category}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-semibold leading-tight text-ink">{listing.title}</h3>
        <p className="mt-1 text-xs text-muted">
          {listing.donor} · {listing.distance}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span
            className={cn(
              'text-sm font-bold',
              listing.price === 'Free' ? 'text-primary' : 'text-ink',
            )}
          >
            {listing.price}
          </span>
          <Button size="sm" variant="danger" to="/browse">
            Reserve
          </Button>
        </div>
      </div>
    </article>
  )
}

export function AvailableNow() {
  return (
    <section id="food" className="bg-cream px-6 pb-16 md:px-10 md:pb-24">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Available Now
        </p>

        <div className="mt-3 flex items-end justify-between gap-4">
          <h2 className="font-heading text-2xl font-bold text-ink md:text-3xl">
            Fresh listings near Ho Chi Minh City
          </h2>
          <Link
            to="/browse"
            className="shrink-0 text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            View all listings &rarr;
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {LISTINGS.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    </section>
  )
}
