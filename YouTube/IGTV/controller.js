const InstagramUser = require('../models/instagramUser.js');

const keys = require('./keys.json');

export function getLoginLink(req, res){
    res.status(200).json({
        status : true,
        link : `https://api.instagram.com/oauth/authorize?client_id=${keys.APP_ID}&redirect_uri=${keys.REDIRECT_URL}&scope=user_profile,user_media&response_type=code`
    })
}

export function handleCallback(req, res){
    const { code } = req.query;
    if (!code) { return res.status(406).json({ ...req.query }) }
    request.post({
        url: 'https://api.instagram.com/oauth/access_token',
        form: {
            client_id: keys.APP_ID,
            client_secret: keys.APP_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: keys.REDIRECT_URL
        }
    }, (err, _, body) => {
        if (err) { return res.status(406).json(err) }
        let data = JSON.parse(body)
        request.get({
            url: `https://graph.instagram.com/v12.0/me`,
            qs : {
                access_token : data.access_token,
                fields : 'id,username,media_count,account_type'
            }
        }, async (error, _, body) => {
            if (error) { return res.status(406).json(error) }
            try {
                const user = JSON.parse(body)
                const newUser = await InstagramUser.findOneAndUpdate({
                    id: user.id
                }, {
                    $set: {
                        id: user.id,
                        access_token: data.access_token,
                        name: user.username,
                        total_media: user.media_count
                    }
                }, { upsert: true, new: true });
                res.cookie('id', user.id),
                    res.cookie('acc', data.access_token)
                res.status(200).json({ ...newUser })
            } catch (error) {
                console.log(error);
                res.status(500).send(error)
            }
        })
    })
}

function instagramLongAccessToken(id, access){
    request({
        url : `https://graph.instagram.com/access_token`,
        qs : {
            grant_type : 'ig_exchange_token',
            client_secret : keys.APP_SECRET,
            access_token : access
        }
    }, async (err, _, body) => {
        try {
            const data = JSON.parse(body);
            const user = await InstagramUser.findOneAndUpdate({id : id}, {
                $set : { 
                    access_token : data.access_token, 
                    expires_in : data.expires_in,
                    token_type : data.token_type
                }
            }, { new : true });
        } catch (error) {
            console.log(error);
        }
    })
}

export async function getMediaById(req, res){
    const { mediaId } = req.params;
    try {
        let query = { ["media."+mediaId] : 1, _id : 0 }
        const media = await InstagramUser.findOne({id : id}, query)
        res.status(200).json({ media })
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
}

export function getMedia(req, res){
    const { id, acc } = req.cookies;
    if(!id || !acc){ return res.sendStatus(406) }
    request.get({
        url : `https://graph.instagram.com/me/media`,
        qs : {
            fields : 'id,caption,thumbnail_url,media_type,media_url,username,timestamp',
            access_token : acc
        }
    }, async(err, _, body) => {
        if(err) { return res.status(406).send(err) }
        try {
            const media = JSON.parse(body).data;
            let update = { $set : { media : {} } }
            media.forEach(m => {
                update.$set.media[m.id] = m;
            });
            const updated = await InstagramUser.findOneAndUpdate({id : id}, update, { new : true });
            res.status(200).json({...updated.media})
        } catch (error) {
            console.log(error);
            res.status(500).send(error)
        }
    })
}

export async function saveMedia(req, res){
    const { id, acc } = req.cookies;
    const { mediaId } = req.query;
    if(!id || !acc || !mediaId){ return res.sendStatus(406) }
    try {
        const { media, saved } = await InstagramUser.findOneAndUpdate({ id : id }, {
            $push : { saved : mediaId }
        }, { new : true });
        res.status(200).json({
            saved_media : saved.map(i => media[i])
        })
    } catch (error) {
        console.log(error);
        res.status(500).send(error)
    }
}

export async function removeMedia(req, res){
    const { id, acc } = req.cookies;
    const { mediaId } = req.query;
    if(!id || !acc || !mediaId){ return res.sendStatus(406) }
    try {
        const { media, saved } = await InstagramUser.findOneAndUpdate({ id : id }, {
            $pull : { saved : mediaId }
        }, { new : true });
        res.status(200).json({
            saved_media : saved.map(i => media[i])
        })
    } catch (error) {
        console.log(error);
        res.status(500).send(error)
    }
}