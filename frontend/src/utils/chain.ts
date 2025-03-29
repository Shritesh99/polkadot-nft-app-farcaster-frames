import { ApiPromise, WsProvider } from "@polkadot/api";

const LOCAL_NODE_URL = "ws://127.0.0.1:9944";

export const connectToChain = async (): Promise<ApiPromise> => {
	try {
		// Create a WebSocket provider pointing to our local node
		const wsProvider = new WsProvider(LOCAL_NODE_URL);

		// Create the API instance
		const api = await ApiPromise.create({
			provider: wsProvider,
		});

		// Wait until we are ready and connected
		await api.isReady;

		// Get chain information
		const [chain, nodeName, nodeVersion] = await Promise.all([
			api.rpc.system.chain(),
			api.rpc.system.name(),
			api.rpc.system.version(),
		]);

		console.log(
			`Connected to chain ${chain} using ${nodeName} v${nodeVersion}`
		);

		return api;
	} catch (error) {
		console.error("Failed to connect to the local chain:", error);
		throw error;
	}
};
