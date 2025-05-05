# Polkadot Farcaster Frames NFT Marketplace

> A Farcaster Frames-enabled NFT marketplace built on a Polkadot parachain.
>
> This project demonstrates how to integrate Farcaster Frames with a Polkadot parachain for social-driven NFT minting.

</div>

## Overview

This project showcases a complete NFT marketplace built on a Polkadot parachain with [Farcaster Frames v2 Mini App](https://miniapps.farcaster.xyz/) integration. The marketplace allows:

-    🖼️ Artists to create and manage NFT collections
-    🔄 Users to mint NFTs directly from Farcaster Frames
-    🔒 Social-gated minting that requires users to like and recast the original cast
-    🌐 Seamless integration between Farcaster's social layer and Polkadot's blockchain infrastructure

## Project Structure

The project consists of:

-    💿 **Parachain Node**: A Polkadot SDK-based parachain with custom pallets for NFT functionality
-    🧮 **Runtime**: Core blockchain logic including the NFT pallet
-    🎨 **Frontend**: Next.js application with Farcaster Frames Mini app
-    🔌 **Farcaster Integration**: API routes and utilities for verifying user engagement

### Build Your Parachain and Run Locally

We have used the [polkadot-sdk-parachain-template](https://github.com/paritytech/polkadot-sdk-parachain-template) for this demo app. This section provides instructions for building and running the parachain locally.

##### Prerequisites

-    [Rust](https://www.rust-lang.org/)
-    openssl
-    cmake
-    llvm
-    protobuf

##### 1. Build the Node

```bash
# Build the node with release optimizations
cargo build --release
```

The build process takes some time. When complete, the binary will be available at `./target/release/parachain-template-node`.

##### 2. Run a Development Chain

You can start a development chain with:

```bash
./target/release/parachain-template-node --dev
```

This command:

-    Runs a temporary node in development mode
-    Purges the development chain state on exit
-    Uses Alice and Bob as pre-funded development accounts
-    Has no external connections to other networks

Additional useful flags:

-    `--alice`: Includes the pre-defined Alice key in the node's keystore
-    `--tmp`: Runs a temporary node (state is not saved to disk)
-    `-d <path>`: Specifies the directory for storing chain data

##### 3. Connect to the Local Node

Once your node is running, you can interact with it using:

-    [Polkadot.js Apps UI](https://polkadot.js.org/apps/?rpc=ws%3A%2F%2F127.0.0.1%3A9944#/explorer)  
     (Pre-configured for a local node on default ports)

-    Command-line tools (using `curl` to make RPC calls)

##### 4. Modify the Runtime

When making changes to the runtime:

1. Edit the runtime code
2. Rebuild the runtime: `cargo build --release -p parachain-template-runtime`
3. Restart your node to apply the changes

##### 5. Connect to a Relay Chain (Optional)

For testing as a parachain:

1. Build the Polkadot relay chain: `cargo build --release`
2. Follow the [Cumulus Workshop](https://docs.substrate.io/tutorials/build-a-parachain/) for connecting your parachain to a local relay chain

## Connecting Farcaster Frames to Your Parachain

### Wallet Integration

The project supports integration with both Polkadot.js Extension and WalletConnect for seamless user authentication and transaction signing. However, the web extenssion support is not available in Farcaster Frames mini app, so user need to use the Walletconnect only to connect to wallets like [Subwallet](https://www.subwallet.app/) or [Nova Wallet](https://novawallet.io/). Make sure you add your node rpc URL as custom network in these wallets.

### Setting up Wallet Integration

This project uses the [`@polkadot-onboard`](https://www.npmjs.com/package/@polkadot-onboard/react) packages to provide a unified wallet connection experience. The setup is handled by the `PolkadotProvider` component.

#### Wallet Provider Implementation

Check out `frontend/src/components/PolkadotProvider.tsx` for full Polkadot <-> Walletconnect integration.

<details>
     <summary>frontend/src/components/PolkadotProvider.tsx</summary>

```tsx
// frontend/src/components/PolkadotProvider.tsx

export default function Provider({ children }: { children: React.ReactNode }) {
	// Configure injected wallets (browser extensions)
	// Configure WalletConnect
	const walletConnectParams: WalletConnectConfiguration = {
		projectId: process.env.NEXT_PUBLIC_APPKIT_PROJECT_ID!,
		metadata: {
			name: "Polkadot Demo",
			description: "Polkadot Demo",
			url: "",
			icons: ["Wallet_Connect.svg"],
		},
		chainIds: [
			"polkadot:e143f23803ac50e8f6f8e62695d1ce9e", // Rococo
			"polkadot:91b171bb158e2d3848fa23a9f1c25182", // Polkadot
			`polkadot:${process.env.NEXT_PUBLIC_LOCAL_NODE_CAPID!}`, // Local node
		],
		optionalChainIds: [
			"polkadot:67f9723393ef76214df0118c34bbbd3d", // Westend
			"polkadot:7c34d42fc815d392057c78b49f2755c7", // Kusama
		],
		onSessionDelete: () => {
			// do something when session is removed
		},
	};

	const walletConnectProvider = new WalletConnectProvider(
		walletConnectParams,
		process.env.NEXT_PUBLIC_APP_NAME!
	);

	// Combine all wallet providers
	const walletAggregator = new WalletAggregator([
		walletConnectProvider,
		// Other Wallet Providers
		// ...
	]);

	return (
		<PolkadotWalletsContextProvider walletAggregator={walletAggregator}>
			{children}
		</PolkadotWalletsContextProvider>
	);
}
```

</details>

#### Environment Variables

Ensure these environment variables are set in your `.env.local` file:

-    `NEXT_PUBLIC_APP_NAME`: YourAppName
-    `NEXT_PUBLIC_APPKIT_PROJECT_ID`: YourWalletConnectProjectID
-    `NEXT_PUBLIC_LOCAL_NODE_CAPID`: YourLocalNodeChainId

To get a WalletConnect Project ID, register your application at [WalletConnect Cloud](https://cloud.walletconnect.com/).

#### Customizing Chain IDs

The `chainIds` array in the WalletConnect configuration specifies which networks your application supports. The format follows the [CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md) standard:

```
polkadot:{chain-id-in-hex}
```

Common Polkadot ecosystem chain IDs:

-    Polkadot: `polkadot:91b171bb158e2d3848fa23a9f1c25182`
-    Kusama: `polkadot:7c34d42fc815d392057c78b49f2755c7`
-    Rococo: `polkadot:e143f23803ac50e8f6f8e62695d1ce9e`
-    Westend: `polkadot:67f9723393ef76214df0118c34bbbd3d`

For your local node, you'll need to get the genesis hash and convert it to the CAIP format.

### How Farcaster Frames Integration Works?

Farcaster Frames allows web applications to be embedded within the Farcaster client (like Warpcast), enabling interactive experiences directly in the social feed. This project demonstrates how to connect Farcaster Frames to a Polkadot parachain for NFT minting.

##### 1. Frame Configuration

The integration starts in the frontend's layout component (`frontend/src/app/layout.tsx`), where we define the Frame metadata:

<details>
     <summary>frontend/src/app/layout.tsx</summary>

```tsx
<head>
	<meta
		name="fc:frame"
		content={JSON.stringify({
			version: "next",
			imageUrl: `${process.env.NEXT_PUBLIC_URL}/Intercaster.png`,
			button: {
				title: "Mint NFT in Polkadot",
				action: {
					type: "launch_frame",
					name: "Mint NFT in Polkadot",
					url: `${process.env.NEXT_PUBLIC_URL}`,
					splashBackgroundColor: "#f5f5f5",
				},
			},
		})}
	/>
</head>
```

</details>

This metadata defines:

-    The image displayed in the Farcaster client
-    The button text and action (launching the full application)
-    The URL to your deployed application

##### 2. User Context and Verification

When a user interacts with your Frame, the application receives context about the user and their interaction:

<details>
     <summary>frontend/src/app/page.tsx</summary>

```tsx
// In frontend/src/app/page.tsx
useEffect(() => {
	const load = async () => {
		setIsLoading(true);
		try {
			await sdk.actions.ready();
			const context = await sdk.context;
			setUserContext(context as unknown as FrameContext);

			if (context?.user?.fid) {
				await verifyUser(context.user.fid as unknown as string);
			}
		} catch (error) {
			console.error("Error loading user context:", error);
		} finally {
			setIsLoading(false);
		}
	};
	load();
}, []);
```

</details>

##### 3. Engagement Verification for NFT Minting

The key feature of this application is that users can only mint NFTs if they have liked and recasted the original cast:

<details>
     <summary>frontend/src/components/NFTMarketplace.tsx</summary>

```tsx
// In frontend/src/components/NFTMarketplace.tsx
const checkEngagement = async () => {
  if (!castHash || !fid) {
    toast.error("Missing cast hash or FID");
    return false;
  }

  try {
    setIsCheckingEngagement(true);
    const engagement = await checkUserEngagement(fid, castHash);

    if (!engagement.hasLiked || !engagement.hasRecasted) {
      toast.error("Please like and recast the post to mint NFT");
      return false;
    }

    return true;
  } catch (error) {
    toast.error("Failed to check engagement with error: " + error);
    return false;
  } finally {
    setIsCheckingEngagement(false);
  }
};

const mintNft = async (collectionId: number, itemId: number) => {
  // ...
  try {
    if (fid) {
      await verifyUser(fid);

      const isEngaged = await checkEngagement();
      if (!isEngaged) {
        setIsLoading(false);
        return;
      }
    }

    // Proceed with blockchain transaction
    // ...
  }
  // ...
};
```

</details>

### Setting Up Your Own Integration

To connect your own Farcaster Frames to a Polkadot parachain:

##### 1. **Create API Routes for Farcaster Verification**:

We have used [Neynar](https://docs.neynar.com/reference/quickstart) to interact with the Farcaster Ecosystem, the following API calls given the following files calls the third-party Neynar APIs to get the Frarcaster data. Check out the implementation in the follwing files:

-    `frontend/src/app/api/verify-user/route.ts` to validate Farcaster user identity
-    `frontend/src/app/api/check-engagement/route.ts` to verify likes and recasts
-    `frontend/src/app/api/cast-details/route.ts` to fetch information about a cast

##### 2. **Configure Frame Metadata**:

-    Add the `fc:frame` meta tag to your application's head
-    Customize the button text and action to match your application

##### 3. **Handle User Context**:

-    Use the Farcaster Frame SDK to access user context
-    Verify user identity and engagement before allowing NFT minting

##### 4. **Connect to Polkadot**:

-    Use the Polkadot.js API to interact with your parachain
-    Implement wallet connection and transaction signing

## Parachain Deployment in Kubernetes

This section provides instructions for deploying the parachain in a Kubernetes environment.

### Prerequisites

-    Kubernetes cluster (e.g., GKE, EKS, AKS, or local Minikube)
-    Helm 3 installed
-    `kubectl` configured to communicate with your cluster
-    Docker images for your parachain node

### Reserve a Parachain Identifier

You must reserve a parachain identifier (ID) before registering your parachain on your relay chain. You'll be assigned the next available identifier.

To reserve a parachain identifier, follow these steps:

##### 1. Navigate to the Parachains section

-    Click on the Network tab in the top menu
-    Select the Parachains option from the dropdown menu

##### 2. Register a ParaId

-    Select the Parathreads tab
-    Click on the + ParaId button

##### 3. Review the transaction and click on the + Submit button

##### 4. After submitting the transaction, you can navigate to the Explorer tab and check the list of recent events for successful registrar.Reserved

### Pre-deployment Steps

##### 1. **Generate parachain private keys**

-    Generate static node keys (aka network keys)
     Node keys are used to identify nodes on the P2P network with a unique PeerID. To ensure this identifier persists across restarts, it is highly recommended to generate a static network key for all nodes. This practice is particularly important for bootnodes, which have publicly listed addresses that are used by other nodes to bootstrap their connections to the network.

     To generate a static node key:

     ```sh
     docker run parity/subkey:latest generate-node-key
     ```

-    Generate keys for your collators (account+aura keys)
     For parachains using the collatorSelection pallet to manage their collator set, you will need to generate a set of keys for each collator:

     -    Collator Account: a regular substrate account
     -    Aura keys (part of the collator "session keys")

     To perform this step, you can use subkey, a command-line tool for generating and managing keys:

     ```sh
     docker run -it parity/subkey:latest generate --scheme sr25519
     ```

##### 2. **Prepare your genesis patch config**

Save the following to genesis.patch.json (replace keys and configuration with your own):

<details>
     <summary>genesis.patch.json</summary>

```
{
     "balances":
          {
               "balances":
                    [
                         [
                              "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
                              1152921504606846976,
                         ],
                         [
                              "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
                              1152921504606846976,
                         ],
                    ],
          },
     "collatorSelection":
          {
               "candidacyBond": 16000000000,
               "invulnerables":
                    [
                         "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
                         "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
                    ],
          },
     "session":
          {
               "keys":
                    [
                         [
                              "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
                              "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
                              {
                                   "aura": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
                              },
                         ],
                         [
                              "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
                              "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
                              {
                                   "aura": "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
                              },
                         ],
                    ],
          },
     "parachainInfo": { "parachainId": 4435 },
     "polkadotXcm": { "safeXcmVersion": 4 },
     "sudo": { "key": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY" },
}
```

In this example:

-    balances: initial account balances
-    collatorSelection: configure the collatorSelection pallet - properties, in this example we set Alice and Bob as initial - invulnerable collators.
-    session.keys: initial session keys
-    parachainInfo.parachainId: parachain ID
-    sudo.keys: initial sudo key account

Note that:

-    5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY: Alice's account address
-    5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty: Bob's account address

</details>

##### 3. **Prepare the Chainsepc**

Generate the plain chain spec, make sure to change to your relay chain and parachin id

```sh
chain-spec-builder --chain-spec-path ./chain-spec/chainspec.plain.json create --chain-name "polkadot-nft-farcaster-frames" --chain-id polkadot-nft-farcaster-frames -t live --relay-chain paseo --para-id 4793 --runtime target/release/wbuild/polkadot-nft-farcaster-frames-runtime/polkadot_nft_farcaster_frames_runtime.compact.compressed.wasm patch ./chain-spec/genesis.patch.json
```

To initialize the genesis storage for your chain, you need convert your chainspec from plain to raw format. This process transforms the human-readable keys in the plain chainspec into actual storage keys and defines a unique genesis block.

```sh
chain-spec-builder --chain-spec-path ./chain-spec/chainspec.raw.json convert-to-raw ./chain-spec/chainspec.plain.json
```

##### 4. **Register and activate your Parachain on the Relaychain**

-    Register parachain genesis code and state on relay-chain

     -    Export the genesis state:

     ```sh
     ./target/release/parachain-template-node export-genesis-state --chain ./chain-spec/chainspec.raw.json ./chain-spec/para-state
     ```

     -    Export the genesis runtime:

     ```sh
     ./target/release/parachain-template-node export-genesis-wasm --chain ./chain-spec/chainspec.raw.json ./chain-spec/para-wasm
     ```

     -    Register your parachain genesis configuration on the relay-chain by executing the registrar.register extrinsic on Paseo:
          -    id: your parachain ID
          -    genesisHead: select the `para-state` file
          -    validationCode: select the `para-wasm` file

### Deployment Steps

##### 1. **Add Helm Charts**

```sh
helm repo add parity https://paritytech.github.io/helm-charts/
```

##### 2. **Prepare Configuration**

The deployment uses Helm charts for managing the Kubernetes resources. Configuration files are located in the `k8s` directory.

```sh
# Review the configuration before deployment
cat k8s/polkadot-node-deployment.yaml
```

##### 3. **Deploy Using Helm**

Deploy the parachain node using the Parity Helm chart:

```sh
helm -n default upgrade --install polkadot-nft-parachain -f k8s/polkadot-node-deployment.yaml parity/node
```

##### 4. **Verify Deployment**

Check that the pods are running correctly:

```sh
kubectl get pods -n default -l app=polkadot-nft-parachain
```

##### 5. **Access the Node**

The deployment exposes RPC endpoints that can be accessed within the cluster or externally depending on your configuration:

```sh
# Get service details
kubectl get svc -n default -l app=polkadot-nft-parachain
```

##### 6. **Monitor Logs**

Monitor the node logs for any issues:

```sh
kubectl logs -n default -l app=polkadot-nft-parachain -f
```

##### 7. Obtain on-demand coretime to produce your first block

Execute extrinsic on your relay chain: `onDemandAssignmentProvider.placeOrderAllowDeath ` or `onDemandAssignmentProvider.placeOrderKeepAlive`:

-    maxAmount: 10000000000000 (13 zeros, ie. 10 ROC)
-    paraId: your parachain ID

After executing this, you should have successfully produced your first block !

```sh
INFO tokio-runtime-worker substrate: [Parachain] ✨ Imported #1 (0xa075…10d6)
```

### Configuration Options

The `k8s/polkadot-node-deployment.yaml` file contains various configuration options:

-    Node type (validator, collator)
-    Resource limits and requests
-    Persistent storage configuration
-    Network settings
-    Chain specification

Modify these settings according to your deployment requirements.

## Frontend Deployment

To deploy the Farcaster Frames-enabled frontend:

##### 1. **Build the frontend**:

```sh
cd frontend
yarn install
yarn build
```

##### 2. **Deploy to your hosting provider** (e.g., Vercel, Netlify, or your own server)

##### 3. **Configure environment variables**:

-    `NEXT_PUBLIC_URL`: URL for the Farcaster Frames Mini App, can be a vercel hosted URL.
-    `NEXT_PUBLIC_LOCAL_NODE_URL`: WebSocket URL of your parachain node
-    `NEXT_PUBLIC_LOCAL_NODE_CAPID`: [CAIP for the WalletConnect as it uses chain ids based on the CAIP standard](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-13.md)
-    `NEXT_PUBLIC_APP_NAME`: Name of your application
-    `NEXT_PUBLIC_APPKIT_PROJECT_ID`: Your WalletConnect project ID
-    `NEXT_PUBLIC_NEYNAR_API_URL`: We have used [Neynar](https://docs.neynar.com/reference/quickstart) an an independent 3rd party provider that offers Farcaster data
-    `NEYNAR_API_KEY`: Neynar API key to call REST APIs.

##### 4. **Update the Frame metadata** in `frontend/src/app/layout.tsx` with your deployed URL

### Publishing Your Farcaster Frame

To properly publish your Farcaster Frame and make it discoverable in the Farcaster ecosystem, follow these steps:

##### 1. Set Up Domain Verification

Create a `.well-known/farcaster.json` file in your public directory with the following structure:

```json
{
	"accountAssociation": {
		"header": "YOUR_HEADER",
		"payload": "YOUR_PAYLOAD",
		"signature": "YOUR_SIGNATURE"
	},
	"frame": {
		"name": "Polkadot NFT Demo",
		"version": "1",
		"iconUrl": "https://your-domain.com/logo.png",
		"homeUrl": "https://your-domain.com/",
		"buttonTitle": "Polkadot NFT",
		"splashBackgroundColor": "#f5f5f5"
	}
}
```

##### 2. Generate Account Association Credentials

To generate the `header`, `payload`, and `signature` values:

1. Go to [Farcaster Developer Hub](https://warpcast.com/~/developers)
2. Navigate to the "Domains" section
3. Click "Add Domain" and follow the instructions to verify your domain
4. Copy the generated values into your `farcaster.json` file

##### 3. Configure Frame Metadata

The `frame` section in your `farcaster.json` file defines how your Frame appears in Farcaster clients:

-    `name`: The display name of your Frame
-    `version`: The Frame version (currently "1")
-    `iconUrl`: URL to your Frame's icon (must be hosted on your domain)
-    `homeUrl`: The main URL of your Frame
-    `buttonTitle`: Text displayed on the Frame button
-    `splashBackgroundColor`: Background color when loading your Frame

##### 4. Test Your Frame

Before publishing, test your Frame using:

1. [Frames.js Debugger](https://debugger.framesjs.org/)
2. [Warpcast Embed Tool](https://warpcast.com/~/developers/mini-apps/embed)

##### 5. Publish Your Frame

Once tested, you can publish your Frame by:

1. Creating a cast with your Frame URL on [Warpcast](https://warpcast.com/~/compose)
2. Sharing the cast with your audience
3. Monitoring engagement through likes, recasts, and mints

## Contributing

-    🔄 This project welcomes contributions and suggestions.

-    😇 Please refer to the project's contribution guidelines and Code of Conduct.

## Getting Help

-    🧑‍🏫 To learn about Polkadot in general, [Polkadot.network](https://polkadot.network/) website is a good starting point.

-    🧑‍🔧 For technical introduction, [here](https://github.com/paritytech/polkadot-sdk#-documentation) are
     the Polkadot SDK documentation resources.

-    👥 For Farcaster Frames documentation, visit [Farcaster's documentation](https://docs.farcaster.xyz/reference/frames/spec).
