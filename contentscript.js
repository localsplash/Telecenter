
chrome.storage.sync.get(function (items) {
    console.log('running plugin' + items);
    var styleurl = chrome.runtime.getURL('phonestyle.css');
    var scripturl = chrome.runtime.getURL('ajaxListener.js');
    var imageUrl = chrome.runtime.getURL('phone.png');
    var phoneCurrentCustomerUrl = chrome.runtime.getURL('phone-currentcustomer.png');
    var phoneDNCImageUrl = chrome.runtime.getURL('phone-dnc.png');
    var phoneDispositionImageUrl = chrome.runtime.getURL('phone-disposition.png');
    var phonePurple = chrome.runtime.getURL('phone-purple.png');
    var errorImageUrl = chrome.runtime.getURL('error.png');
    var phoneDNCImageUrl_tri_red=chrome.runtime.getURL("phone-dnc-triangle-red.png");
    var phoneDispositionImageUrl_tri_purple=chrome.runtime.getURL("phone-disposition-triangle-purple.png");
    var phoneDispositionImageUrl_orange=chrome.runtime.getURL("phone-disposition-orange.png");
    var phoneDispositionImageUrl_tri_red=chrome.runtime.getURL("phone-disposition-triangle-red.png");
    var phoneDispositionImageUrl_tri_blue=chrome.runtime.getURL("phone-disposition-triangle-blue.png");
    var phoneDispositionImageUrl_yellow=chrome.runtime.getURL("phone-disposition-yellow.png");
    var phoneDispositionImageUrl_red=chrome.runtime.getURL("phone-disposition-red.png");
    var phoneDNCImageUrl_tri_black=chrome.runtime.getURL("phone-dnc-triangle-black.png ");
    
    chrome.runtime.sendMessage({
        msg: "loadAjaxListner"
    });
    appendStyle(styleurl);
    // injectScript(scripturl, 'body');
    if (items.regex && items.c2cURL && items.pbxExten) {

        // add settings to hidden div on page
        var body = document.getElementsByTagName('body')[0];
        var settingsDiv = document.createElement('div');
        settingsDiv.style.display = 'none';
        settingsDiv.setAttribute('data-rlv-settings', JSON.stringify({
            imageUrl: imageUrl,
            currentCustomerImageUrl: phoneCurrentCustomerUrl,
            dncImageUrl: phoneDNCImageUrl,
            dispositionImageUrl: phoneDispositionImageUrl,
            purpleImageUrl: phonePurple,
            errorImageUrl: errorImageUrl,
            regex: items.regex,
            c2cURL: items.c2cURL,
            pbxExten: items.pbxExten,
            loadDelay: items.loadDelay,
            phoneDNCImageUrl_tri_red:phoneDNCImageUrl_tri_red,
            phoneDispositionImageUrl_orange:phoneDispositionImageUrl_orange,
            phoneDispositionImageUrl_tri_red:phoneDispositionImageUrl_tri_red,
            phoneDispositionImageUrl_tri_blue:phoneDispositionImageUrl_tri_blue,
            phoneDispositionImageUrl_yellow:phoneDispositionImageUrl_yellow,
            phoneDispositionImageUrl_tri_purple:phoneDispositionImageUrl_tri_purple,
            phoneDispositionImageUrl_red:phoneDispositionImageUrl_red,
            phoneDNCImageUrl_tri_black:phoneDNCImageUrl_tri_black
        }));
        settingsDiv.id = 'rlv-settings';
        body.appendChild(settingsDiv);

            // parse page
            //setTimeout(function () {
            //    find_textNodesWithPhones(items.regex, items.c2cURL, items.pbxExten, imageUrl, storedPhones);
            //}, items.loadDelay ? (parseInt(items.loadDelay) * 1000) : 3000);

    }
});


