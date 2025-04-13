export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const fid = searchParams.get("fid");

	const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || "";
	const NEYNAR_API_URL =
		process.env.NEYNAR_API_URL || "https://api.neynar.com/v2/farcaster/";

	try {
		if (!fid) {
			return Response.json(
				{ success: false, error: "FID parameter is required" },
				{ status: 400 }
			);
		}

		const url = `${NEYNAR_API_URL}user/bulk?fids=${fid}`;
		const options = {
			method: "GET",
			headers: {
				accept: "application/json",
				"x-neynar-experimental": "false",
				"x-api-key": NEYNAR_API_KEY,
			},
		};

		const response = await fetch(url, options);
		const data = await response.json();
		return Response.json({ success: true, data });
	} catch (error) {
		console.error("API error:", error);
		return Response.json(
			{ success: false, error: "Server error" },
			{ status: 500 }
		);
	}
}
