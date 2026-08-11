import Link from 'next/link';

interface CategoryBadgeProps {
  category: string;
  href?: string;
  active?: boolean;
  as?: 'span' | 'link' | 'button';
  onClick?: () => void;
}

const baseClasses =
  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-wide transition-colors';

function variantClasses(active: boolean) {
  return active
    ? 'border-accent bg-accent/15 text-accent'
    : 'border-border bg-surface-alt text-muted hover:border-accent/60 hover:text-accent';
}

/**
 * A small pill used for blog + product categories. Renders as a static span,
 * an internal link, or a clickable filter button depending on props.
 */
export default function CategoryBadge({
  category,
  href,
  active = false,
  as = 'span',
  onClick,
}: CategoryBadgeProps) {
  const className = `${baseClasses} ${variantClasses(active)}`;

  if (as === 'link' && href) {
    return (
      <Link href={href} className={className}>
        {category}
      </Link>
    );
  }

  if (as === 'button') {
    return (
      <button type="button" onClick={onClick} className={className}>
        {category}
      </button>
    );
  }

  return <span className={className}>{category}</span>;
}
