import React, { useEffect, useState } from "react";
import { ApiPromise } from "@polkadot/api";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import type { Signer } from "@polkadot/types/types";
import { Button } from "./ui/Button";

interface NFTMarketplaceProps {
	api: ApiPromise;
	account: InjectedAccountWithMeta;
	signer: Signer;
}

interface Collection {
	id: number;
	metadata: {
		title: string;
		description: string;
		image: string;
		price: string;
		creator: string;
	};
}

export const NFTMarketplace: React.FC<NFTMarketplaceProps> = ({
	api,
	account,
	signer,
}) => {
	const [collections, setCollections] = useState<Collection[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		loadCollections();
	}, [api]);

	const loadCollections = async () => {
		if (!api) return;

		setIsLoading(true);
		setError(null);

		try {
			// Fetch all collections
			const collections =
				await api.query.template.collections.entries();
			const formattedCollections = collections.map(([key, value]) => {
				const id = Number(key.args[0].toString());
				const metadata = JSON.parse(value.toString());
				return { id, metadata };
			});
			setCollections(formattedCollections);
		} catch (error) {
			console.error("Failed to load collections:", error);
			setError(
				error instanceof Error
					? error.message
					: "Failed to load collections"
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleMint = async (collectionId: number) => {
		if (!api || !account?.address || !signer) {
			setError("Missing required properties for minting");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const tx = api.tx.template.mintNFT(collectionId);
			await tx.signAndSend(
				account.address,
				{ signer },
				({ status }) => {
					if (status.isInBlock) {
						console.log(
							`NFT minted in block ${status.asInBlock.toString()}`
						);
						loadCollections(); // Refresh collections after minting
					}
				}
			);
		} catch (error) {
			console.error("Failed to mint NFT:", error);
			setError(
				error instanceof Error
					? error.message
					: "Failed to mint NFT"
			);
		} finally {
			setIsLoading(false);
		}
	};

	if (isLoading && collections.length === 0) {
		return (
			<div className="text-center py-8">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
				<p className="mt-2 text-gray-600">Loading collections...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
				<p>{error}</p>
			</div>
		);
	}

	return (
		<div className="max-w-6xl mx-auto p-6">
			<h2 className="text-2xl font-bold text-gray-800 mb-6">
				Available Collections
			</h2>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{collections.map((collection) => (
					<div
						key={collection.id}
						className="bg-white rounded-lg shadow-md overflow-hidden">
						<img
							src={collection.metadata.image}
							alt={collection.metadata.title}
							className="w-full h-48 object-cover"
						/>
						<div className="p-4">
							<h3 className="text-xl font-semibold text-gray-800">
								{collection.metadata.title}
							</h3>
							<p className="text-gray-600 mt-2">
								{collection.metadata.description}
							</p>
							<div className="mt-4 flex justify-between items-center">
								<span className="text-lg font-bold text-blue-600">
									{collection.metadata.price} DOT
								</span>
								<Button
									onClick={() =>
										handleMint(collection.id)
									}
									disabled={isLoading}
									className="bg-blue-600 hover:bg-blue-700 text-white">
									{isLoading
										? "Minting..."
										: "Mint NFT"}
								</Button>
							</div>
						</div>
					</div>
				))}
			</div>

			{collections.length === 0 && (
				<div className="text-center py-8 text-gray-600">
					No collections available yet.
				</div>
			)}
		</div>
	);
};
