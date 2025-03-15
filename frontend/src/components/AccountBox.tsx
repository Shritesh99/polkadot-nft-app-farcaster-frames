import React from "react";

const shorten = (str: string) => {
	let size = 10;
	let result = str;
	if (str && str.length > 2 * size) {
		let start = str.slice(0, size);
		let end = str.slice(-size);
		result = `${start}...${end}`;
	}
	return result;
};

interface AccountBoxParams {
	account: { address: string; name: string };
	signer: any;
	api: any;
}

export const AccountBox = ({ api, account, signer }: AccountBoxParams) => {
	const signTransactionHandler = async (event: any) => {
		event.preventDefault();
		event.stopPropagation();
		if (api && account?.address && signer) {
			const decimals = api.registry.chainDecimals[0];

			await api.tx.system
				.remark("I am signing this transaction!")
				.signAndSend(account.address, { signer }, () => {
					// do something with result
				});
		}
	};
	const signMessageHandler = async (event: any) => {
		event.preventDefault();
		event.stopPropagation();
		const signRaw = signer?.signRaw;

		if (!!signRaw && account?.address) {
			const { signature } = await signRaw({
				address: account.address,
				data: "I am signing this message",
				type: "bytes",
			});
		}
	};

	return (
		<div className={``}>
			<div className={``}>{shorten(account?.name)}</div>
			<div className={``}>{shorten(account?.address)}</div>
			<div className={``}>
				<button
					className={``}
					onClick={(e) => signTransactionHandler(e)}>
					Submit Transaction
				</button>
				<button
					className={``}
					onClick={(e) => signMessageHandler(e)}>
					Sign Message
				</button>
			</div>
		</div>
	);
};
