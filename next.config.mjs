/** @type {import('next').NextConfig} */
// next.config.mjs

export default {
  async headers() {
    return [
      {
        source: '/(.*)', // This applies the header to all routes
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'all', // Allow all search engines to crawl the pages
          },
        ],
      },
    ];
  },
  // Other Next.js configurations (if any) go here
};
