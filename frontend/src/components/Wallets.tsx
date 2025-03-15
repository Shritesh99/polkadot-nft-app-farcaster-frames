import { memo } from "react";
import { useWallets } from "@polkadot-onboard/react";
import { BaseWallet } from "@polkadot-onboard/core";
import Wallet from "./Wallet";
import React from "react";

const Wallets = () => {
	const { wallets } = useWallets();

	if (!Array.isArray(wallets)) {
		return null;
	}

	return (
		<div>
			{wallets.map((wallet: BaseWallet) => (
				<Wallet key={wallet.metadata.title} wallet={wallet} />
			))}
		</div>
	);
};

export default memo(Wallets);
