const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

//Register Schema
const registerSChema = new mongoose.Schema({
    avatar:{
        type: String
    },
    avatarKey:{
        type: String
    },
    firstname:{
        type: String
    },
    lastname:{
        type: String
    },
    username:{
        type: String
        
    },
    email: {
        type: String
     
    },
    password: {
        type: String
        
    },
    createdAt: {type: Date, default: Date.now},
    post: [{type: mongoose.Schema.Types.ObjectId, ref: 'Post'}],
    likes: [{type: mongoose.Schema.Types.ObjectId, ref: 'Post'}],
    comments: [{type: mongoose.Schema.Types.ObjectId, ref: 'Comments'}]

    
})

registerSChema.plugin(passportLocalMongoose)
const User = new mongoose.model('User', registerSChema)

module.exports = User;