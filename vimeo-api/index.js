const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const Vimeo = require('vimeo').Vimeo;
const CONFIG = require('./config.js');

const VimeoUser = require('./models/vimeoUser.js');
const VimeoVideos = require('./models/vimeoVideos.js');

app.use(cookieParser());
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", __dirname + '/ejs');

app.get("/", async (req, res) => {
    if(req.cookies.usac && req.cookies.usid){
        return res.status(200).redirect("/my-videos")
    } else {
        try {
            const allVideos = await VimeoVideos.find({}, {data : 1});
            const allUploads = allVideos.map(v => v.data).flat().filter(v => v.privacy.view === 'anybody');
            return res.status(200).render("home", { uploads : allUploads });
        } catch (error) {
            console.log(error);
            res.status(500).send("Some Error Occured");
        }
    }
})

app.get("/login", (req, res) => {
    if(req.cookies.usac && req.cookies.usid){
        return res.redirect('/');
    }
    const client = new Vimeo(CONFIG.CLIENT_ID, CONFIG.CLIENT_SECRET);
    let url = client.buildAuthorizationEndpoint(CONFIG.vimeoRedirect, CONFIG.vimeoScope, CONFIG.vimeoState);
    res.status(200).send(`<a href="${url}">Login with Vimeo</a>`);
})

app.get("/login-callback", (req, res) => {
    const { code, state } = req.query;
    if(state === CONFIG.vimeoState){
        const client = new Vimeo(CONFIG.CLIENT_ID, CONFIG.CLIENT_SECRET);
        client.accessToken(code, CONFIG.vimeoRedirect, async (err, response) => {
            if(err){
                console.log(err);
                res.status(500).send(err);
            } else {
                try {
                    console.log('callback', response);
                    const user = response.user;
                    await VimeoUser.findOneAndUpdate({"user.uri" : response.user.uri}, {
                        $set : {
                            access_token : response.access_token,
                            user : {
                                uri : user.uri,
                                name : user.name,
                                link : user.link,
                                pictures : {
                                    uri : user.pictures.uri,
                                    base_link : user.pictures.base_link
                                },
                                created_time : user.created_time,
                                resource_key : user.resource_key,
                                account : user.account
                            }
                        }                        
                    }, { upsert : true});

                    res.status(200);
                    res.cookie('usac', response.access_token, { httpOnly : true})
                    res.cookie('usid', user.uri);
                    res.redirect('/');
                } catch (error) {
                    console.log(error);
                    res.status(500).send("Some Error Occured try <a href='/login'>Login</a> again !")
                }
            }
        });
    } else {
        res.status(400).send("<h5>Login Error</h5>");
    }
})

app.get('/my-videos', authenticate, async (req, res) => {
    const client = new Vimeo(CONFIG.CLIENT_ID, CONFIG.CLIENT_SECRET);
    client.setAccessToken(req.cookies.usac);
    try {
        const { user } = await VimeoUser.findOne({
            access_token: req.cookies.usac,
            "user.uri": req.cookies.usid
        }, { user: 1 });
        const vidsData = await VimeoVideos.findOne({ userId: req.cookies.usid }, {
            total: 1, data: 1
        });
        if (vidsData) {
            return res.status(200).render("UserHome", {
                user: user, total: vidsData.total, uploads: vidsData.data,
                created_time: user.created_time, account: user.account
            });
        } else {
            client.request({
                path: req.cookies.usid + '/videos',
                query: {
                    fields: 'uri,name,description,link,duration,embed,created_time,modified_time,pictures,tags,stats,privacy'
                }
            }, async (err, response) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send("Some Error Occured");
                }
                let videos = response.data.map(v => {
                    return {
                        uri: v.uri,
                        name: v.name,
                        description: v.description,
                        link: v.link,
                        duration: v.duration,
                        embed: v.embed,
                        created_time: v.created_time,
                        modified_time: v.modified_time,
                        pictures: {
                            base_link: v.pictures.base_link
                        },
                        tags: v.tags,
                        stats: v.stats,
                        privacy: v.privacy
                    }
                })
                await VimeoVideos.findOneAndUpdate({ userId: req.cookies.usid }, {
                    $set: {
                        userId: req.cookies.usid,
                        total: response.total,
                        data: [...videos]
                    }
                }, { upsert: true });

                return res.status(200).render("UserHome", {
                    user: user, total: response.total, uploads: videos,
                    created_time: user.created_time, account: user.account
                })
            })
        }
    } catch (error) {
        console.log(error);
        return res.status(500).send("Some Error Occured")
    }
})

