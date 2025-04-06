import React, { useState, useEffect } from "react";
import { ApiPromise } from "@polkadot/api";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import type { Signer } from "@polkadot/types/types";
import { Button } from "./ui/components/Button";
import toast from "react-hot-toast";
import { decodeMetadata } from "../utils/utils";

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
	isSold: boolean;
}

interface NFTData {
	owner: string;
	metadata: string;
	isSold: boolean;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
	api,
	account,
	signer,
}) => {
	const [userNFTs, setUserNFTs] = useState<NFT[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		loadUserNFTs();
	}, [api, account]);

	const loadUserNFTs = async () => {
		if (!api || !account?.address) return;

		setIsLoading(true);
		try {
			const nextCollectionId =
				await api.query.templatePallet.nextCollectionId();
			const allUserNFTs: NFT[] = [];

			for (
				let collectionId = 0;
				collectionId < Number(nextCollectionId.toString());
				collectionId++
			) {
				const nextItemId =
					await api.query.templatePallet.nextItemId(
						collectionId
					);

				for (
					let itemId = 0;
					itemId < Number(nextItemId.toString());
					itemId++
				) {
					const nft = await api.query.templatePallet.nfts(
						collectionId,
						itemId
					);

					if (!nft.isEmpty) {
						const rawData = nft.toJSON();
						const nftData = rawData as unknown as NFTData;

						if (
							nftData.owner.toString() === account.address
						) {
							const metadataStr = decodeMetadata(
								nftData.metadata
							);
							let metadata;
							try {
								metadata = JSON.parse(metadataStr);
								console.log(metadata);
							} catch (e) {
								console.error(
									"Failed to parse metadata:",
									e
								);
								metadata = {
									title: "Unknown NFT",
									description: "Invalid metadata",
									image: "",
								};
							}

							allUserNFTs.push({
								id: itemId,
								collectionId,
								metadata,
								owner: nftData.owner.toString(),
								isSold: nftData.isSold,
							});
						}
					}
				}
			}

			setUserNFTs(allUserNFTs);
		} catch (error) {
			console.error("Failed to load NFTs:", error);
			toast.error("Failed to load your NFTs");
		} finally {
			setIsLoading(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex justify-center items-center min-h-[400px]">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	if (userNFTs.length === 0) {
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
			<h1 className="text-3xl font-bold mb-8 text-gray-900">
				Your NFT Collection
			</h1>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{userNFTs.map((nft) => (
					<div
						key={`${nft.collectionId}-${nft.id}`}
						className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
						<div className="aspect-w-16 aspect-h-9 bg-gray-200">
							{nft.metadata.image && (
								<img
									src={nft.metadata.image}
									alt={`NFT ${nft.id}`}
									className="object-cover w-full h-full"
								/>
							)}
						</div>
						<div className="p-4">
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								{`${nft.metadata.title}` ||
									`NFT #${nft.id}`}
							</h3>
							<p className="text-sm text-gray-600 mb-4">
								Collection ID: {nft.collectionId}
							</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
