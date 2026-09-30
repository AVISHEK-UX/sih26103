import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The landing page is the entry point: it introduces the system and links on to the
      // dashboard. The component at src/app/page.tsx stays where it is -- /analyses,
      // /documents and /projects/[projectId] render it as the project intelligence report.
      {
        source: "/",
        destination: "/landing",
        permanent: false,
      },
      {
        source: "/geospatial",
        destination: "/gis-check",
        permanent: false,
      },
      {
        source: "/geospatial-view",
        destination: "/gis-check",
        permanent: false,
      },
      // The registry list moved from /dashboard to /projects; its deep links (?risk=high,
      // ?search=) still resolve. Next passes the query string through to the destination.
      {
        source: "/dashboard",
        has: [{ type: "query", key: "risk" }],
        destination: "/projects",
        permanent: false,
      },
      {
        source: "/dashboard",
        has: [{ type: "query", key: "search" }],
        destination: "/projects",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
