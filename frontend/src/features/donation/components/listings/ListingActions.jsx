import { Link } from "react-router-dom";
import {
  Copy,
  HandCoins,
  ListChecks,
  Pause,
  Pencil,
  Play,
  Trash2,
} from "lucide-react";
import { useListingActions } from "@/features/donation/hooks/useListingActions.js";
import { DonationStatus } from "@/features/donation/models/donation.js";
import { StatusAlert } from "@/shared/components/status-alert.jsx";

export function ListingActions({ closed, listing }) {
  const actions = useListingActions(listing);

  return (
    <div className="listing-actions">
      {actions.error && (
        <StatusAlert variant="danger" title="Action failed">
          {actions.error.message}
        </StatusAlert>
      )}
      {!closed && (
        <Link
          className="button-secondary"
          to={`/donor/listings/${listing.id}/edit`}
        >
          <Pencil size={16} /> Edit
        </Link>
      )}
      <Link
        className="button-secondary"
        to={`/donor/listings/${listing.id}/duplicate`}
      >
        <Copy size={16} /> Duplicate
      </Link>
      <Link
        className="button-secondary"
        to={`/donor/listings/${listing.id}/donations`}
      >
        <ListChecks size={16} /> Reservations
      </Link>
      {listing.status === DonationStatus.ACTIVE && (
        <button
          disabled={actions.pending}
          onClick={() => actions.changeStatus(DonationStatus.PAUSED)}
        >
          <Pause size={16} /> Pause
        </button>
      )}
      {listing.status === DonationStatus.PAUSED && (
        <button
          disabled={actions.pending || listing.remainingQuantity <= 0}
          onClick={() => actions.changeStatus(DonationStatus.ACTIVE)}
        >
          <Play size={16} /> Resume
        </button>
      )}
      {[DonationStatus.ACTIVE, DonationStatus.PAUSED].includes(listing.status) &&
        (actions.confirming === "cancel" ? (
          <div
            className="inline-confirm"
            role="group"
            aria-label="Confirm listing cancellation"
          >
            <span>Close this listing?</span>
            <button
              className="button-danger"
              onClick={() => actions.changeStatus(DonationStatus.CANCELLED)}
            >
              Confirm
            </button>
            <button onClick={actions.clearConfirmation}>Keep</button>
          </div>
        ) : (
          <button
            className="button-danger-outline"
            disabled={actions.pending}
            onClick={() => actions.requestConfirmation("cancel")}
          >
            Cancel
          </button>
        ))}
      {listing.revenue <= 0 &&
        (actions.confirming === "delete" ? (
          <div
            className="inline-confirm"
            role="group"
            aria-label="Confirm permanent deletion"
          >
            <span>Delete forever?</span>
            <button className="button-danger" onClick={actions.remove}>
              <Trash2 size={15} /> Delete
            </button>
            <button onClick={actions.clearConfirmation}>Keep</button>
          </div>
        ) : (
          <button
            className="button-quiet"
            disabled={actions.pending}
            onClick={() => actions.requestConfirmation("delete")}
          >
            <Trash2 size={16} /> Delete
          </button>
        ))}
      {listing.status === DonationStatus.ACTIVE && (
        <button className="button-primary" onClick={actions.openManualDonation}>
          <HandCoins size={16} /> Give out
        </button>
      )}
    </div>
  );
}
