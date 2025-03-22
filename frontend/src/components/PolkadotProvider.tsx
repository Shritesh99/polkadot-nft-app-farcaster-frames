"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

import type { WalletConnectConfiguration } from "@polkadot-onboard/wallet-connect";
import { PolkadotWalletsContextProvider } from "@polkadot-onboard/react";
import { WalletAggregator } from "@polkadot-onboard/core";
import { WalletConnectProvider } from "@polkadot-onboard/wallet-connect";

const queryClient = new QueryClient();

export default function Provider({ children }: { children: React.ReactNode }) {
	const walletConnectParams: WalletConnectConfiguration = {
		projectId: process.env.NEXT_PUBLIC_APPKIT_PROJECT_ID!,
		relayUrl: "wss://relay.walletconnect.com",
		metadata: {
			name: "Polkadot Demo",
			description: "Polkadot Demo",
			url: "#",
			icons: ["wallet-connect.svg"],
		},
		chainIds: [
			"polkadot:e143f23803ac50e8f6f8e62695d1ce9e",
			"polkadot:91b171bb158e2d3848fa23a9f1c25182",
		],
		optionalChainIds: [
			"polkadot:67f9723393ef76214df0118c34bbbd3d",
			"polkadot:7c34d42fc815d392057c78b49f2755c7",
		],
		onSessionDelete: () => {
			// do something when session is removed
		},
	};
	const walletConnectProvider = new WalletConnectProvider(
		walletConnectParams,
		process.env.NEXT_PUBLIC_APP_NAME!
	);
	const walletAggregator = new WalletAggregator([walletConnectProvider]);

	return (
		<PolkadotWalletsContextProvider walletAggregator={walletAggregator}>
			<QueryClientProvider client={queryClient}>
				{children}
			</QueryClientProvider>
		</PolkadotWalletsContextProvider>
	);
}
