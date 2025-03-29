import React, { useState, useEffect } from "react";
import { ApiPromise } from "@polkadot/api";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import type { Signer } from "@polkadot/types/types";
import { Button } from "./ui/Button";
interface ArtistDashboardProps {
	api: ApiPromise;
	account: InjectedAccountWithMeta;
	signer: Signer;
}

interface ArtworkSubmission {
	title: string;
	description: string;
	imageUrl: string;
	price: string;
}

export const ArtistDashboard: React.FC<ArtistDashboardProps> = ({
	api,
	account,
	signer,
}) => {
	const [artwork, setArtwork] = useState<ArtworkSubmission>({
		title: "",
		description: "",
		imageUrl: "",
		price: "",
	});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isRegistered, setIsRegistered] = useState(false);
	const [myCollections, setMyCollections] = useState<Collection[]>([]);

	useEffect(() => {
		checkArtistStatus();
		loadMyCollections();
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

	const loadMyCollections = async () => {
		if (!api || !account?.address) return;

		try {
			const collections =
				await api.query.template.collections.entries();
			const myCollections = collections
				.map(([key, value]) => {
					const id = Number(key.args[0].toString());
					const metadata = JSON.parse(value.toString());
					return { id, metadata };
				})
				.filter(
					(collection) =>
						collection.metadata.creator === account.address
				);
			setMyCollections(myCollections);
		} catch (error) {
			console.error("Failed to load collections:", error);
		}
	};

	const registerAsArtist = async () => {
		if (!api || !account?.address || !signer) {
			setError("Missing required properties for registration");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const tx = api.tx.template.registerArtist();

			await tx.signAndSend(
				account.address,
				{ signer },
				({ status, dispatchError }) => {
					if (dispatchError) {
						console.error("Dispatch error:", dispatchError);
						setError(dispatchError.toString());
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
			setError(
				error instanceof Error
					? error.message
					: "Failed to register as artist"
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!api || !account?.address || !signer) {
			setError("Missing required properties for submission");
			return;
		}

		if (!isRegistered) {
			setError("Please register as an artist first");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const metadata = JSON.stringify({
				title: artwork.title,
				description: artwork.description,
				image: artwork.imageUrl,
				price: artwork.price,
				creator: account.address,
			});

			const metadataBytes = Array.from(metadata).map((c) =>
				c.charCodeAt(0)
			);
			const tx = api.tx.template.createCollection(metadataBytes);

			await tx.signAndSend(
				account.address,
				{ signer },
				({ status }) => {
					if (status.isInBlock) {
						console.log(
							`Collection created in block ${status.asInBlock.toString()}`
						);
						setArtwork({
							title: "",
							description: "",
							imageUrl: "",
							price: "",
						});
						loadMyCollections(); // Refresh collections after creation
					}
				}
			);
		} catch (error) {
			console.error("Failed to create collection:", error);
			setError(
				error instanceof Error
					? error.message
					: "Failed to create collection"
			);
		} finally {
			setIsLoading(false);
		}
	};

	if (!isRegistered) {
		return (
			<div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
				<h2 className="text-2xl font-bold text-gray-800 mb-6">
					Register as Artist
				</h2>
				<p className="text-gray-600 mb-4">
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
		<div className="max-w-6xl mx-auto p-6">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{/* Create New Collection Form */}
				<div className="bg-white rounded-lg shadow-md p-6">
					<h2 className="text-2xl font-bold text-gray-800 mb-6">
						Create New Collection
					</h2>

					{error && (
						<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
							{error}
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700">
								Title
							</label>
							<input
								type="text"
								value={artwork.title}
								onChange={(e) =>
									setArtwork({
										...artwork,
										title: e.target.value,
									})
								}
								className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">
								Description
							</label>
							<textarea
								value={artwork.description}
								onChange={(e) =>
									setArtwork({
										...artwork,
										description: e.target.value,
									})
								}
								className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
								rows={3}
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">
								Image URL
							</label>
							<input
								type="url"
								value={artwork.imageUrl}
								onChange={(e) =>
									setArtwork({
										...artwork,
										imageUrl: e.target.value,
									})
								}
								className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">
								Price (DOT)
							</label>
							<input
								type="number"
								value={artwork.price}
								onChange={(e) =>
									setArtwork({
										...artwork,
										price: e.target.value,
									})
								}
								className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
								step="0.0000000001"
								required
							/>
						</div>

						<Button
							type="submit"
							disabled={isLoading}
							className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors disabled:bg-blue-300">
							{isLoading
								? "Creating Collection..."
								: "Create Collection"}
						</Button>
					</form>
				</div>

				{/* My Collections */}
				<div className="bg-white rounded-lg shadow-md p-6">
					<h2 className="text-2xl font-bold text-gray-800 mb-6">
						My Collections
					</h2>

					{myCollections.length === 0 ? (
						<p className="text-gray-600">
							No collections created yet.
						</p>
					) : (
						<div className="space-y-4">
							{myCollections.map((collection) => (
								<div
									key={collection.id}
									className="border rounded-lg p-4">
									<h3 className="text-lg font-semibold text-gray-800">
										{collection.metadata.title}
									</h3>
									<p className="text-gray-600 mt-1">
										{
											collection.metadata
												.description
										}
									</p>
									<div className="mt-2 flex justify-between items-center">
										<span className="text-blue-600 font-medium">
											{
												collection.metadata
													.price
											}{" "}
											DOT
										</span>
										<span className="text-sm text-gray-500">
											Collection #
											{collection.id}
										</span>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
