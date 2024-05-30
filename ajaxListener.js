(function () {
  init();
})();

function init() {
  var settings = loadSettings();
  var url = [document.URL].toString();

  // BEGIN cludge to eliminate MAnager issues for SMS & input boxes.
  if (
    url.includes("manager") &&
    (url.includes("/profile.aspx?p=") ||
      url.includes("/manage_profiles.aspx") ||
      url.includes("/placement/"))
  )
    return; // END cludge to eliminate MAnager issues for SMS & input boxes.

  if (
    settings.regex &&
    settings.c2cURL &&
    settings.pbxExten &&
    settings.imageUrl
  ) {
    var regex = new RegExp(settings.regex);
    var win = document.defaultView || document.parentWindow;
    var origOpen = win.XMLHttpRequest.prototype.open;
    win.XMLHttpRequest.prototype.open = function () {
      this.addEventListener("load", function () {
        if (regex.test(this.responseText)) {
          setTimeout(function () {
            find_textNodesWithPhones(
              settings.regex,
              settings.c2cURL,
              settings.pbxExten,
              settings.imageUrl,
              settings.currentCustomerImageUrl,
              settings.dncImageUrl,
              settings.dispositionImageUrl,
              settings.purpleImageUrl,
              settings.errorImageUrl,
              settings.phoneDNCImageUrl_tri_red,
              settings.phoneDispositionImageUrl_tri_purple,
              settings.phoneDispositionImageUrl_orange,
              settings.phoneDispositionImageUrl_tri_red,
              settings.phoneDispositionImageUrl_tri_blue,
              settings.phoneDispositionImageUrl_yellow,
              settings.phoneDispositionImageUrl_red,
              settings.phoneDNCImageUrl_tri_black
            );
          }, 100);
        }
      });
      origOpen.apply(this, arguments);
    };
  }

  setTimeout(
    function () {
      find_textNodesWithPhones(
        settings.regex,
        settings.c2cURL,
        settings.pbxExten,
        settings.imageUrl,
        settings.currentCustomerImageUrl,
        settings.dncImageUrl,
        settings.dispositionImageUrl,
        settings.purpleImageUrl,
        settings.errorImageUrl,
        settings.phoneDNCImageUrl_tri_red,
        settings.phoneDispositionImageUrl_tri_purple,
        settings.phoneDispositionImageUrl_orange,
        settings.phoneDispositionImageUrl_tri_red,
        settings.phoneDispositionImageUrl_tri_blue,
        settings.phoneDispositionImageUrl_yellow,
        settings.phoneDispositionImageUrl_red,
        settings.phoneDNCImageUrl_tri_black
      );
    },
    settings.loadDelay ? parseInt(settings.loadDelay) * 1000 : 3000
  );
}

