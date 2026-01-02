chrome.action.onClicked.addListener(function(tab) {
    chrome.tabs.sendMessage(tab.id, {text: "startScan"}, function() {
        console.log(chrome.runtime.lastError);
    });
});

chrome.tabs.onActivated.addListener(function(activeInfo){
    tabId = activeInfo.tabId;
    chrome.tabs.sendMessage(tabId, {text: "are_you_there_content_script?"}, function(msg) {
        if(chrome.runtime.lastError || msg === undefined) {
            chrome.action.disable(tabId);
        } else {
            chrome.action.enable(tabId);
        }
    });
});

chrome.tabs.onUpdated.addListener(function(tabId){
    chrome.tabs.sendMessage(tabId, {text: "are_you_there_content_script?"}, function(msg) {
        if(chrome.runtime.lastError || msg === undefined) {
            chrome.action.disable(tabId);
        } else {
            chrome.action.enable(tabId);
        }
    });
});
chrome.runtime.onMessage.addListener(function (req, sender, reply) {
    console.log("Background script received message:", req);
    let msg = req.msg;
    if (msg == "loadAjaxListner") {
        chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            files: ["ajaxListener.js"]
          });
    }
    
    // Handle API calls that need to bypass CORS
    if (req.action === "getPhones") {
        console.log("Starting fetch to GetPhones API with", req.phones.length, "phone numbers");
        fetch("https://infrastructure.localsplash.com/api/Telcenter/GetPhones", {
            method: "POST",
            headers: {
                "accept": "text/plain",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ phones: req.phones })
        })
        .then(response => {
            console.log("GetPhones API response status:", response.status, response.statusText);
            if (!response.ok) {
                throw new Error("HTTP error " + response.status + " " + response.statusText);
            }
            return response.text();
        })
        .then(data => {
            console.log("GetPhones API success, data length:", data.length);
            reply({ success: true, data: data });
        })
        .catch(error => {
            console.error("GetPhones API error:", error.name, error.message, error.stack);
            reply({ success: false, error: error.name + ": " + error.message });
        });
        
        return true; // Required for async reply
    }
    
    return true;
  });