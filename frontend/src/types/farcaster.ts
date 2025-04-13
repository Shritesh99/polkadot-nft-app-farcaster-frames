export interface FrameContext {
	user: {
		fid: number;
		username?: string;
		displayName?: string;
		pfpUrl?: string;
	};
	location?: {
		type: string;
		cast?: {
			hash: string;
			fid: number;
		};
	};
	client: {
		clientFid: number;
		added: boolean;
		safeAreaInsets?: {
			top: number;
			bottom: number;
			left: number;
			right: number;
		};
	};
}
