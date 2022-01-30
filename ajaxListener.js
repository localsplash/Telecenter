(function () {
    init();
})();

function init() {
    var settings = loadSettings();
    var url = [document.URL].toString();

    // BEGIN cludge to eliminate MAnager issues for SMS & input boxes.
    if (url.includes("manager") &&
        ( url.includes("/profile.aspx?p=") || url.includes("/manage_profiles.aspx")  || url.includes("/placement/") )
      ) return;  // END cludge to eliminate MAnager issues for SMS & input boxes.

    if (settings.regex && settings.c2cURL && settings.pbxExten && settings.imageUrl) {
        var regex = new RegExp(settings.regex);
        var win = document.defaultView || document.parentWindow;
        var origOpen = win.XMLHttpRequest.prototype.open;
        win.XMLHttpRequest.prototype.open = function () {
            this.addEventListener('load', function () {
                if (regex.test(this.responseText)) {
                    setTimeout(function () {
                        find_textNodesWithPhones(settings.regex, settings.c2cURL, settings.pbxExten, settings.imageUrl,
                            settings.currentCustomerImageUrl, settings.dncImageUrl, settings.dispositionImageUrl, settings.purpleImageUrl);
                    }, 100)

                }
            });
            origOpen.apply(this, arguments);
        };
    }

    setTimeout(function () {
        find_textNodesWithPhones(settings.regex, settings.c2cURL, settings.pbxExten, settings.imageUrl,
            settings.currentCustomerImageUrl, settings.dncImageUrl, settings.dispositionImageUrl, settings.purpleImageUrl);
    }, settings.loadDelay ? (parseInt(settings.loadDelay) * 1000) : 3000);
}


function find_textNodesWithPhones(regexString, baseAddress, pbxExten, imageUrl, currentCustomerImageUrl, dncImageUrl, dispositionImageUrl, purpleImageUrl) {
    var queue = [document.body];
    var curr;
    var regex = new RegExp(regexString);
    var globalRegex = new RegExp(regexString, 'g');
    var fullMatchRegex = new RegExp("^" + regexString + "$");
    var imageCode = '<span class="rlv-container">'
        + '<img src="{imageUrl}" height="15" width="15" class="rlv-phone-call" data-preview="NO" data-phone-number="{phoneDigits}" style="cursor:pointer;" />'
        + '<div class="rlv-menu-container"><a href="#" data-preview="NO" data-phone-number="{phoneDigits}" class="rlv-phone-call">Call</a>'
        + '<a href="#" data-preview="YES" data-phone-number="{phoneDigits}" class="rlv-phone-call">Preview</a>'
        + '<a href="https://www.google.com/search?q={phoneDigits}" target="goog">Search Phone on Google</a>'
        + '<a href="https://manager.localsplash.com/telecenter/phoneopen.aspx?p={phoneDigits}" target="manager">Manager open</a></div>'
        + '</span>';
    var nodePromices = [];
    while (curr = queue.pop()) {
        if (!regex.test(curr.textContent)) continue;
        for (var i = 0; i < curr.childNodes.length; ++i) {
            switch (curr.childNodes[i].nodeType) {
                case Node.TEXT_NODE:
                    if (regex.test(curr.childNodes[i].textContent)) {
                        var res = curr.childNodes[i].textContent.match(globalRegex);
                        var nodePromice = new Promise(function (resolve, reject) {
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

                                    if (currCopy.getAttribute('rlv-processed') === "true" && currCopy.getAttribute('rlv-processed-phone').indexOf(resCopy[j] + ';') >= 0) {
                                        continue;
                                    }

                                    found = true;
                                    // fill template with required data
                                    var phoneDigits = resCopy[j].replace(/[^0-9]/g, '');
                                    var imgTag = imageCode.replace('{imageUrl}', imageUrl);
                                    imgTag = imgTag.replace(/{phoneNumber}/g, resCopy[j]);
                                    imgTag = imgTag.replace(/{phoneDigits}/g, phoneDigits);
                                    currCopy.innerHTML = currCopy.innerHTML.replace(resCopy[j], resCopy[j] + imgTag);
                                    processedPhones += resCopy[j] + ';';
                                }

                                if (!found) {
                                    resolve();
                                    return;
                                }

                                var nodes = currCopy.getElementsByClassName('rlv-phone-call');
                                currCopy.setAttribute('rlv-processed', 'true');
                                currCopy.setAttribute('rlv-processed-phone', processedPhones);

                                // add click and context menu event listeners
                                for (var j = 0; j < nodes.length; j++) {
                                    nodes[j].addEventListener('click', sendRequest);
                                    var links = nodes[j].parentNode.getElementsByTagName('a');
                                    if (links.length > 0) {
                                        for (var k = 0; k < links.length; k++) {
                                            links[k].addEventListener('click', stopLinkClickPropargation);
                                        }
                                    }
                                    nodes[j].addEventListener('contextmenu', contextMenu);
                                }

                                resolve();
                            });
                        });
                        nodePromices.push(nodePromice);
                    }
                    break;
                case Node.ELEMENT_NODE:
                    queue.push(curr.childNodes[i]);
                    break;
            }
        }
    }

    Promise.all(nodePromices).then(function () {
        UpdatePhoneDetails(imageUrl, currentCustomerImageUrl, dncImageUrl, dispositionImageUrl, purpleImageUrl);
    });
}

