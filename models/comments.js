const mongoose = require('mongoose')

const userComments = new mongoose.Schema({
    comment:{
        type: String
    },
    userId:{
        type: String
    },
    username: {
        type: String
    },
    avatar: {
        type: String
    },
    postId: {
        type: String
    },
    createdAt: {type: Date, default: Date.now},
    //postID:  [{type: mongoose.Schema.Types.ObjectId, ref: 'Post'}]
})

const comments = new mongoose.model('Comments', userComments)

module.exports = comments