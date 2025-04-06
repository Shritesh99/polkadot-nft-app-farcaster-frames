import { ApiPromise, WsProvider } from "@polkadot/api";

const LOCAL_NODE_URL = process.env.NEXT_PUBLIC_LOCAL_NODE_URL!;

export const connectToChain = async (): Promise<ApiPromise> => {
	try {
		// Create a WebSocket provider pointing to our local node
		const wsProvider = new WsProvider(LOCAL_NODE_URL);

		// Create the API instance
		const api = await ApiPromise.create({
			provider: wsProvider,
			types: {
				NFTMetadata: {
					title: "BoundedVec<u8, ConstU32<64>>",
					description: "BoundedVec<u8, ConstU32<128>>",
					image: "BoundedVec<u8, ConstU32<256>>",
				},
			},
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
