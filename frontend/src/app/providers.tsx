"use client";
import dynamic from "next/dynamic";
import React from "react";
import Provider from "../components/PolkadotProvider";

export function Providers({ children }: { children: React.ReactNode }) {
	return <Provider>{children}</Provider>;
}