app.get("/refresh", (req, res) => {
    const { usid, usac } = req.cookies;
    if(usid && usac){
        const client = new Vimeo(CONFIG.CLIENT_ID, CONFIG.CLIENT_SECRET);
        client.setAccessToken(req.cookies.usac);
        client.request({
            path : usid+'/videos',
            query : {
                fields : 'uri,name,description,link,duration,embed,created_time,modified_time,pictures,tags,stats,privacy'
            }
        }, async (err, response) => {
            if(err){
                console.log(err);
                return res.status(500).send("Some Error Occured");
            } 
            let videos = response.data.map(v => {
                return {
                    uri: v.uri,
                    name: v.name,
                    description: v.description,
                    link: v.link,
                    duration: v.duration,
                    embed: v.embed,
                    created_time: v.created_time,
                    modified_time: v.modified_time,
                    pictures: {
                        base_link: v.pictures.base_link
                    },
                    tags: v.tags,
                    stats: v.stats,
                    privacy: v.privacy
                }
            });
            try {
                await VimeoVideos.findOneAndUpdate({userId : req.cookies.usid}, {
                    $set : {
                        total : response.total,
                        data : [...videos]
                    }
                });
                res.status(200).redirect("/my-videos");
            } catch (error) {
                console.log(error);
                res.status(500).send("Some Error Occured");   
            }
        })
    } else {
        res.status(200).redirect('/login');
    }
})

app.get("/watch", authenticate, async (req, res) => {
    const { v, title } = req.query;
    const { usid } = req.cookies;
    if(v && title){
        try {
            const videos = await VimeoVideos.findOne({"data.uri" : v}, {
                data : 1, userId : 1
            })
            const { playlist } = await VimeoUser.findOne({"user.uri" : usid}, {
                playlist : 1
            })
            const saved = playlist.includes(v);
            const video = videos.data.find(vid => vid.uri === v);
            if(video.privacy.view === 'anybody'){
                return res.status(200).render("watch", { video : video, videoId : v.split('videos/')[1], videoTitle : title, saved});
            } else {
                if(usid === videos.userId){
                    return res.status(200).render("watch", { video : video, videoId : v.split('videos/')[1], videoTitle : title, saved});
                }
                return res.status(200).send("This video is private");
            }
        } catch (error) {
            console.log(error);
            res.status(500).send("Some Error Occured");
        }
    }
})

function authenticate(req, res, next){
    if(!req.cookies.usid || !req.cookies.usac){
        res.status(401).redirect('/login');
    } else {
        next();
        return
    }
}

app.get("/toggle-playlist", authenticate, async (req, res) => {
    const { videoUri } = req.query;
    if(!videoUri) return res.status(406).json({msg : "Provide Video Id"});
    try {
        const { playlist } = await VimeoUser.findOne({"user.id" : req.cookies.usid}, {
            playlist : 1
        });
        if(playlist.includes(videoUri)){
            await VimeoUser.findOneAndUpdate({"user.uri" : req.cookies.usid}, {
                $pull : { playlist : videoUri }
            });
            return res.status(200).json({status : true, in : false, msg : "Video removed from playlist"}); 
        } else {
            await VimeoUser.findOneAndUpdate({"user.uri" : req.cookies.usid}, {
                $push: { playlist : videoUri }
            });
            return res.status(200).json({status : true, in : true, msg : "Video added to playlist"}); 
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({status : false, msg : "Some Error Occured"})
    }
})

app.get("/saved", authenticate, async(req, res) => {
    try {
        const { playlist } = await VimeoUser.findOne({"user.uri" : req.cookies.usid}, {
            playlist : 1
        });
        const { data } = await VimeoVideos.findOne({userId : req.cookies.usid}, {
            data : 1
        });
        const videos = data.filter(v => playlist.includes(v.uri));
        res.status(200).render("playlist", {videos : videos});
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
})

app.get("refresh-list", authenticate, (req, res) => {
    const client = new Vimeo(CONFIG.CLIENT_ID, CONFIG.CLIENT_SECRET);
    client.setAccessToken(req.cookies.usac);
    client.request({
        path: usid + '/videos',
        query: {
            fields: 'uri,name,description,link,duration,embed,created_time,modified_time,pictures,tags,stats,privacy'
        }
    }, async (err, response) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Some Error Occured");
        }
        let videos = response.data.map(v => {
            return {
                uri: v.uri,
                name: v.name,
                description: v.description,
                link: v.link,
                duration: v.duration,
                embed: v.embed,
                created_time: v.created_time,
                modified_time: v.modified_time,
                pictures: {
                    base_link: v.pictures.base_link
                },
                tags: v.tags,
                stats: v.stats,
                privacy: v.privacy
            }
        });
        try {
            await VimeoVideos.findOneAndUpdate({ userId: req.cookies.usid }, {
                $set: {
                    total: response.total,
                    data: [...videos]
                }
            });
            res.status(200).redirect("/my-videos");
        } catch (error) {
            console.log(error);
            res.status(500).send("Some Error Occured");
        }
    })
})

app.get("/logout", (req, res) => {
    res.clearCookie('usid');
    res.clearCookie('usac');
    res.status(200).redirect('/');
})

mongoose.connect(CONFIG.mongoURL, (err, done) => {
    if(err) console.log(err.message)
    else app.listen(CONFIG.port, () => {
        console.log('Database and Server Started');
    })
})
