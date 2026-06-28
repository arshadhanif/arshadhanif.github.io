import type { Metadata } from 'next';
import { getAllPosts } from '@/lib/posts';
import BlogList from '@/components/BlogList';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Practical articles on Oracle Fusion, Excel, ERP strategy, tools, and finance careers.',
  openGraph: {
    title: 'Blog',
    description:
      'Practical articles on Oracle Fusion, Excel, ERP strategy, tools, and finance careers.',
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="container-page py-16">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          The Blog
        </h1>
        <p className="mt-4 text-lg text-muted">
          Field notes on ERP, Oracle Fusion, Excel, and building a finance
          career. Filter by category below.
        </p>
      </header>

      <BlogList posts={posts} />
    </div>
  );
}
