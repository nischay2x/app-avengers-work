const mongoose = require('mongoose');

const schema = mongoose.Schema({
    _id : String, // wallet address
    username : { type : String, unique : true },
    nonce : String
}, { _id : false });

const WalletMap = mongoose.model("walletmaps", schema);
module.exports = WalletMap;