// function to send request on phone icon click
function sendRequest(event) {
    if (this.parentNode.getAttribute('data-remove-ajax')) {
        return;
    }

    var settings = loadSettings();
    event.stopPropagation();
    event.preventDefault();
    var phoneNumber = this.getAttribute('data-phone-number');
    var preview = this.getAttribute('data-preview');
    var rootc2cURL = settings.c2cURL;
    var urlC2C = rootc2cURL.replace(/{{EXTEN}}/g, settings.pbxExten).replace('{{PHONEDIAL}}', phoneNumber) + '&preview=' + preview;
    console.log('Send request: ' + urlC2C);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', urlC2C, false);
    xhr.send();

    return false;
}

// function to append context menu on phone icon right click
function contextMenu(event) {
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
    element.style.display = 'block';

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
    event.stopPropagation();
}

function loadSettings() {
    var settingsDiv = document.getElementById('rlv-settings');
    if (settingsDiv) {
        var settings = JSON.parse(settingsDiv.getAttribute('data-rlv-settings'));
        console.log('plugin settings:' + settings);
        return settings;
    }
}

// Process Phone number
// Ruturns object that contains imageUrl and indicates if ajax option should be disabled
function ProcessPhoneDetails(phoneNumber, phones, imageUrl, currentCustomerImage, dncImage, despositionImage, purpleImageUrl) {
    for (var i = 0; i < phones.length; i++) {
        if (phoneNumber == phones[i].IPhone) {
            break;
        }
    }

    if (i < phones.length) {
        var formattedLastDispositionDate = "";
        var lastDispositionDate = phones[i].dtLastDisposition;
        var dispositionCreatorUsername = phones[i].DispositionCreatorUsername;
        if(lastDispositionDate != null) {
            formattedLastDispositionDate = constructFormattedLastDispositionDate(lastDispositionDate);
        }
        if (phones[i].bIsPaying == 1) {
            return {
                imageUrl: currentCustomerImage,
                removeAjax: true,
                altText: formattedLastDispositionDate + 'Current client' + getDispositionUserName(dispositionCreatorUsername)
            }
        } else if (phones[i].eDispositionID == 16) {
            var purpleImageTxt = "";
            switch (phones[i].eDispositionID) {
                case 16:
                    purpleImageTxt = "T.O.";
                    break;
                default:
                    purpleImageTxt = "unknown disposition!";
                    break;
            }
            return {
                imageUrl: purpleImageUrl,
                removeAjax: false,
                altText: formattedLastDispositionDate + purpleImageTxt + getDispositionUserName(dispositionCreatorUsername)
            }
        } else if (phones[i].eDispositionID == 1 || phones[i].eDispositionID == 4 || phones[i].eDispositionID == 8 || phones[i].eDispositionID == 512
            || phones[i].eDispositionID == 32768 || phones[i].eDispositionID == 32770 || phones[i].eDispositionID == 32775 || phones[i].eDispositionID == 32776 || phones[i].eDispositionID == 32777 ) {
            var dncImageText = "";
            switch (phones[i].eDispositionID) {
                case 1:
                    dncImageText = "DNC";
                    break;
                case 4:
                    dncImageText = "Phone Disconnected";
                    break;
                case 8:
                    dncImageText = "Multilocation";
                    break; 
                case 512:
                    dncImageText = "On Hold";
                    break;
                case 32768:
                    dncImageText = "Out of Business";
                    break;
                case 32770:
                    dncImageText = "Not a Business";
                    break;
                case 32775:
                    dncImageText = "HomeAdvisor Recording";
                    break;
                case 32776:
                    dncImageText = "Tracking Number";
                    break;
                case 32777:
                    dncImageText = "Deactivated";
                    break;
                default:
                    dncImageText = "unknown disposition!";
                    break;
            }

            return {
                imageUrl: dncImage,
                removeAjax: false,
                altText: formattedLastDispositionDate + dncImageText + getDispositionUserName(dispositionCreatorUsername)
            }
        } else if (phones[i].eDispositionID != null) {
            var reason = "";
            switch (phones[i].eDispositionID) {
                case 2:
                    reason = "Pitch Attempted";
                    break;     
                case 32:
                    reason = "Email requested";
                    break;
                case 64:
                    reason = "Not interested";
                    break;
                case 128:
                    reason = "Hang up";
                    break;
                case 256:
                    reason = "Done - Final Attempt";
                    break;                
                case 2048:
                    reason = "Loss of Sale - Reviews";
                    break;
                case 4096:
                    reason = "Future Interest - Call Back";
                    break;
                case 8192:
                    reason = "No Answer";
                    break;
                case 16384:
                    reason = "Booked";
                    break;
                case 32769:
                    reason = "On Hold";
                    break;
                case 32771:
                    reason = "Gatekeeper";
                    break;
                case 32772:
                    reason = "Future Interest";
                    break;
                case 32773:
                    reason = "Ranking First Page";
                    break;
                case 32774:
                    reason = "Language Barrier";
                    break;
                default:
                    reason = "unknown disposition!";
                    break;
            }

            return {
                imageUrl: despositionImage,
                removeAjax: false,
                altText: formattedLastDispositionDate + reason + getDispositionUserName(dispositionCreatorUsername)
            }
        } else {
            // nothing, let go into default below
        }
    }

    return {
        imageUrl: imageUrl,
        removeAjax: false,
        altText: 'Call now'
    }
}

