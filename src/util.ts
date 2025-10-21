import { Config, Sample } from './types';

export type Message = {
	action: 'get_rules'
} | {
	action: 'update_rules'
	addRule?: chrome.declarativeNetRequest.Rule
	removeRuleIds?: number[]
} | {
	action: 'get_integrity'
	key: string
} | {
	action: 'aggregate'
	samples: Sample[]
	config: Config
} | {
	action: 'clear_expired'
	ttlMs: number
	config: Config
} | {
	action: 'clear_db'
}

export const sendMsg = (msg: Message) => new Promise<any>((res, rej) => {
	chrome.runtime.sendMessage(msg, (resp) => {
		const err = chrome.runtime.lastError || resp?.error;
		if (err) return rej(err);
		res(resp);
	});
});
