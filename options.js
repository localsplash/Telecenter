// Saves options to chrome.storage.sync.
function save_options() {
    var regex = document.getElementById('regex').value;
    var c2cURL = document.getElementById('c2cURL').value;
    var pbxExten = document.getElementById('pbxExten').value;
    var loadDelay = document.getElementById('loadDelay').value;
    chrome.storage.sync.set({
        regex: regex,
        c2cURL: c2cURL,
        pbxExten: pbxExten,
        loadDelay: loadDelay
    }, function () {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function () {
            status.textContent = '';
        }, 750);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    var defaultLastSyncDate = new Date();
    defaultLastSyncDate.setFullYear(defaultLastSyncDate.getFullYear());

    // Use default value color = 'red' and likesColor = true.
    chrome.storage.sync.get({
        regex: '\\(?([0-9]{3})\\)?[.-\\s]+?[0-9]{3}[.-\\s]+?[0-9]{4}',
        c2cURL: 'https://dayone.localsplash.com/agc/api.php?source=test&user={{EXTEN}}&pass=localsplash12&agent_user={{EXTEN}}&function=external_dial&value={{PHONEDIAL}}&phone_code=1&search=YES&focus=YES',
        pbxExten: "",
        loadDelay: "3",
        lastSyncDate: defaultLastSyncDate
    }, function (items) {
        document.getElementById('regex').value = items.regex;
        document.getElementById('c2cURL').value = items.c2cURL;
        document.getElementById('loadDelay').value = items.loadDelay;
        if (items.pbxExten) {
            document.getElementById('pbxExten').value = items.pbxExten;
        }
    });
}

function reset_options() {
    chrome.storage.sync.clear();
    restore_options();
}

function test_regex() {
    var regex = document.getElementById('regex').value;
    var phone = document.getElementById('phone').value;
    if (!phone) {
        document.getElementById('phone').style.borderColor = "#66FFA8";
        return;
    }

    if (phone.length > 0) {
        var pattern = new RegExp('^' + regex + '$');
        if (pattern.test(phone)) {
            document.getElementById('phone').style.borderColor = "#66FFA8";
        } else {
            document.getElementById('phone').style.borderColor = "#FF1626";
        }
    }
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
document.getElementById('resetDefaults').addEventListener('click',
    reset_options);
document.getElementById('phone').addEventListener('change', test_regex);

document.getElementById('advanced-expander').addEventListener('click', function () {
    if (document.getElementById('advanced-block').getAttribute('class') == 'advanced-block') {
        this.innerText = '-';
        document.getElementById('advanced-block').setAttribute('class', '');
    } else {
        this.innerText = '+';
        document.getElementById('advanced-block').setAttribute('class', 'advanced-block');
    }
});