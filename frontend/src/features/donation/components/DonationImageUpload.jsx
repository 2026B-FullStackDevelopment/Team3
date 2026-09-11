import { useEffect, useMemo, useRef, useState } from "react";
import { Image as ImageIcon, UploadCloud, X } from "lucide-react";
import { validateDonationImage } from "@/lib/donation.js";

export function DonationImageUpload({
  file,
  error,
  onChange,
  onError,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function chooseFile(candidate) {
    const validationError = validateDonationImage(candidate);
    if (validationError) {
      onChange(null);
      onError(validationError);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    onError(null);
    onChange(candidate);
  }

  function openPicker() {
    if (!disabled) inputRef.current?.click();
  }

  function removeFile(event) {
    event.stopPropagation();
    onChange(null);
    onError("A food image is required.");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="donation-image-field">
      <span className="donation-image-label">
        Food image <span aria-hidden="true">*</span>
      </span>
      <div
        className={`donation-image-dropzone ${isDragging ? "is-dragging" : ""} ${error ? "has-error" : ""} ${previewUrl ? "has-preview" : ""}`}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label="Choose food image"
        aria-describedby="donation-image-help donation-image-error"
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openPicker();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsDragging(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (disabled) return;
          if (event.dataTransfer.files?.length !== 1) {
            onChange(null);
            onError("Upload exactly one food image.");
            return;
          }
          chooseFile(event.dataTransfer.files[0]);
        }}
      >
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          aria-label="Upload food image"
          disabled={disabled}
          onChange={(event) => chooseFile(event.target.files?.[0])}
        />
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="Selected food preview" />
            <div className="donation-image-preview-copy">
              <ImageIcon aria-hidden="true" />
              <span>
                <strong>{file.name}</strong>
                <small>{(file.size / (1024 * 1024)).toFixed(2)} MB</small>
              </span>
              <button
                type="button"
                className="button-quiet"
                onClick={removeFile}
                aria-label="Remove selected food image"
              >
                <X aria-hidden="true" /> Remove
              </button>
            </div>
          </>
        ) : (
          <div className="donation-image-empty">
            <UploadCloud aria-hidden="true" />
            <strong>Drag and drop an image here, or click to browse</strong>
            <small id="donation-image-help">
              JPEG, PNG, or WebP, maximum 5 MB
            </small>
          </div>
        )}
      </div>
      <span
        className="field-error"
        id="donation-image-error"
        role={error ? "alert" : undefined}
      >
        {error}
      </span>
    </div>
  );
}
