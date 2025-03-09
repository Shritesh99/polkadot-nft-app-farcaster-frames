import { ApiPromise, WsProvider } from "@polkadot/api";
import { web3Enable, web3Accounts } from "@polkadot/extension-dapp";
import { ChainNotConfiguredError, createConnector } from "wagmi";
import sdk from "@farcaster/frame-sdk"; // Assuming this provides a Polkadot-compatible provider

// Define the connector type
polkadotFrameConnector.type = "polkadotFrameConnector" as const;

export function polkadotFrameConnector() {
	let connected = false;
	let api: ApiPromise | null = null;

	return createConnector<any>((config) => ({
		id: "polkadot-farcaster",
		name: "Polkadot Farcaster Wallet",
		type: polkadotFrameConnector.type,

		// Setup the initial connection (e.g., to Polkadot mainnet)
		async setup() {
			await this.connect({ chainId: config.chains[0]?.id });
		},

		// Connect to the Polkadot wallet via Farcaster Frames
		async connect({ chainId, isReconnecting } = {}) {
			// Enable Polkadot.js extensions (assuming Farcaster integrates via an extension-like interface)
			const extensions = await web3Enable(
				"Polkadot Farcaster Connector"
			);
			if (extensions.length === 0) {
				throw new Error(
					"No Polkadot-compatible wallet found. Please install a Polkadot wallet."
				);
			}

			// Get accounts from the connected wallet
			const accounts = await web3Accounts();
			if (accounts.length === 0) {
				throw new Error("No accounts available.");
			}

			// Initialize Polkadot API with the specified chain
			const currentChainId = chainId || config.chains[0]?.id;
			const chain = config.chains.find((c) => c.id === currentChainId);
			if (!chain) throw new Error("Chain not configured");

			const provider = new WsProvider(
				chain.rpcUrls.default.webSocket?.[0]
			);
			api = await ApiPromise.create({ provider });

			connected = true;

			return {
				accounts: accounts.map(
					(acc) => acc.address
				) as `0x${string}`[],
				chainId: currentChainId,
			};
		},

		// Disconnect from the wallet
		async disconnect() {
			if (api) {
				await api.disconnect();
				api = null;
			}
			connected = false;
		},

		// Get the list of accounts
		async getAccounts() {
			if (!connected) throw new Error("Not connected");
			const accounts = await web3Accounts();
			return accounts.map((acc) => acc.address) as `0x${string}`[];
		},

		// Get the current chain ID
		async getChainId() {
			if (!connected || !api) throw new Error("Not connected");
			const chainName = (await api.rpc.system.chain()).toString();
			const chain = config.chains.find((c) => c.name === chainName);
			if (!chain) throw new ChainNotConfiguredError();
			return chain.id;
		},

		// Check if the wallet is authorized
		async isAuthorized() {
			if (!connected) return false;
			const accounts = await this.getAccounts();
			return !!accounts.length;
		},

		// Switch to a different Polkadot chain
		async switchChain({ chainId }) {
			const chain = config.chains.find((x) => x.id === chainId);
			if (!chain) throw new ChainNotConfiguredError();

			if (api) {
				await api.disconnect();
			}

			const provider = new WsProvider(
				chain.rpcUrls.default.webSocket?.[0]
			);
			api = await ApiPromise.create({ provider });

			return chain;
		},

		// Handle account changes
		onAccountsChanged(accounts) {
			if (accounts.length === 0) {
				this.onDisconnect();
			} else {
				config.emitter.emit("change", {
					accounts: accounts.map(
						(acc) => acc
					) as `0x${string}`[],
				});
			}
		},

		// Handle chain changes
		onChainChanged(chainId) {
			config.emitter.emit("change", { chainId: Number(chainId) });
		},

		// Handle disconnection
		async onDisconnect() {
			config.emitter.emit("disconnect");
			await this.disconnect();
		},

		// Get the provider (assuming Farcaster SDK provides a Polkadot-compatible interface)
		async getProvider() {
			if (!api) {
				const chain = config.chains[0];
				const provider = new WsProvider(
					chain.rpcUrls.default.webSocket?.[0]
				);
				api = await ApiPromise.create({ provider });
			}
			return api; // Return Polkadot API as the provider
		},
	}));
}
