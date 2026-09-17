import { Leaf } from "lucide-react";
import { ListingActions } from "@/features/donation/components/listings/ListingActions.jsx";
import { ListingArtwork } from "@/features/donation/components/listings/ListingArtwork.jsx";
import { StatusBadge } from "@/features/donation/components/listings/StatusBadge.jsx";
import { CATEGORY_LABELS, DonationStatus } from "@/features/donation/models/donation.js";
import { formatQuantityWithUnit } from "@/features/donation/utils/donationFormatters.js";
import { formatDateTime, formatVnd } from "@/shared/utils/formatters.js";

export function ListingCard({ listing }) {
  const closed =
    listing.closedAt ||
    [DonationStatus.CANCELLED, DonationStatus.SOLD_OUT].includes(listing.status);
  const donated =
    listing.donationLimit > 0
      ? Math.max(listing.donationLimit - listing.remainingQuantity, 0)
      : null;

  return (
    <article className="listing-card">
      <ListingArtwork listing={listing} />
      <div className="listing-body">
        <div className="listing-title-row">
          <div>
            <div className="listing-badges">
              <span>
                {CATEGORY_LABELS[listing.foodCategory] ?? listing.foodCategory}
              </span>
              {listing.isVegetarian != null && (
                <span>
                  {listing.isVegetarian && <Leaf size={13} />}
                  {listing.isVegetarian ? "Vegetarian" : "Non-vegetarian"}
                </span>
              )}
            </div>
            <h3>{listing.name}</h3>
            <p className="listing-quantity">
              {formatQuantityWithUnit(
                listing.remainingQuantity,
                listing.measurementUnit,
              )}{" "}
              remaining
            </p>
          </div>
          <StatusBadge status={listing.status} />
        </div>
        <dl className="listing-metrics">
          <div>
            <dt>Price</dt>
            <dd>{listing.price === 0 ? "Free" : formatVnd(listing.price)}</dd>
          </div>
          <div>
            <dt>Donation limit</dt>
            <dd>
              {listing.donationLimit > 0
                ? formatQuantityWithUnit(
                    listing.donationLimit,
                    listing.measurementUnit,
                  )
                : "Not tracked"}
            </dd>
          </div>
          <div>
            <dt>Donated</dt>
            <dd>
              {donated === null
                ? "Not tracked"
                : formatQuantityWithUnit(donated, listing.measurementUnit)}
            </dd>
          </div>
          <div>
            <dt>Revenue</dt>
            <dd>{formatVnd(listing.revenue)}</dd>
          </div>
          <div>
            <dt>Created on</dt>
            <dd>{formatDateTime(listing.createdAt)}</dd>
          </div>
          {closed && (
            <div>
              <dt>Closed on</dt>
              <dd>{formatDateTime(listing.closedAt)}</dd>
            </div>
          )}
        </dl>
      </div>
      <ListingActions closed={closed} listing={listing} />
    </article>
  );
}
