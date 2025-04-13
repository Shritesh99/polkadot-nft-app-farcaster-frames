export async function verifyUser(fid: string) {
	try {
		const response = await fetch(`/api/verify-user?fid=${fid}`);
		const data = await response.json();
		if (!data.success) {
			throw new Error(data.error);
		}
		return data.data;
	} catch (error) {
		console.error("Error verifying user:", error);
		throw error;
	}
}

export async function checkUserEngagement(fid: string, castHash: string) {
	try {
		const response = await fetch(
			`/api/check-engagement?fid=${fid}&castHash=${castHash}`
		);
		const data = await response.json();
		if (!data.success) {
			throw new Error(data.error);
		}
		return data.data;
	} catch (error) {
		console.error("Error checking user engagement:", error);
		throw error;
	}
}

export async function getCastDetails(castHash: string) {
	try {
		const response = await fetch(
			`/api/cast-details?castHash=${castHash}`
		);
		const data = await response.json();
		if (!data.success) {
			throw new Error(data.error);
		}
		return data.data;
	} catch (error) {
		console.error("Error getting cast details:", error);
		throw error;
	}
}
