const jwt = require('jsonwebtoken');
const Joi = require('joi');

function checkQueryParams(req, res, next){
    const { error, code, state } = req.query;
    if(error) return res.status(500).json({
        msg : "Unable to login, please try again later.",
        error : error
    });
    const token = state;
    if(!token) return res.sendStatus(401)
    jwt.verify(token, CONFIG.jwtSecret, (err, user) => {
        if(err) return res.sendStatus(403)
        req.user = user;
        req.code = code;
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

function verifySingleUpdate(req, res, next){
    const { error, value } = Joi.object().keys({
        videoId : Joi.string().required()
    }).validate(req.body);
    if(error){
        return res.status(406).json({
            msg : error.message
        });
    }
    req.body = value;
    next();
}

function verifyMultipleUpdate(req, res, next){
    const { error, value } = Joi.object().keys({
        videoIds : Joi.array().min(2).required()
    }).validate(req.body);
    if(error){
        return res.status(406).json({
            msg : error.message
        });
    }
    req.body = value;
    next();
}

module.exports = {
    checkQueryParams, authenticateToken, verifyMultipleUpdate, verifySingleUpdate
}