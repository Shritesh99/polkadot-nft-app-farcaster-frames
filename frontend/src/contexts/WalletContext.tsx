import React, { createContext, useContext, useState } from "react";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import type { Signer } from "@polkadot/rpc-augment/node_modules/@polkadot/types/types/extrinsic";
import { useWallets } from "@polkadot-onboard/react";
import type { BaseWallet } from "@polkadot-onboard/core";

// Extend the InjectedAccountWithMeta type to include our custom meta fields
interface ExtendedInjectedAccountWithMeta extends InjectedAccountWithMeta {
	meta: {
		name?: string;
		source: string;
		genesisHash?: string | null;
		walletId?: string;
	};
}

interface WalletContextType {
	accounts: ExtendedInjectedAccountWithMeta[];
	selectedAccount: ExtendedInjectedAccountWithMeta | null;
	signer: Signer | undefined;
	isConnecting: boolean;
	error: Error | null;
	connectWallet: () => Promise<void>;
	selectAccount: (account: ExtendedInjectedAccountWithMeta) => Promise<void>;
	availableWallets: BaseWallet[];
	selectedWallet: BaseWallet | null;
	selectWallet: (wallet: BaseWallet) => Promise<void>;
	disconnectWallet: (walletId?: string) => Promise<void>;
	connectedWallets: BaseWallet[];
	connectSpecificWallet: (wallet: BaseWallet) => Promise<void>;
	getWalletForAccount: (address: string) => Promise<BaseWallet | undefined>;
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
	disconnectWallet: async () => {},
	connectedWallets: [],
	connectSpecificWallet: async () => {},
	getWalletForAccount: async () => undefined,
});

export const useWallet = () => useContext(WalletContext);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [accounts, setAccounts] = useState<
		ExtendedInjectedAccountWithMeta[]
	>([]);
	const [selectedAccount, setSelectedAccount] =
		useState<ExtendedInjectedAccountWithMeta | null>(null);
	const [signer, setSigner] = useState<Signer | undefined>(undefined);
	const [isConnecting, setIsConnecting] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [selectedWallet, setSelectedWallet] = useState<BaseWallet | null>(
		null
	);
	const [connectedWallets, setConnectedWallets] = useState<BaseWallet[]>([]);

	const { wallets } = useWallets();
	const availableWallets = wallets || [];

	const getWalletForAccount = async (
		address: string
	): Promise<BaseWallet | undefined> => {
		if (!selectedWallet) return undefined;
		const walletAccounts = await selectedWallet.getAccounts();
		if (walletAccounts.some((account) => account.address === address)) {
			return selectedWallet;
		}
		return undefined;
	};

	const connectSpecificWallet = async (wallet: BaseWallet) => {
		try {
			setIsConnecting(true);
			setError(null);

			// Disconnect any previously connected wallet
			if (connectedWallets.length > 0) {
				await disconnectWallet(connectedWallets[0].metadata.id);
			}

			// Connect the new wallet
			await wallet.connect();

			// Get accounts from the wallet
			const walletAccounts = await wallet.getAccounts();
			if (!walletAccounts || walletAccounts.length === 0) {
				throw new Error("No accounts found in the selected wallet");
			}

			// Convert wallet accounts to ExtendedInjectedAccountWithMeta format
			const formattedAccounts: ExtendedInjectedAccountWithMeta[] =
				walletAccounts.map((account) => ({
					address: account.address,
					meta: {
						name: account.name || "Unknown",
						source: wallet.metadata.title || "polkadot-js",
						walletId: wallet.metadata.id,
					},
					type: account.type || "sr25519",
				}));

			// Set the connected wallet
			setConnectedWallets((prev) => [...prev, wallet]);
			setSelectedWallet(wallet);

			// Update accounts list
			setAccounts(formattedAccounts);
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

	const selectWallet = async (wallet: BaseWallet) => {
		try {
			setIsConnecting(true);
			setError(null);
			await connectSpecificWallet(wallet);
		} catch (err) {
			console.error("Failed to select wallet:", err);
			setError(
				err instanceof Error
					? err
					: new Error("Failed to select wallet")
			);
		} finally {
			setIsConnecting(false);
		}
	};

	const selectAccount = async (account: ExtendedInjectedAccountWithMeta) => {
		try {
			setIsConnecting(true);
			setError(null);
			const wallet = await getWalletForAccount(account.address);
			if (!wallet) {
				throw new Error("No wallet found for this account");
			}

			setSelectedAccount(account);
			setSigner(wallet.signer as unknown as Signer);
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

			// Connect the first available wallet
			if (availableWallets.length > 0) {
				await connectSpecificWallet(availableWallets[0]);
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

	const disconnectWallet = async (walletId?: string) => {
		try {
			if (walletId) {
				// Disconnect specific wallet
				const wallet = connectedWallets.find(
					(w) => w.metadata.id === walletId
				);
				if (wallet) {
					await wallet.disconnect();
					setConnectedWallets([]);
					setSelectedWallet(null);
					setSelectedAccount(null);
					setSigner(undefined);
					setAccounts([]);
				}
			} else {
				// Disconnect all wallets
				if (connectedWallets.length > 0) {
					await connectedWallets[0].disconnect();
				}
				// Clean up state
				setConnectedWallets([]);
				setSelectedWallet(null);
				setSelectedAccount(null);
				setSigner(undefined);
				setAccounts([]);
			}
			setError(null);
		} catch (error) {
			console.error("Error during wallet disconnection:", error);
			setError(
				error instanceof Error
					? error
					: new Error("Failed to disconnect wallet")
			);
		}
	};

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
				connectedWallets,
				connectSpecificWallet,
				getWalletForAccount,
			}}>
			{children}
		</WalletContext.Provider>
	);
};
