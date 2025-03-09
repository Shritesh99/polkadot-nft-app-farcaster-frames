import { useEffect, useCallback, useState } from "react";
import sdk, { type FrameContext } from "@farcaster/frame-sdk";
import { useAccount, useConnect, useDisconnect } from "wagmi";

import { config } from "../utils/wagmi-config";
import { Button } from "./ui/Button";
import React from "react";

export default function Demo() {
	const [isSDKLoaded, setIsSDKLoaded] = useState(false);
	const [context, setContext] = useState<FrameContext>();

	const { address, isConnected } = useAccount();
	const { disconnect } = useDisconnect();
	const { connect } = useConnect();

	useEffect(() => {
		const load = async () => {
			setContext(await sdk.context);
			sdk.actions.ready();
		};
		if (sdk && !isSDKLoaded) {
			setIsSDKLoaded(true);
			load();
		}
	}, [isSDKLoaded]);

	if (!isSDKLoaded) {
		return <div>Loading...</div>;
	}

	return (
		<div className="w-[300px] mx-auto py-4 px-2">
			<h1 className="text-2xl font-bold text-center mb-4">
				Frames v2 Demo
			</h1>

			{/* Context and action buttons omitted */}

			<div>
				<h2 className="font-2xl font-bold">Wallet</h2>

				{address && (
					<div className="my-2 text-xs">
						Address: <pre className="inline">{address}</pre>
					</div>
				)}

				<div className="mb-4">
					<Button
						onClick={() =>
							isConnected
								? disconnect()
								: connect({
										connector:
											config.connectors[0],
								  })
						}>
						{isConnected ? "Disconnect" : "Connect"}
					</Button>
				</div>
			</div>
		</div>
	);
}
