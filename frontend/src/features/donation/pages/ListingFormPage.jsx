import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Link, useNavigate, useParams } from "react-router-dom";
import { donationService } from "@/features/donation/service/donationService.js";
import {
  useDonationDetail,
  useDonationMutation,
} from "@/features/donation/hooks/useDonationData.js";
import {
  CATEGORY_LABELS,
  FoodCategory,
  MeasurementUnit,
  UNIT_LABELS,
} from "@/lib/donation.js";
import { StatusAlert } from "@/components/ui/status-alert.jsx";
import { DonationPageHeader } from "@/features/donation/components/DonationUI.jsx";

const schema = z
  .object({
    name: z.string().trim().min(1, "Listing name is required."),
    description: z
      .string()
      .max(500, "Description must be 500 characters or fewer."),
    foodCategory: z.enum(Object.values(FoodCategory)),
    measurementUnit: z.enum(Object.values(MeasurementUnit)),
    isVegetarian: z.enum(["unspecified", "yes", "no"]),
    remainingQuantity: z.coerce
      .number()
      .positive("Quantity must be greater than zero."),
    donationLimit: z.coerce
      .number()
      .min(0, "Donation limit cannot be negative."),
    ration: z.coerce.number().min(0, "Ration cannot be negative."),
    price: z.coerce.number().min(0, "Price cannot be negative."),
  })
  .superRefine((values, context) => {
    if (
      values.measurementUnit === MeasurementUnit.UNIT &&
      !Number.isInteger(values.remainingQuantity)
    ) {
      context.addIssue({
        code: "custom",
        path: ["remainingQuantity"],
        message: "Per Unit quantity must be a whole number.",
      });
    }
    if (values.ration > 0 && values.ration > values.remainingQuantity) {
      context.addIssue({
        code: "custom",
        path: ["ration"],
        message: "Ration cannot exceed remaining quantity.",
      });
    }
    if (values.donationLimit > 0 && values.ration > values.donationLimit) {
      context.addIssue({
        code: "custom",
        path: ["ration"],
        message: "Ration cannot exceed donation limit.",
      });
    }
  });

const defaults = {
  name: "",
  description: "",
  foodCategory: FoodCategory.FRUIT,
  measurementUnit: MeasurementUnit.KG,
  isVegetarian: "unspecified",
  remainingQuantity: 1,
  donationLimit: 1,
  ration: 0,
  price: 0,
};

function FieldError({ error }) {
  return error ? <span className="field-error">{error.message}</span> : null;
}

export function ListingFormPage({ mode = "create" }) {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const detail = useDonationDetail(mode === "create" ? null : listingId);
  const mutation = useDonationMutation(async (values) => {
    const perRequest = values.measurementUnit === MeasurementUnit.PER_REQUEST;
    const payload = {
      name: values.name.trim(),
      description: values.description.trim(),
      foodCategory: values.foodCategory,
      measurementUnit: values.measurementUnit,
      isVegetarian:
        values.isVegetarian === "unspecified"
          ? null
          : values.isVegetarian === "yes",
      remainingQuantity: perRequest ? 1 : values.remainingQuantity,
      donationLimit: perRequest ? 0 : values.donationLimit,
      ration: perRequest ? 0 : values.ration,
      price: values.price > 0 && values.price < 1000 ? 0 : values.price,
    };
    if (mode === "edit") return donationService.update(listingId, payload);
    if (mode === "duplicate")
      return donationService.duplicate(listingId, payload);
    return donationService.create(payload);
  });
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });
  const unit = useWatch({ control, name: "measurementUnit" });
  const price = Number(useWatch({ control, name: "price" }) || 0);

  useEffect(() => {
    if (!detail.data) return;
    reset({
      ...detail.data,
      name: mode === "duplicate" ? "" : detail.data.name,
      isVegetarian: detail.data.isVegetarian ? "yes" : "no",
    });
  }, [detail.data, mode, reset]);

  async function submit(values) {
    const listing = await mutation.mutateAsync(values);
    navigate(`/donor/listings/${listing.id}/reservations`, { replace: true });
  }

  const title =
    mode === "edit"
      ? "Edit Donation Listing"
      : mode === "duplicate"
        ? "Duplicate Donation Listing"
        : "Create New Donation Listing";
  if (mode !== "create" && detail.isLoading)
    return <StatusAlert variant="loading" title="Loading listing" />;
  if (mode !== "create" && detail.isError)
    return (
      <StatusAlert variant="danger" title="Unable to load listing">
        {detail.error.message}
      </StatusAlert>
    );

  return (
    <div className="donation-page donation-form-page">
      <DonationPageHeader
        eyebrow="Donation listing"
        title={title}
        description="Share extra food with your community using the live Donation API."
      />
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
            <h2>Food details</h2>
            <p>Set quantity, price, and recipient limits.</p>
          </div>
        </div>
        {unit === MeasurementUnit.PER_REQUEST && (
          <StatusAlert
            variant="warning"
            title="Per Request — special condition"
          >
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
        {mutation.isError && (
          <StatusAlert variant="danger" title="Listing could not be saved">
            {mutation.error.message}
          </StatusAlert>
        )}
        <div className="form-actions">
          <Link className="button-secondary" to="/donor/listings">
            Back to listings
          </Link>
          <button
            className="button-primary"
            disabled={mutation.isPending}
            type="submit"
          >
            {mutation.isPending
              ? "Saving…"
              : mode === "edit"
                ? "Save Changes"
                : mode === "duplicate"
                  ? "Create Duplicate"
                  : "Create New Listing"}
          </button>
        </div>
      </form>
    </div>
  );
}
