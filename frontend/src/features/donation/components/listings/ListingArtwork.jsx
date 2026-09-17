import { useState } from "react";
import { PackageOpen } from "lucide-react";

export function ListingArtwork({ listing }) {
  const [imageFailed, setImageFailed] = useState(false);
  const fallback = !listing.imageUrl || imageFailed;

  return (
    <div
      className={`listing-art category-${listing.foodCategory} ${fallback ? "" : "has-image"}`}
    >
      {fallback ? (
        <PackageOpen aria-hidden="true" />
      ) : (
        <img
          src={listing.imageUrl}
          alt={`${listing.name} donation food`}
          onError={() => setImageFailed(true)}
        />
      )}
    </div>
  );
}
