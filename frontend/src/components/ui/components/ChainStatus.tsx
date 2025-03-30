import React from "react";
import { useChain } from "../../../contexts/ChainContext";

export const ChainStatus: React.FC = () => {
	const { api, isConnecting, error } = useChain();

	if (error) {
		return (
			<div className="flex items-center text-red-600 text-sm">
				<div className="w-2 h-2 bg-red-600 rounded-full mr-2"></div>
				<span>Chain Error</span>
			</div>
		);
	}

	if (isConnecting) {
		return (
			<div className="flex items-center text-yellow-600 text-sm">
				<div className="w-2 h-2 bg-yellow-600 rounded-full mr-2 animate-pulse"></div>
				<span>Connecting...</span>
			</div>
		);
	}

	if (!api) {
		return (
			<div className="flex items-center text-gray-600 text-sm">
				<div className="w-2 h-2 bg-gray-600 rounded-full mr-2"></div>
				<span>Disconnected</span>
			</div>
		);
	}

	return (
		<div className="flex items-center text-green-600 text-sm">
			<div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
			<span>Connected</span>
		</div>
	);
};
