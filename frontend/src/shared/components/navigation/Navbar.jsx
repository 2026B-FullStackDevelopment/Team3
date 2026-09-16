import { Link, NavLink } from "react-router-dom";
import { cn } from "@/shared/utils/cn.js";
import { Brand } from "@/shared/components/Brand.jsx";
import { Button } from "@/shared/components/Button.jsx";
import { UserMenu } from "@/shared/components/navigation/UserMenu.jsx";
import { USER_ROLES } from "@/config/constants.js";

/**
 * Role-aware top bar (presentation only — session data arrives via props).
 * `public` renders the marketing bar over the Landing hero; authed roles render
 * a dark-green bar with the role's links and the account UserMenu. When a `user`
 * is present the public bar's auth actions become the UserMenu too.
 * Tailwind classes inlined (single-file rule).
 */

// Marketing anchors for the public (Landing) bar.
const PUBLIC_LINKS = [
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Food", href: "#food", active: true },
  { label: "Contact", href: "#contact" },
];

// Center nav links per role (placeholder routes until their modules are built).
const ROLE_LINKS = {
  recipient: [
    { label: "Browse", to: "/browse" },
    { label: "History", to: "/history" },
  ],
  donor: [
    { label: "Dashboard", to: "/donor/dashboard" },
    { label: "My Listings", to: "/donor/listings" },
    { label: "Manual Entries", to: "/donor/manual-donations" },
  ],
  admin: [
    { label: "Listing Moderation", to: "/admin/listing-moderation" },
    { label: "User Management", to: "/admin/user-management" },
    { label: "Audit Log", to: "/admin/audit-log" },
  ],
};

// Account dropdown items per role.
const MENU_ITEMS = {
  recipient: [
    { label: "Profile", to: "/profile", icon: "user" },
    { label: "Wallet", to: "/wallet", icon: "wallet" },
    {
      label: "Notification Preferences",
      to: "/notification-preferences",
      icon: "bell",
    },
  ],
  donor: [
    { label: "Dashboard", to: "/donor/dashboard" },
    { label: "My Listings", to: "/donor/listings" },
    { label: "Manual Entries", to: "/donor/manual-donations" },
    { label: "Profile", to: "/donor/profile" },
  ],
  // The three admin tabs already live in the top nav (below), so the
  // account dropdown has nothing role-specific to add -- just avatar + Log Out.
  admin: [],
};

function itemsForUser(user) {
  const role = String(user?.role ?? "").toLowerCase();
  return MENU_ITEMS[role] ?? [];
}

function PublicBar({ user, onLogout }) {
  const link =
    "rounded-full px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:text-white";
  const linkActive = "bg-[#c56f52] text-white hover:text-white";
  return (
    <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 md:px-10">
      <Brand tone="light" />
      <nav className="hidden items-center gap-1 rounded-full bg-white/10 px-2 py-1 backdrop-blur-sm md:flex">
        {PUBLIC_LINKS.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={cn(link, item.active && linkActive)}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        {user ? (
          <UserMenu
            user={user}
            items={itemsForUser(user)}
            onLogout={onLogout}
            tone="light"
          />
        ) : (
          <>
            <Link
              to="/login"
              className="px-2 text-sm font-medium text-white/90 transition-colors hover:text-white"
            >
              Log in
            </Link>
            <Button to="/register" size="sm">
              Register Now
            </Button>
          </>
        )}
      </div>
    </header>
  );
}

function AuthedBar({ role, user, onLogout, actions }) {
  // The `role` prop is already route-guard-restricted (RequireRole), but the
  // Admin tab specifically is re-checked against the real authenticated
  // user's role, not just the layout prop -- so it can never render off a
  // mismatched/stale `role` value passed into RoleLayout.
  const isAdmin = role === "admin";
  const links = isAdmin
    ? user?.role === USER_ROLES.ADMIN
      ? ROLE_LINKS.admin
      : []
    : (ROLE_LINKS[role] ?? []);
  return (
    <header className="sticky top-0 z-20 bg-ink">
      <div
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between gap-x-3 gap-y-2 px-4 py-3 sm:px-6",
          // Admin's 3 tabs replace what used to be a separate sidebar (A.3.c) --
          // they need to stay reachable below md, so the row wraps them onto
          // their own line instead of hiding them like the other roles' nav.
          isAdmin && "flex-wrap",
        )}
      >
        <Brand tone="light" />
        <nav
          className={cn(
            "items-center gap-1",
            isAdmin
              ? "order-3 flex w-full overflow-x-auto md:order-none md:w-auto"
              : "hidden md:flex",
          )}
        >
          {links.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/15 font-bold text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {actions}
          <UserMenu
            user={user}
            items={MENU_ITEMS[role] ?? []}
            onLogout={onLogout}
            tone="light"
          />
        </div>
      </div>
    </header>
  );
}

export function Navbar({ role = "public", user, onLogout, actions }) {
  if (role === "public") return <PublicBar user={user} onLogout={onLogout} />;
  return (
    <AuthedBar role={role} user={user} onLogout={onLogout} actions={actions} />
  );
}
