const authDiv = document.getElementById('auth')
const manageDiv = document.getElementById('manage')
const fore = document.getElementById('fore')
const back = document.getElementById('back')

let extensionKey = ''
let currentVideoId = ''
let esid = '';
let currentTab = {}

const queryOption = { active : true, currentWindow : true }

window.onload = async () => {
    const tabs = await chrome.tabs.query(queryOption)
    const { url } = tabs[0]
    const currentTab = tabs[0]
    if(url.startsWith('http://localhost:5000/extension')){ 
        chrome.storage.local.get(['mintLogin', 'mintAccess', 'mintSession'], (local) => {
            if (!local.mintLogin) {
                showLoginButton();
            } else {
                extensionKey = local.mintAccess;
                esid = local.mintSession;
                showLogoutButton();
            }
        })
    }
    else if(url.startsWith('https://www.youtube.com/watch?')){
        chrome.storage.local.get(['mintLogin', 'mintList', 'mintAll', 'mintAccess', 'mintSession'], async(local) => {
            extensionKey = local.mintAccess;
            esid = local.mintSession;
            if(!local.mintLogin){
                manageDiv.innerHTML = '<button class="btn btn-dark">You are not logged in with Mint Extension</button>';
            } else {
                const query = extractQuery(url);
                if(query){
                    currentVideoId = query.v;
                    checkOwnership(local, currentVideoId);
                } else {
                    manageDiv.innerHTML = '<button class="btn btn-warning">Click On a Video to Save</button>'
                }
            }
        })
    } 
    else {
        manageDiv.innerHTML = '<button class="btn btn-dark">The extension will only work in Watch page of YouTube</button>'
    }
}

function checkOwnership(local, vid){
    if (local.mintAll.includes(vid)) {
        // check if the video is there in the list or not
        if (local.mintList.includes(vid)) {
            showRemoveButton()
        } else {
            showAddButton()
        }
    } else {
        manageDiv.innerHTML = "<button class='btn btn-dark'>You don't Own This Video</button>"
    }
}

function extractQuery(url){
    let queries = {}
    const qs = url.split('https://www.youtube.com/watch?')[1]
    try {
        qs.split('&').forEach(qp => {
            let parts = qp.split('=')
            queries[parts[0]] = parts[1]
        })
        return queries 
    } catch (error) {
        return false
    }
}

// append login button to popup
function loginInjection(){
    return window.localStorage.getItem('extensionAccess')
}
function reloadInjection(){
    return window.location.reload()
}
function showLoginButton() {
    authDiv.innerHTML = ''
    authDiv.innerHTML = '<button class="btn btn-primary" id="key-submit">Enable Extension</button>'
    document.getElementById('key-submit').addEventListener('click', async() => {
        const tabs = await chrome.tabs.query(queryOption)
        const { id } = tabs[0]
        chrome.scripting.executeScript({
            target : { tabId : id },
            func : loginInjection
        }, (results) => {
            const key = results[0];
            console.log(key);
            handleLogin(key.result)
        })
        chrome.scripting.executeScript({
            target : { tabId : id },
            func : reloadInjection
        })
    })
}

// verify the key placed by the user
async function handleLogin(key) {
    try {
        const data = await postData('http://localhost:5000/extension/login', {
            key : key
        })
        chrome.runtime.sendMessage({ message: "log", data: data }, (res) => { })
        if (data.status) {
            setLogin(data, key)
        }
    } catch (error) {
        chrome.runtime.sendMessage({ message: "log", data: error }, (res) => {})
    }
}

// if server login successfull then set up local login
function setLogin(data, key){
    chrome.storage.local.set({
        mintChannel : data.channelId,
        mintList : data.saved,
        mintAccess : key,
        mintAll : data.all,
        mintLogin : true,
        mintSession : data.esid
    }, () => { showLogoutButton(); window.location.reload(); }) 
}

// append logout button to popup
function showLogoutButton() {
    authDiv.innerHTML = ''
    authDiv.innerHTML = '<button class="btn btn-danger" id="log-out">Disable Extension</button>'
    document.getElementById('log-out').addEventListener('click', () => { handleLogout() })
}


// remove user login data
async function handleLogout() {
    try {
        const data = await postData('http://localhost:5000/extension/logout', {
            access : extensionKey,
            esid : esid
        })
        if (data.status) {
            const tabs = await chrome.tabs.query(queryOption)
            const { id } = tabs[0]
            chrome.storage.local.remove(['mintLogin', 'mintAccess', 'mintChannel', 'mintList'], () => {
                manageDiv.innerHTML = ''
                chrome.scripting.executeScript({
                    target: { tabId: id },
                    files: ['logoutScript.js']
                })
                showLoginButton();
            })
        }
    } catch (error) {
        alert('Logout Failed')
    }
}


function showAddButton() {
    manageDiv.innerHTML = '<button id="add-to-mint" class="btn btn-success">Add To Mint List</button>'
    document.getElementById('add-to-mint').addEventListener('click', () => { addVideoToList(); })
}

function showRemoveButton() {
    manageDiv.innerHTML = '<button id="remove-from-mint" class="btn btn-warning">Remove from Mint List</button>'
    document.getElementById('remove-from-mint').addEventListener('click', () => { removeVideoFromList(); })
}

async function addVideoToList(){
    try {
        const data = await postData('http://localhost:5000/extension/add', {
            access: extensionKey,
            videoId: currentVideoId,
            esid : esid
        })
        if (data.status) {
            chrome.storage.local.set({'mintList': data.list }, () => { showRemoveButton(); })
        }
    } catch (error) {
        chrome.runtime.sendMessage({ message: "log", data: error }, (res) => { })
    }
}

async function removeVideoFromList(){
    try {
        const data = await postData('http://localhost:5000/extension/remove', {
            access: extensionKey,
            videoId: currentVideoId,
            esid : esid
        })
        if (data.status) {
            chrome.storage.local.set({'mintList': data.list }, () => { showAddButton(); })
        }
    } catch (error) {
        chrome.runtime.sendMessage({ message: "log", data: error }, (res) => { })
    }
}


// Helper Function to do post request
async function postData(url = '', data = {}) {
    const response = await fetch(url, {
        method: 'POST', 
        mode: 'cors',         
        cache: 'no-cache', 
        credentials: 'same-origin', 
        headers: {
            'Content-Type': 'application/json'
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer', 
        body: JSON.stringify(data) 
    });
    return response.json();
}

