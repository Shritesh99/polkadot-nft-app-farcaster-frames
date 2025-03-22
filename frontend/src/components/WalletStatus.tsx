import React from "react";
import { useWallet } from "../contexts/WalletContext";
import { Button } from "./ui/Button";

export const WalletStatus: React.FC = () => {
	const {
		accounts,
		selectedAccount,
		isConnecting,
		error,
		connectWallet,
		selectAccount,
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

	if (!accounts.length) {
		return (
			<div className="p-4 bg-gray-100 border border-gray-400 text-gray-700 rounded-md">
				<p className="mb-2">No wallet connected</p>
				<Button
					onClick={() => connectWallet()}
					className="bg-blue-600 hover:bg-blue-700 text-white">
					Connect Wallet
				</Button>
			</div>
		);
	}

	return (
		<div className="p-4 bg-white border border-gray-200 rounded-md shadow-sm">
			<h3 className="font-bold text-gray-800 mb-2">
				Available Accounts
			</h3>
			<div className="space-y-2">
				{accounts.map((account) => (
					<div
						key={account.address}
						className={`p-3 rounded-md cursor-pointer transition-colors ${
							selectedAccount?.address === account.address
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
					</div>
				))}
			</div>
		</div>
	);
};
