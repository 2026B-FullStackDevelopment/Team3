import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HandCoins } from "lucide-react";
import { donationService } from "@/features/donation/service/donationService.js";
import { donationKeys } from "@/features/donation/service/donationKeys.js";
import { useDonationList } from "@/features/donation/hooks/useDonationData.js";
import { DonationStatus, MeasurementUnit } from "@/lib/donation.js";
import { formatQuantityWithUnit, formatVnd } from "@/lib/formatters.js";
import { DonationPageHeader } from "@/features/donation/components/DonationUI.jsx";
import { StatusAlert } from "@/shared/components/status-alert.jsx";

export function ManualDonationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const listings = useDonationList({ includeClosed: true, limit: 100 });
  const [recipientName, setRecipientName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [amountReceived, setAmountReceived] = useState("");
  const selectedId = searchParams.get("listing") ?? "";
  const selected = useMemo(
    () => listings.data?.entries.find((item) => item.id === selectedId),
    [listings.data, selectedId],
  );
  const total = selected ? Number(quantity || 0) * selected.price : 0;
  const change = Math.max(Number(amountReceived || 0) - total, 0);
  const mutation = useMutation({
    mutationFn: (body) => donationService.manualDonation(selected.id, body),
    onSuccess: (result) => {
      queryClient.setQueryData(
        donationKeys.detail(result.listing.id),
        result.listing,
      );
      queryClient.invalidateQueries({ queryKey: donationKeys.all });
    },
  });

  function selectListing(id) {
    setSearchParams(id ? { listing: id } : {});
    setQuantity(1);
    mutation.reset();
  }

  function submit(event) {
    event.preventDefault();
    if (!selected || selected.status !== DonationStatus.ACTIVE) return;
    const numericQuantity =
      selected.measurementUnit === MeasurementUnit.PER_REQUEST
        ? 1
        : Number(quantity);
    if (
      !recipientName.trim() ||
      numericQuantity <= 0 ||
      numericQuantity > selected.remainingQuantity
    )
      return;
    const body = {
      recipientName: recipientName.trim(),
      quantity: numericQuantity,
    };
    if (total > 0) {
      body.paymentMethod = paymentMethod;
      body.amountReceived = Number(amountReceived);
    }
    mutation.mutate(body);
  }

  const invalidQuantity =
    selected &&
    (Number(quantity) <= 0 || Number(quantity) > selected.remainingQuantity);
  const insufficientCash = total > 0 && Number(amountReceived || 0) < total;

  return (
    <div className="donation-page">
      <DonationPageHeader
        eyebrow="Direct handoff"
        title="Manual Donation Entry"
        description="Record food handed directly to a recipient and calculate cash change."
        actions={
          <Link className="button-secondary" to="/donor/dashboard">
            Back to Dashboard
          </Link>
        }
      />
      {listings.isLoading && (
        <StatusAlert variant="loading" title="Loading listings" />
      )}
      {listings.isError && (
        <StatusAlert variant="danger" title="Unable to load listings">
          {listings.error.message}
        </StatusAlert>
      )}
      {listings.data && (
        <div className="manual-grid">
          <section className="panel manual-selector">
            <h2>Choose a listing</h2>
            <p className="muted-text">
              Closed and paused listings remain visible with their current
              state.
            </p>
            <div className="manual-listings">
              {listings.data.entries.map((listing) => (
                <button
                  className={selectedId === listing.id ? "selected" : ""}
                  key={listing.id}
                  onClick={() => selectListing(listing.id)}
                  type="button"
                >
                  <span>
                    <strong>{listing.name}</strong>
                    <small>
                      {formatQuantityWithUnit(
                        listing.remainingQuantity,
                        listing.measurementUnit,
                      )}{" "}
                      available
                    </small>
                  </span>
                  <em>{listing.status}</em>
                </button>
              ))}
            </div>
          </section>
          <form className="panel manual-form" onSubmit={submit}>
            <div className="form-section-title">
              <span>
                <HandCoins />
              </span>
              <div>
                <h2>Give Out Donation</h2>
                <p>{selected ? selected.name : "Select a listing to begin"}</p>
              </div>
            </div>
            {!selected && (
              <div className="donation-empty">
                <h3>No listing selected</h3>
                <p>Choose one of your donation listings.</p>
              </div>
            )}
            {selected && selected.status !== DonationStatus.ACTIVE && (
              <StatusAlert
                variant="warning"
                title={`${selected.status} listing`}
              >
                Only Active listings can receive a manual donation. Manage its
                status from My Listings.
              </StatusAlert>
            )}
            {selected && (
              <>
                <label>
                  Recipient&apos;s name
                  <input
                    maxLength="80"
                    required
                    value={recipientName}
                    onChange={(event) => setRecipientName(event.target.value)}
                    placeholder="Enter recipient name"
                  />
                </label>
                <label>
                  Quantity
                  <input
                    type="number"
                    min="0"
                    step={
                      selected.measurementUnit === MeasurementUnit.UNIT
                        ? 1
                        : "any"
                    }
                    readOnly={
                      selected.measurementUnit === MeasurementUnit.PER_REQUEST
                    }
                    value={
                      selected.measurementUnit === MeasurementUnit.PER_REQUEST
                        ? 1
                        : quantity
                    }
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                </label>
                {invalidQuantity && (
                  <span className="field-error">
                    Requested {quantity}; only{" "}
                    {formatQuantityWithUnit(
                      selected.remainingQuantity,
                      selected.measurementUnit,
                    )}{" "}
                    remains.
                  </span>
                )}
                <div className="manual-summary">
                  <span>
                    Unit price
                    <strong>
                      {selected.price === 0
                        ? "Free"
                        : formatVnd(selected.price)}
                    </strong>
                  </span>
                  <span>
                    Total
                    <strong>{total === 0 ? "Free" : formatVnd(total)}</strong>
                  </span>
                </div>
                {total > 0 && (
                  <>
                    <fieldset>
                      <legend>Payment method</legend>
                      <label className="radio-row">
                        <input
                          type="radio"
                          checked={paymentMethod === "Cash"}
                          onChange={() => setPaymentMethod("Cash")}
                        />{" "}
                        Cash
                      </label>
                    </fieldset>
                    <label>
                      Cash received (VND)
                      <input
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={amountReceived}
                        onChange={(event) =>
                          setAmountReceived(event.target.value)
                        }
                      />
                    </label>
                    <div className="change-due">
                      <span>Change to return</span>
                      <strong>{formatVnd(change)}</strong>
                    </div>
                    {insufficientCash && (
                      <span className="field-error">
                        Cash received must cover the {formatVnd(total)} total.
                      </span>
                    )}
                  </>
                )}
                <button
                  className="button-primary"
                  disabled={
                    mutation.isPending ||
                    selected.status !== DonationStatus.ACTIVE ||
                    invalidQuantity ||
                    insufficientCash ||
                    !recipientName.trim()
                  }
                  type="submit"
                >
                  {mutation.isPending ? "Recording…" : "Confirm & Record"}
                </button>
              </>
            )}
            {mutation.isSuccess && (
              <StatusAlert variant="success" title="Donation recorded">
                {mutation.data.listing.status === DonationStatus.SOLD_OUT
                  ? "The listing is now Sold Out."
                  : "The remaining quantity and history were updated."}
              </StatusAlert>
            )}
            {mutation.isError && (
              <StatusAlert variant="danger" title="Donation was not recorded">
                {mutation.error.message}
              </StatusAlert>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
