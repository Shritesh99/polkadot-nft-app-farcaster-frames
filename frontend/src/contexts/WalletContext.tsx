import React, { createContext, useContext, useEffect, useState } from "react";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import type { Signer } from "@polkadot/types/types";
import { useWallets } from "@polkadot-onboard/react";
import type { BaseWallet } from "@polkadot-onboard/core";

interface WalletContextType {
	accounts: InjectedAccountWithMeta[];
	selectedAccount: InjectedAccountWithMeta | null;
	signer: Signer | undefined;
	isConnecting: boolean;
	error: Error | null;
	connectWallet: () => Promise<void>;
	selectAccount: (account: InjectedAccountWithMeta) => Promise<void>;
	availableWallets: BaseWallet[];
	selectedWallet: BaseWallet | null;
	selectWallet: (wallet: BaseWallet) => Promise<void>;
	disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType>({
	accounts: [],
	selectedAccount: null,
	signer: undefined,
	isConnecting: false,
	error: null,
	connectWallet: async () => {},
	selectAccount: async () => {},
	availableWallets: [],
	selectedWallet: null,
	selectWallet: async () => {},
	disconnectWallet: () => {},
});

export const useWallet = () => useContext(WalletContext);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
	const [selectedAccount, setSelectedAccount] =
		useState<InjectedAccountWithMeta | null>(null);
	const [signer, setSigner] = useState<Signer | undefined>(undefined);
	const [isConnecting, setIsConnecting] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [selectedWallet, setSelectedWallet] = useState<BaseWallet | null>(
		null
	);

	const { wallets } = useWallets();

	const availableWallets = wallets || [];

	const selectWallet = async (wallet: BaseWallet) => {
		try {
			setIsConnecting(true);
			setError(null);

			// Set the selected wallet first
			setSelectedWallet(wallet);

			// Get accounts from the wallet
			const walletAccounts = await wallet.getAccounts();
			if (!walletAccounts || walletAccounts.length === 0) {
				throw new Error("No accounts found in the selected wallet");
			}

			// Convert wallet accounts to InjectedAccountWithMeta format
			const formattedAccounts: InjectedAccountWithMeta[] =
				walletAccounts.map((account) => ({
					address: account.address,
					meta: {
						name: account.name || "Unknown",
						source: "polkadot-js",
					},
					type: account.type || "sr25519",
				}));

			setAccounts(formattedAccounts);

			// If there's only one account, select it automatically
			if (formattedAccounts.length === 1) {
				await selectAccount(formattedAccounts[0]);
			}
		} catch (err) {
			console.error("Failed to select wallet:", err);
			setError(
				err instanceof Error
					? err
					: new Error("Failed to select wallet")
			);
			setSelectedWallet(null);
		} finally {
			setIsConnecting(false);
		}
	};

	const selectAccount = async (account: InjectedAccountWithMeta) => {
		try {
			setIsConnecting(true);
			setError(null);

			if (!selectedWallet) {
				throw new Error("No wallet selected");
			}
			setSelectedAccount(account);
			setSigner(selectedWallet.signer);
		} catch (err) {
			console.error("Failed to select account:", err);
			setError(
				err instanceof Error
					? err
					: new Error("Failed to select account")
			);
			setSelectedAccount(null);
			setSigner(undefined);
		} finally {
			setIsConnecting(false);
		}
	};

	const connectWallet = async () => {
		try {
			setIsConnecting(true);
			setError(null);
			if (availableWallets.length === 0) {
				throw new Error(
					"No wallets available. Please install a Polkadot wallet."
				);
			}

			// // If there's only one wallet available, select it automatically
			if (availableWallets.length === 1) {
				const wallet = availableWallets[0];
				await wallet.connect();
				await selectWallet(wallet);
			}
		} catch (err) {
			console.error("Failed to connect wallet:", err);
			setError(
				err instanceof Error
					? err
					: new Error("Failed to connect wallet")
			);
		} finally {
			setIsConnecting(false);
		}
	};

	const disconnectWallet = () => {
		if (selectedWallet) {
			try {
				selectedWallet.disconnect?.();
			} catch (error) {
				console.error("Error disconnecting wallet:", error);
			}
		}
		setSelectedWallet(null);
		setSelectedAccount(null);
		setSigner(undefined);
		setAccounts([]);
		setError(null);
	};

	// Clean up on unmount
	useEffect(() => {
		return () => {
			disconnectWallet();
		};
	}, []);

	return (
		<WalletContext.Provider
			value={{
				accounts,
				selectedAccount,
				signer,
				isConnecting,
				error,
				connectWallet,
				selectAccount,
				availableWallets,
				selectedWallet,
				selectWallet,
				disconnectWallet,
			}}>
			{children}
		</WalletContext.Provider>
	);
};
