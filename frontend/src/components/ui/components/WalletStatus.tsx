import React from "react";
import { useWallet } from "../../../contexts/WalletContext";
import { Button } from "./Button";

export const WalletStatus: React.FC = () => {
	const {
		accounts,
		selectedAccount,
		isConnecting,
		error,
		connectWallet,
		selectAccount,
		disconnectWallet,
		availableWallets,
		connectedWallets,
		connectSpecificWallet,
	} = useWallet();

	if (error) {
		return (
			<div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
				<h3 className="font-bold">Wallet Connection Error</h3>
				<p>{error.message}</p>
				<Button
					onClick={() => connectWallet()}
					className="mt-2 bg-red-600 hover:bg-red-700 text-white">
					Retry Connection
				</Button>
			</div>
		);
	}

	if (isConnecting) {
		return (
			<div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md">
				Connecting to wallet...
			</div>
		);
	}

	return (
		<div className="p-4 bg-white border border-gray-200 rounded-md shadow-sm">
			<div className="flex justify-between items-center mb-4">
				<h3 className="font-bold text-gray-800">
					Wallet Connection
				</h3>
				{connectedWallets.length > 0 && (
					<Button
						onClick={async () => await disconnectWallet()}
						className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1">
						Disconnect All
					</Button>
				)}
			</div>

			{/* Available Wallets */}
			<div className="mb-4">
				<h4 className="text-sm font-medium text-gray-700 mb-2">
					Available Wallets
				</h4>
				<div className="space-y-2">
					{availableWallets.map((wallet) => {
						const isConnected = connectedWallets.some(
							(w) => w.metadata.id === wallet.metadata.id
						);
						return (
							<div
								key={wallet.metadata.id}
								className="flex items-center justify-between p-3 rounded-md border border-gray-200">
								<div className="flex items-center space-x-2">
									{wallet.metadata.iconUrl && (
										<img
											src={`/${wallet.metadata.iconUrl}`}
											alt={
												wallet.metadata
													.title
											}
											className="w-6 h-6"
										/>
									)}
									<div>
										<div className="font-medium text-gray-800">
											{wallet.metadata.title}
										</div>
										<div className="text-sm text-gray-500">
											{
												wallet.metadata
													.description
											}
										</div>
									</div>
								</div>
								<Button
									onClick={() =>
										connectSpecificWallet(wallet)
									}
									disabled={isConnected}
									className={`text-sm px-3 py-1 ${
										isConnected
											? "bg-green-600 text-white cursor-not-allowed"
											: "bg-blue-600 hover:bg-blue-700 text-white"
									}`}>
									{isConnected
										? "Connected"
										: "Connect"}
								</Button>
							</div>
						);
					})}
				</div>
			</div>

			{/* Connected Accounts */}
			{accounts.length > 0 && (
				<div>
					<h4 className="text-sm font-medium text-gray-700 mb-2">
						Connected Accounts
					</h4>
					<div className="space-y-2">
						{accounts.map((account) => (
							<div
								key={account.address}
								className={`p-3 rounded-md cursor-pointer transition-colors ${
									selectedAccount?.address ===
									account.address
										? "bg-blue-100 border border-blue-300"
										: "bg-gray-50 border border-gray-200 hover:bg-gray-100"
								}`}
								onClick={() => selectAccount(account)}>
								<div className="font-medium text-gray-800">
									{account.meta.name}
								</div>
								<div className="text-sm text-gray-500">
									{account.address.slice(0, 6)}...
									{account.address.slice(-4)}
								</div>
								<div className="text-xs text-gray-400">
									{account.meta.source}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};
