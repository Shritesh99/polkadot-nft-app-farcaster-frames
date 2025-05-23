"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import React from "react";
import PolkadotProvider from "../components/PolkadotProvider";
import { ChainProvider } from "../contexts/ChainContext";
import { WalletProvider } from "../contexts/WalletContext";
import Provider from "../components/PolkadotProvider";
const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
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
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<PolkadotProvider>
					<ChainProvider>
						<WalletProvider>
							<Provider>{children}</Provider>
						</WalletProvider>
					</ChainProvider>
				</PolkadotProvider>
			</body>
		</html>
	);
}
