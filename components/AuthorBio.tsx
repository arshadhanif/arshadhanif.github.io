import { AUTHOR } from '@/lib/constants';

export default function AuthorBio() {
  const initials = AUTHOR.name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('');

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 sm:flex-row sm:items-center">
      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-accent text-xl font-bold text-background">
        {initials}
      </div>
      <div>
        <p className="text-base font-semibold">{AUTHOR.name}</p>
        <p className="text-sm text-accent">{AUTHOR.title}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{AUTHOR.bio}</p>
      </div>
    </div>
  );
}
