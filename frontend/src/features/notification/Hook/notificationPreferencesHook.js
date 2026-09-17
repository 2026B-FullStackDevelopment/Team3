import { useCallback, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { notificationPreferencesService } from "@/features/notification/Service/notificationPreferencesService.js";
import {
  formatPreference,
  formatPreferences,
  toPreferencePayload,
} from "@/features/notification/Model/notificationPreferencesModel.js";

const MIN_PRICE = 0;
const MAX_PRICE = 100_000_000;

/* ---- List + page state ------------------------------------------------------- */

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | nonpremium | error
  const [mode, setMode] = useState("list"); // list | create | edit
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    let active = true;
    notificationPreferencesService.getPreferences().then((res) => {
      if (!active) return;
      if (res.ok) {
        setPreferences(formatPreferences(res.data.preferences));
        setStatus("ready");
      } else if (res.status === 403) {
        setStatus("nonpremium");
      } else {
        setStatus("error");
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const startCreate = useCallback(() => {
    setEditing(null);
    setMode("create");
  }, []);
  const startEdit = useCallback((pref) => {
    setEditing(pref);
    setMode("edit");
  }, []);
  const cancelForm = useCallback(() => {
    setEditing(null);
    setMode("list");
  }, []);

  // Prepend a new pref, or replace the edited one; back to the list.
  const applySaved = useCallback((saved, isNew) => {
    setPreferences((prev) =>
      isNew
        ? [saved, ...prev]
        : prev.map((p) => (p.id === saved.id ? saved : p)),
    );
    setEditing(null);
    setMode("list");
  }, []);

  const requestDelete = useCallback((pref) => setDeleteTarget(pref), []);
  const cancelDelete = useCallback(() => setDeleteTarget(null), []);
  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const res = await notificationPreferencesService.deletePreference(
      deleteTarget.id,
    );
    // 204 (ok) or 404 (already gone) → drop it either way.
    if (res.ok || res.status === 404) {
      setPreferences((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  }, [deleteTarget]);

  return {
    preferences,
    status,
    mode,
    editing,
    startCreate,
    startEdit,
    cancelForm,
    applySaved,
    deleteTarget,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
}

/* ---- Create / edit form ------------------------------------------------------ */

export function usePreferenceForm(editing, onSaved) {
  const isEdit = Boolean(editing);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: editing
      ? {
          categories: editing.categories,
          vegetarian:
            editing.isVegetarian == null
              ? "any"
              : editing.isVegetarian
                ? "vegetarian"
                : "nonVegetarian",
          min: String(editing.priceRangeMin),
          max: String(editing.priceRangeMax),
          city: editing.city,
        }
      : {
          categories: [],
          vegetarian: "any",
          min: "",
          max: "",
          city: "",
        },
  });

  const categories = useWatch({ control, name: "categories" }) ?? [];
  const [banner, setBanner] = useState(null);
  const [categoryError, setCategoryError] = useState(null);

  const toggleCategory = (label) => {
    const next = categories.includes(label)
      ? categories.filter((c) => c !== label)
      : [...categories, label];
    setValue("categories", next);
    if (next.length > 0) setCategoryError(null);
  };

  const onSubmit = handleSubmit(async (values) => {
    setBanner(null);
    setCategoryError(null);

    if (!values.categories || values.categories.length === 0) {
      setCategoryError("Select at least one food category — e.g. Fruit.");
      return;
    }

    const payload = toPreferencePayload(values);
    const res = isEdit
      ? await notificationPreferencesService.updatePreference(
          editing.id,
          payload,
        )
      : await notificationPreferencesService.createPreference(payload);

    if (res.ok) {
      onSaved(formatPreference(res.data.preference), !isEdit);
      return;
    }
    if (res.status === 409) {
      setBanner(
        "You already have a notification preference with these exact settings.",
      );
      return;
    }
    setBanner(
      res.error?.message ?? "Could not save your preference. Please try again.",
    );
  });

  return {
    register,
    onSubmit,
    errors,
    isSubmitting,
    banner,
    categoryError,
    categories,
    toggleCategory,
    isEdit,
    minRules: {
      required: "Enter a minimum price — e.g. 0.",
      validate: (v) => {
        const n = Number(v);
        if (!Number.isInteger(n) || n < MIN_PRICE)
          return "Min must be a whole number ≥ 0 — e.g. 0.";
        if (n > MAX_PRICE) return "Min is too large.";
        return true;
      },
    },
    maxRules: {
      required: "Enter a maximum price — e.g. 50000.",
      validate: (v, values) => {
        const n = Number(v);
        if (!Number.isInteger(n) || n < MIN_PRICE)
          return "Max must be a whole number ≥ 0 — e.g. 50000.";
        if (n > MAX_PRICE) return "Max is too large.";
        if (Number(values.min) > n)
          return "Max must be greater than or equal to Min.";
        return true;
      },
    },
    cityRules: { required: "Select your city — e.g. Ho Chi Minh City." },
  };
}
