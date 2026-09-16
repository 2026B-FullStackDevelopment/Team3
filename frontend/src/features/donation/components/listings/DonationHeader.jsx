export function DonationPageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="donation-page-header">
      <div>
        {eyebrow && <p className="donation-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="donation-header-actions">{actions}</div>}
    </header>
  );
}
