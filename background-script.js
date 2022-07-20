chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.sendMessage(tab.id, {text: "startScan"}, function() {
        console.log(chrome.runtime.lastError);
    });
});

chrome.tabs.onActivated.addListener(function(activeInfo){
    tabId = activeInfo.tabId;
    chrome.tabs.sendMessage(tabId, {text: "are_you_there_content_script?"}, function(msg) {
        if(chrome.runtime.lastError || msg === undefined) {
            chrome.browserAction.disable(tabId);
        } else {
            chrome.browserAction.enable(tabId);
        }
    });
});

chrome.tabs.onUpdated.addListener(function(tabId){
    chrome.tabs.sendMessage(tabId, {text: "are_you_there_content_script?"}, function(msg) {
        if(chrome.runtime.lastError || msg === undefined) {
            chrome.browserAction.disable(tabId);
        } else {
            chrome.browserAction.enable(tabId);
        }
    });
});