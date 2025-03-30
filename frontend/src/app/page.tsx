"use client";

import dynamic from "next/dynamic";
import React from "react";
import { ChainStatus } from "../components/ui/components/ChainStatus";
import { WalletStatus } from "../components/ui/components/WalletStatus";

const Demo = dynamic(() => import("../components/Demo"), {
	ssr: false,
});

export default function Home() {
	return (
		<main className="min-h-screen flex flex-col p-4">
			<div className="max-w-6xl mx-auto w-full space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<ChainStatus />
					<WalletStatus />
				</div>
				<Demo />
			</div>
		</main>
	);
}
