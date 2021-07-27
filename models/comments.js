const mongoose = require('mongoose')

const userComments = new mongoose.Schema({
    comment:{
        type: String,
        required: true
    },
    userId:{
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        required: true
    },
    postId: {
        type: String,
        required: true
    },
    createdAt: {type: Date, default: Date.now}
    //postID:  [{type: mongoose.Schema.Types.ObjectId, ref: 'Post'}]
})

const comments = new mongoose.model('Comments', userComments)

module.exports = comments