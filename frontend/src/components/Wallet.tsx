import { memo, useEffect, useState } from "react";
import Image from "next/image";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { BaseWallet, Account } from "@polkadot-onboard/core";
import { AccountBox } from "./AccountBox";
import React from "react";

const Wallet = ({ wallet }: { wallet: BaseWallet }) => {
	const [accounts, setAccounts] = useState<Account[]>([]);
	const [api, setApi] = useState<ApiPromise | null>(null);
	const [isBusy, setIsBusy] = useState<boolean>(false);

	useEffect(() => {
		const setupApi = async () => {
			const provider = new WsProvider("wss://westend-rpc.polkadot.io");
			const api = await ApiPromise.create({ provider });

			setApi(api);
		};

		setupApi();
	}, []);

	const walletClickHandler = async (event: React.MouseEvent) => {
		console.log(`wallet clicked!`);
		if (!isBusy) {
			try {
				setIsBusy(true);
				await wallet.connect();
				let accounts = await wallet.getAccounts();
				console.log(accounts);
				setAccounts(accounts);
			} catch (error) {
				// handle error
			} finally {
				setIsBusy(false);
			}
		}
	};

	return (
		<div
			className={``}
			style={{ marginBottom: "20px" }}
			onClick={walletClickHandler}>
			<div className={``}>
				<div
					style={{
						margin: 5,
						display: "flex",
						alignItems: "center",
					}}>
					{wallet?.metadata?.iconUrl && (
						<Image
							width={45}
							height={45}
							src={wallet.metadata.iconUrl}
							alt="wallet icon"
						/>
					)}
				</div>
				<div>{`${wallet.metadata.title} ${
					wallet.metadata.version || ""
				}`}</div>
			</div>
			<div className={``}>
				{accounts.length > 0 &&
					accounts.map(({ address, name = "" }) => (
						<div key={address}>
							<AccountBox
								api={api}
								account={{ address, name }}
								signer={wallet.signer}
							/>
						</div>
					))}
			</div>
		</div>
	);
};

export default memo(Wallet);
