import React, { useState, useEffect } from "react";
import { ApiPromise } from "@polkadot/api";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import type { Signer } from "@polkadot/types/types";
import { Button } from "./ui/Button";
import { decodeMetadata } from "../utils/utils";
import { CreateCollectionModal } from "./CreateCollectionModal";
import { CreateNFTModal } from "./CreateNFTModal";

interface CollectionManagerProps {
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
	nfts: number[]; // List of NFT IDs in the collection
}

interface NFTData {
	owner: string;
	metadata: string;
	is_sold: boolean;
}

interface CollectionData {
	creator: string;
	metadata: string;
	is_frozen: boolean;
	nfts: number[];
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

export const CollectionManager: React.FC<CollectionManagerProps> = ({
	api,
	account,
	signer,
}) => {
	const [collections, setCollections] = useState<Collection[]>([]);
	const [selectedCollection, setSelectedCollection] =
		useState<Collection | null>(null);
	const [nfts, setNfts] = useState<NFT[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [isCreateCollectionModalOpen, setIsCreateCollectionModalOpen] =
		useState(false);
	const [isCreateNFTModalOpen, setIsCreateNFTModalOpen] = useState(false);

	useEffect(() => {
		loadCollections();
	}, [api, account]);

	useEffect(() => {
		if (selectedCollection) {
			loadNFTs(selectedCollection.id);
		}
	}, [selectedCollection]);

	const loadCollections = async () => {
		if (!api || !account?.address) return;

		try {
			const collections =
				await api.query.template.collections.entries();
			const formattedCollections = collections
				.map(([key, value]) => {
					const id = Number(key.args[0].toString());
					const rawData = value.toJSON();
					if (!rawData || typeof rawData !== "object") {
						throw new Error("Invalid collection data");
					}

					const collection =
						rawData as unknown as CollectionData;
					const metadataStr = decodeMetadata(
						collection.metadata
					);
					let metadata;
					try {
						metadata = JSON.parse(metadataStr);
					} catch (e) {
						console.error(
							"Failed to parse collection metadata:",
							e
						);
						metadata = {
							title: "Unknown Collection",
							description: "Invalid metadata",
							image: "",
							price: "0",
							creator: collection.creator,
						};
					}
					return {
						id,
						metadata,
						nfts: collection.nfts || [],
					};
				})
				.filter(
					(collection) =>
						collection.metadata.creator === account.address
				);
			setCollections(formattedCollections);
		} catch (error) {
			console.error("Failed to load collections:", error);
			setError("Failed to load collections");
		}
	};

	const loadNFTs = async (collectionId: number) => {
		if (!api) return;

		try {
			const nextItemId = await api.query.template.nextItemId(
				collectionId
			);
			const nftPromises = Array.from(
				{ length: Number(nextItemId.toString() + 1) },
				async (_, itemId) => {
					try {
						const nft = await api.query.template.nfts(
							collectionId,
							itemId
						);

						if (nft.isEmpty) {
							return null;
						}

						const rawData = nft.toJSON();
						if (!rawData || typeof rawData !== "object") {
							return null;
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
						return {
							id: itemId,
							metadata,
							owner: nftData.owner,
							is_sold: nftData.is_sold,
						};
					} catch (error) {
						console.error(
							`Error loading NFT ${itemId}:`,
							error
						);
						return null;
					}
				}
			);

			const nftResults = await Promise.all(nftPromises);
			setNfts(nftResults.filter((nft): nft is NFT => nft !== null));
		} catch (error) {
			console.error("Failed to load NFTs:", error);
			setError("Failed to load NFTs");
		}
	};

	const burnNFT = async (collectionId: number, itemId: number) => {
		if (!api || !account?.address || !signer) {
			setError("Missing required properties");
			return;
		}

		try {
			const tx = api.tx.template.burnNft(collectionId, itemId);

			await tx.signAndSend(
				account.address,
				{ signer },
				({ status }) => {
					if (status.isInBlock) {
						console.log(
							`NFT burned in block ${status.asInBlock.toString()}`
						);
						loadNFTs(collectionId);
					}
				}
			);
		} catch (error) {
			console.error("Failed to burn NFT:", error);
			setError("Failed to burn NFT");
		}
	};

	const transferNFT = async (
		collectionId: number,
		itemId: number,
		to: string
	) => {
		if (!api || !account?.address || !signer) {
			setError("Missing required properties");
			return;
		}

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
						loadNFTs(collectionId);
					}
				}
			);
		} catch (error) {
			console.error("Failed to transfer NFT:", error);
			setError("Failed to transfer NFT");
		}
	};

	return (
		<div className="max-w-6xl mx-auto p-6">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{/* Collections List */}
				<div className="bg-white rounded-lg shadow-lg p-6">
					<div className="flex justify-between items-center mb-6">
						<h2 className="text-2xl font-bold text-gray-800">
							My Collections
						</h2>
						<Button
							onClick={() =>
								setIsCreateCollectionModalOpen(true)
							}
							className="bg-blue-600 hover:bg-blue-700 text-white transition duration-300">
							Create Collection
						</Button>
					</div>

					{error && (
						<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
							{error}
						</div>
					)}

					<div className="space-y-4">
						{collections.map((collection) => (
							<div
								key={collection.id}
								className={`p-4 border rounded-lg cursor-pointer transition-colors duration-300 ${
									selectedCollection?.id ===
									collection.id
										? "bg-blue-50 border-blue-300"
										: "hover:bg-gray-50"
								}`}
								onClick={() =>
									setSelectedCollection(collection)
								}>
								<h3 className="text-lg font-semibold text-gray-800">
									{collection.metadata.title}
								</h3>
								<p className="text-gray-600 mt-1">
									{collection.metadata.description}
								</p>

								<div className="mt-2 flex justify-between items-center">
									<span className="text-sm text-gray-500">
										Collection #{collection.id} (
										{collection.nfts?.length || 0}{" "}
										NFTs)
									</span>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* NFTs in Selected Collection */}
				<div className="bg-white rounded-lg shadow-lg p-6">
					<h2 className="text-2xl font-bold text-gray-800 mb-6">
						{selectedCollection
							? `NFTs in ${selectedCollection.metadata.title}`
							: "Select a Collection"}
					</h2>
					{selectedCollection !== null && (
						<>
							<div className="flex justify-end mb-4">
								<Button
									onClick={() =>
										setIsCreateNFTModalOpen(true)
									}
									className="bg-blue-600 hover:bg-blue-700 text-white transition duration-300">
									Create NFT
								</Button>
							</div>

							<div className="space-y-4">
								{nfts.length === 0 ? (
									<div className="text-center p-4 bg-gray-50 rounded-lg">
										<p className="text-gray-500">
											No NFTs in this
											collection yet
										</p>
									</div>
								) : (
									nfts.map((nft) => (
										<div
											key={nft.id}
											className="p-4 border rounded-lg shadow-sm transition duration-300 hover:shadow-md">
											<div className="flex justify-between items-start">
												<div>
													<h3 className="font-semibold text-black">
														{nft
															.metadata
															.title ||
															`NFT #${nft.id}`}
													</h3>
													<p className="text-sm text-gray-600">
														{
															nft
																.metadata
																.description
														}
													</p>
													{nft.metadata
														.image && (
														<img
															src={
																nft
																	.metadata
																	.image
															}
															alt={
																nft
																	.metadata
																	.title ||
																`NFT #${nft.id}`
															}
															width={
																0
															}
															height={
																0
															}
															sizes="100vw"
															className="mt-2 w-24 h-24 object-cover rounded-lg shadow"
														/>
													)}
													<p className="text-xs text-gray-500 mt-2">
														Owner:{" "}
														{nft.owner.slice(
															0,
															6
														)}
														...
														{nft.owner.slice(
															-4
														)}
													</p>
													<p className="text-xs text-gray-500">
														Status:{" "}
														{nft.is_sold
															? "Sold"
															: "Available"}
													</p>
												</div>
												<div className="space-y-2">
													{nft.owner ===
													account.address ? (
														<>
															<input
																type="text"
																placeholder="Recipient address"
																className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
																id={`transfer-${nft.id}`}
															/>
															<div className="flex space-x-2">
																<Button
																	onClick={() => {
																		const input =
																			document.getElementById(
																				`transfer-${nft.id}`
																			) as HTMLInputElement;
																		transferNFT(
																			selectedCollection.id,
																			nft.id,
																			input.value
																		);
																	}}
																	className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded-lg transition duration-300">
																	Transfer
																</Button>
																<Button
																	onClick={() =>
																		burnNFT(
																			selectedCollection.id,
																			nft.id
																		)
																	}
																	className="bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 rounded-lg transition duration-300">
																	Burn
																</Button>
															</div>
														</>
													) : (
														<span className="text-sm text-gray-500">
															Not
															owned
														</span>
													)}
												</div>
											</div>
										</div>
									))
								)}
							</div>
						</>
					)}
				</div>
			</div>

			{/* Modals */}
			<CreateCollectionModal
				api={api}
				account={account}
				signer={signer}
				isOpen={isCreateCollectionModalOpen}
				onClose={() => setIsCreateCollectionModalOpen(false)}
				onSuccess={loadCollections}
			/>

			{selectedCollection && (
				<CreateNFTModal
					api={api}
					account={account}
					signer={signer}
					collectionId={selectedCollection.id}
					isOpen={isCreateNFTModalOpen}
					onClose={() => setIsCreateNFTModalOpen(false)}
					onSuccess={() => loadNFTs(selectedCollection.id)}
				/>
			)}
		</div>
	);
};
