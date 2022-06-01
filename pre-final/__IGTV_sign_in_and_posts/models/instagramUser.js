const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    access_token : String,
    refresh_token : String,
    id : String,
    media : {},
    total_media : Number,
    saved : [String],
    name : String,
    profile : String,
    image : String,
    expires_in : Number,
    token_type : String
})

const InstagramUser = mongoose.model('instagramuser', userSchema);
module.exports = InstagramUser;