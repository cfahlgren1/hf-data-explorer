export { }

console.log("Background script loaded")

const isHuggingFaceDatasetUrl = (url: string): boolean => {
    return url.startsWith('https://huggingface.co/datasets/');
}

// Keep track of which tabs have the side panel enabled
const enabledTabs = new Set<number>();

const updateSidePanel = async (tabId: number, url: string | undefined) => {
    if (url && isHuggingFaceDatasetUrl(url)) {
        await chrome.sidePanel.setOptions({
            tabId,
            path: 'sidepanel.html?tabId=' + tabId,
            enabled: enabledTabs.has(tabId)
        });
    } else {
        await chrome.sidePanel.setOptions({
            tabId,
            enabled: false
        });
        enabledTabs.delete(tabId);
    }
}

// On tab update
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        updateSidePanel(tabId, tab.url);
    }
});

// On tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    updateSidePanel(activeInfo.tabId, tab.url);
});

// On tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
    enabledTabs.delete(tabId);
});

// On startup
chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
        if (tab.id) updateSidePanel(tab.id, tab.url);
    });
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "toggleSidebar" && message.tabId) {
        const tabId = message.tabId;
        const isEnabled = enabledTabs.has(tabId);

        if (isEnabled) {
            enabledTabs.delete(tabId);
        } else {
            enabledTabs.add(tabId);
        }

        chrome.sidePanel.setOptions({
            tabId: tabId,
            path: 'sidepanel.html?tabId=' + tabId,
            enabled: !isEnabled
        }).then(() => {
            sendResponse({ success: true, enabled: !isEnabled });
        }).catch((error) => {
            console.error("Error toggling sidebar:", error);
            sendResponse({ success: false, error: error.message });
        });

        return true;
    }
});