function getPhones(phoneNumbers) {
    var phonesPromise = new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                resolve(xhr.responseText); // Another callback here
            }
        };
        xhr.open("POST", "https://svc.relevantads.com/Telcenter/GetPhones");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify({ Phones: phoneNumbers }));
    });

    return phonesPromise;
}

function UpdatePhoneDetails(imageUrl, currentCustomerImageUrl, dncImageUrl, dispositionImageUrl, purpleImageUrl) {
    var phoneNodes = document.getElementsByClassName("rlv-container");
    var phones = [];
    var processedPhoneNodes = {};
    for (var i = 0; i < phoneNodes.length; i++) {
        var imgNode = phoneNodes[i].firstChild;
        if (imgNode.getAttribute('data-phone-number')) {
            phones.push(parseInt(imgNode.getAttribute('data-phone-number')));
            if (processedPhoneNodes[imgNode.getAttribute('data-phone-number')]) {
                processedPhoneNodes[imgNode.getAttribute('data-phone-number')].push(imgNode);
            } else {
                processedPhoneNodes[imgNode.getAttribute('data-phone-number')] = [imgNode];
            }
        }
    }

    getPhones(phones).then(function (result) {
        if (result) {
            var resultObject = JSON.parse(result);
            for (var i = 0; i < resultObject.length; i++) {
                var processedPhone = ProcessPhoneDetails(resultObject[i].IPhone, resultObject, imageUrl, currentCustomerImageUrl, dncImageUrl, dispositionImageUrl, purpleImageUrl);
                var imgNodes = processedPhoneNodes[resultObject[i].IPhone.toString()];
                if (!imgNodes) {
                    continue;
                }

                for (var j = 0; j < imgNodes.length; j++) {
                    var imgNode = imgNodes[j];
                    imgNode.alt = processedPhone.altText;
                    imgNode.setAttribute('title', processedPhone.altText);
                    if (imgNode.getAttribute('src') != processedPhone.imageUrl) {
                        imgNode.setAttribute('src', processedPhone.imageUrl);
                    }

                    if (processedPhone.removeAjax) {
                        imgNode.parentNode.setAttribute('data-remove-ajax', 'true');

                        var menuItem = imgNode.parentNode.getElementsByClassName('rlv-menu-container');
                        if (menuItem && menuItem.length > 0) {
                            var ajaxLink = menuItem[0].getElementsByClassName('rlv-phone-call');
                            if (ajaxLink && ajaxLink.length > 0) {
                                menuItem[0].removeChild(ajaxLink[0]);
                            }
                        }
                    }
                }

                processedPhoneNodes[resultObject[i].IPhone.toString()] = null;
            }
        }
    });
}

function constructFormattedLastDispositionDate(isoFormatDate) {
    var date = new Date(isoFormatDate);
    var year = date.getFullYear().toString().substr(-2);
    var month = date.getMonth() + 1;
    var dt = date.getDate();

    if (dt < 10) {
        dt = '0' + dt;
    }
    if (month < 10) {
        month = '0' + month;
    }

    var time = formatAMPM(date);

    return month + '/' + dt + '/' + year + " " + time + ' - ';
}

function formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}

function getDispositionUserName(dispositionUserName) {
    if(dispositionUserName) {
        return " (" + dispositionUserName + ")";
    } else {
        return "";
    }
}

document.addEventListener('yourCustomEvent', function (e) {
    document.querySelectorAll(".rlv-container").forEach(el => el.remove());
    document.querySelectorAll('[rlv-processed="true"]').forEach(elem => {
        elem.setAttribute("rlv-processed", false);
    });
    init();
});