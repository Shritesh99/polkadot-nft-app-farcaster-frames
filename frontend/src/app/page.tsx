"use client";

import dynamic from "next/dynamic";
import React, { useState, useEffect } from "react";
import { ChainStatus } from "../components/ui/components/ChainStatus";
import { Button } from "../components/ui/components/Button";
import { Toaster } from "react-hot-toast";
import { ConnectWalletModal } from "../components/ui/modals/ConnectWalletModal";
import { useWallet } from "../contexts/WalletContext";
import sdk from "@farcaster/frame-sdk";
import { FrameContext } from "../types/farcaster";
import { verifyUser } from "../utils/farcaster";

const Demo = dynamic(
	() => import("../components/Demo").then((mod) => mod.Demo),
	{
		ssr: false,
	}
);

export default function Home() {
	const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
	const [userContext, setUserContext] = useState<FrameContext | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const { selectedAccount } = useWallet();

	useEffect(() => {
		const load = async () => {
			setIsLoading(true);
			try {
				await sdk.actions.ready();
				const context = await sdk.context;
				setUserContext(context as unknown as FrameContext);

				if (context?.user?.fid) {
					await verifyUser(context.user.fid);
				}
			} catch (error) {
				console.error("Error loading user context:", error);
			} finally {
				setIsLoading(false);
			}
		};
		load();
	}, []);

	return (
		<main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
			<Toaster position="top-right" />
			<div className="mx-auto">
				<nav className="bg-white shadow-md sticky top-0 z-10">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex flex-col sm:flex-row justify-between h-auto sm:h-16 py-4 sm:py-0">
							<div className="flex items-center justify-between mb-4 sm:mb-0">
								<h1 className="text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors duration-300">
									NFT Marketplace
								</h1>
								{isLoading ? (
									<div className="animate-pulse h-8 w-24 bg-gray-200 rounded-md"></div>
								) : userContext?.user ? (
									<div className="flex items-center space-x-2 bg-gray-100 p-2 rounded-lg transition-all hover:bg-gray-200">
										{userContext.user.pfpUrl ? (
											<img
												src={
													userContext
														.user
														.pfpUrl
												}
												alt="Profile"
												className="w-8 h-8 rounded-full border-2 border-indigo-300"
											/>
										) : (
											<div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center">
												<span className="text-xs text-indigo-600 font-bold">
													{userContext.user.username
														?.substring(
															0,
															2
														)
														.toUpperCase() ||
														"FC"}
												</span>
											</div>
										)}
										<div className="text-sm font-medium text-gray-700">
											{userContext.user
												.displayName ||
												userContext.user
													.username}
											<ChainStatus />
										</div>
									</div>
								) : null}
							</div>
							<div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
								{selectedAccount ? (
									<div className="text-sm bg-indigo-50 text-indigo-700 py-2 px-3 rounded-lg font-medium">
										{selectedAccount.meta.name ||
											"Account"}{" "}
										(
										{selectedAccount.address.slice(
											0,
											6
										)}
										...
										{selectedAccount.address.slice(
											-4
										)}
										)
									</div>
								) : (
									<Button
										onClick={() =>
											setIsConnectModalOpen(
												true
											)
										}
										variant="primary"
										size="sm"
										className="w-full sm:w-auto transition-transform hover:scale-105 active:scale-95">
										Connect Wallet
									</Button>
								)}
							</div>
						</div>
					</div>
				</nav>
				<div className="py-6 sm:py-10">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						{isLoading ? (
							<div className="animate-pulse space-y-4">
								<div className="h-8 bg-gray-200 rounded w-1/4"></div>
								<div className="h-64 bg-gray-200 rounded"></div>
							</div>
						) : (
							<Demo
								setConnectModalOpen={
									setIsConnectModalOpen
								}
							/>
						)}
						<Toaster position="bottom-right" />
					</div>
				</div>
			</div>

			<ConnectWalletModal
				isOpen={isConnectModalOpen}
				onClose={() => setIsConnectModalOpen(false)}
			/>
		</main>
	);
}
