const Joi = require('joi');
const jwt = require('jsonwebtoken');
const CONFIG = require('../config.js');

function verifyCollectionToken(req, res, next){
    const token = req.body.collectionToken;
    if(!token) return res.sendStatus(401);
    jwt.verify(token, CONFIG.collectionTokenSecret, (err, collection) => {
        if(err) return res.sendStatus(403);
        if(collection.wallet !== req.user.wallet) return res.sendStatus(403);
        req.collection = collection;
        next();
    });
}

function verifyAndPlaceAuthHeader(req, res, next){
    const token = req.headers['authorization'].split(' ')[1];
    if(!token){
        req.user = { wallet : "DEFAULT" }
        next();
    }
    jwt.verify(token, CONFIG.collectionTokenSecret, (err, user) => {
        if(err){
            req.user = { wallet : "DEFAULT" };
            next();
        }
        req.user = user;
        next();
    })
}

function authenticateToken(req, res, next){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if( token == null ) return res.sendStatus(401)
    jwt.verify(token, CONFIG.jwtSecret, (err, user) => {
        if(err) return res.sendStatus(403)
        req.user = user
        next()
    })
}