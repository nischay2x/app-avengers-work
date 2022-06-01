const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    access_token : String,
    user : {
        uri : String,
        name : String,
        link : String,
        pictures : {
            uri : String,
            base_link : String
        },
        created_time : Date,
        resource_key : String,
        account : String
    },
    playlist : [String],
    extensionSessions : [String]
})

const VimeoUser = mongoose.model("vimeouser", userSchema);

module.exports = VimeoUser;