function find_textNodesWithPhones(regexString, baseAddress, pbxExten, imageUrl, currentCustomerImage, dncImage, dispositionImage, storedPhones) {
    var queue = [document.body];
    var curr;
    var regex = new RegExp(regexString);
    var globalRegex = new RegExp(regexString, 'g');
    var fullMatchRegex = new RegExp("^" + regexString + "$");
    var imageCode = '<span class="rlv-container">'
        + '<img src="{imageUrl}" alt="{imageAlt}" height="15" width="15" class="rlv-phone-call" data-phone-number="{phoneDigits}" style="cursor:pointer;" />'
        + '<div class="rlv-menu-container">{phone-call-text}'
        + '<a href="https://www.google.com/search?q={phoneDigits}" target="goog">Search PHone on Google</a>'
        + '<a href="https://manager.localsplash.com/telecenter/phoneopen.aspx?p={phoneDigits}" target="manager">Open in Manager</a></div>'
        + '</span>';
    var phoneCallMenuitem = '<a href="#" data-phone-number="{phoneDigits}" class="rlv-phone-call">Call</a>';
    while (curr = queue.pop()) {
        if (!regex.test(curr.textContent)) continue;
        for (var i = 0; i < curr.childNodes.length; ++i) {
            switch (curr.childNodes[i].nodeType) {
                case Node.TEXT_NODE:
                    if (regex.test(curr.childNodes[i].textContent)) {
                        var res = curr.childNodes[i].textContent.match(globalRegex);
                        (function () {
                            var currCopy = curr;
                            var resCopy = res;

                            setTimeout(function () {
                                var processedPhones = '';
                                var found = false;

                                // apply img tag only to the fully matched nodes
                                for (var j = 0; j < resCopy.length; j++) {
                                    if (!fullMatchRegex.test(resCopy[j])) {
                                        continue;
                                    }

                                    if (currCopy.getAttribute('rlv-processed') && currCopy.getAttribute('rlv-processed-phone').indexOf(resCopy[j] + ';') >= 0) {
                                        continue;
                                    }

                                    found = true;
                                    var processPhoneResult = ProcessPhoneDetails(
                                        phoneDigits,
                                         processedPhones,
                                        imageUrl,
                                        currentCustomerImage,
                                        dncImage,
                                        dispositionImage,
                                        phonePurple,
                                        phoneDNCImageUrl_tri_red,
                                        phoneDispositionImageUrl_tri_purple,
                                        phoneDispositionImageUrl_orange,
                                        phoneDispositionImageUrl_tri_red,
                                        phoneDispositionImageUrl_tri_blue,
                                        phoneDispositionImageUrl_yellow,
                                        phoneDispositionImageUrl_red,
                                        phoneDNCImageUrl_tri_black

                                        );
                                    // fill template with required data
                                    var phoneDigits = resCopy[j].replace(/[^0-9]/g, '');
                                    var imgTag = imageCode.replace('{imageUrl}', processPhoneResult.imageUrl);
                                    imgTag = imgTag.replace(/{phoneNumber}/g, resCopy[j]);
                                    imgTag = imgTag.replace(/{phoneDigits}/g, phoneDigits);
                                    imgTag = imgTag.replace("{imageAlt}", processPhoneResult.altText);

                                    if (processPhoneResult.removeAjax) {
                                        imgTag = imgTag.replace("{phone-call-text}", "");
                                    } else {
                                        imgTag = imgTag.replace("{phone-call-text}", phoneCallMenuitem);
                                    }
                                    currCopy.innerHTML = currCopy.innerHTML.replace(resCopy[j], resCopy[j] + imgTag);
                                    processedPhones += resCopy[j] + ';';
                                }

                                if (!found) {
                                    return;
                                }

                                var nodes = currCopy.getElementsByClassName('rlv-phone-call');
                                currCopy.setAttribute('rlv-processed', 'true');
                                currCopy.setAttribute('rlv-processed-phone', processedPhones);

                                // add click and context menu event listeners
                                for (var j = 0; j < nodes.length; j++) {
                                    if (!processPhoneResult.removeAjax) {
                                        nodes[j].addEventListener('click', sendRequest);
                                    }

                                    var links = nodes[j].parentNode.getElementsByTagName('a');
                                    if (links.length > 0) {
                                        for (var k = 0; k < links.length; k++) {
                                            links[k].addEventListener('click', stopLinkClickPropargation);
                                        }
                                    }
                                    nodes[j].addEventListener('contextmenu', contextMenu);
                                }
                            });
                        })();
                    }
                    break;
                case Node.ELEMENT_NODE:
                    queue.push(curr.childNodes[i]);
                    break;
            }
        }
    }
}

// function to send request on phone icon click
function sendRequest(event) {
    event.stopPropagation();
    event.preventDefault();
    var phoneNumber = this.getAttribute('data-phone-number');
    chrome.storage.sync.get(function (items) {
        console.log('Send request: ' + items.c2cURL + '?source_number=' + items.pbxExten + '&display_source_callerid=' + phoneNumber + '&destination_number=' + phoneNumber);
        //return; // comment this line to make real request
        var xhr = new XMLHttpRequest();
        xhr.open('GET', items.c2cURL + '?source_number=' + items.pbxExten + '&display_source_callerid=' + phoneNumber + '&destination_number=' + phoneNumber, false);
        xhr.send();
    });

    return false;
}

// function to append context menu on phone icon right click
function contextMenu(event) {
    alert("hit bc")
    var element = this.parentNode.getElementsByClassName('rlv-menu-container')[0];
    var boundingRect = this.parentNode.getBoundingClientRect();
    element.style.top = boundingRect.top + 'px';
    element.style.left = boundingRect.left + 'px';

    // hide all previous context menus
    var nodes = document.getElementsByClassName('rlv-menu-container');
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].style.display = 'none';
    }

    event.stopPropagation();
    event.preventDefault();

    // show element
    //element.style.display = 'block';

    // add event listeners to hide context menu
    document.onclick = function () {
        element.style.display = 'none';
    }
    document.addEventListener('contextmenu', function () {
        element.style.display = 'none';
    });
    return false;
}

function stopLinkClickPropargation(event) {
    eevent.stopPropagation();
}

// append script tag to the top of the page
function appendStyle(styleUrl) {
    var head = document.head;
    var link = document.createElement('link');

    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = styleUrl;

    head.appendChild(link);
}

// inject script tag into the page
function injectScript(file, node) {
    var th = document.getElementsByTagName(node)[0];
    var s = document.createElement('script');
    s.setAttribute('type', 'text/javascript');
    s.setAttribute('src', file);
    th.appendChild(s);
}

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.text === "startScan") {
        var evt=document.createEvent("CustomEvent");
        evt.initCustomEvent("yourCustomEvent", true, true, {});
        document.dispatchEvent(evt);
    } else if(msg.text === 'are_you_there_content_script?') {
        sendResponse({status: "yes"});
    }
});