function find_textNodesWithPhones(
  regexString,
  baseAddress,
  pbxExten,
  imageUrl,
  currentCustomerImageUrl,
  dncImageUrl,
  dispositionImageUrl,
  purpleImageUrl,
  errorImageUrl,
  phoneDNCImageUrl_tri_red,
  phoneDispositionImageUrl_tri_purple,
  phoneDispositionImageUrl_orange,
  phoneDispositionImageUrl_tri_red,
  phoneDispositionImageUrl_tri_blue,
  phoneDispositionImageUrl_yellow,
  phoneDispositionImageUrl_red,
  phoneDNCImageUrl_tri_black
) {
  var queue = [document.body];
  var curr;
  var regex = new RegExp(regexString);
  var globalRegex = new RegExp(regexString, "g");
  var fullMatchRegex = new RegExp("^" + regexString + "$");
  var imageCode =
    '<span class="rlv-container">' +
    '<img src="{imageUrl}" height="15" width="15" class="rlv-phone-call" data-preview="NO" data-phone-number="{phoneDigits}" style="cursor:pointer;" title="Network Error" />' +
    '<div class="rlv-menu-container"><a href="#" data-preview="NO" data-phone-number="{phoneDigits}" class="rlv-phone-call">Call</a>' +
    '<a href="#" data-preview="YES" data-phone-number="{phoneDigits}" class="rlv-phone-call">Preview</a>' +
    '<a href="https://www.google.com/search?q={phoneDigits}" target="goog">Search Phone on Google</a>' +
    '<a href="https://manager.localsplash.com/telecenter/phoneopen.aspx?p={phoneDigits}" target="manager">Manager open</a></div>' +
    "</span>";
  var nodePromices = [];
  while ((curr = queue.pop())) {
    if (!regex.test(curr.textContent)) continue;
    for (var i = 0; i < curr.childNodes.length; ++i) {
      switch (curr.childNodes[i].nodeType) {
        case Node.TEXT_NODE:
          if (regex.test(curr.childNodes[i].textContent)) {
           // console.log("***********text content*********"+curr.childNodes[i].textContent);
            //console.log("***********outer html*********"+curr.childNodes[i]);
            var res = curr.childNodes[i].textContent.match(globalRegex);
            var nodePromice = new Promise(function (resolve, reject) {
              var currCopy = curr;
              var resCopy = res;

              setTimeout(function () {
                var processedPhones = "";
                var found = false;

                // apply img tag only to the fully matched nodes
                for (var j = 0; j < resCopy.length; j++) {
                  if (!fullMatchRegex.test(resCopy[j])) {
                    continue;
                  }

                  if (
                    currCopy.getAttribute("rlv-processed") === "true" &&
                    currCopy
                      .getAttribute("rlv-processed-phone")
                      .indexOf(resCopy[j] + ";") >= 0
                  ) {
                    continue;
                  }
                  //ignore the google search box
                  else if (
                    currCopy.getAttribute("aria-label") === "Search"
                  ) {
                    continue;
                  }

                  found = true;
                  // fill template with required data
                  var phoneDigits = resCopy[j].replace(/[^0-9]/g, "");
                  var imgTag = imageCode.replace("{imageUrl}", errorImageUrl);
                  imgTag = imgTag.replace(/{phoneNumber}/g, resCopy[j]);
                  imgTag = imgTag.replace(/{phoneDigits}/g, phoneDigits);
                  //console.log("outer**********"+currCopy.outerHTML )
                  currCopy.innerHTML = currCopy.innerHTML.replace(
                    resCopy[j],
                    resCopy[j] + imgTag
                  );
                  processedPhones += resCopy[j] + ";";
                }

                if (!found) {
                  resolve();
                  return;
                }

                var nodes = currCopy.getElementsByClassName("rlv-phone-call");
                currCopy.setAttribute("rlv-processed", "true");
                currCopy.setAttribute("rlv-processed-phone", processedPhones);

                // add click and context menu event listeners
                for (var j = 0; j < nodes.length; j++) {
                  nodes[j].addEventListener("click", sendRequest);
                  var links = nodes[j].parentNode.getElementsByTagName("a");
                  if (links.length > 0) {
                    for (var k = 0; k < links.length; k++) {
                      links[k].addEventListener(
                        "click",
                        stopLinkClickPropargation
                      );
                    }
                  }
                  nodes[j].addEventListener("contextmenu", contextMenu);
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
    UpdatePhoneDetails(
      imageUrl,
      currentCustomerImageUrl,
      dncImageUrl,
      dispositionImageUrl,
      purpleImageUrl,
      phoneDNCImageUrl_tri_red,
      phoneDispositionImageUrl_tri_purple,
      phoneDispositionImageUrl_orange,
      phoneDispositionImageUrl_tri_red,
      phoneDispositionImageUrl_tri_blue,
      phoneDispositionImageUrl_yellow,
      phoneDispositionImageUrl_red,
      phoneDNCImageUrl_tri_black
    );
  });
}

// function to send request on phone icon click
function sendRequest(event) {
  if (this.parentNode.getAttribute("data-remove-ajax")) {
    return;
  }

  var settings = loadSettings();
  event.stopPropagation();
  event.preventDefault();
  var phoneNumber = this.getAttribute("data-phone-number");
  var preview = this.getAttribute("data-preview");
  var rootc2cURL = settings.c2cURL;
  var urlC2C =
    rootc2cURL
      .replace(/{{EXTEN}}/g, settings.pbxExten)
      .replace("{{PHONEDIAL}}", phoneNumber) +
    "&preview=" +
    preview;
  console.log("Send request: " + urlC2C);
  var xhr = new XMLHttpRequest();
  xhr.open("GET", urlC2C, false);
  xhr.send();

  return false;
}

// function to append context menu on phone icon right click
function contextMenu(event) {
  var element = this.parentNode.getElementsByClassName("rlv-menu-container")[0];
  var gElement = this.parentNode.getElementsByClassName("rlv-menu-container")[0];
  var boundingRect = this.parentNode.getBoundingClientRect();
  element.style.top = boundingRect.top + "px";
  element.style.left = boundingRect.left + "px";

  // hide all previous context menus
  var nodes = document.getElementsByClassName("rlv-menu-container");
  for (var i = 0; i < nodes.length; i++) {
    nodes[i].style.display = "none";
  }

  event.stopPropagation();
  event.preventDefault();
//alert("alert bc");
//element.style.height="20px";
  // show element
  element.style.display = "block";

  if (areWeOnGoogleSearchPage()) {
    ContainNoneParentNodes(gElement);
    // while (true) {
    //   element.parentNode;
    //   window.getComputedStyle(element.parentNode);
    // }
    // element.parentNode.parentNode.parentNode.parentNode.style.contain = "none";
    // element.parentNode.parentNode.parentNode.parentNode.parentNode.style.contain =
    //   "none";
    // element.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.style.contain =
    //   "none";
  }
  else if (areWeOnFacebookIntroSection(element)){
    addSpaceDiv(element);
  }

  // add event listeners to hide context menu
  document.onclick = function () {
    element.style.display = "none";
    if (areWeOnGoogleSearchPage()) {
        ContainRemoveParentNodes(gElement);
    //   element.parentNode.parentNode.parentNode.parentNode.style.removeProperty(
    //     "contain"
    //   );
    //   element.parentNode.parentNode.parentNode.parentNode.parentNode.style.removeProperty(
    //     "contain"
    //   );
    //   element.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.style.removeProperty(
    //     "contain"
    //   );
    }
    else if (areWeOnFacebookIntroSection(element)){
      removeDivSpace(element);
    }
  };
  document.addEventListener("contextmenu", function () {
    element.style.display = "none";
    if (areWeOnGoogleSearchPage()) {
        ContainRemoveParentNodes(gElement);
    //   element.parentNode.parentNode.parentNode.parentNode.style.removeProperty(
    //     "contain"
    //   );
    //   element.parentNode.parentNode.parentNode.parentNode.parentNode.style.removeProperty(
    //     "contain"
    //   );
    //   element.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.style.removeProperty(
    //     "contain"
    //   );
    }
    else if (areWeOnFacebookIntroSection(element)){
      removeDivSpace(element);
    }
  });
  return false;
}
function addSpaceDiv(element){
  var newDiv = document.createElement('div');
  newDiv.innerHTML = "";
  newDiv.className="rlv-extra-space"
  newDiv.style.height="86px";
  element.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.insertBefore(newDiv,element.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.nextSibling);
}
function removeDivSpace(element){
  if(element.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.nextSibling.classList.contains('rlv-extra-space'))
  {
    element.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.nextSibling.remove()	
  }
}
function ContainNoneParentNodes(gElement){
    var els = [];
    while (gElement) {
      els.unshift(gElement);
      gElement = gElement.parentNode;
      if(gElement.hasAttribute('jscontroller')){
        break;
      }
      else{
        if(window.getComputedStyle(gElement).getPropertyValue('contain')){
            gElement.style.contain = "none";
        }
        
        console.log(gElement);
      }
    }
}
function ContainRemoveParentNodes(gElement){
    var els = [];
    while (gElement) {
      els.unshift(gElement);
      gElement = gElement.parentNode;
      if(gElement.hasAttribute('jscontroller')){
        break;
      }
      else{
        if(window.getComputedStyle(gElement).getPropertyValue('contain')){
            gElement.style.removeProperty(
                "contain"
              );
        }
        
        console.log(gElement);
      }
    }
}
function areWeOnGoogleSearchPage() {
  return (
    window.location.hostname.indexOf(".google") != -1 &&
    window.location.pathname.indexOf("search") != -1
  );
}

function areWeOnFacebookIntroSection(element) {
  try{
  return (
    window.location.hostname.indexOf(".facebook") != -1 &&
    element.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.classList.contains('x1ja2u2z')
  );
  }catch(e)
  {
    return false;
  }
}
function stopLinkClickPropargation(event) {
  event.stopPropagation();
}

function loadSettings() {
  var settingsDiv = document.getElementById("rlv-settings");
  if (settingsDiv) {
    var settings = JSON.parse(settingsDiv.getAttribute("data-rlv-settings"));
    console.log("plugin settings:" + settings);
    return settings;
  }
}

// Process Phone number
// Ruturns object that contains imageUrl and indicates if ajax option should be disabled
function ProcessPhoneDetails(
  phoneNumber,
  phones,
  imageUrl,
  currentCustomerImage,
  dncImage_round_red,
  despositionImage_round_blue,
  purpleImageUrl_round_purple,
  phoneDNCImageUrl_tri_red,
  phoneDispositionImageUrl_tri_purple,
  phoneDispositionImageUrl_orange,
  phoneDispositionImageUrl_tri_red,
  phoneDispositionImageUrl_tri_blue,
  phoneDispositionImageUrl_yellow,
  phoneDispositionImageUrl_red,
  phoneDNCImageUrl_tri_black
) {
  // Find the phone object where the phone number matches
  const foundPhone = phones.find(phone => phone.IPhone === phoneNumber);
  if (foundPhone) {
    console.log("phone desposition Id",foundPhone.eDispositionID);
    var formattedLastDispositionDate =foundPhone.dtLastDisposition != null? constructFormattedLastDispositionDate(
      foundPhone.dtLastDisposition,
      foundPhone.TimeZone
    ) :"";
    if (foundPhone.bIsPaying == 1) {
      return {
        imageUrl: currentCustomerImage,
        removeAjax: true,
        altText:
          formattedLastDispositionDate +
          "Current client" +
          getDispositionUserName(foundPhone.DispositionCreatorUsername),
      };
    } 
    else if (
      foundPhone.eDispositionID != null
      
    ) {
      let imagePath="";
      switch (foundPhone.eDispositionID) {
        case 16:
          reason = "TO - Open Manager";
          imagePath=purpleImageUrl_round_purple;
          break;
        case 1: //c
          reason = "Do Not Call";
          imagePath=dncImage_round_red;
          break;
        case 4://c
          reason = "Phone Disconnected";
          imagePath=dncImage_round_red;
          break;
        case 8://c
          reason = "Multilocation";
          imagePath=dncImage_round_red;
          break;
        case 512: //c
          reason = "On Hold Seven Days-Closer";
          imagePath=phoneDNCImageUrl_tri_red;
          break;
        case 32768://c
          reason = "Out of Business";
          imagePath=dncImage_round_red;
          break;
        case 131072://c
          reason = "Not a Business";
          imagePath=dncImage_round_red;
          break;
        case 4194304://c
          reason = "Tracking Number";
          imagePath=phoneDispositionImageUrl_red;
          break;
        case 1024: //c
          reason = "Post Date-Do Not Call";
          imagePath=phoneDispositionImageUrl_tri_red;
          break;   
        case 8388608: //c
          reason = "Bad Category";
          imagePath=phoneDispositionImageUrl_red;
          break;   
        case 16777216: //c
          reason = "Future Interest-Booked";
          imagePath=phoneDispositionImageUrl_yellow;
          break; 
        case 33554432://c
          reason = "Current client";
          imagePath=phoneDNCImageUrl_tri_black;
          break;
        case 67108864://c
          reason = "Spanish speaking";
          imagePath=phoneDispositionImageUrl_orange;
          break;
        case 134217728://c
          reason = "Inbound Callback";
          imagePath=despositionImage_round_blue;
          break;
        case 2: //c
          reason = "Callback Scheduled";
          imagePath=phoneDispositionImageUrl_yellow;
          break;
        // case 2:
        //   reason = "Scheduled Call Back";
        //   imagePath=despositionImage;
        //   break;
        case 32://c
          reason = "Email Request";
          imagePath=despositionImage_round_blue;
          break;
        case 64://c
          reason = "Not interested";
          imagePath=phoneDispositionImageUrl_yellow;
          break;
        case 128://c
          reason = "Hang up";
          imagePath=despositionImage_round_blue;
          break;
        case 256://c
          reason = "Attempted Close";
          imagePath=phoneDispositionImageUrl_tri_blue;
          break;
        case 2048: //c
          reason = "Reviews";
          imagePath=phoneDispositionImageUrl_tri_blue;
          break;
        case 4096://c
          reason = "Future Interest-Call Back";
          imagePath=phoneDispositionImageUrl_yellow;
          break;
        case 8192://c
          reason = "No Answer-Voicemail";
          imagePath=despositionImage_round_blue;
          break;
        // case 16384:
        //   reason = "Unknown dispo not found 16384";
        //   imagePath=despositionImage_round_blue;
        //   break;
        // case 65536:
        //   reason = "1 Day";
        //   imagePath=despositionImage_round_blue;
        //   break;
        case 262144://c
          reason = "Gatekeeper";
          imagePath=despositionImage_round_blue;
          break;
        case 524288://c
          reason = "Future Interest-In contract";
          imagePath=phoneDispositionImageUrl_yellow;
          break;
        case 1048576://c
          reason = "On First Page";
          imagePath=phoneDispositionImageUrl_yellow;
          break;
        // case 2097152:
        //   reason = "Language Barrier";
        //   break;
        case 536870912: //c
          reason = "On Hold One Day-Opener";
          imagePath=phoneDispositionImageUrl_red;
          break;
        case 1073741824://c
          reason = "TO - Open Manager";
          imagePath=phoneDispositionImageUrl_tri_purple;
          break;
        default:
          reason = "unknown disposition!";
          imagePath=dncImage_round_red;
          break;
      }

      return {
        imageUrl: imagePath,
        removeAjax: false,
        altText:
          formattedLastDispositionDate +
          reason +
          getDispositionUserName(foundPhone.DispositionCreatorUsername),
      };
    } else {
      // nothing, let go into default below
      console.error("despoistion id not found")
    }
  }

  return {
    imageUrl: imageUrl,
    removeAjax: false,
    altText: "Call now",
  };
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

function UpdatePhoneDetails(
  imageUrl,
  currentCustomerImageUrl,
  dncImageUrl,
  dispositionImageUrl,
  purpleImageUrl,
  phoneDNCImageUrl_tri_red,
  phoneDispositionImageUrl_tri_purple,
  phoneDispositionImageUrl_orange,
  phoneDispositionImageUrl_tri_red,
  phoneDispositionImageUrl_tri_blue,
  phoneDispositionImageUrl_yellow,
  phoneDispositionImageUrl_red,
  phoneDNCImageUrl_tri_black
) {
  var phoneNodes = document.getElementsByClassName("rlv-container");
  var phones = [];
  var processedPhoneNodes = {};
  for (var i = 0; i < phoneNodes.length; i++) {
    var imgNode = phoneNodes[i].firstChild;
    if (imgNode.getAttribute("data-phone-number")) {
      phones.push(parseInt(imgNode.getAttribute("data-phone-number")));
      if (processedPhoneNodes[imgNode.getAttribute("data-phone-number")]) {
        processedPhoneNodes[imgNode.getAttribute("data-phone-number")].push(
          imgNode
        );
      } else {
        processedPhoneNodes[imgNode.getAttribute("data-phone-number")] = [
          imgNode,
        ];
      }
    }
  }

  getPhones(phones).then(function (result) {
    if (result) {
      var resultObject = JSON.parse(result);
      for (var i = 0; i < resultObject.length; i++) {
        var processedPhone = ProcessPhoneDetails(
          resultObject[i].IPhone,
          resultObject,
          imageUrl,
          currentCustomerImageUrl,
          dncImageUrl,
          dispositionImageUrl,
          purpleImageUrl,
          phoneDNCImageUrl_tri_red,
          phoneDispositionImageUrl_tri_purple,
          phoneDispositionImageUrl_orange,
          phoneDispositionImageUrl_tri_red,
          phoneDispositionImageUrl_tri_blue,
          phoneDispositionImageUrl_yellow,
          phoneDispositionImageUrl_red,
          phoneDNCImageUrl_tri_black
        );
        var imgNodes = processedPhoneNodes[resultObject[i].IPhone.toString()];
        if (!imgNodes) {
          continue;
        }

        for (var j = 0; j < imgNodes.length; j++) {
          var imgNode = imgNodes[j];
          imgNode.alt = processedPhone.altText;
          imgNode.setAttribute("title", processedPhone.altText);
          if (imgNode.getAttribute("src") != processedPhone.imageUrl) {
            imgNode.setAttribute("src", processedPhone.imageUrl);
          }

          if (processedPhone.removeAjax) {
            imgNode.parentNode.setAttribute("data-remove-ajax", "true");

            var menuItem =
              imgNode.parentNode.getElementsByClassName("rlv-menu-container");
            if (menuItem && menuItem.length > 0) {
              var ajaxLink =
                menuItem[0].getElementsByClassName("rlv-phone-call");
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

function constructFormattedLastDispositionDate(isoFormatDate, timezone) {
  var date = new Date(isoFormatDate);
  var year = date.getFullYear().toString().substr(-2);
  var month = date.getMonth() + 1;
  var dt = date.getDate();

  if (dt < 10) {
    dt = "0" + dt;
  }
  if (month < 10) {
    month = "0" + month;
  }

  var time = formatAMPM(date);

  var formattedTimezone = "PST";
  if (
    timezone &&
    timezone.split("(").length > 1 &&
    timezone.split(")").length > 1
  ) {
    formattedTimezone = timezone.split("(")[1].split(")")[0];
  }

  return (
    month +
    "/" +
    dt +
    "/" +
    year +
    " " +
    time +
    +" " +
    formattedTimezone +
    " - "
  );
}

function formatAMPM(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? "0" + minutes : minutes;
  var strTime = hours + ":" + minutes + " " + ampm;
  return strTime;
}

function getDispositionUserName(dispositionUserName) {
  if (dispositionUserName) {
    return " (" + dispositionUserName + ")";
  } else {
    return "";
  }
}

document.addEventListener("yourCustomEvent", function (e) {
  document.querySelectorAll(".rlv-container").forEach((el) => el.remove());
  document.querySelectorAll('[rlv-processed="true"]').forEach((elem) => {
    elem.setAttribute("rlv-processed", false);
  });
  init();
});
