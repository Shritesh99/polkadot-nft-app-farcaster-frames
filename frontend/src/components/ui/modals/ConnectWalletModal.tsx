import React, { useState } from "react";
import { useWallet } from "../../../contexts/WalletContext";
import { Button } from "../components/Button";
import toast from "react-hot-toast";

interface ConnectWalletModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({
	isOpen,
	onClose,
}) => {
	const {
		availableWallets,
		connectSpecificWallet,
		isConnecting,
		error,
		accounts,
		selectAccount,
	} = useWallet();
	const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
	const [selectedAccountAddress, setSelectedAccountAddress] = useState<
		string | null
	>(null);

	const handleConnect = async (walletId: string) => {
		if (!walletId) {
			toast.error("Please select a wallet");
			return;
		}

		const wallet = availableWallets.find(
			(w) => w.metadata.id === walletId
		);
		if (!wallet) {
			toast.error("Selected wallet not found");
			return;
		}

		try {
			await connectSpecificWallet(wallet);
			setSelectedWallet(walletId);
		} catch (err) {
			console.error("Failed to connect wallet:", err);
			toast.error("Failed to connect wallet");
		}
	};

	const handleAccountSelect = async () => {
		if (!selectedAccountAddress) {
			toast.error("Please select an account");
			return;
		}

		const account = accounts.find(
			(acc) => acc.address === selectedAccountAddress
		);
		if (!account) {
			toast.error("Selected account not found");
			return;
		}

		try {
			await selectAccount(account);
			onClose();
		} catch (err) {
			console.error("Failed to select account:", err);
			toast.error("Failed to select account");
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-2xl font-bold text-gray-800">
						Connect Wallet
					</h2>
					<button
						onClick={onClose}
						className="text-gray-500 hover:text-gray-700">
						<svg
							className="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				<div className="space-y-4">
					{availableWallets.map((wallet) => (
						<div
							key={wallet.metadata.id}
							className={`p-4 border rounded-lg cursor-pointer transition-colors duration-300 ${
								selectedWallet === wallet.metadata.id
									? "border-blue-500 bg-blue-50"
									: "hover:bg-gray-50"
							}`}
							onClick={() =>
								handleConnect(wallet.metadata.id)
							}>
							<div className="flex items-center space-x-4">
								{wallet.metadata.iconUrl && (
									<img
										src={wallet.metadata.iconUrl}
										alt={wallet.metadata.title}
										className="w-8 h-8"
									/>
								)}
								<div>
									<h3 className="font-medium text-gray-900">
										{wallet.metadata.title}
									</h3>
									<p className="text-sm text-gray-500">
										{wallet.metadata.description}
									</p>
								</div>
							</div>
						</div>
					))}
				</div>

				{accounts.length > 0 && (
					<div className="mt-6">
						<h3 className="text-lg font-medium text-gray-900 mb-4">
							Select Account
						</h3>
						<div className="space-y-2">
							{accounts
								.filter(function (item, pos) {
									return (
										accounts.indexOf(item) == pos
									);
								})
								.map((account) => (
									<div
										key={account.address}
										className={`p-3 border rounded-lg cursor-pointer transition-colors duration-300 ${
											selectedAccountAddress ===
											account.address
												? "border-blue-500 bg-blue-50"
												: "hover:bg-gray-50"
										}`}
										onClick={() =>
											setSelectedAccountAddress(
												account.address
											)
										}>
										<div className="flex items-center justify-between">
											<div>
												<h4 className="font-medium text-gray-900">
													{account.meta
														.name ||
														"Account"}
												</h4>
												<p className="text-sm text-gray-500">
													{account.address.slice(
														0,
														6
													)}
													...
													{account.address.slice(
														-4
													)}
												</p>
											</div>
											{selectedAccountAddress ===
												account.address && (
												<svg
													className="w-5 h-5 text-blue-500"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24">
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={
															2
														}
														d="M5 13l4 4L19 7"
													/>
												</svg>
											)}
										</div>
									</div>
								))}
						</div>
					</div>
				)}

				<div className="mt-6 flex space-x-4">
					<Button
						onClick={onClose}
						variant="secondary"
						className="flex-1">
						Cancel
					</Button>
					{accounts.length !== 0 && (
						<Button
							onClick={handleAccountSelect}
							disabled={
								!selectedAccountAddress || isConnecting
							}
							className="flex-1">
							Select Account
						</Button>
					)}
				</div>
			</div>
		</div>
	);
};
