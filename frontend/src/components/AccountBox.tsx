import React from "react";
import { Button } from "./ui/components/Button";
import { NFTMinting } from "./NFTMinting";
import { ApiPromise } from "@polkadot/api";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import type { Signer } from "@polkadot/types/types";

const shorten = (str: string) => {
	const size = 10;
	let result = str;
	if (str && str.length > 2 * size) {
		const start = str.slice(0, size);
		const end = str.slice(-size);
		result = `${start}...${end}`;
	}
	return result;
};

interface AccountBoxParams {
	account: InjectedAccountWithMeta;
	signer: Signer;
	api: ApiPromise;
}

export const AccountBox = ({ api, account, signer }: AccountBoxParams) => {
	const signMessageHandler = async (event: React.MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		const signRaw = signer?.signRaw;

		if (!!signRaw && account?.address) {
			const { signature } = await signRaw({
				address: account.address,
				data: "I am signing this message",
				type: "bytes",
			});
			console.log("Message signed:", signature);
		}
	};

	return (
		<div className="p-4 rounded-lg bg-white shadow-md">
			<div className="text-sm text-gray-600 mb-4">
				{shorten(account?.address)}
			</div>

			<NFTMinting api={api} account={account} signer={signer} />

			<div className="mt-4">
				<Button
					className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-md transition-colors"
					onClick={signMessageHandler}>
					Sign Message
				</Button>
			</div>
		</div>
	);
};
