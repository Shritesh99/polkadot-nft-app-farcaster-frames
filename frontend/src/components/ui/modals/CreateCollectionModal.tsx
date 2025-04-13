import React, { useState } from "react";
import { ApiPromise } from "@polkadot/api";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import type { Signer } from "@polkadot/types/types";
import { Button } from "../components/Button";
import toast from "react-hot-toast";

interface CreateCollectionModalProps {
	api: ApiPromise;
	account: InjectedAccountWithMeta;
	signer: Signer;
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

export const CreateCollectionModal: React.FC<CreateCollectionModalProps> = ({
	api,
	account,
	signer,
	isOpen,
	onClose,
	onSuccess,
}) => {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const createCollection = async () => {
		if (!api || !account?.address || !signer) {
			toast.error("Missing required properties");
			return;
		}

		setIsLoading(true);

		try {
			const metadata = {
				title,
				description,
				creator: account.address,
			};
			const metadataString = JSON.stringify(metadata);
			const metadataBytes = Array.from(metadataString).map((c) =>
				c.charCodeAt(0)
			);
			const tx = api.tx.templatePallet.createCollection(metadataBytes);

			await tx.signAndSend(
				account.address,
				{ signer },
				({ status }) => {
					if (status.isInBlock) {
						console.log(
							`Collection created in block ${status.asInBlock.toString()}`
						);
						setTitle("");
						setDescription("");
						onSuccess();
						onClose();
					}
				}
			);
		} catch (error) {
			toast.error("Failed to create collection: " + error);
		} finally {
			setIsLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
				<h2 className="text-2xl font-bold text-gray-800 mb-4">
					Create New Collection
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
							placeholder="Enter collection title"
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
							placeholder="Enter collection description"
							maxLength={128}
							rows={3}
						/>
					</div>
					<div className="flex space-x-4 mt-6">
						<Button
							onClick={onClose}
							className="flex-1 bg-gray-600 hover:bg-gray-700 text-white mr-2">
							Cancel
						</Button>
						<Button
							onClick={createCollection}
							disabled={
								isLoading || !title || !description
							}
							className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
							{isLoading
								? "Creating..."
								: "Create Collection"}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};
