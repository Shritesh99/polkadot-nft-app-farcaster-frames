import { useEffect, useCallback, useState } from "react";
import sdk, { type FrameContext } from "@farcaster/frame-sdk";
import { Button } from "./ui/Button";
import React from "react";
import Wallets from "./Wallets";

export default function Demo() {
	const [isSDKLoaded, setIsSDKLoaded] = useState(false);
	const [showWallets, setShowWallets] = useState(false);
	const [context, setContext] = useState<FrameContext>();

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

				<div className="mb-4">
					{!showWallets && (
						<Button
							onClick={() => {
								setShowWallets(true);
							}}>
							Get Wallets
						</Button>
					)}
					{showWallets && <Wallets />}
				</div>
			</div>
		</div>
	);
}
