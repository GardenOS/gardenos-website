import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
	// Keep dev artifacts isolated so `next build` and `next dev` outputs do not clash.
	distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
	webpack: (config, { dev }) => {
		if (dev) {
			// Prevent flaky local chunk cache corruption in long-running dev sessions.
			config.cache = false;
		}
		return config;
	},
};

export default withNextIntl(nextConfig);
