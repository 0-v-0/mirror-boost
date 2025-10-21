import { Aggregator } from './aggregator';
import { storage } from './storage';
import { Config } from './types';
import { Message } from './util';

chrome.action.onClicked.addListener(function () {
	// open or focus options page.
	const optionsUrl = chrome.runtime.getURL('options.html');
	chrome.tabs.query({}, function (extensionTabs) {
		for (let i = 0, len = extensionTabs.length; i < len; i++) {
			if (optionsUrl === extensionTabs[i].url) {
				chrome.tabs.update(extensionTabs[i].id, { selected: true });
				return;
			}
		}
		chrome.tabs.create({ url: optionsUrl });
	});
});

// Helper: simple match check against a rule's condition.urlFilter
const urlMatches = (url: string, urlFilter?: string) => {
	if (!urlFilter) return false;
	// Many rules use urlFilter as a substring or pattern. For safety,
	// treat urlFilter as either an exact match or a substring.
	if (typeof urlFilter === 'string') {
		if (url.includes(urlFilter)) return true;
	}
	return false;
}
const local = chrome.storage?.local

function chromeGet<T = any>(key: string): Promise<T | undefined> {
	return new Promise((res) => {
		if (!local) return res(undefined);
		local.get(key, (items) => {
			res((items as any)[key]);
		});
	});
}

chrome.runtime.onStartup.addListener(async () => {
	const cfg = await chromeGet<chrome.declarativeNetRequest.Rule[]>('rules')
	if (cfg?.length) {
		chrome.declarativeNetRequest.updateDynamicRules({
			addRules: cfg,
			removeRuleIds: []
		}, () => {
			/* ignore */
		});
	}
});

chrome.runtime.onMessage.addListener(function (request: Message, _sender, sendResponse) {
	if (request.action === 'update_rules') {
		const rule = request.addRule;
		// If the request is to add a rule (object), check whether the new rule's
		// redirect target would itself be matched by any existing dynamic rule.
		if (rule?.action?.redirect?.url) {
			const ruleId = rule.id;
			const newTarget: string = rule.action.redirect.url;
			// Fetch existing dynamic rules to check for conflicts
			chrome.declarativeNetRequest.getDynamicRules((existingRules = []) => {
				const err = chrome.runtime.lastError;
				if (err) {
					// forward getDynamicRules error
					sendResponse({ ruleId, error: err });
					return;
				}
				const ids = request.removeRuleIds || [];
				// Iterate existing rules and see if any would match newTarget
				for (const r of existingRules) {
					if (r.condition) {
						if (r.condition.urlFilter === rule.condition.urlFilter) {
							return;
						}
						if (urlMatches(newTarget, r.condition.urlFilter)) {
							// Found an existing rule that would redirect the new target.
							//sendResponse({ ruleId, error: { action: 'redirect_target_conflict', details: { existingRuleId: r.id, existingRule: r } } });
							//return;
							ids.push(r.id);
						}
					}
				}
				try {
					chrome.declarativeNetRequest.updateDynamicRules({ addRules: [rule], removeRuleIds: ids }, () => {
						sendResponse({ ruleId, error: chrome.runtime.lastError })
					})
				} catch (err) {
					sendResponse({ ruleId, error: err })
				}
			})
			// indicate we will call sendResponse asynchronously
			return true;
		}
		const ruleIds = request.removeRuleIds;
		// If it's a remove (number) or other operation, fall back to previous behavior
		try {
			chrome.declarativeNetRequest.updateDynamicRules({
				addRules: [],
				removeRuleIds: ruleIds
			}, () => {
				sendResponse({ ruleIds, error: chrome.runtime.lastError })
			})
		} catch (err) {
			sendResponse({ ruleIds, error: err })
		}
		return true;
	}
	if (request.action === 'get_rules') {
		chrome.declarativeNetRequest.getDynamicRules((rules) => {
			sendResponse({ rules, error: chrome.runtime.lastError })
		})
		return true;
	}
	if (request.action === 'aggregate') {
		const aggregator = new Aggregator(request.config)
		aggregator.aggregate(request.samples);
		sendResponse({});
		return true;
	}
	if (request.action === 'clear_expired') {
		const config = request.config;
		const aggregator = new Aggregator(config)
		aggregator.clearExpired(config.ttlMs).then(() => {
			sendResponse({});
		});
		return true;
	}
	if (request.action === 'get_integrity') {
		storage.getIntegrity(request.key).then((map) => {
			sendResponse({ urls: map?.urls });
		});
		return true;
	}
	if (request.action === 'clear_db') {
		storage.clear().then(() => {
			sendResponse({});
		});
	}
	return false;
});