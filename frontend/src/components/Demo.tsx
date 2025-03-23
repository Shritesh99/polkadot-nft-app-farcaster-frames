import { useEffect, useState } from "react";
import sdk from "@farcaster/frame-sdk";
import React from "react";
import { NFTMinting } from "./NFTMinting";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { useWallet } from "../contexts/WalletContext";
import { Button } from "./ui/Button";
import type { WalletMetadata } from "@polkadot-onboard/core";

export default function Demo() {
	const [isSDKLoaded, setIsSDKLoaded] = useState(false);
	const [api, setApi] = useState<ApiPromise | null>(null);
	const {
		selectedAccount,
		signer,
		isConnecting,
		error,
		connectWallet,
		availableWallets,
		selectedWallet,
		selectWallet,
		disconnectWallet,
	} = useWallet();

	useEffect(() => {
		const load = async () => {
			await sdk.actions.ready();
		};
		if (sdk && !isSDKLoaded) {
			setIsSDKLoaded(true);
			load();
		}
	}, [isSDKLoaded]);

	useEffect(() => {
		const connectToChain = async () => {
			if (selectedAccount && !api) {
				try {
					const provider = new WsProvider(
						"wss://westend-rpc.polkadot.io"
					);
					const api = await ApiPromise.create({
						provider,
					});
					setApi(api);
				} catch (error) {
					console.error("Failed to connect to chain:", error);
				}
			}
		};

		connectToChain();

		return () => {
			if (api) {
				api.disconnect();
			}
		};
	}, [selectedAccount, api]);

	const renderWalletSelection = () => (
		<div className="space-y-4">
			<h2 className="text-xl font-bold text-gray-800">
				Select Wallet
			</h2>
			<div className="space-y-2">
				{availableWallets.map((wallet) => {
					const metadata = wallet.metadata as WalletMetadata & {
						icon?: string;
					};
					return (
						<Button
							key={metadata.id}
							onClick={() => selectWallet(wallet)}
							disabled={isConnecting}
							className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors flex items-center justify-center space-x-2 disabled:bg-blue-300">
							{metadata.icon && (
								<img
									src={metadata.icon}
									alt={metadata.title}
									className="w-6 h-6"
								/>
							)}
							<span>{metadata.title}</span>
						</Button>
					);
				})}
			</div>
			<Button
				onClick={disconnectWallet}
				className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md transition-colors">
				Cancel
			</Button>
		</div>
	);

	if (!isSDKLoaded) {
		return <div>Loading SDK...</div>;
	}

	return (
		<div className="w-[300px] mx-auto py-4 px-2">
			<h1 className="text-2xl font-bold text-center mb-4">
				NFT Minting Frame
			</h1>

			{!selectedWallet ? (
				<div className="space-y-4">
					<h2 className="text-xl font-bold text-gray-800">
						Connect Wallet
					</h2>
					{error && (
						<div className="text-red-500 text-sm p-2 bg-red-50 rounded-md">
							{error.message}
						</div>
					)}
					{availableWallets.length === 0 ? (
						<div className="text-center text-gray-600">
							No wallets found. Please connect a wallet.
						</div>
					) : (
						<></>
					)}
				</div>
			) : !selectedAccount ? (
				renderWalletSelection()
			) : api && selectedAccount && signer ? (
				<>
					<div className="mb-4 flex justify-between items-center">
						<div className="text-sm text-gray-600">
							Connected:{" "}
							{selectedAccount.address.slice(0, 6)}...
							{selectedAccount.address.slice(-4)}
						</div>
						<Button
							onClick={disconnectWallet}
							className="text-sm bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-md">
							Disconnect
						</Button>
					</div>
					<NFTMinting
						api={api}
						account={selectedAccount}
						signer={signer}
					/>
				</>
			) : (
				<div className="text-center text-gray-600">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
					Connecting to chain...
				</div>
			)}
		</div>
	);
}
