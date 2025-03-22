import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	env: {
		NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
		NEXT_PUBLIC_APPKIT_PROJECT_ID:
			process.env.NEXT_PUBLIC_APPKIT_PROJECT_ID,
	},
};

export default nextConfig;
