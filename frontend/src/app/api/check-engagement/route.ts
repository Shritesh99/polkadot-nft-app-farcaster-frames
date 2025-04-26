export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const fid = searchParams.get("fid");
	const castHash = searchParams.get("castHash");

	const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || "";
	const NEYNAR_API_URL =
		process.env.NEXT_PUBLIC_NEYNAR_API_URL ||
		"https://api.neynar.com/v2/farcaster/";

	try {
		if (!fid || !castHash) {
			return Response.json(
				{
					success: false,
					error: "FID and castHash parameters are required",
				},
				{ status: 400 }
			);
		}

		const url = `${NEYNAR_API_URL}cast?type=hash&identifier=${castHash}`;
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
		const cast = data.cast;
		console.log(cast);
		const hasLiked = cast.reactions.likes.some(
			(like: { fid: number }) => like.fid === Number(fid)
		);
		const hasRecasted = cast.reactions.recasts.some(
			(recast: { fid: number }) => recast.fid === Number(fid)
		);

		return Response.json({
			success: true,
			data: { hasLiked, hasRecasted },
		});
	} catch (error) {
		console.error("API error:", error);
		return Response.json(
			{ success: false, error: "Server error" },
			{ status: 500 }
		);
	}
}
