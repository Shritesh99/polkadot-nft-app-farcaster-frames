import React, { useEffect, useState } from "react";
import { ApiPromise } from "@polkadot/api";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import type { Signer } from "@polkadot/types/types";
import { Button } from "./ui/components/Button";
import { decodeMetadata } from "../utils/utils";
import toast from "react-hot-toast";
import { verifyUser, checkUserEngagement } from "../utils/farcaster";

interface NFTMarketplaceProps {
	api: ApiPromise;
	account: InjectedAccountWithMeta;
	signer: Signer;
	castHash?: string;
	fid?: string;
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
	collectionId: number;
	owner: string;
	metadata: string;
	isSold: boolean;
}

export const NFTMarketplace: React.FC<NFTMarketplaceProps> = ({
	castHash,
	fid,
	api,
	account,
	signer,
}) => {
	const [nfts, setNfts] = useState<NFT[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isCheckingEngagement, setIsCheckingEngagement] = useState(false);

	useEffect(() => {
		loadNFTs();
	}, [api]);

	const loadNFTs = async () => {
		if (!api) return;

		setIsLoading(true);

		try {
			// First get all collections
			const collections =
				await api.query.templatePallet.collections.entries();

			// For each collection, get its NFTs
			const allNFTs: NFT[] = [];

			for (const [key] of collections) {
				const collectionId = Number(key.args[0].toString());
				const nextItemId =
					await api.query.templatePallet.nextItemId(
						collectionId
					);

				for (
					let itemId = 0;
					itemId < Number(nextItemId.toString() + 1);
					itemId++
				) {
					try {
						const nft = await api.query.templatePallet.nfts(
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
							isSold: nftData.isSold,
						});
					} catch (error) {
						toast.error(
							`Error loading NFT ${itemId} from collection ${collectionId}: ` +
								error
						);
						continue;
					}
				}
			}

			setNfts(allNFTs);
		} catch (error) {
			toast.error("Failed to load NFTs: " + error);
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
			toast.error("Missing required properties for transfer");
			return;
		}

		setIsLoading(true);

		try {
			const tx = api.tx.templatePallet.transferNft(
				collectionId,
				itemId,
				to
			);
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
			toast.error("Failed to transfer NFT: " + error);
		} finally {
			setIsLoading(false);
		}
	};

	const checkEngagement = async () => {
		if (!castHash || !fid) {
			toast.error("Missing cast hash or FID");
			return false;
		}

		try {
			setIsCheckingEngagement(true);
			const engagement = await checkUserEngagement(fid, castHash);

			if (!engagement.hasLiked || !engagement.hasRecasted) {
				toast.error("Please like and recast the post to mint NFT");
				return false;
			}

			return true;
		} catch (error) {
			toast.error("Failed to check engagement");
			return false;
		} finally {
			setIsCheckingEngagement(false);
		}
	};

	const mintNft = async (collectionId: number, itemId: number) => {
		if (!api || !account?.address || !signer) {
			toast.error("Missing required properties for purchase");
			return;
		}

		setIsLoading(true);

		try {
			if (fid) {
				await verifyUser(fid);

				const isEngaged = await checkEngagement();
				if (!isEngaged) {
					setIsLoading(false);
					toast.error(
						"Please like and recast the post to mint NFT"
					);
					return;
				}
			}

			const tx = api.tx.templatePallet.mintNft(collectionId, itemId);
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
			toast.error("Failed to buy NFT: " + error);
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

	return (
		<div className="max-w-6xl mx-auto p-4 sm:p-6">
			<h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">
				Available NFTs
			</h2>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
				{nfts.map((nft) => (
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
							<div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
								{nft.owner === account.address && (
									<Button
										onClick={() =>
											handleTransfer(
												nft.collectionId,
												nft.id,
												""
											)
										}
										variant="secondary"
										size="sm"
										className="w-full sm:w-auto">
										Transfer
									</Button>
								)}
								{!nft.isSold && (
									<>
										<Button
											onClick={() =>
												mintNft(
													nft.collectionId,
													nft.id
												)
											}
											variant="primary"
											size="sm"
											className="w-full sm:w-auto">
											Mint
										</Button>
									</>
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
