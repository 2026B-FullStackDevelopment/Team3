import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Link } from "react-router-dom";
import {
  CATEGORY_LABELS,
  MeasurementUnit,
  UNIT_LABELS,
} from "@/features/donation/models/donation.js";
import { StatusAlert } from "@/shared/components/status-alert.jsx";
import { DonationImageUpload } from "@/features/donation/components/DonationImageUpload.jsx";
import {
  createListingFormSchema,
  listingFormDefaults,
} from "@/features/donation/models/listingFormSchema.js";

/** Displays a validation message for one form field. */
function FieldError({ error }) {
  return error ? <span className="field-error">{error.message}</span> : null;
}

/** Renders and manages the shared create, edit, and duplicate listing form. */
export function ListingForm({
  mode,
  listing,
  isSaving,
  saveError,
  onSubmit,
}) {
  const validationSchema = useMemo(
    () => createListingFormSchema(mode),
    [mode],
  );
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { dirtyFields, errors, isDirty },
  } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: listingFormDefaults,
  });
  const unit = useWatch({ control, name: "measurementUnit" });
  const price = Number(useWatch({ control, name: "price" }) || 0);
  const image = useWatch({ control, name: "image" });

  useEffect(() => {
    if (!listing) return;
    reset({
      ...listing,
      name: mode === "duplicate" ? "" : listing.name,
      isVegetarian:
        listing.isVegetarian == null
          ? "unspecified"
          : listing.isVegetarian
            ? "yes"
            : "no",
      image: null,
    });
  }, [listing, mode, reset]);

  /** Passes validated values and a snapshot of changed fields to the page. */
  function submit(values) {
    return onSubmit(values, { ...dirtyFields });
  }

  return (
    <form
      className="listing-form panel"
      onSubmit={handleSubmit(submit)}
      noValidate
    >
      <div className="form-section-title">
        <span>1</span>
        <div>
          <h2>Basic information</h2>
          <p>Use clear, accurate details for recipients.</p>
        </div>
      </div>
      <div className="form-grid">
        <label className="full-field">
          Listing name
          <input {...register("name")} placeholder="e.g. Vegetable Curry" />
          <FieldError error={errors.name} />
        </label>
        <label>
          Category
          <select {...register("foodCategory")}>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <FieldError error={errors.foodCategory} />
        </label>
        <label>
          Measurement unit
          <select {...register("measurementUnit")}>
            {Object.entries(UNIT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <FieldError error={errors.measurementUnit} />
        </label>
        <label className="full-field">
          Description
          <textarea
            maxLength="500"
            rows="4"
            {...register("description")}
            placeholder="Add details about the food"
          />
          <FieldError error={errors.description} />
        </label>
      </div>

      <div className="form-section-title">
        <span>2</span>
        <div>
          <h2>Listing photo</h2>
          <p>Show recipients the food included in this listing.</p>
        </div>
      </div>
      {mode === "create" ? (
        <DonationImageUpload
          file={image}
          error={errors.image?.message}
          disabled={isSaving}
          onChange={(file) =>
            setValue("image", file, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            })
          }
          onError={(message) => {
            if (message) {
              setError("image", { type: "manual", message });
            }
          }}
        />
      ) : (
        <div className="existing-listing-image">
          {listing?.imageUrl ? (
            <img
              src={listing.imageUrl}
              alt={`${listing.name} donation food`}
            />
          ) : (
            <div className="existing-listing-image-fallback">
              No listing image is available.
            </div>
          )}
          <p>
            {mode === "duplicate"
              ? "The duplicate will reuse this image."
              : "Image replacement is not available for existing listings."}
          </p>
        </div>
      )}

      <div className="form-section-title">
        <span>3</span>
        <div>
          <h2>Food details</h2>
          <p>Set quantity, price, and recipient limits.</p>
        </div>
      </div>
      {unit === MeasurementUnit.PER_REQUEST && (
        <StatusAlert variant="warning" title="Per Request — special condition">
          Quantity is fixed to one request, online reservation is unavailable,
          and the first fulfilled request may mark this listing Sold Out.
        </StatusAlert>
      )}
      <div className="form-grid">
        <label>
          Dietary preference
          <select {...register("isVegetarian")}>
            <option value="unspecified">Not specified</option>
            <option value="yes">Vegetarian</option>
            <option value="no">Non-vegetarian</option>
          </select>
        </label>
        <label>
          Available quantity
          <input
            readOnly={unit === MeasurementUnit.PER_REQUEST}
            type="number"
            min="0"
            step={unit === MeasurementUnit.UNIT ? 1 : "any"}
            {...register("remainingQuantity")}
          />
          <FieldError error={errors.remainingQuantity} />
        </label>
        <label>
          Donation limit
          <input
            readOnly={unit === MeasurementUnit.PER_REQUEST}
            type="number"
            min="0"
            step="any"
            {...register("donationLimit")}
          />
          <small>Use 0 when the total cap is not tracked.</small>
          <FieldError error={errors.donationLimit} />
        </label>
        <label>
          Ration per recipient
          <input
            readOnly={unit === MeasurementUnit.PER_REQUEST}
            type="number"
            min="0"
            step="any"
            {...register("ration")}
          />
          <small>0 means no ration limit.</small>
          <FieldError error={errors.ration} />
        </label>
        <label>
          Price (VND)
          <input type="number" min="0" step="1" {...register("price")} />
          <small>
            {price > 0 && price < 1000
              ? "This will be saved as Free."
              : "Prices below 1,000 VND become Free."}
          </small>
          <FieldError error={errors.price} />
        </label>
      </div>

      {saveError && (
        <StatusAlert variant="danger" title="Listing could not be saved">
          {saveError.message}
        </StatusAlert>
      )}
      <div className="form-actions">
        <Link className="button-secondary" to="/donor/listings">
          Back to listings
        </Link>
        <button
          className="button-primary"
          disabled={isSaving || (mode === "edit" && !isDirty)}
          type="submit"
        >
          {isSaving
            ? "Saving…"
            : mode === "edit"
              ? "Save Changes"
              : mode === "duplicate"
                ? "Create Duplicate"
                : "Create New Listing"}
        </button>
      </div>
    </form>
  );
}
