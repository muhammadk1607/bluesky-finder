// @ts-check

/*
 * This script runs in the background and listens for tab updates.
 * It checks if the current tab has a _atproto TXT record and updates the icon accordingly.
 * If the icon is clicked, it opens the Bluesky profile for the domain.
 */

/// <reference types="chrome" />

/**
 * @typedef {string & { _brand: "domain" }} Domain
 */

/**
 * The getDomain function extracts the root domain from a URL.
 * For example, it returns "example.com" for "https://www.example.com/page".
 * @param {string} url - The URL to extract the domain from.
 * @returns {Domain | null} The root domain or null if the URL is invalid.
 */
function getDomain(url) {
	try {
		const hostname = new URL(url).hostname;

		// Remove any subdomains and return the root domain
		const parts = hostname.split(".");

		if (parts.length <= 2) {
			return /** @type {Domain} */ (hostname);
		}
		return /** @type {Domain} */ (parts.slice(-2).join("."));
	} catch {
		return null;
	}
}

/**
 * Test if a domain has a _atproto TXT record.
 * @param {Domain} domain - The domain to check for a _atproto TXT record.
 * @returns {Promise<boolean>} True if the domain has a _atproto TXT record, false otherwise.
 */
async function checkAtprotoRecord(domain) {
	try {
		const response = await fetch(
			`https://dns.google/resolve?name=_atproto.${domain}&type=TXT`
		);
		const data = await response.json();
		const answer = data.Answer && data.Answer[0];
		console.log(answer);
		return Boolean(answer && answer.type === 16);
	} catch {
		return false;
	}
}

/**
 * Update the action icon based on the presence of a _atproto TXT record.
 * @param {number} tabId - The ID of the tab to update the icon for.
 * @param {boolean} hasRecord - True if the domain has a _atproto TXT record, false otherwise.
 */
async function updateIcon(tabId, hasRecord) {
	const iconPrefix = hasRecord ? "logo" : "logo-off";
	await chrome.action.setIcon({
		tabId,
		path: {
			16: `icons/${iconPrefix}-16.png`,
			32: `icons/${iconPrefix}-32.png`,
			48: `icons/${iconPrefix}-48.png`,
			128: `icons/${iconPrefix}-128.png`,
		},
	});
}

// Handle tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
	if (tab.url && changeInfo.status === "complete") {
		const domain = getDomain(tab.url);
		if (domain) {
			const storedRecord = await chrome.storage.local.get(domain);

			const hasRecord = storedRecord[domain]
				? true
				: await checkAtprotoRecord(domain);

			await updateIcon(tabId, hasRecord);

			// Store the result for this domain, so we can avoid checking it again
			chrome.storage.local.set({ [domain]: hasRecord });
		}
	}
});

// Handle icon clicks
chrome.action.onClicked.addListener(async (tab) => {
	if (!tab.url) return;

	const domain = getDomain(tab.url);
	if (domain) {
		const { [domain]: hasRecord } = await chrome.storage.local.get(domain);
		if (hasRecord) {
			// Extract handle from TXT record and construct Bluesky URL
			chrome.tabs.create({ url: `https://bsky.app/profile/${domain}` });
		}
	}
});
