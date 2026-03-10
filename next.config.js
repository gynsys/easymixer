
/** @type {import('next').NextConfig} */
const nextConfig = {
    // Increase limits if possible for Vercel, though this is mostly for Webpack
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
        serverComponentsExternalPackages: ['fluent-ffmpeg', '@ffmpeg-installer/ffmpeg', '@distube/ytdl-core', 'undici'],
    },
    webpack: (config) => {
        config.externals.push({
            'fluent-ffmpeg': 'commonjs fluent-ffmpeg',
            '@ffmpeg-installer/ffmpeg': 'commonjs @ffmpeg-installer/ffmpeg',
            '@distube/ytdl-core': 'commonjs @distube/ytdl-core',
            'undici': 'commonjs undici',
        });
        return config;
    },
};

module.exports = nextConfig;
