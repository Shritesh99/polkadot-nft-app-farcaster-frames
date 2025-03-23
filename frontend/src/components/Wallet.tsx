import { memo, useContext, useEffect, useState } from "react";
import Image from "next/image";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { BaseWallet, Account } from "@polkadot-onboard/core";
import { AccountBox } from "./AccountBox";
import React from "react";
import { Button } from "./ui/Button";
import { ShowWalletsContext } from "./contexts/ShowWalletsContext";

const Wallet = ({ wallet }: { wallet: BaseWallet }) => {
	const [accounts, setAccounts] = useState<Account[]>([]);
	const [api, setApi] = useState<ApiPromise | null>(null);
	const [isBusy, setIsBusy] = useState<boolean>(false);
	const { setShowWallets } = useContext(ShowWalletsContext);

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
				setAccounts(accounts);
			} catch (error) {
				// handle error
			} finally {
				setIsBusy(false);
			}
		}
	};

	return (
		<div style={{ marginBottom: "20px" }} onClick={walletClickHandler}>
			<div>
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
			<div>
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
				{accounts.length > 0 && (
					<div className="mb-4">
						<Button
							onClick={(e) => {
								(async () =>
									await wallet.disconnect())();
								setShowWallets(false);
							}}>
							Disconnect
						</Button>
					</div>
				)}
			</div>
		</div>
	);
};

export default memo(Wallet);
