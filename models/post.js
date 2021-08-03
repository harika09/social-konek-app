const mongoose = require('mongoose');

const userPost = new mongoose.Schema({
    userId:{
        type: String
    },
    username:{
        type: String
    },
    avatar:{
        type: String
    },
    title: {
        type: String
    },
    content: {
        type: String
    },
    img:{
        type: String
    },
    imgKey: {
        type: String
    },
    createdAt: {type: Date, default: Date.now},
    likes: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    comments: [{type: mongoose.Schema.Types.ObjectId, ref: 'Comments'}]

})

const post = new mongoose.model('Post', userPost)

module.exports = post;