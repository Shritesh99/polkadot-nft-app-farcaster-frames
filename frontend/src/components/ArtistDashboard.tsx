import React, { useState, useEffect } from "react";
import { ApiPromise } from "@polkadot/api";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import type { Signer } from "@polkadot/api/types";
import { Button } from "./ui/components/Button";
import { CollectionManager } from "./CollectionManager";

interface ArtistDashboardProps {
	api: ApiPromise;
	account: InjectedAccountWithMeta;
	signer: Signer;
}

export const ArtistDashboard: React.FC<ArtistDashboardProps> = ({
	api,
	account,
	signer,
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const [isRegistered, setIsRegistered] = useState(false);

	useEffect(() => {
		checkArtistStatus();
	}, [api, account]);

	const checkArtistStatus = async () => {
		if (!api || !account?.address) return;

		try {
			const isArtist = await api.query.template.artists(
				account.address
			);
			setIsRegistered(Boolean(isArtist.toJSON()));
		} catch (error) {
			console.error("Failed to check artist status:", error);
		}
	};

	const registerAsArtist = async () => {
		if (!api || !account?.address || !signer) {
			return;
		}

		setIsLoading(true);

		try {
			const tx = api.tx.template.registerArtist();

			await tx.signAndSend(
				account.address,
				{ signer },
				({ status, dispatchError }) => {
					if (dispatchError) {
						console.error("Dispatch error:", dispatchError);
						return;
					}

					if (status.isInBlock) {
						console.log(
							`Registered as artist in block ${status.asInBlock.toString()}`
						);
						setIsRegistered(true);
					}
				}
			);
		} catch (error) {
			console.error("Failed to register as artist:", error);
		} finally {
			setIsLoading(false);
		}
	};

	if (!isRegistered) {
		return (
			<div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-md">
				<h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
					Register as Artist
				</h2>
				<p className="text-sm sm:text-base text-gray-600 mb-4">
					Register as an artist to create and manage your NFT
					collections.
				</p>
				<Button
					onClick={registerAsArtist}
					disabled={isLoading}
					className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors disabled:bg-blue-300">
					{isLoading ? "Registering..." : "Register as Artist"}
				</Button>
			</div>
		);
	}

	return (
		<div className="max-w-6xl mx-auto p-4 sm:p-6">
			<h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-900">
				Artist Dashboard
			</h1>
			<CollectionManager api={api} account={account} signer={signer} />
		</div>
	);
};
