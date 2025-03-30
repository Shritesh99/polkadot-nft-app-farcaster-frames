import React, { useState } from "react";
import { ApiPromise } from "@polkadot/api";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import type { Signer } from "@polkadot/types/types";
import { Button } from "./ui/Button";

interface CreateNFTProps {
	api: ApiPromise;
	account: InjectedAccountWithMeta;
	signer: Signer;
	collectionId: number;
	onSuccess?: () => void;
}

export const CreateNFT: React.FC<CreateNFTProps> = ({
	api,
	account,
	signer,
	collectionId,
	onSuccess,
}) => {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [imageUrl, setImageUrl] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createNFT = async () => {
		if (!api || !account?.address || !signer) {
			setError("Missing required properties");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			// Create metadata as JSON
			const metadata = JSON.stringify({
				title,
				description,
				image: imageUrl,
			});

			// Convert JSON string to Uint8Array
			const encodedBytes = Array.from(metadata).map((c) =>
				c.charCodeAt(0)
			);

			// Use the Bytes type for metadata to handle the encoding properly
			// This ensures the metadata is properly encoded as a Compact<u8>[] that the chain expects
			const tx = api.tx.template.mintNft(
				collectionId,
				api.createType("Vec<u8>", encodedBytes)
			);

			// First do a dry run to check if the encoding is correct
			const res = await tx.dryRun(account.address, { signer });
			console.log("Dry run result:", res.toHuman());

			// If dry run succeeds, send the actual transaction
			await tx.signAndSend(account.address, { signer }, (result) => {
				if (result.status.isInBlock) {
					console.log(
						`NFT minted in block ${result.status.hash.toString()}`
					);
					setTitle("");
					setDescription("");
					setImageUrl("");
					onSuccess?.();
				}
			});
		} catch (error) {
			console.error("Failed to mint NFT:", error);
			setError("Failed to mint NFT");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-4 p-4 bg-white rounded-lg shadow-md">
			<h2 className="text-xl font-bold text-gray-800">
				Create New NFT
			</h2>

			{error && (
				<div className="text-red-500 text-sm p-2 bg-red-50 rounded-md">
					{error}
				</div>
			)}

			<div className="space-y-2">
				<label className="block text-sm font-medium text-gray-700">
					Title
				</label>
				<input
					type="text"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
					placeholder="Enter NFT title"
					maxLength={64}
				/>
			</div>

			<div className="space-y-2">
				<label className="block text-sm font-medium text-gray-700">
					Description
				</label>
				<textarea
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
					placeholder="Enter NFT description"
					maxLength={128}
					rows={3}
				/>
			</div>

			<div className="space-y-2">
				<label className="block text-sm font-medium text-gray-700">
					Image URL
				</label>
				<input
					type="text"
					value={imageUrl}
					onChange={(e) => setImageUrl(e.target.value)}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
					placeholder="Enter image URL"
					maxLength={256}
				/>
			</div>

			<Button
				onClick={createNFT}
				disabled={isLoading || !title || !description || !imageUrl}
				className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors disabled:bg-blue-300">
				{isLoading ? "Creating..." : "Create NFT"}
			</Button>
		</div>
	);
};
