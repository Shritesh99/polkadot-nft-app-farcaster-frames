import React, { createContext, useContext, useEffect, useState } from "react";
import { ApiPromise } from "@polkadot/api";
import { connectToChain } from "../utils/chain";

interface ChainContextType {
	api: ApiPromise | null;
	isConnecting: boolean;
	error: Error | null;
}

const ChainContext = createContext<ChainContextType>({
	api: null,
	isConnecting: false,
	error: null,
});

export const useChain = () => useContext(ChainContext);

export const ChainProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [api, setApi] = useState<ApiPromise | null>(null);
	const [isConnecting, setIsConnecting] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		const initChain = async () => {
			if (api) return;

			setIsConnecting(true);
			setError(null);

			try {
				const chainApi = await connectToChain();
				setApi(chainApi);
			} catch (err) {
				setError(
					err instanceof Error
						? err
						: new Error("Failed to connect to chain")
				);
			} finally {
				setIsConnecting(false);
			}
		};

		initChain();

		return () => {
			if (api) {
				api.disconnect();
				setApi(null);
			}
		};
	}, [api]);

	return (
		<ChainContext.Provider value={{ api, isConnecting, error }}>
			{children}
		</ChainContext.Provider>
	);
};
