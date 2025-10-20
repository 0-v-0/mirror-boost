export const sendMsg = (msg: any) => new Promise<any>((res, rej) => {
	chrome.runtime.sendMessage(msg, (resp) => {
		const err = chrome.runtime.lastError || resp?.error;
		if (err) return rej(err);
		res(resp);
	});
});
