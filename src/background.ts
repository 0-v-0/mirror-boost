chrome.action.onClicked.addListener(function () {
	// open or focus options page.
	const optionsUrl = chrome.runtime.getURL("options.html");
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

chrome.runtime.onMessage.addListener(function(request, _sender, sendResponse) {
	if (request.message === "update_rules") {
		const rule = request.rule;
		const ruleId = typeof rule === 'number' ? rule : rule.ruleId;
		try {
			chrome.declarativeNetRequest.updateDynamicRules(typeof rule === 'number' ? {
				addRules: [],
				removeRuleIds: [rule]
			} : {
				addRules: [rule],
				removeRuleIds: []
			}, () => {
				// send response back to sender; include lastError if any
				sendResponse({ ruleId, error: chrome.runtime.lastError })
			})
		} catch (err) {
			// ensure we always respond so the message port doesn't close unexpectedly
			sendResponse({ ruleId, error: err })
		}
		// return true to indicate we'll call sendResponse asynchronously
		return true;
	}
	if (request.message === "get_rules") {
		chrome.declarativeNetRequest.getDynamicRules((rules) => {
			sendResponse({ rules, error: chrome.runtime.lastError })
		})
		return true;
	}
	// sync handler: not handling other messages here
	return false;
});