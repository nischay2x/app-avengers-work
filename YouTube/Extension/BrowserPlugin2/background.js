const API_KEY = "AIzaSyAnN7dVZiLAaYYL3Vsx8PW7w4qWpWJ9WTE";

let local = {}

function loadLocal(){
    chrome.storage.local.get(['mintLogin', 'mintAccess', 'mintChannel', 'mintList'], data => {
        local = data
    })
} loadLocal()

chrome.runtime.onMessage.addListener(async (req, sender, sendResponse) => {
    switch(req.message){
        case 'logged_in' : 
            chrome.storage.local.set({
                mintLogin : true, 
                mintChannel : req.channelId,
                mintAccess : req.key,
                mintList : req.saved
            }, () => {})
            loadLocal()
            console.log('logged in set', req.channelId);
            sendResponse(true)
        break;
        case 'log' : 
            console.log(req.data)
            sendResponse(true)
        break;
        case 'check_list': 
            loadLocal()
            sendResponse(local.mintList.includes(req.videoId))
        break;
        case 'update_list' :
            console.log('list updated', req.list) 
            chrome.storage.local.set({'mintList' : req.list}, () => {})
            loadLocal()
            sendResponse(true)
        break;
        case 'check_login' :
            loadLocal()
            if(local.mintLogin) {
                sendResponse({login : true, channelId : local.mintChannel, access : local.mintAccess})
                console.log('login check - user exist');
            }
            else{
                console.log('login check - user not exist');
                sendResponse(false)
            }  
        break;
        case 'log_out': 
            chrome.storage.local.remove(['mintLogin', 'mintAccess', 'mintChannel', 'mintList'], () => {})
            loadLocal()
            sendResponse(true)
        break;
        default : break;
    }
})

