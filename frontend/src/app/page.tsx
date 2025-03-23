"use client";

import dynamic from "next/dynamic";
import React from "react";
import { useChain } from "../contexts/ChainContext";
import { ChainStatus } from "../components/ChainStatus";
import { WalletStatus } from "../components/WalletStatus";
const Demo = dynamic(() => import("../components/Demo"), {
	ssr: false,
});

export default function Home() {
	const { api } = useChain();
	return (
		<main className="min-h-screen flex flex-col p-4">
			<ChainStatus />
			<WalletStatus />
			{api && (
				// <AccountBox
				// 	api={api}
				// 	account={selectedAccount}
				// 	signer={signer}
				// />
				<Demo />
			)}
		</main>
	);
}
