const mongoose = require('mongoose');

const schema = mongoose.Schema({
    _id : { type : String, required : true, unique : true }, // token_id of item
    image_url :  String,
    external_link : String,
    origin : Object,
    name : String,
    slug : { type : String, unique : true, required : true, index : true },
    description : String,
    owner : { type: String, ref : 'walletmap' },
    asset_contract : Object,
    last_sale : { type : String, default : null }
}, { _id : false, timestamps : true });

const Item = mongoose.model("items", schema);
module.exports = Item;