"use client";
import dynamic from "next/dynamic";
import React from "react";

const WagmiProvider = dynamic(() => import("../components/WagmiProvider"), {
	ssr: false,
});

export function Providers({ children }: { children: React.ReactNode }) {
	return <WagmiProvider>{children}</WagmiProvider>;
}
