const mongoose = require('mongoose');

const userSchema =  mongoose.Schema({
    _id : String, // earlier I thougth this can be either wallet or username, but then I made it only Username
    username : { type: string, unique : true, required : true },
    email : { type : String, default : null },
    bio : { type : String, default : null },
    links : {
        twitter : { link : String, display : String },
        instagram : { link : String, display : String },
        discord : { link : String, display : String }
    },
    wallet : { type : String, required : true, unique : true, index : true },
    walletProvider : String,
    image : { type : String, default : null },
    banner : { type : String, default : null },
    is_verified : { type : Boolean, default : false },
    collections : [ { type : mongoose.SchemaTypes.ObjectId, ref : 'collections' } ],
    items : [ { type : mongoose.SchemaTypes.ObjectId, ref : 'items' } ]
}, { timestamps : true, _id : false  });

const User = mongoose.model('users', userSchema);
module.exports = User;
