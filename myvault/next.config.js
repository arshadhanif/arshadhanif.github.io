/** @type {import('next').NextConfig} */

// GitHub Pages deployment configuration.
//
// This repo (arshadhanif.github.io) is a *user* GitHub Pages site, so the
// site is served from the domain root and `basePath` should stay empty.
//
// If you later deploy MyVault to a *project* page (e.g. username.github.io/myvault),
// set the BASE_PATH env var (e.g. BASE_PATH="/myvault") and the app + assets
// will be served from that sub-path automatically.
const basePath = process.env.BASE_PATH || '';

const nextConfig = {
  // Produce a fully static site in `out/` for GitHub Pages.
  output: 'export',

  // Static export cannot use the Next.js Image Optimization server.
  images: {
    unoptimized: true,
  },

  // GitHub Pages serves each route as a directory with an index.html.
  trailingSlash: true,

  basePath,
  // Expose basePath to the client (for asset prefixes in components).
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },

  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
};

module.exports = nextConfig;
