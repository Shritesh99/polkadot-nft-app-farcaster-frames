import React, { useState } from "react";
import { ApiPromise } from "@polkadot/api";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import type { Signer } from "@polkadot/types/types";
import { Button } from "./ui/Button";

interface CreateNFTModalProps {
	api: ApiPromise;
	account: InjectedAccountWithMeta;
	signer: Signer;
	collectionId: number;
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

export const CreateNFTModal: React.FC<CreateNFTModalProps> = ({
	api,
	account,
	signer,
	collectionId,
	isOpen,
	onClose,
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
					onSuccess();
					onClose();
				}
			});
		} catch (error) {
			console.error("Failed to mint NFT:", error);
			setError("Failed to mint NFT");
		} finally {
			setIsLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
				<h2 className="text-2xl font-bold text-gray-800 mb-4">
					Create New NFT
				</h2>

				{error && (
					<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
						{error}
					</div>
				)}

				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Title
						</label>
						<input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Enter NFT title"
							maxLength={64}
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Description
						</label>
						<textarea
							value={description}
							onChange={(e) =>
								setDescription(e.target.value)
							}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Enter NFT description"
							maxLength={128}
							rows={3}
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Image URL
						</label>
						<input
							type="text"
							value={imageUrl}
							onChange={(e) => setImageUrl(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Enter image URL"
							maxLength={256}
						/>
					</div>

					<div className="flex space-x-4 mt-6">
						<Button
							onClick={createNFT}
							disabled={
								isLoading ||
								!title ||
								!description ||
								!imageUrl
							}
							className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
							{isLoading ? "Creating..." : "Create NFT"}
						</Button>
						<Button
							onClick={onClose}
							className="bg-gray-600 hover:bg-gray-700 text-white">
							Cancel
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};
