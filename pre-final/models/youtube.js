const mongoose = require('mongoose');

// although this is written as Youtube Schema, but can be used for other social platforms also, with slide modifications
const schema = mongoose.Schema({
    _id : String,
    site_id : { type: String, required : true, unique : true },
    site_username : String,
    site_profile : String,
    site_access : String,
    site_channel : Object,
    site_videos : {},
    listed_videos : []
}, { timestamps : true, _id : false });

const YouTube = mongoose.model('youtube', schema);
module.exports = YouTube;