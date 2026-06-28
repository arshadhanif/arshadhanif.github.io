/**
 * Renders a JSON-LD structured-data script. Search engines use this to
 * understand the site (organisation, articles, breadcrumbs), which helps with
 * rich results and discoverability over time.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
