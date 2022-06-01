const User = require('../models/user.js');
const WalletMap = require('../models/walletMap.js');
const jwt = require('jsonwebtoken');
const CONFIG = require('../config.js');

async function updateUsername(req, res){
    const { wallet, username } = req.user;
    const { newUsername } = req.body;
    try {
        // this is to prevent two people having same username,
        // if they'll enter same username this will result in error
        let updated = await WalletMap.findByIdAndUpdate(wallet, {
            $set : { "username" : newUsername }
        }, { new : true });


        // if above process didn't threw error that means the username is unique
        if(username){
            updated = await User.findByIdAndUpdate(username, {
                $set : { username : newUsername, _id : newUsername }
            }, { new : true });
            return res.status(200).json({
                msg : `User name Updated to ${updated.username}`,
                token : jwt.sign({ wallet : wallet, username : newUsername }, CONFIG.jwtSecret)
            });
        } else {
            const newUser = await new User({
                _id : newUsername,
                username : newUsername,
                wallet : wallet
            });
            await newUser.save();
            return res.status(200).json({
                msg : `User name Updated to ${newUsername}`,
                token : jwt.sign({ wallet : wallet, username : newUsername }, CONFIG.jwtSecret)
            });
        }
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
}

// get the user from JWT token
async function getSignedUser(req, res){
    const { username } = req.user;
    try {
        const user = await User.findById(username, {
            _id : 0, username : 1, email : 1, bio : 1,
            links : 1, wallet : 1, WalletProvider : 1, image : 1,
            banner : 1, is_verified : 1, createdAt : 1, updatedAt : 1
        });
        return res.status(200).json({
            data : {...user}
        })
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
}

// get user by username
async function getUser(req, res){
    const { username } = req.params;
    try {
        const user = await User.findById(username, {
            _id : 0, username : 1, bio : 1,
            links : 1, wallet : 1, WalletProvider : 1, image : 1,
            banner : 1, is_verified : 1, createdAt : 1
        });
        return res.status(200).json({ data : {...user} });
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
}

// update user profile
async function updateProfile(req, res){
    const { username } = req.user;
    try {
        let updates = {};
        Object.keys(req.body).forEach(key => {
            update[key] = req.body[key]
        });
        await User.findByIdAndUpdate(username, {
            $set : updates
        }, { new : true });
        return res.status(200).json({
            msg : "Profile Updated",
            data : {...updates}
        })
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
}

// update profile links
async function updateLinks(req, res){
    const { username } = req.user;
    const { links } = req.body;
    try {
        let linkUpdates = {};
        if(links.length){
            links.forEach(l => {
                linkUpdates[l.sitename] = { link : l.link, display : l.username }
            });
            const updated = await User.findByIdAndUpdate(username, {
                $set : {
                    "links" : linkUpdates 
                }
            }, { new : true });
            return res.status(200).json({
                msg : "Links Updated",
                data : {...linkUpdates}
            });
        } 
        return res.status(200).json({
            msg : "Nothing to update"
        });
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
}

module.exports = {
    updateUsername, getSignedUser, getUser, 
    updateLinks, updateProfile
}