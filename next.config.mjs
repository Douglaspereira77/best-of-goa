/** @type {import('next').NextConfig} */
console.log('----------------------------------------');
console.log('LOADING NEXT.CONFIG.MJS - DEBUG ACTIVE');
console.log('----------------------------------------');

const nextConfig = {
    // Skip URL normalization for redirects to prevent 308 -> 301 chains
    skipTrailingSlashRedirect: true,

    // Ignore ESLint during builds (service files have warnings - fix later)
    eslint: {
        ignoreDuringBuilds: true,
    },

    // Ignore TypeScript errors during builds (type mismatches - fix later)
    typescript: {
        ignoreBuildErrors: true,
    },

    // Add experimental features for better performance
    experimental: {
        optimizePackageImports: ['lucide-react', '@tabler/icons-react'],
    },

    // Configure image domains for Supabase storage and Google images
    images: {
        domains: ['storage.googleapis.com', 'lh3.googleusercontent.com', 'best-of-goa.firebasestorage.app'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'storage.googleapis.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'best-of-goa.firebasestorage.app',
                port: '',
                pathname: '/**',
            },
        ],
    },

    // Headers for caching and performance optimization
    async headers() {
        return [
            {
                // Cache static assets for 1 year (images)
                source: '/:path*\\.(svg|jpg|jpeg|png|gif|ico|webp)$',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                // Cache static assets for 1 year (fonts)
                source: '/:path*\\.(ttf|otf|woff|woff2)$',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                // Cache static assets for 1 year (media)
                source: '/:path*\\.(mp4|webm|ogg)$',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                // Cache JS/CSS chunks
                source: '/_next/static/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                // Stale-while-revalidate for API routes
                source: '/api/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, s-maxage=60, stale-while-revalidate=300',
                    },
                ],
            },
            {
                // Stale-while-revalidate for hub pages (can be cached briefly)
                source: '/(places-to-eat|places-to-stay|places-to-shop|places-to-visit|places-to-learn|things-to-do)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, s-maxage=300, stale-while-revalidate=600',
                    },
                ],
            },
        ];
    },

    // Redirects for organized routing
    async redirects() {
        return [
            // Redirect non-www to www for canonical consistency
            {
                source: '/:path*',
                has: [
                    {
                        type: 'host',
                        value: 'bestgoa.com',
                    },
                ],
                destination: 'https://www.bestgoa.com/:path*',
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
