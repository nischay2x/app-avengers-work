const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const request = require('request');
const path = require('path')

const mongoose = require('mongoose');
const InstagramUser = require('./models/instagramUser.js');
const FacebookUser = require('./models/facebookUser.js');
const keys = require('./keys.json');

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'static')));


app.get("/", (req, res) => {
    res.status(200).send("Hello From Vercel");
});

app.get("/instagram/login", (req, res) => {
    const loginlink = `https://api.instagram.com/oauth/authorize?client_id=428951248759666&redirect_uri=https://igtv-nischay2x.vercel.app/instagram/callback&scope=user_profile,user_media&response_type=code`
    res.redirect(loginlink);
})

app.get("/facebook/login", (req, res) => {
    const link = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${keys.F_APP_ID}&redirect_uri=${keys.F_CALLBACK_URL}&state=ithinkthisisokay`
    res.redirect(link)
})

app.get("/facebook/delete", async (req, res) => {
    const { fid, facc } = req.cookies;
    if(!fid) return res.sendStatus(406)
    try {   
        const data = await FacebookUser.find({id : fid})
        res.status(200).send(data.name + "data deleted")
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
})

app.get("/facebook/callback", (req, res) => {
    const { code } = req.query;
    if(!code) { return res.status(406).json({...req.query}) }
    request.get({
        url : `https://graph.facebook.com/v12.0/oauth/access_token`,
        qs : {
            client_id : keys.F_APP_ID,
            client_secret : keys.F_APP_SECRET,
            redirect_uri : keys.F_CALLBACK_URL,
            code : code
        }
    }, (err, _, body) => {
        if(err) { return res.status(406).send(err) }
        const data = JSON.parse(body);
        request.get({
            url : 'https://graph.facebook.com/v12.0/me',
            qs : {
                access_token : data.access_token,
                fields : 'id,name,picture'
            }
        }, async (error, _, body) => {
            if(error) { return res.status(406).send(error) }
            const user = JSON.parse(body);
            try {
                const newUser = await FacebookUser.findOneAndUpdate({ id : user.id }, {
                    $set : { 
                        name : user.name,
                        id : user.id,
                        image : user.picture.data.url,
                        access_token : data.access_token
                    }
                }, { upsert : true, new : true });
                res.cookie('fid', user.id);
                res.cookie('facc', data.access_token);
                res.status(200).json(user)
            } catch (error) {
                console.log(error);
                res.status(500).send(error)
            }
        })
    })
})

app.get("/instagram/callback", (req, res) => {
    const { code } = req.query;
    if(!code) { return res.status(406).json({...req.query}) }
    request.post({
        url : 'https://api.instagram.com/oauth/access_token',
        form : {
            client_id : keys.APP_ID,
            client_secret : keys.APP_SECRET,
            grant_type : 'authorization_code',
            code : code,
            redirect_uri : keys.REDIRECT_URL
        }
    }, (err, _, body) => {
        if(err) { return res.status(406).json(err) }
            let data = JSON.parse(body)
            request.get({
                url : `https://graph.instagram.com/v12.0/me?access_token=${data.access_token}&fields=id,username,media_count,account_type`
            }, async (error, _, body) => {
                if(error) { return res.status(406).json(error) }
                try {
                    const user = JSON.parse(body)
                    const newUser = await InstagramUser.findOneAndUpdate({
                        id : user.id 
                    }, {
                        $set : {
                            id : user.id,
                            access_token : data.access_token,
                            name : user.username,
                            total_media : user.media_count
                        }
                    }, { upsert : true, new : true });
                    res.cookie('id', user.id),
                    res.cookie('acc', data.access_token)
                    res.status(200).json({...newUser})
                } catch (error) {
                    console.log(error);
                    res.status(500).send(error)
                }
            })
    })
})

function instagramLongAccessToken(id, access){
    request({
        url : `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${keys.APP_SECRET}&access_token=${access}`
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

app.get("/instagram/media/:mediaId", async (req, res) => {
    const { mediaId } = req.params;
    try {
        let query = { ["media."+mediaId] : 1, _id : 0 }
        const media = await InstagramUser.findOne({id : id}, query)
        res.status(200).json({ media })
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
})

app.get("/instagram/media", (req, res) => {
    const { id, acc } = req.cookies;
    if(!id || !acc){ return res.sendStatus(406) }
    request.get({
        url : `https://graph.instagram.com/me/media?fields=id,caption,thumbnail_url,media_type,media_url,username,timestamp&access_token=${acc}`
    }, async(err, _, body) => {
        if(err) { return res.status(406).send(err) }
        try {
            const media = JSON.parse(body).data;
            let update = { $set : { media : {} } }
            media.forEach(m => {
                update.$set.media[m.id] = m;
            });
            const updated = await InstagramUser.findOneAndUpdate({id : id}, update, { new : true });
            res.status(200).json({...updated})
        } catch (error) {
            console.log(error);
            res.status(500).send(error)
        }
    })
})

app.get("/facebook/media", (req, res) => {
    const { fid, facc } = req.cookies;
    if( !fid || !facc ) { return res.sendStatus(406) }
    request.get({
        url : `https://graph.facebook.com/me/posts`,
        qs : {
            access_token : facc
        }
    }, async (err, _, body) => {
        if(err) { return res.status(406).send(err) }
        const data = JSON.parse(body);
        res.status(200).json(body);
    })
})

app.get("/instagram/save", async (req, res) => {
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
})

app.get("/instagram/remove", async (req, res) => {
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
})

mongoose.connect('mongodb+srv://nischay:facebook10@cluster0.wj2bp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', (err) =>{
    if(err) console.log(err);
    else {
        app.listen(5000, (error) => {
            if(err) console.log(error);
            else console.log('Server Running');
        })
    }
})