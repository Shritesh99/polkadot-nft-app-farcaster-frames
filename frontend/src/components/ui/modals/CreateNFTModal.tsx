import React, { useState } from "react";
import { ApiPromise } from "@polkadot/api";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import type { Signer } from "@polkadot/types/types";
import { Button } from "../components/Button";
import toast from "react-hot-toast";

interface CreateNFTModalProps {
	api: ApiPromise;
	account: InjectedAccountWithMeta;
	signer: Signer | unknown;
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
	const [price, setPrice] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const createNFT = async () => {
		if (!api || !account?.address || !signer) {
			toast.error("Missing required properties");
			return;
		}

		setIsLoading(true);

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

			// Convert price string to number
			const priceValue = parseInt(price) || 0;

			// Use the Bytes type for metadata to handle the encoding properly
			const tx = api.tx.templatePallet.createNft(
				collectionId,
				api.createType("Vec<u8>", encodedBytes),
				priceValue
			);

			// If dry run succeeds, send the actual transaction
			await tx.signAndSend(account.address, { signer }, (result) => {
				if (result.status.isInBlock) {
					console.log(
						`NFT minted in block ${result.status.hash.toString()}`
					);
					setTitle("");
					setDescription("");
					setImageUrl("");
					setPrice("");
					onSuccess();
					onClose();
				}
			});
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			toast.error("Failed to mint NFT: " + errorMessage);
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

				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Title
						</label>
						<input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 text-gray-700"
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
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 text-gray-700"
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
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 text-gray-700"
							placeholder="Enter image URL"
							maxLength={256}
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Price
						</label>
						<input
							type="number"
							value={price}
							onChange={(e) => setPrice(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 text-gray-700"
							placeholder="Enter price in native tokens"
							min="0"
						/>
					</div>

					<div className="flex space-x-4 mt-6">
						<Button
							onClick={onClose}
							className="flex-1 bg-gray-600 hover:bg-gray-700 text-white mr-2">
							Cancel
						</Button>
						<Button
							onClick={createNFT}
							disabled={
								isLoading ||
								!title ||
								!description ||
								!imageUrl ||
								!price
							}
							className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
							{isLoading ? "Creating..." : "Create NFT"}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};
