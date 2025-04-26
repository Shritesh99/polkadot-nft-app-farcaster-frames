import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	// env: {
	// 	NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
	// 	NEXT_PUBLIC_APPKIT_PROJECT_ID:
	// 		process.env.NEXT_PUBLIC_APPKIT_PROJECT_ID,
	// },
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**",
			},
		],
	},
};

export default nextConfig;
