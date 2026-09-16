import { PackageOpen } from "lucide-react";
import { ListingCard } from "@/features/donation/components/listings/ListingCard.jsx";

export function ListingSection({ title, listings, emptyTitle, emptyCopy }) {
  return (
    <section className="donation-section">
      <h2>{title}</h2>
      {listings.length ? (
        <div className="listing-stack">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="donation-empty">
          <PackageOpen aria-hidden="true" />
          <h3>{emptyTitle}</h3>
          <p>{emptyCopy}</p>
        </div>
      )}
    </section>
  );
}
