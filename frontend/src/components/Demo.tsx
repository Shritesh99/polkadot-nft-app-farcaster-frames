import { useEffect, useState } from "react";
import sdk from "@farcaster/frame-sdk";
import React from "react";
import { useWallet } from "../contexts/WalletContext";
import { Button } from "./ui/components/Button";
import type { WalletMetadata } from "@polkadot-onboard/core";
import { ArtistDashboard } from "./ArtistDashboard";
import { NFTMarketplace } from "./NFTMarketplace";
import { useChain } from "../contexts/ChainContext";

export default function Demo() {
	const [isSDKLoaded, setIsSDKLoaded] = useState(false);
	const [isArtistMode, setIsArtistMode] = useState(false);
	const {
		api,
		isConnecting: isChainConnecting,
		error: chainError,
	} = useChain();
	const {
		selectedAccount,
		signer,
		isConnecting: isWalletConnecting,
		error: walletError,
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
							disabled={isWalletConnecting}
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

	if (chainError) {
		return (
			<div className="text-red-500 text-sm p-2 bg-red-50 rounded-md">
				Chain Error: {chainError.message}
			</div>
		);
	}

	if (isChainConnecting) {
		return (
			<div className="text-center text-gray-600">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
				Connecting to chain...
			</div>
		);
	}

	return (
		<div className="w-full max-w-6xl mx-auto py-4 px-2">
			<h1 className="text-2xl font-bold text-center mb-4">
				NFT Marketplace
			</h1>

			{!selectedWallet ? (
				<div className="space-y-4">
					<h2 className="text-xl font-bold text-gray-800">
						Connect Wallet
					</h2>
					{walletError && (
						<div className="text-red-500 text-sm p-2 bg-red-50 rounded-md">
							{walletError.message}
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
						<div className="text-sm">
							Connected:{" "}
							{selectedAccount.address.slice(0, 6)}...
							{selectedAccount.address.slice(-4)}
						</div>
						<div className="flex space-x-4">
							<Button
								onClick={() =>
									setIsArtistMode(!isArtistMode)
								}
								className="text-sm bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-md mr-2">
								{isArtistMode
									? "Switch to Marketplace"
									: "Switch to Artist Mode"}
							</Button>
							<Button
								onClick={disconnectWallet}
								className="text-sm bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-md">
								Disconnect
							</Button>
						</div>
					</div>
					{isArtistMode ? (
						<ArtistDashboard
							api={api}
							account={selectedAccount}
							signer={signer}
						/>
					) : (
						<NFTMarketplace
							api={api}
							account={selectedAccount}
							signer={signer}
						/>
					)}
				</>
			) : (
				<div className="text-center text-gray-600">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
					Connecting to wallet...
				</div>
			)}
		</div>
	);
}
