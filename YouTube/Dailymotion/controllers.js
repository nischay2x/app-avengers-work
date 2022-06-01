const keys = require('./keys.json');
const request = require('request');
const DailymotionUser = require('../models/dailymotionUser');

function getLoginLink(req, res){
    res.status(200).json({
        link : `https://www.dailymotion.com/oauth/authorize?response_type=code&client_id=${keys.API_KEY}&redirect_uri=${keys.REDIRECT_URL}`
    })
}

function handleCallback(req, res){
    const { code } = req.query;
    if(!code) { return res.status(406).json({ msg : "Try Again" }) }
    request.post({
        url : 'https://api.dailymotion.com/oauth/token',
        form : {
            grant_type : 'authorization code',
            client_id : keys.API_KEY,
            client_secret : keys.API_SECRET,
            redirect_uri : keys.REDIRECT_URL,
            code : code
        }
    }, (err, _, body) => {
        if(err){
            console.log(err);
            return res.status(406).send(err)
        }
        request.get({
            url : 'https://api.dailymotion.com/me',
            headers : {
                'Authorization' : `Bearer ${data.access_token}`
            }
        }, async ( error, _, body ) => {
            if(error){ return res.sendStatus(406) }
            try {
                const user = JSON.parse(body)
                const newUser = await DailymotionUser.findOneAndUpdate({ id : user.id }, {
                    $set : {
                        ...user,
                        access_token : data.access_token,
                        refresh_token : data.refresh_token
                    }
                }, { upsert : true, new : true });
                res.cookie('us', newUser.id);
                res.cookie('ac', data.access_token)
                res.status(200).json(newUser)
            } catch (error) {
                console.log(error);
                res.status(500).send(error);
            }
        })
    })
}

function getUserVideos(req, res){
    const { acc, us } = req.cookies;
    if(!acc || !us) { return res.sendStatus(406) }
    request.get({
        url : 'https://api.dailymotion.com/me/videos',
        headers : {
            'Authorization' : `Bearer ${acc}`
        }
    }, async (err, _, body) => {
        if(err) {
            console.log(err);
            return res.status(406).send(err.message)
        }
        try {
            const data = JSON.parse(body)
            let videosObject = {};
            data.list.forEach(video => {
                videosObject[video.id] = video;
            });
            const { videos, saved } = await DailymotionUser.findByIdAndUpdate({ id : us }, {
                $set : {
                    videos : videosObject,
                    total : data.total
                }
            }, { new : true });
            res.status(200).json({ videos, saved });
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }
    })
}

function saveVideo(req, res){
    const { us, acc } = req.cookies;
    const { videoId } = req.query;
    if(!us || !acc || !videoId ){ return res.sendStatus(406) }
    try {
        const { saved, videos } = await DailymotionUser.findOneAndUpdate({ id : us }, {
            $push : { saved : videoId }
        }, { new : true });
        res.status(200).json({saved, videos})
    } catch (error) {
        console.log(error);
        res.status(500).send(error)
    }
}

function removeVideo(req, res){
    const { us, acc } = req.cookies;
    const { videoId } = req.query;
    if(!us || !acc || !videoId ){ return res.sendStatus(406) }
    try {
        const { saved, videos } = await DailymotionUser.findOneAndUpdate({ id : us }, {
            $pull : { saved : videoId }
        }, { new : true });
        res.status(200).json({saved, videos})
    } catch (error) {
        console.log(error);
        res.status(500).send(error)
    }
}

function getUser(req, res){
    const { us } = req.cookies;
    if(!us) { return res.sendStatus(406) }
    try {
        const user = await DailymotionUser.findOne({ id : us });
        res.status(200).json(user);
    } catch (error) {
        console.log(error);
        res.status(500).send(error)
    }
}

module.exports = {
    getLoginLink, handleCallback, getUser, 
    getUserVideos, saveVideo, removeVideo
}