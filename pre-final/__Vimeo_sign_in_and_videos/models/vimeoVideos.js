const mongoose = require('mongoose');

const video = mongoose.Schema({
    uri : String,
    name : String,
    description : String,
    link : String,
    duration : Number,
    embed : {},
    created_time : Date,
    modified_time : Date,
    pictures : {
        base_link : String
    },
    tags : [],
    stats : {},
    privacy : {}
});

const videoSchema = mongoose.Schema({
    userId : String,
    total : Number,
    data : [video]
})

const VimeoVideos = mongoose.model("vimeoVideos", videoSchema);

module.exports = VimeoVideos;