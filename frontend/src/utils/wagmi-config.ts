import { createStorage, cookieStorage, createConfig, webSocket } from "wagmi";
import { polkadotFrameConnector } from "./connector";

const polkadotChain = {
	id: 1,
	name: "Polkadot",
	nativeCurrency: {
		name: "Dot",
		symbol: "DOT",
		decimals: 1,
	},
	rpcUrls: {
		default: {
			http: ["https://westend-asset-hub-eth-rpc.polkadot.io"],
			webSocket: ["wss://rpc.polkadot.io"],
		},
	},
};

export const config = createConfig({
	chains: [polkadotChain],
	transports: {
		[polkadotChain.id]: webSocket(),
	},
	connectors: [polkadotFrameConnector()],
	storage: createStorage({ storage: cookieStorage }),
});
