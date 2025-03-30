import React, { useEffect, useState } from "react";
import { ApiPromise } from "@polkadot/api";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import type { Signer } from "@polkadot/types/types";
import { Button } from "./ui/components/Button";
import { decodeMetadata } from "../utils/utils";

interface NFTMarketplaceProps {
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

interface NFTData {
	owner: string;
	metadata: string;
	is_sold: boolean;
}

export const NFTMarketplace: React.FC<NFTMarketplaceProps> = ({
	api,
	account,
	signer,
}) => {
	const [nfts, setNfts] = useState<NFT[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		loadNFTs();
	}, [api]);

	const loadNFTs = async () => {
		if (!api) return;

		setIsLoading(true);
		setError(null);

		try {
			// First get all collections
			const collections =
				await api.query.template.collections.entries();

			// For each collection, get its NFTs
			const allNFTs: NFT[] = [];

			for (const [key] of collections) {
				const collectionId = Number(key.args[0].toString());
				const nextItemId = await api.query.template.nextItemId(
					collectionId
				);

				for (
					let itemId = 0;
					itemId < Number(nextItemId.toString() + 1);
					itemId++
				) {
					try {
						const nft = await api.query.template.nfts(
							collectionId,
							itemId
						);

						if (nft.isEmpty) {
							continue;
						}

						const rawData = nft.toJSON();
						if (!rawData || typeof rawData !== "object") {
							continue;
						}

						const nftData = rawData as unknown as NFTData;
						const metadataStr = decodeMetadata(
							nftData.metadata
						);
						let metadata;
						try {
							metadata = JSON.parse(metadataStr);
						} catch (e) {
							console.error(
								"Failed to parse metadata:",
								e
							);
						}
						allNFTs.push({
							id: itemId,
							collectionId,
							metadata,
							owner: nftData.owner,
							is_sold: nftData.is_sold,
						});
					} catch (error) {
						console.error(
							`Error loading NFT ${itemId} from collection ${collectionId}:`,
							error
						);
						continue;
					}
				}
			}

			setNfts(allNFTs);
		} catch (error) {
			console.error("Failed to load NFTs:", error);
			setError(
				error instanceof Error
					? error.message
					: "Failed to load NFTs"
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleTransfer = async (
		collectionId: number,
		itemId: number,
		to: string
	) => {
		if (!api || !account?.address || !signer) {
			setError("Missing required properties for transfer");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const tx = api.tx.template.transferNft(collectionId, itemId, to);
			await tx.signAndSend(
				account.address,
				{ signer },
				({ status }) => {
					if (status.isInBlock) {
						console.log(
							`NFT transferred in block ${status.asInBlock.toString()}`
						);
						loadNFTs(); // Refresh NFTs after transfer
					}
				}
			);
		} catch (error) {
			console.error("Failed to transfer NFT:", error);
			setError(
				error instanceof Error
					? error.message
					: "Failed to transfer NFT"
			);
		} finally {
			setIsLoading(false);
		}
	};

	const mintNft = async (collectionId: number, itemId: number) => {
		if (!api || !account?.address || !signer) {
			setError("Missing required properties for purchase");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const tx = api.tx.template.mintNft(collectionId, itemId);
			await tx.signAndSend(
				account.address,
				{ signer },
				({ status }) => {
					if (status.isInBlock) {
						console.log(
							`NFT purchased in block ${status.asInBlock.toString()}`
						);
						loadNFTs(); // Refresh NFTs after purchase
					}
				}
			);
		} catch (error) {
			console.error("Failed to buy NFT:", error);
			setError(
				error instanceof Error ? error.message : "Failed to buy NFT"
			);
		} finally {
			setIsLoading(false);
		}
	};

	if (isLoading && nfts.length === 0) {
		return (
			<div className="text-center py-8">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
				<p className="mt-2 text-gray-600">Loading NFTs...</p>
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
			<h2 className="text-2xl font-bold mb-6">Available NFTs</h2>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{nfts.map((nft) => (
					<div
						key={`${nft.collectionId}-${nft.id}`}
						className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
						{nft.metadata.image && (
							<img
								src={nft.metadata.image}
								alt={
									nft.metadata.title ||
									`NFT #${nft.id}`
								}
								className="w-full h-48 object-cover"
							/>
						)}
						<div className="p-4">
							<h3 className="text-xl font-semibold text-gray-800">
								{nft.metadata.title || `NFT #${nft.id}`}
							</h3>
							<p className="text-gray-600 mt-2">
								{nft.metadata.description}
							</p>
							<div className="mt-4 space-y-2">
								<p className="text-sm text-gray-500">
									Collection #{nft.collectionId} |
									NFT #{nft.id}
								</p>
								<p className="text-sm text-gray-500">
									Owner: {nft.owner.slice(0, 6)}...
									{nft.owner.slice(-4)}
								</p>
								{nft.owner === account.address ? (
									<div className="space-y-2">
										<input
											type="text"
											placeholder="Recipient address"
											className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-400 text-gray-700"
											id={`transfer-${nft.collectionId}-${nft.id}`}
										/>
										<Button
											onClick={() => {
												const input =
													document.getElementById(
														`transfer-${nft.collectionId}-${nft.id}`
													) as HTMLInputElement;
												handleTransfer(
													nft.collectionId,
													nft.id,
													input.value
												);
											}}
											isLoading={isLoading}
											variant="primary"
											size="sm"
											className="w-full">
											Transfer NFT
										</Button>
									</div>
								) : (
									nft.is_sold && (
										<Button
											onClick={() =>
												mintNft(
													nft.collectionId,
													nft.id
												)
											}
											isLoading={isLoading}
											variant="primary"
											size="sm"
											className="w-full">
											Mint NFT
										</Button>
									)
								)}
							</div>
						</div>
					</div>
				))}
			</div>

			{nfts.length === 0 && (
				<div className="text-center py-8 text-gray-600">
					No NFTs available yet.
				</div>
			)}
		</div>
	);
};
