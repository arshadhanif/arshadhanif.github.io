import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getAllPostSlugs, getPostBySlug, getRelatedPosts } from '@/lib/posts';
import CategoryBadge from '@/components/CategoryBadge';
import AuthorBio from '@/components/AuthorBio';
import ShareButtons from '@/components/ShareButtons';
import ArticleCard from '@/components/ArticleCard';
import LeadMagnet from '@/components/LeadMagnet';
import JsonLd from '@/components/JsonLd';
import ReadingProgress from '@/components/ReadingProgress';
import Breadcrumbs from '@/components/Breadcrumbs';
import TableOfContents from '@/components/TableOfContents';
import { extractHeadings, slugify } from '@/lib/toc';
import { categorySlug } from '@/lib/categories';
import { SITE_NAME, FOUNDER, LEAD_MAGNET, SITE_URL, OG_IMAGE } from '@/lib/constants';

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const post = getPostBySlug(params.slug);
  if (!post) return { title: 'Not found' };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
      authors: [FOUNDER.name],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  };
}

function formatDate(date: string) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Pull plain text out of MDX heading children so anchors match the TOC slugs.
function childText(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(childText).join('');
  return '';
}

const mdxComponents = {
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 id={slugify(childText(props.children))} className="scroll-mt-24" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 id={slugify(childText(props.children))} className="scroll-mt-24" {...props} />
  ),
};

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const related = getRelatedPosts(post.slug, 2);
  const headings = extractHeadings(post.content);

  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const siteBase = `${SITE_URL}${base}`;
  const postUrl = `${siteBase}/blog/${post.slug}/`;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    articleSection: post.category,
    image: `${siteBase}${OG_IMAGE}`,
    author: { '@type': 'Person', name: FOUNDER.name },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${siteBase}/favicon.svg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
    url: postUrl,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteBase}/` },
      { '@type': 'ListItem', position: 2, name: 'Articles', item: `${siteBase}/blog/` },
      { '@type': 'ListItem', position: 3, name: post.title, item: postUrl },
    ],
  };

  return (
    <article className="container-page max-w-3xl py-16">
      <ReadingProgress />
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />
      <Breadcrumbs
        items={[
          { label: 'Articles', href: '/blog' },
          { label: post.category, href: `/blog/category/${categorySlug(post.category)}` },
          { label: post.title },
        ]}
      />

      <header className="mt-5 border-b-2 border-foreground pb-8">
        <div className="flex items-center gap-3">
          <CategoryBadge
            category={post.category}
            as="link"
            href={`/blog/category/${categorySlug(post.category)}`}
          />
          <span className="font-mono text-xs uppercase tracking-wider text-muted">{post.readTime}</span>
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
          {post.title}
        </h1>
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-wider text-muted">
          <span>By {FOUNDER.name}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
        </div>
      </header>

      <TableOfContents headings={headings} />

      <div className="prose-article mt-10">
        <MDXRemote source={post.content} components={mdxComponents} />
      </div>

      {/* Content upgrade: turn a reader into a subscriber */}
      <div className="mt-12">
        <LeadMagnet
          variant="banner"
          title={LEAD_MAGNET.title}
          description={LEAD_MAGNET.description}
          fileUrl={LEAD_MAGNET.fileUrl}
          format={LEAD_MAGNET.format}
        />
      </div>

      <hr className="my-10 border-border" />

      <div className="flex flex-col gap-8">
        <ShareButtons title={post.title} slug={post.slug} />
        <AuthorBio />
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-8 border-b-2 border-foreground pb-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">Keep reading</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {related.map((r) => (
              <ArticleCard key={r.slug} post={r} />
            ))}
          </div>
        </section>
      )}

      <p className="mt-12 text-center text-sm text-muted">
        Find more templates and guides across {SITE_NAME}.
      </p>
    </article>
  );
}
