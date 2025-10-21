import { Config } from './types'

chromeGet<Config>('settings').then((cfg = DEFAULT.settings) => {
    chrome.runtime.sendMessage({
        action: 'clear_expired',
        config: cfg,
    });
});