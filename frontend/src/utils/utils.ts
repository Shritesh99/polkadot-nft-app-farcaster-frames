export const decodeMetadata = (metadataBytes: string): string => {
	try {
		// Remove 0x prefix if present and convert bytes to string, filtering out null bytes
		const hexString = metadataBytes.replace(/^0x/, "");
		const filteredBytes =
			hexString
				.match(/.{1,2}/g)
				?.map((byte) => parseInt(byte, 16))
				.filter((byte) => byte !== 0) || [];
		return String.fromCharCode(...filteredBytes);
	} catch (error) {
		console.error("Failed to decode metadata:", error);
		return "";
	}
};
