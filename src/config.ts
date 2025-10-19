DEFAULT = {
	settings: {
		thresholdMs: 300,
		minSampleCount: 3,
		enableLogging: false,
		writeBatchMs: 30000,
	},
	mirrors: [],
};

local = chrome.storage?.local

function chromeGet<T = any>(key: string): Promise<T | undefined> {
	return new Promise((res) => {
		if (!local) return res(undefined);
		local.get(key, (items) => {
			res((items as any)[key]);
		});
	});
}
function chromeSet(obj: Record<string, any>): Promise<void> {
	return new Promise((res) => {
		if (!local) return res();
		local.set(obj, () => res());
	});
}
