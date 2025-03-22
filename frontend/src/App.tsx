import React from "react";
import { ChainProvider } from "./contexts/ChainContext";
import { WalletProvider } from "./contexts/WalletContext";
import { ChainStatus } from "./components/ChainStatus";
import { WalletStatus } from "./components/WalletStatus";
import { AccountBox } from "./components/AccountBox";
import { useChain } from "./contexts/ChainContext";
import { useWallet } from "./contexts/WalletContext";
import PolkadotProvider from "./components/PolkadotProvider";

// Wrap the main content in a component that uses both contexts
const MainContent: React.FC = () => {
	const { api } = useChain();
	const { selectedAccount, signer } = useWallet();

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="grid gap-6">
				<ChainStatus />
				<WalletStatus />
				{api && selectedAccount && signer && (
					<AccountBox
						api={api}
						account={selectedAccount}
						signer={signer}
					/>
				)}
			</div>
		</div>
	);
};

const App: React.FC = () => {
	return (
		<PolkadotProvider>
			<ChainProvider>
				<WalletProvider>
					<MainContent />
				</WalletProvider>
			</ChainProvider>
		</PolkadotProvider>
	);
};

export default App;
