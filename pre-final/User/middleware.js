const Joi = require('joi');
const CONFIG = require('../config.js');

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

const profile = Joi.object().keys({
    username : Joi.string(),
    email : Joi.string().email(),
    bio : Joi.string(),
    links : Joi.object().keys({
        twitter : Joi.string().regex(/^http(?:s)?:\/\/(?:www\.)?twitter\.com\/([a-zA-Z0-9_]+)/),
        instagram : Joi.string().regex(/^http(?:s)?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9_]+)/),
        website : Joi.string().regex(/http(?:s)?:\/\/(?:www\.)?[a-z]+\.com\/([a-zA-Z0-9_]+)/)
    }),
    image : Joi.string(),
    banner : Joi.string()
})

function verifyUpdateProfile(req, res, next){
    const { error, value } = profile.validate(req.body);
    if(error){
        return res.status(406).json({
            msg : error.message
        });
    }
    req.body = value;
    next();
}

function verifyUsernameUpdate(req, res, next){
    const { error } = Joi.string().required()
    .regex(/^[a-zA-Z0-9]([a-zA-Z0-9]|-|_)+$/)
    .validate(req.body.newUsername)
    if(error){
        return res.status(406).json({
            msg : error.message
        });
    }
    next();
}

module.exports = {
    authenticateToken
}