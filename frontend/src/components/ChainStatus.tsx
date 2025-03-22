import React from "react";
import { useChain } from "../contexts/ChainContext";

export const ChainStatus: React.FC = () => {
	const { api, isConnecting, error } = useChain();

	if (error) {
		return (
			<div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
				<h3 className="font-bold">Chain Connection Error</h3>
				<p>{error.message}</p>
			</div>
		);
	}

	if (isConnecting) {
		return (
			<div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md">
				Connecting to local chain...
			</div>
		);
	}

	if (!api) {
		return (
			<div className="p-4 bg-gray-100 border border-gray-400 text-gray-700 rounded-md">
				Not connected to chain
			</div>
		);
	}

	return (
		<div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
			Connected to local chain
		</div>
	);
};
