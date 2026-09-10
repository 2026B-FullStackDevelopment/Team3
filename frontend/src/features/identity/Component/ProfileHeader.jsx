import { Avatar } from '@/shared/components/Avatar.jsx'

/** Avatar + name + "email · city" + optional badge (e.g. Premium). */
export function ProfileHeader({ name, sub, avatarUrl, badge }) {
  return (
    <div className="flex items-center gap-5">
      <Avatar src={avatarUrl} size="lg" className="h-16 w-16" />
      <div>
        <h2 className="font-heading text-xl font-bold text-ink">{name}</h2>
        <p className="text-sm text-muted">{sub}</p>
        {badge && <div className="mt-2">{badge}</div>}
      </div>
    </div>
  )
}
