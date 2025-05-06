/** @type {import('next').NextConfig} */
const nextConfig = {
	eslint: {
		// Warning: This allows production builds to successfully complete even if
		// your project has ESLint errors.
		ignoreDuringBuilds: true,
	},
	typescript: {
		// Warning: This allows production builds to successfully complete even if
		// your project has type errors.
		ignoreBuildErrors: true,
	},
	webpack: (config) => {
		config.resolve.alias = {
			...config.resolve.alias,
			'@': new URL('./src', import.meta.url).pathname,
		};
		return config;
	},
}

module.exports = nextConfig 