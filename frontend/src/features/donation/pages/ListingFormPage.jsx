import { useNavigate, useParams } from "react-router-dom";
import { donationService } from "@/features/donation/service/donationService.js";
import {
  useDonationDetail,
  useDonationMutation,
} from "@/features/donation/hooks/useDonationData.js";
import { DonationPageHeader } from "@/features/donation/components/DonationUI.jsx";
import { ListingForm } from "@/features/donation/components/listing-form/ListingForm.jsx";
import {
  buildEditListingPayload,
  buildListingPayload,
} from "@/features/donation/components/listing-form/listingFormPayload.js";
import { StatusAlert } from "@/shared/components/status-alert.jsx";

/** Coordinates listing data, API mutations, and navigation for the form. */
export function ListingFormPage({ mode = "create" }) {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const detail = useDonationDetail(mode === "create" ? null : listingId);
  const mutation = useDonationMutation(async ({ values, dirtyFields }) => {
    const payload =
      mode === "edit"
        ? buildEditListingPayload(values, dirtyFields)
        : buildListingPayload(values);

    if (mode === "edit") return donationService.update(listingId, payload);
    if (mode === "duplicate") {
      return donationService.duplicate(listingId, payload);
    }
    return donationService.create(payload, values.image);
  });

  /** Saves the listing and returns to the donor's listing page. */
  async function submit(values, dirtyFields) {
    await mutation.mutateAsync({ values, dirtyFields });
    navigate("/donor/listings", { replace: true });
  }

  const title =
    mode === "edit"
      ? "Edit Donation Listing"
      : mode === "duplicate"
        ? "Duplicate Donation Listing"
        : "Create New Donation Listing";

  if (mode !== "create" && detail.isLoading) {
    return <StatusAlert variant="loading" title="Loading listing" />;
  }

  if (mode !== "create" && detail.isError) {
    return (
      <StatusAlert variant="danger" title="Unable to load listing">
        {detail.error.message}
      </StatusAlert>
    );
  }

  return (
    <div className="donation-page donation-form-page">
      <DonationPageHeader
        eyebrow="Donation listing"
        title={title}
        description="Share extra food with your community using the live Donation API."
      />
      <ListingForm
        mode={mode}
        listing={detail.data}
        isSaving={mutation.isPending}
        saveError={mutation.isError ? mutation.error : null}
        onSubmit={submit}
      />
    </div>
  );
}
