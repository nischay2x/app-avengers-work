const mongoose = require('mongoose');

const schema = mongoose.Schema({
    name : String, // just the normaal name for the collection
    slug : { type : String, required : true, unique : true, index : true },
    image : String,
    banner : String,
    description : String,
    external_link : String,
    owner : { type: String, ref : "walletmaps" },
    items : {},
    is_public : { type : Boolean, default : true }
}, { timestapms : true });

const Collection = mongoose.model("collections", schema);
module.exports = Collection;