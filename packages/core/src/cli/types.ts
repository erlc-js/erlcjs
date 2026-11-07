export interface BundledDoc {
  /** Path without the /docs prefix, e.g. guides/getting-started. */
  slug: string;
  /** Route path, e.g. /docs/guides/getting-started/. */
  path: string;
  title: string;
  description: string;
  section: string;
  order: number;
  /** Raw Markdown content without frontmatter. */
  content: string;
}
