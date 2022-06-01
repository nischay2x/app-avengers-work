const YouTube = require('../models/youtube.js');
const jwt = require('jsonwebtoken');
const google = require('googleapis').google;
const OAuth2 = google.auth.OAuth2;
const youtube = google.youtube("v3");
const CONFIG = require('../config.js');

// FUNCTIONS THAT WILL BE EXPORTED
function getLoginLink(req, res){
    const oauth2Client = initOauth();
    const { wallet, username } = req.user;

    const stateToken = jwt.sign({ wallet, username }, CONFIG.jwtYtSecret, { expiresIn : 120 });

    const link = oauth2Client.generateAuthUrl({
        access_type : "offline",
        scope : CONFIG.yt.scopes,
        state : stateToken
    });

    return res.status(200).json({link});
}

async function handleLoginCallback(req, res){
    const oauth2Client = initOauth();
    const { wallet : uid } = req.user;
    const code = req.code;
    try {
        const { token } = await oauth2Client.getToken(code);
        const ticket = await oauth2Client.verifyIdToken({
            idToken : token.id_token,
            audience : CONFIG.yt.clientId
        });
        const payload = ticket.getPayload();
        const user = await YouTube.findByIdAndUpdate(uid, {
            $set : {
                _id : uid,
                site_id : payload.sub,
                site_profile : payload.picture,
                site_username : payload.name,
                site_access : token
            }
        }, { upsert : true, new : true });
        return res.status(200).json({
            msg : "YouTube Connected",
            user : {
                name : user.site_username,
                image : user.site_profile
            }
        });
    } catch (err) {
        console.log(err);
        return res.status(500).send(err);   
    }
}


async function getVideos(req, res){
    const { wallet : uid } = req.user;
    try {
        const { 
            site_channel, site_videos, 
            listed_videos, site_access 
        } = await YouTube.findById(uid);
        if(Object.keys(site_videos).length){
            return res.status(200).json({
                channel : site_channel,
                videos : site_videos,
                listed_videos : listed_videos
            })
        }
        let { status, error, msg, updated } = await refreshVideoList(site_access, uid);
        if(status){
            return res.status(200).json({
                channel : updated.site_channel,
                videos : updated.site_videos,
                listed_videos : updated.listed_videos 
            });
        } else {
            if(error){
                console.log(msg)
                return res.sendStatus(500);
            } else {
                return res.status(200).json({
                    msg : msg
                })
            }
        }
    } catch (err) {
        console.log(err);
        return res.status(500).send(err);   
    } 
}

async function getVideoById(req, res){
    const { videoId } = req.params;
    if(!videoId) return res.sendStatus(400);
    const { wallet : uid } = req.user;
    const oauth2Client = initOauth()
    try {
        const { site_access } = await YouTube.findById(uid);
        oauth2Client.credentials = site_access;
        const { data } = await youtube.videos.list({
            auth : oauth2Client,
            id : videoId,
            part : 'snippet, statistics, contentDetails'
        });
        const videoDetails = data.items[0];
        const { listed_videos } = await YouTube.findByIdAndUpdate(uid, {
            $set : {
                ["site_videos."+videoId] : videoDetails
            }
        }, { new : true });
        return res.status(200).json({
            video : videoDetails,
            is_listed : listed_videos.includes(videoId)
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg : error.message
        })
    }
}

async function refreshList(req, res){
    const { wallet : uid } = req.user;
    try {
        const { site_access } = await YouTube.findById(uid);
        let { status, error, msg, updated } = await refreshVideoList(site_access, uid);
        if (status) {
            return res.status(200).json({
                msg: "List Updated",
                channel: updated.site_channel,
                videos: updated.site_videos
            });
        } else {
            if (error) {
                console.log(msg)
                return res.sendStatus(500);
            } else {
                return res.status(200).json({
                    msg: msg
                })
            }
        }
    } catch (err) {
        console.log(err);
        return res.status(500).send(err);
    }
}

async function listVideo(req, res){
    const { wallet : uid } = req.user;
    const { videoId } = req.body;
    try {
        const updated = await YouTube.findByIdAndUpdate(uid, {
            $push : { "listed_videos" : videoId }
        }, { new : true });
        return res.status(200).json({
            msg : "Added to List",
            listed_videos : updated.listed_videos,
            video : updated.site_videos[videoId]
        })
    } catch (error) {
        console.log(error);
        res.status(500).send(err);
    }
}

async function listMultipleVideos(req, res){
    const { wallet : uid } = req.user;
    const { videoIds } = req.body;
    try {
        const updated = await YouTube.findByIdAndUpdate(uid, {
            $push : { "listed_videos" : { $each : [...videoIds] } }
        }, { new : true });
        return res.status(200).json({
            msg : "Added to List",
            listed_videos : updated.listed_videos
        })
    } catch (error) {
        console.log(error);
        res.status(500).send(err);
    }
}


async function unlistVideo(req, res){
    const { wallet : uid } = req.user;
    const { videoId } = req.body;
    try {
        const updated = await YouTube.findByIdAndUpdate(uid, {
            $pull : { "listed_videos" : videoId } 
        }, { new : true });
        return res.status(200).json({
            msg : "Removed from list",
            listed_videos : updated.listed_videos
        })
    } catch (error) {
        console.log(error);
        res.status(500).send(err);
    }
}

async function unlistMultipleVideos(req, res){
    const { wallet : uid } = req.user;
    const { videoIds } = req.body;
    try {
        const updated = await YouTube.findByIdAndUpdate(uid, {
            $pullAll : { "listed_videos" : [...videoIds] } 
        }, { new : true });
        return res.status(200).json({
            msg : "Removed from list",
            listed_videos : updated.listed_videos
        })
    } catch (error) {
        console.log(error);
        res.status(500).send(err);
    }
}

// START HELPER FUNCTIONS

function initOauth(){
    return new OAuth2(
        CONFIG.yt.clientId,
        CONFIG.yt.clientSecret,
        CONFIG.yt.redirectUris
    )
}

async function refreshVideoList(accessToken, uid){
    const oauth2Client = initOauth();
    oauth2Client.credentials = accessToken;
    try {
        const channel_response = await youtube.channels.list({
            auth : oauth2Client,
            mine : true,
            part : 'id, snippet, contentDetails, statistics',
            maxResults : 1
        });
        if(!channel_response.data.pageInfo.totalResults){
            return { 
                status : false, 
                error : false,
                msg : "Couldn't find any YouTube channels associated with this account"
            }
        }
        const channel_data = channel_response.data.items[0];
        const playlistId = channel_data.contentDetails.relatedPlaylists.uploads;
        const playlist_response = await youtube.playlistItems.list({
            auth : oauth2Client,
            playlistId : playlistId,
            part : 'snippet, contentDetails, id',
            maxResults : channel_data.statistics.videoCount
        });
        const playlist_items = playlist_response.data.items;
        let uploadsObject = {};
        playlist_items.forEach(item => {
            uploadsObject[item.id] = item;
        });
        const updated = await YouTube.findByIdAndUpdate(uid, {
            $set: {
                channel: channel_data,
                uploads: uploadsObject
            }
        }, { new: true });
        return { status : true, error : false, updated }
    } catch (error) {
        return { status : false, error : true, msg : error }
    }
}

// END HELPER FUNCTIONS

module.exports = {
    getLoginLink, handleLoginCallback, getVideos, getVideoById,
    refreshList, listVideo, listMultipleVideos,
    unlistVideo, unlistMultipleVideos
}