"use client";

import dynamic from "next/dynamic";
import React, { useState } from "react";
import { ChainStatus } from "../components/ui/components/ChainStatus";
import { Button } from "../components/ui/components/Button";
import { Toaster } from "react-hot-toast";
import { ConnectWalletModal } from "../components/ui/modals/ConnectWalletModal";
import { useWallet } from "../contexts/WalletContext";

const Demo = dynamic(
	() => import("../components/Demo").then((mod) => mod.Demo),
	{
		ssr: false,
	}
);

export default function Home() {
	const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
	const { selectedAccount } = useWallet();

	return (
		<main className="min-h-screen bg-gray-50">
			<Toaster position="top-right" />
			<div className="max-w-7xl mx-auto">
				<nav className="bg-white shadow-sm">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex flex-col sm:flex-row justify-between h-auto sm:h-16 py-4 sm:py-0">
							<div className="flex items-center mb-4 sm:mb-0">
								<h1 className="text-xl font-bold text-gray-900">
									NFT Marketplace
								</h1>
							</div>
							<div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
								<ChainStatus />
								{selectedAccount ? (
									<div className="text-sm text-gray-700">
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
										className="w-full sm:w-auto">
										Connect Wallet
									</Button>
								)}
							</div>
						</div>
					</div>
				</nav>
				<div className="py-4 sm:py-6">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<Demo
							setConnectModalOpen={setIsConnectModalOpen}
						/>
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
