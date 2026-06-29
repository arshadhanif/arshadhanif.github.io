import type { Metadata } from 'next';
import { getAllPosts } from '@/lib/posts';
import BlogList from '@/components/BlogList';
import PageHeader from '@/components/PageHeader';

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
      <PageHeader
        eyebrow="Dispatches"
        title="The Blog"
        intro="Field notes on ERP, Oracle Fusion, Excel, and building a finance career. Filter by category below."
      />

      <BlogList posts={posts} />
    </div>
  );
}
