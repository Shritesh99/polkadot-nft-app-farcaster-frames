import React, { useState, useEffect } from "react";
import { ApiPromise } from "@polkadot/api";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import type { Signer } from "@polkadot/types/types";
import { Button } from "./ui/Button";
import type { Vec } from "@polkadot/types";
import type { EventRecord } from "@polkadot/types/interfaces";
import { u32 } from "@polkadot/types";
import type { Option } from "@polkadot/types";

interface NFTMintingProps {
	api: ApiPromise;
	account?: InjectedAccountWithMeta;
	signer?: Signer;
}

interface NFTEvent {
	collectionId: number;
	itemId: number;
	owner: string;
	eventType: "minted" | "transferred";
}

interface NFTDetails {
	owner: string;
	metadata: string;
}

interface CollectionNFTs {
	[key: number]: {
		[key: number]: NFTDetails;
	};
}

export const NFTMinting: React.FC<NFTMintingProps> = ({
	api,
	account,
	signer,
}) => {
	const [metadata, setMetadata] = useState<string>("");
	const [collectionId, setCollectionId] = useState<number>(0);
	const [nftEvents, setNftEvents] = useState<NFTEvent[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [collections, setCollections] = useState<number[]>([]);
	const [nfts, setNfts] = useState<CollectionNFTs>({});
	const [selectedCollection, setSelectedCollection] = useState<
		number | null
	>(null);
	const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);

	// Fetch available collections
	useEffect(() => {
		const fetchCollections = async () => {
			if (!api) return;
			try {
				const nextCollectionId =
					(await api.query.templateModule.nextCollectionId()) as u32;
				const collectionIds = Array.from(
					{ length: nextCollectionId.toNumber() },
					(_, i) => i
				);
				setCollections(collectionIds);
			} catch (error) {
				console.error("Failed to fetch collections:", error);
			}
		};

		fetchCollections();
	}, [api]);

	// Fetch NFTs for selected collection
	useEffect(() => {
		const fetchNFTs = async () => {
			if (!api || selectedCollection === null) return;

			setIsLoadingNFTs(true);
			try {
				const nextItemId =
					(await api.query.templateModule.nextItemId(
						selectedCollection
					)) as u32;
				const nftPromises = Array.from(
					{ length: nextItemId.toNumber() },
					async (_, itemId) => {
						const nft = (await api.query.templateModule.nfts(
							selectedCollection,
							itemId
						)) as Option<unknown>;
						if (nft.isSome) {
							const nftData = nft.unwrap();
							return {
								itemId,
								details: {
									owner: nftData.owner.toString(),
									metadata: String.fromCharCode(
										...nftData.metadata
									),
								},
							};
						}
						return null;
					}
				);

				const nftResults = await Promise.all(nftPromises);
				const collectionNFTs = nftResults.reduce(
					(acc, nft) => {
						if (nft) {
							if (!acc[selectedCollection]) {
								acc[selectedCollection] = {};
							}
							acc[selectedCollection][nft.itemId] =
								nft.details;
						}
						return acc;
					},
					{ ...nfts }
				);

				setNfts(collectionNFTs);
			} catch (error) {
				console.error("Failed to fetch NFTs:", error);
			} finally {
				setIsLoadingNFTs(false);
			}
		};

		fetchNFTs();
	}, [api, selectedCollection]);

	// Subscribe to NFT events
	useEffect(() => {
		if (!api) return;

		let unsubscribe: unknown;

		try {
			unsubscribe = api.query.system.events(
				(events: Vec<EventRecord>) => {
					events.forEach((record) => {
						const { event } = record;

						if (event.section === "templateModule") {
							if (event.method === "NFTMinted") {
								const [collectionId, itemId, owner] =
									event.data;
								setNftEvents((prev) => [
									...prev,
									{
										collectionId: (
											collectionId as u32
										).toNumber(),
										itemId: (
											itemId as u32
										).toNumber(),
										owner: owner.toString(),
										eventType: "minted",
									},
								]);
								// Refresh NFTs for the collection
								setSelectedCollection(
									(collectionId as u32).toNumber()
								);
							} else if (
								event.method === "NFTTransferred"
							) {
								const [collectionId, itemId, , to] =
									event.data;
								setNftEvents((prev) => [
									...prev,
									{
										collectionId: (
											collectionId as u32
										).toNumber(),
										itemId: (
											itemId as u32
										).toNumber(),
										owner: to.toString(),
										eventType: "transferred",
									},
								]);
								// Refresh NFTs for the collection
								setSelectedCollection(
									(collectionId as u32).toNumber()
								);
							}
						}
					});
				}
			);
		} catch (error) {
			console.error("Error subscribing to events:", error);
		}

		return () => {
			if (unsubscribe) {
				if (typeof unsubscribe === "function") {
					unsubscribe();
				} else if (unsubscribe instanceof Promise) {
					(unsubscribe as Promise<() => void>)
						.then((unsub) => unsub())
						.catch(console.error);
				}
			}
		};
	}, [api]);

	const mintNFT = async () => {
		if (!api || !account?.address || !signer) {
			console.error("Missing required properties for minting");
			return;
		}

		setIsLoading(true);
		try {
			const tx = api.tx.template.mintNft(
				collectionId,
				Array.from(metadata).map((c) => c.charCodeAt(0))
			);

			await tx.signAndSend(
				account.address,
				{ signer },
				({ status }) => {
					if (status.isInBlock) {
						console.log(
							`Minted NFT in block ${status.asInBlock.toString()}`
						);
						setMetadata("");
						setSelectedCollection(collectionId);
					}
				}
			);
		} catch (error) {
			console.error("Failed to mint NFT:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const transferNFT = async (toAddress: string, itemId: number) => {
		if (
			!api ||
			!account?.address ||
			!signer ||
			selectedCollection === null
		) {
			console.error("Missing required properties for transfer");
			return;
		}

		setIsLoading(true);
		try {
			const tx = api.tx.template.transferNft(
				selectedCollection,
				itemId,
				toAddress
			);

			await tx.signAndSend(
				account.address,
				{ signer },
				({ status }) => {
					if (status.isInBlock) {
						console.log(
							`Transferred NFT in block ${status.asInBlock.toString()}`
						);
					}
				}
			);
		} catch (error) {
			console.error("Failed to transfer NFT:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-6 p-4 bg-white rounded-lg shadow-md">
			{/* Collections List */}
			<div className="space-y-4">
				<h2 className="text-2xl font-bold text-gray-800">
					NFT Collections
				</h2>
				<div className="grid grid-cols-2 gap-4">
					{collections.map((id) => (
						<Button
							key={id}
							onClick={() => setSelectedCollection(id)}
							className={`p-4 rounded-lg ${
								selectedCollection === id
									? "bg-blue-600 text-white"
									: "bg-gray-100 hover:bg-gray-200"
							}`}>
							Collection #{id}
						</Button>
					))}
				</div>
			</div>

			{/* NFT Minting Form */}
			<div className="space-y-4 border-t pt-6">
				<h2 className="text-2xl font-bold text-gray-800">
					Mint New NFT
				</h2>

				<div className="space-y-2">
					<label className="block text-sm font-medium text-gray-700">
						Select Collection
					</label>
					<select
						value={collectionId}
						onChange={(e) =>
							setCollectionId(Number(e.target.value))
						}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
						{collections.map((id) => (
							<option key={id} value={id}>
								Collection #{id}
							</option>
						))}
					</select>
				</div>

				<div className="space-y-2">
					<label className="block text-sm font-medium text-gray-700">
						NFT Metadata
					</label>
					<input
						type="text"
						value={metadata}
						onChange={(e) => setMetadata(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Enter NFT metadata"
					/>
				</div>

				<Button
					onClick={mintNFT}
					disabled={isLoading}
					className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors disabled:bg-blue-300">
					{isLoading ? "Minting..." : "Mint NFT"}
				</Button>
			</div>

			{/* NFT List for Selected Collection */}
			{selectedCollection !== null && (
				<div className="space-y-4 border-t pt-6">
					<h2 className="text-2xl font-bold text-gray-800">
						NFTs in Collection #{selectedCollection}
					</h2>
					{isLoadingNFTs ? (
						<div className="text-center py-4">
							Loading NFTs...
						</div>
					) : (
						<div className="grid grid-cols-1 gap-4">
							{nfts[selectedCollection] &&
								Object.entries(
									nfts[selectedCollection]
								).map(([itemId, nft]) => (
									<div
										key={itemId}
										className="p-4 border rounded-lg space-y-2">
										<div className="flex justify-between items-start">
											<div>
												<h3 className="font-semibold">
													NFT #{itemId}
												</h3>
												<p className="text-sm text-gray-600">
													{nft.metadata}
												</p>
												<p className="text-xs text-gray-500">
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
											</div>
											{nft.owner ===
												account.address && (
												<div className="space-y-2">
													<input
														type="text"
														placeholder="Recipient address"
														className="w-full px-2 py-1 text-sm border rounded"
														id={`transfer-${itemId}`}
													/>
													<Button
														onClick={() => {
															const input =
																document.getElementById(
																	`transfer-${itemId}`
																) as HTMLInputElement;
															transferNFT(
																input.value,
																Number(
																	itemId
																)
															);
														}}
														className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-2 rounded">
														Transfer
													</Button>
												</div>
											)}
										</div>
									</div>
								))}
						</div>
					)}
				</div>
			)}

			{/* Recent Events */}
			<div className="mt-6 border-t pt-6">
				<h3 className="text-xl font-semibold text-gray-800 mb-4">
					Recent NFT Events
				</h3>
				<div className="space-y-2">
					{nftEvents.map((event, index) => (
						<div
							key={index}
							className="p-3 bg-gray-50 rounded-md">
							<p className="text-sm text-gray-600">
								Collection ID: {event.collectionId} |
								Item ID: {event.itemId} |
								{event.eventType === "minted"
									? " Minted by: "
									: " Transferred to: "}
								{event.owner.slice(0, 6)}...
								{event.owner.slice(-4)}
							</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};
