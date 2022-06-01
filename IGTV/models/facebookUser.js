const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    id : String,
    name : String,
    access_token : String,
    refresh_token : String,
    image : String,
    media : {},
    saved : [String]
});

const FacebookUser = mongoose.model('facebookuser', userSchema);
module.exports = FacebookUser;