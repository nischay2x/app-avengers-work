const WalletMap = require('../models/walletMap.js');
const jwt = require('jsonwebtoken');
const CONFIG = require('../config.js');

const { recoverPersonalSignature } = require('@metamask/eth-sig-util');

// It'll be better If the schema "WalletMap" is transfered to some Redis like database, it needs to be accessed frequently.
// If you need to know how this thig works ? visit - https://youtu.be/W28-1PXcLAI

async function getNonceToSign(req, res){
    const { address } = req.body;
    if (!address) return response.sendStatus(400);
    try {
        const wm = await WalletMap.findById(address, { nonce : 1, username : 1 });
        if(wm.nonce){
            return res.status(200).json({ nonce : wm.nonce })
        } else {
            const generatedNonce = Math.floor(Math.random() * 1000000).toString();
            const newWm = await new WalletMap({
                nonce : generatedNonce,
                _id : address
            });
            await newWm.save();
            return res.status(200).json({ nonce : generatedNonce })
        }
    } catch (error) {
        console.log(error)
        return res.sendStatus(500);
    }
}

async function verifySignedMessage(req, res){
    const { address, signature } = req.body;
    if(!address || !signature){
        return res.sendStatus(400);
    }
    try {
        const wm = await WalletMap.findById(address, { nonce : 1, username : 1 });
        if(wm.nonce){
            const recoveredAddress = recoverPersonalSignature({
                data : `0x${toHex(wm.nonce)}`,
                signature : signature
            });
            if(recoveredAddress === address){
                await WalletMap.updateOne({ _id : address }, {
                    $set : { nonce : Math.floor(Math.random() * 1000000).toString() }
                });

                const token = jwt.sign({ 
                    wallet : address, 
                    username : wm.username ? wm.username : "" 
                }, CONFIG.jwtSecret);
                return res.status(200).json({ token });
            } else {
                return res.sendStatus(401);
            }
        } else {
            return res.status(500).json({ msg : "Permission lena chahiye na" });
        }
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);   
    }
}

// Utility Function
function toHex(stringToConvert){
    return stringToConvert
    .split('')
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
}

module.exports = { 
    getNonceToSign, verifySignedMessage
}