DEFAULT = {
	settings: {
		thresholdMs: 300,
		minSampleCount: 3,
		enableLogging: false,
		writeBatchMs: 30000,
		ttlMs: 7 * 24 * 60 * 60 * 1000, // 7 days
	},
	rules: '',
};

local = chrome.storage?.local

chromeGet = function <T = any>(key: string): Promise<T | undefined> {
	return new Promise((res) => {
		if (!local) return res(undefined);
		local.get(key, (items) => {
			res((items as any)[key]);
		});
	});
}
chromeSet = (obj: Record<string, any>): Promise<void> => {
	return new Promise((res) => {
		if (!local) return res();
		local.set(obj, () => res());
	});
}
