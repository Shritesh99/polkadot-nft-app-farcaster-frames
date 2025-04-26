import { useEffect, useState } from "react";
import sdk from "@farcaster/frame-sdk";
import React from "react";
import { useWallet } from "../contexts/WalletContext";
import { Button } from "./ui/components/Button";
import { ArtistDashboard } from "./ArtistDashboard";
import { NFTMarketplace } from "./NFTMarketplace";
import { UserDashboard } from "./UserDashboard";
import { useChain } from "../contexts/ChainContext";
import toast from "react-hot-toast";

type View = "marketplace" | "artist" | "collection";

interface DemoProps {
	setConnectModalOpen: (open: boolean) => void;
}

export const Demo: React.FC<DemoProps> = ({ setConnectModalOpen }) => {
	const [isSDKLoaded, setIsSDKLoaded] = useState(false);
	const [currentView, setCurrentView] = useState<View>("marketplace");
	const [castHash, setCastHash] = useState("");
	const [fid, setFid] = useState("");
	const { api } = useChain();
	const {
		selectedAccount,
		signer,
		error: walletError,
		selectedWallet,
	} = useWallet();

	useEffect(() => {
		const load = async () => {
			await sdk.actions.ready();
			const context = await sdk.context;
			if (context?.location && "cast" in context.location) {
				setCastHash(context.location.cast.hash || "");
			} else {
				setCastHash("");
			}
			setFid(context?.user?.fid?.toString() || "");
		};
		if (sdk && !isSDKLoaded) {
			setIsSDKLoaded(true);
			load();
		}
	}, [isSDKLoaded]);

	useEffect(() => {
		if (walletError) {
			toast.error(walletError.message);
		}
	}, [walletError]);

	if (!isSDKLoaded) {
		return (
			<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-3xl font-bold text-gray-900 mb-4">
						Loading...
					</h2>
					<p className="text-gray-600">
						Please wait while we load the SDK
					</p>
				</div>
			</div>
		);
	}

	if (!selectedWallet) {
		return (
			<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-3xl font-bold text-gray-900 mb-4">
						Welcome to NFT Marketplace
					</h2>
					<p className="text-gray-600 mb-8 max-w-md mx-auto">
						Connect your wallet to start exploring and trading
						NFTs
					</p>
					<div className="animate-pulse">
						<Button
							onClick={() => setConnectModalOpen(true)}
							variant="primary">
							Connect Wallet
						</Button>
					</div>
				</div>
			</div>
		);
	}

	if (!selectedAccount) {
		return (
			<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-3xl font-bold text-gray-900 mb-4">
						Select an Account
					</h2>
					<p className="text-gray-600 max-w-md mx-auto">
						Please select an account from your connected
						wallet to continue
					</p>
				</div>
			</div>
		);
	}

	if (!api || !selectedAccount || !signer) {
		return (
			<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Connecting to chain...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap gap-4">
				<Button
					onClick={() => setCurrentView("marketplace")}
					variant={
						currentView === "marketplace"
							? "primary"
							: "secondary"
					}
					size="lg">
					Browse NFTs
				</Button>
				<Button
					onClick={() => setCurrentView("collection")}
					variant={
						currentView === "collection"
							? "primary"
							: "secondary"
					}
					size="lg">
					My Collection
				</Button>
				<Button
					onClick={() => setCurrentView("artist")}
					variant={
						currentView === "artist" ? "primary" : "secondary"
					}
					size="lg">
					Artist Dashboard
				</Button>
			</div>

			<div className="bg-white shadow-sm rounded-lg p-6">
				{currentView === "marketplace" && (
					<NFTMarketplace
						castHash={castHash}
						fid={fid}
						api={api}
						account={selectedAccount}
						signer={signer}
					/>
				)}
				{currentView === "collection" && (
					<UserDashboard
						api={api}
						account={selectedAccount}
						signer={signer}
					/>
				)}
				{currentView === "artist" && (
					<ArtistDashboard
						api={api}
						account={selectedAccount}
						signer={signer}
					/>
				)}
			</div>
		</div>
	);
};
