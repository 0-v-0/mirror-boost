import { Config } from './types'

chromeGet<Config>('settings').then((cfg = DEFAULT.settings) => {
    chrome.runtime.sendMessage({
        message: 'clear_expired',
        config: cfg,
    });
});