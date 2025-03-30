import React, { useState, useEffect } from "react";
import { ApiPromise } from "@polkadot/api";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import type { Signer } from "@polkadot/types/types";
import { Button } from "./ui/components/Button";
import toast from "react-hot-toast";

interface UserDashboardProps {
	api: ApiPromise;
	account: InjectedAccountWithMeta;
	signer: Signer;
}

interface NFT {
	id: number;
	collectionId: number;
	metadata: {
		title: string;
		description: string;
		image: string;
	};
	owner: string;
	is_sold: boolean;
}

interface Collection {
	id: number;
	metadata: {
		title: string;
		description: string;
		creator: string;
	};
	nfts: NFT[];
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
	api,
	account,
	signer,
}) => {
	const [collections, setCollections] = useState<Collection[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		loadUserCollections();
	}, [api, account]);

	const loadUserCollections = async () => {
		if (!api || !account?.address) return;

		setIsLoading(true);
		try {
			const nextCollectionId =
				await api.query.template.nextCollectionId();
			const userCollections: Collection[] = [];

			for (let i = 0; i < nextCollectionId.toNumber(); i++) {
				const collection = await api.query.template.collections(i);
				if (collection.isSome) {
					const collectionData = collection.unwrap();
					const nfts = await loadNFTs(i);

					if (
						nfts.some((nft) => nft.owner === account.address)
					) {
						userCollections.push({
							id: i,
							metadata: {
								title: String.fromCharCode(
									...collectionData.metadata
								),
								description: "",
								creator: collectionData.creator.toString(),
							},
							nfts: nfts.filter(
								(nft) => nft.owner === account.address
							),
						});
					}
				}
			}

			setCollections(userCollections);
		} catch (error) {
			console.error("Failed to load collections:", error);
			toast.error("Failed to load your collections");
		} finally {
			setIsLoading(false);
		}
	};

	const loadNFTs = async (collectionId: number): Promise<NFT[]> => {
		const nextItemId = await api.query.template.nextItemId(collectionId);
		const nfts: NFT[] = [];

		for (let i = 0; i < nextItemId.toNumber(); i++) {
			const nft = await api.query.template.nfts(collectionId, i);
			if (nft.isSome) {
				const nftData = nft.unwrap();
				const metadata = JSON.parse(
					String.fromCharCode(...nftData.metadata)
				);
				nfts.push({
					id: i,
					collectionId,
					metadata,
					owner: nftData.owner.toString(),
					is_sold: nftData.is_sold.toJSON(),
				});
			}
		}

		return nfts;
	};

	if (isLoading) {
		return (
			<div className="flex justify-center items-center min-h-[400px]">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	if (collections.length === 0) {
		return (
			<div className="text-center py-12">
				<h2 className="text-2xl font-bold text-gray-800 mb-4">
					Your NFT Collection
				</h2>
				<p className="text-gray-600">You don't own any NFTs yet.</p>
				<p className="text-gray-600 mt-2">
					Browse the marketplace to discover and purchase NFTs!
				</p>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto p-6">
			<h1 className="text-3xl font-bold mb-8">Your NFT Collection</h1>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{collections.map((collection) => (
					<div
						key={collection.id}
						className="bg-white rounded-lg shadow-md overflow-hidden">
						<div className="p-4">
							<h2 className="text-xl font-semibold text-gray-800 mb-2">
								{collection.metadata.title}
							</h2>
							<p className="text-gray-600 text-sm mb-4">
								{collection.metadata.description}
							</p>
							<div className="grid grid-cols-2 gap-4">
								{collection.nfts.map((nft) => (
									<div
										key={nft.id}
										className="relative group">
										<img
											src={nft.metadata.image}
											alt={nft.metadata.title}
											className="w-full h-48 object-cover rounded-lg"
										/>
										<div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-200 rounded-lg flex items-center justify-center">
											<div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
												<h3 className="text-sm font-medium">
													{
														nft
															.metadata
															.title
													}
												</h3>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
