const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

//Register Schema
const registerSChema = new mongoose.Schema({
    avatar:{
        type: String,
        required: true
    },
    avatarKey:{
        type: String,
        required: true
    },
    firstname:{
        type: String,
        required: true
    },
    lastname:{
        type: String,
        required: true
    },
    username:{
        type: String,
        required: true
        
    },
    email: {
        type: String,
        required: true
     
    },
    password: {
        type: String,
        required: true
        
    },
    createdAt: {type: Date, default: Date.now},
    post: [{type: mongoose.Schema.Types.ObjectId, ref: 'Post'}],
    likes: [{type: mongoose.Schema.Types.ObjectId, ref: 'Post'}],
    comments: [{type: mongoose.Schema.Types.ObjectId, ref: 'Comments'}]

    
})

registerSChema.plugin(passportLocalMongoose)
const User = new mongoose.model('User', registerSChema)

module.exports = User;