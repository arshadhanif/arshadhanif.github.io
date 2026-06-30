import Link from 'next/link';
import type { Product } from '@/lib/products';
import { isLive } from '@/lib/products';
import CategoryBadge from './CategoryBadge';

export default function ProductCard({ product }: { product: Product }) {
  const live = isLive(product);
  return (
    <article className="card-premium group flex h-full flex-col p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <CategoryBadge category={product.category} />
        {live ? (
          <span className="text-xs font-medium text-accent">Available now</span>
        ) : (
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
            Soon
          </span>
        )}
      </div>

      <h3 className="text-lg font-semibold leading-snug">
        <Link
          href={`/store/${product.id}`}
          className="transition-colors group-hover:text-accent"
        >
          {product.title}
        </Link>
      </h3>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
        {product.description}
      </p>

      <div className="mt-6 flex items-center justify-between gap-3">
        <span className="text-2xl font-bold text-foreground">{product.price}</span>
        <div className="flex items-center gap-3">
          <Link
            href={`/store/${product.id}`}
            className="text-sm font-medium text-accent hover:opacity-80"
          >
            Details
          </Link>
          {live ? (
            <a
              href={product.gumroadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-accent-dim"
            >
              Get it
            </a>
          ) : (
            <Link
              href="/newsletter"
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-accent-dim"
            >
              Notify me
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
