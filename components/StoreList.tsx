'use client';

import { useMemo, useState } from 'react';
import type { Product } from '@/lib/products';
import ProductCard from './ProductCard';
import CategoryBadge from './CategoryBadge';

const ALL = 'All';

export default function StoreList({ products }: { products: Product[] }) {
  const [active, setActive] = useState<string>(ALL);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return [ALL, ...Array.from(set)];
  }, [products]);

  const filtered =
    active === ALL ? products : products.filter((p) => p.category === active);

  return (
    <>
      <div className="mb-10 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <CategoryBadge
            key={cat}
            category={cat}
            as="button"
            active={active === cat}
            onClick={() => setActive(cat)}
          />
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}
