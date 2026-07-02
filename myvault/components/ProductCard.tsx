import Link from 'next/link';
import type { Product } from '@/lib/products';
import { isLive } from '@/lib/products';
import CategoryBadge from './CategoryBadge';
import { IconArrowRight } from './Icons';

export default function ProductCard({ product }: { product: Product }) {
  const live = isLive(product);
  return (
    <article className="card-premium group flex h-full flex-col p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <CategoryBadge category={product.category} />
        {live ? (
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-accent">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            Available now
          </span>
        ) : (
          <span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted">
            Coming soon
          </span>
        )}
      </div>

      <h3 className="font-display text-xl font-bold leading-snug tracking-tight">
        <Link
          href={`/store/${product.id}`}
          className="transition-colors group-hover:text-accent"
        >
          {product.title}
        </Link>
      </h3>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden">
        {product.description}
      </p>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-5">
        <span className="font-display text-2xl font-bold text-foreground">
          {product.price}
        </span>
        <div className="flex items-center gap-4">
          <Link
            href={`/store/${product.id}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:opacity-80"
          >
            Details
            <IconArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          {live ? (
            <a
              href={product.gumroadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background transition-all hover:-translate-y-0.5 hover:bg-accent-dim"
            >
              Get it
            </a>
          ) : (
            <Link
              href="/newsletter"
              className="whitespace-nowrap rounded-full border border-foreground px-5 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-accent hover:text-accent"
            >
              Notify me
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
