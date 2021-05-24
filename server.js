const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const multer = require('multer')
const multerS3 = require('multer-s3')
const aws = require('aws-sdk')
const uuid = require('uuid').v4
const path = require('path')
const fs = require('fs')
require('dotenv').config()

//Passport
const session = require('express-session')
const passport = require('passport')
const flash = require('connect-flash')


const app = express()

/* MiddleWares */
app.set('view engine', 'ejs')
app.use(express.static('public'))
const urlencodedParser = bodyParser.urlencoded({extended: false})
app.use('/uploads', express.static('uploads')); // show uploaded image
app.use(flash())
app.use(express.json())
app.locals.moment = require('moment') //convert save date to '2 hours ago' like

let port = process.env.PORT;
if(port == null || port == ""){
    port = 4000;
}

//Handle Session
app.use(session({
    secret: "This is password", //input any
    resave: false,
    saveUninitialized: true
    //cookie: { secure: true }  //for HTTPS request
}))

app.use(passport.initialize());
app.use(passport.session());
//Session END 


const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY

// AWS Credentials
const s3 = new aws.S3({ apiVersion: '2006-03-01',
    region,
    accessKeyId,
    secretAccessKey
})

//Database Connection
let db = '';
/* mongodb+srv://admin-kyaalod:Palaganas09@cluster0.c8rn6.mongodb.net/KoNeKDB */
/* mongodb://localhost:27017/KoNek */
/* let url = 'mongodb://localhost:27017/KoNek' */

mongoose.connect(process.env.HOST, {useNewUrlParser: true, useUnifiedTopology: true}, (err, database)=>{
    if(err){
        res.send(err)
    }else{
        db = database
        app.listen(port, ()=>{console.log('Sever is running')})
    }
})
//Database Connection END 


//Model Schema
const User = require('./models/User')
const Post = require('./models/post')
const Comments = require('./models/comments')
//const comments = require('./models/comments')


// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(function(user, done){
    done(null, user.id)
});

passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
        done(err, user)
    })
})

const maxSize = 1024 * 1024 * 3 // 3MB Limit image upload

function fileFilter (req, file, cb){
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
        cb(null, true)
    }else{
        cb(null, false)
        //console.log('File is not Supported')
        req.flash('invalid', 'File is not Supported')
    }
}

const Upload = multer({
    storage: multerS3({ /* Save on AWS Storage */
        s3,
        bucket: bucketName,
        ACL: 'public-read',
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname })
        },
        key: (req, file, cb) =>{
            const ext = path.extname(file.originalname)
            cb(null, `${uuid()}${ext}`)
        }, 
       
    }),
    limits: { 
        fileSize: maxSize
    },
    fileFilter: fileFilter
}).single('image')



//Multer End


/* Index */
app.get('/index', (req, res)=>{
    if(req.isAuthenticated()){
        const userID = req.user.id
            
        Post.find({}, function(err, post){
            if(err){
                res.send(err)
            }else{
                res.render('index', {posts: post, userID: userID})  
                }

        }) 
                        
    }else{
        res.redirect('/')
    }
})


/* ========== Post Here ========== */
app.get('/addPost',urlencodedParser, (req, res)=>{
    if(req.isAuthenticated()){
        res.render('addPost',{limit: req.flash('limits'), empty: req.flash('empty'), message: req.flash('invalid')})
        
    }else{
        res.redirect('/')
    }
})

app.post('/post', urlencodedParser, (req, res)=>{
   if(req.isAuthenticated()){
   Upload(req, res, function(err){
    const { title, content, image } = req.body
    
    let post = new Post ({
        title: req.body.title,
        content: req.body.content,
        username: req.user.username,
        userId: req.user.id,
        avatar: req.user.avatar 
    })
        if(err instanceof multer.MulterError){
            req.flash('limits', 'Image is too large')
            res.redirect('/addPost')
        }else if(err){
            console.log('Something went wrong...')
        }else{
            if(!title || !content || !req.file){
                req.flash('empty', 'Fields cannot be empty')
                res.redirect('/addPost')
            }else{
                if(req.file){
                    post.img = req.file.location /* aws S3 location */
                    post.imgKey = req.file.key /* AWS S3 key is needed to locate the file inside the bucket */
                    //post.img = req.file.path
                    post.save(function(err){
                        if(err){
                            res.send(err)
                        }else{
                            User.updateOne({_id: req.user.id}, {$push:{post: post}}, function(err){
                                if(err){
                                    res.send(err)
                                    
                                }else{
                                    res.redirect('/index')
                                }
                            })
                        }
                    })
    
                }else{
                    res.redirect('addPost')
                }
            }
        }
    })
   }else{
       res.redirect('/login')
   }

})

app.get('/post/:postId', (req, res)=>{
    if(req.isAuthenticated()){
        const requestedPostId = req.params.postId;
        const requestedUserId = req.user.id
        let like = '';

        User.findOne({_id: req.user.id}, function(err, data){
            if(err){
                res.send(err)
            }else{
                if(data.likes.includes(requestedPostId)){ /* Check if user like array contains post ID */
                    let liked = data.likes.includes(requestedPostId)
                    like = liked /* Pass the data from user like array */
                }
            }
        })

        Post.findOne({_id: requestedPostId}, function(err, post){
            if(err){
                res.send(err)
            }else{
                Comments.find({postId: requestedPostId}, function(err, comment){
                    if(err){
                        res.send(err)
                    }else{
                        if(post){  
                            res.render('posts', {
                                title: post.title, 
                                content: post.content,
                                username: post.username,
                                avatar: post.avatar,
                                createdAt: post.createdAt,
                                userId: post.userId,
                                postId: post._id,
                                like: like, // array that return true
                                likeCount: post.likes,
                                postCount: post.comments,
                                userID: requestedUserId,
                                img: post.img,
                                comment: comment // array
                            })
                        }else{
                            res.redirect('/index')
                        }
                        
                    }
                })
            }
        })
    }else{
        res.redirect('/login')
    }
})


app.post('/likes/:userId', urlencodedParser, (req, res)=>{
    if(req.isAuthenticated()){
        const postID = req.params.userId
        const userID = req.user.id;
    
        User.updateOne({_id: userID}, {$push:{likes: postID}}, function(err){
            if(err){
                res.send(err)
            }else{
                //Add User ID
                Post.updateOne({_id: postID}, {$push:{likes: userID}}, function(err){
                    if(err){
                        res.send(err)
                    }else{
                       Post.findOne({_id: postID}, function(err, data){
                           if(err){
                               res.send(err)
                           }else{
                               res.json(data.likes.length)
                           }
                       })
                    }
                })
            }
        })
    }else{
        res.redirect('/login')
    }
})

app.post('/unlike/:userId', urlencodedParser, (req, res)=>{
    if(req.isAuthenticated()){
        const postID = req.params.userId
        const userID = req.user.id;

        User.updateOne({_id: userID}, {$pull: {likes:postID}}, function(err){
            if(err){
                res.send(err)
            }else{
                Post.updateOne({_id: postID}, {$pull:{likes: userID}}, function(err){
                    if(err){
                        res.send(err)
                    }else{
                        Post.findOne({_id: postID}, function(err, data){
                            if(err){
                                res.send(err)
                            }else{
                                res.json(data.likes.length)
                            }
                        })
                     }
                })
            }
        })

    }
})

app.post('/comment/:postId', urlencodedParser, (req, res)=>{
     if(req.isAuthenticated()){
        const { postId, comment } = req.body;
        const { username, id, avatar } = req.user
        
        const userComments = new Comments({
            comment: comment,
            userId: id,
            username: username,
            avatar: avatar,
            postId: postId
        })

        userComments.save(function(err, success){
            if(err){
                res.send(err)
            }else{
                if(success){
                    /* adding comment ID to post commentArray */
                    Post.updateOne({_id: postId}, {$push:{comments: userComments}}, function(err){
                        if(err){
                            res.send(err)
                        }
                    })

                    /* adding comment ID to User commentArray */
                    User.updateOne({_id: id}, {$push: {comments: userComments}}, function(err){
                        if(err){
                            res.send(err)
                        }
                    })

                }
            }
        })
     }else{
         res.render('/login')
     }
})

app.get('/editPost/:postId', (req, res)=>{
    if(req.isAuthenticated()){
        const requestedPostId = req.params.postId

        Post.findOne({_id: requestedPostId}, function(err, foundData){
            if(err){
                res.send(err)
            }else{
                if(foundData){
                    res.render('editPost', {
                        title:foundData.title,
                        content:foundData.content,
                        postId:requestedPostId,
                        limit: req.flash('limits'),
                        empty: req.flash('empty'),
                        message: req.flash('info')
                    })
                }
            }
        })
    }else{
        res.redirect('/login')
    }
})

app.post('/edit/:postId', urlencodedParser, (req, res)=>{
    const { title, content} =  req.body
    const requestedPostId = req.params.postId 

   if(!title || !content){
        req.flash('empty', 'Fields cannot be empty')
       res.redirect('/editPost/'+requestedPostId)
   }else{
    Post.updateOne({_id: requestedPostId}, {$set:{ title: title, content: content}}, function(err){
        if(err){
            res.send(err)
        }else{
            res.redirect('/index')
        }
    })
   }

})

app.post('/delete', urlencodedParser, (req, res)=>{
        const { postID } = req.body
        //const userID = req.user.id
       
        /* Deleting the comment that is connected to post Array */
        Post.findOne({_id: postID}, function(err, data){
            if(err){
                res.sendDate(err)
            }else{
                if(data){
                    const commentID = data.comments
                    /* Used forEach to delete list of objects inside array */
                    commentID.forEach((id)=>{
                        User.updateOne({comments: id}, {$pull: {comments: id}}, function(err){
                            if(err){
                                res.send(error)
                            }
                        })
                    })
                    Comments.deleteMany({_id: data.comments}, function(err){
                        if(err){
                            res.send(err)
                        }
                    })
                }
            }
        })

        Post.findOneAndDelete({_id: postID}, function(err, data){
            if(err){
                res.send(err)
            }else{
                const path = data.imgKey
                User.updateMany({}, {$pull:{post: postID, likes: postID}}, function(err,success){ 
                    if(err){
                        res.send(err)
                    }else{
                        if(success){
                            /* Delete Iamge on AWS key is needed to locate the file */
                            const deleteParams = {
                                Bucket: bucketName,
                                Key: path
                            }
                            s3.deleteObject(deleteParams, function(err){
                                if(err){
                                    res.send(err)
                                }else{
                                    res.redirect('/index')
                                    console.log('Image deleted' +""+  path)
                                }
                            })
                            //fs.unlinkSync(path)
                            //res.redirect('/index')
                        }
                    }
                })
            }
        }) 

})

/* Delete Comment */
app.post('/deleteComment', urlencodedParser, (req, res)=>{
    const { commentId } = req.body

    Comments.findOneAndDelete({_id: commentId}, function(err){
        if(err){
            res.send(err)
        }else{
            Post.updateOne({comments: commentId}, {$pull:{comments: commentId}}, function(err){
                if(err){
                    res.send(err)
                }
            })
            User.updateOne({comments: commentId}, {$pull: {comments: commentId}}, function(err){
                if(err){
                    res.send(error)
                }
            })
        }
    })

    
})

/* ========== Post END Here ========== */


/* ========== PROFILE HERE ========== */

app.get('/profile', urlencodedParser, (req, res)=>{

    if(req.isAuthenticated()){
        const requestedUserId = req.user.id
        User.findOne({_id: requestedUserId}, function(err, user){
            if(err){
                res.send(err)
            }else{
                const requestedPostId = user.post
                
                Post.find({_id: requestedPostId}, function(err, foundPost){
                    if(err){
                        res.send(err)
                    }else{
                        res.render('profile', {user: user, posts: foundPost, userID: requestedUserId })
                       
                    }
                })
            }
        })
    }else{
        res.redirect('/')
    }
})

app.get('/profile/:userId', (req, res)=>{
    if(req.isAuthenticated()){
        const requestedUserId = req.params.userId

        User.findOne({_id: requestedUserId}, function(err, data){
            if(err){
                res.send(err)
            }else{
                if(data){
                    const id = data.post
                    //console.log(data._id)
                    Post.find({_id: id}, function(err, foundPost){
                        if(err){
                            res.send(err)
                        }else{
                            res.render('profile', {user: data, posts: foundPost, userID: req.user.id })
                        }
                    })
                }else{
                    res.render('404') /* Wher user is not found show error 404 */
                }
            }
        })
        
    }else{
        res.redirect('/login')
    }
})


app.get('/users', (req, res)=>{
    
    if(req.isAuthenticated()){
        User.find({}, function(err, users){
            if(err){
                res.send(err)
            }else{
                res.render('users', {users: users})
            }
        })
    }else{
        res.redirect('/')
    }
  
   
})
/* ========== PROFILE END HERE ========== */



/* ========== SETTINGS HERE ========== */


app.get('/settings', urlencodedParser, (req, res)=>{
    if(req.isAuthenticated()){
        const requestedUserId = req.user.id
        User.findOne({_id: requestedUserId}, function(err, user){
            if(err){
                res.send(err)
            }else{
                res.render('settings', {user: user, limit: req.flash('limit'), empty: req.flash('emptyFields'), message: req.flash('invalid')})
            }
        })
    }else{
        res.redirect('/login')
    }
})

app.post('/update', urlencodedParser, (req, res, next)=>{
    if(req.isAuthenticated()){
        
        Upload(req, res, function(err){
            let { userId, email, username, name, firstname, lastname, avatar } = req.body
            const requestedUserId = req.user.id
            const avatarKeys = req.user.avatarKey

            if(err instanceof multer.MulterError){
                //res.redirect('/settings')
                req.flash('limit', 'Image is too large')
                res.redirect('/settings')
            }else if(err){
                console.log('Error encountered')
            }else{

                let userAvatar = '';
                let userAvatarKey = '';
                
                if(req.file){ 
                    avatar = req.file.location  
                    userAvatar = avatar
                    avatarKey = req.file.key       
                    userAvatarKey = avatarKey            
                    /* Deleting avatar and replace with the new avatar with image key for aws s3*/
                    const deleteParams = {
                        Bucket: bucketName,
                        Key: avatarKeys
                    }
                    s3.deleteObject(deleteParams, function(err){
                        if(err){
                            res.send(err)
                        }
                    })
                    
                }else{
                    /* Resaved current avatar when no changes */
                    userAvatar = req.user.avatar
                    userAvatarKey = avatarKeys
                }

                if(!username || !firstname || !lastname){
                    req.flash('emptyFields', 'Fields cannot be empty')
                    res.redirect('/settings')
                }else{
                        User.findOne({_id: requestedUserId}, function(err, user){
                            if(err){
                                res.send(err)
                            }else{
                                if(user){
                                    User.updateOne({_id: requestedUserId},{$set:{username: username, lastname: lastname, firstname: firstname, avatar: userAvatar, avatarKey: userAvatarKey}}, function(err){
                                        if(err){
                                        res.send(err)
                                            }else{
                                                const requestedPostId = user.post
                                                const requestedCommentId = user.comments
                                                Post.updateMany({_id: requestedPostId}, {$set: { username: username, avatar: userAvatar}}, {"multi": true}, function(err, data){
                                                    if(err){
                                                        res.send(err)
                                                    } 
                                                })
                                                Comments.updateMany({_id: requestedCommentId}, {$set: {username: username, avatar: userAvatar}}, function(err){
                                                    if(err){
                                                        re.send(err)
                                                    }else{
                                                        res.redirect('/settings')
                                                    }
                                                })
                                            }
                                        })
                                }else{
                                    console.log('No Data')
                            }
                        }
                    })
                }
            }
        })       
    }else{
        res.redirect('/login')
    }
})


/* ========== SETTINGS END HERE ========== */


/* ========== LOGIN HERE ========== */
app.get('/', (req, res)=>{
    if(req.isAuthenticated()){
        res.redirect('index')
    }else{
        //res.render('dashboard')
    res.render('login', {message: req.flash('info')})
    }
})

app.get('/login', urlencodedParser, (req, res)=>{
    if(req.isAuthenticated()){
        res.redirect('/index')
    }else{
        res.render('login', {message: req.flash('info')})
    }
})

app.post('/login', urlencodedParser,  //Handle unauthorized request
        passport.authenticate('local', {
            successRedirect: '/index',
            failureRedirect: ('/flash'),
            failureFlash: true,
    })
)

//Handle login Error
app.get('/flash', function(req, res){
    
    // Set a flash message by passing the key, followed by the value, to req.flash().
    req.flash('info', 'Invalid Username or Password')
    res.redirect('/login');
});
/* ========== LOGIN END HERE ========== */



/* ========== REGISTRATION HERE ========== */
app.get('/register', (req, res)=>{
    if(req.isAuthenticated()){
        res.redirect('index')
    }else{
        res.render('register') /* {message: req.flash('error')}) */
    }
})

app.post('/register', urlencodedParser,(req, res)=>{
    const { username, email, password, firstname, lastname} =  req.body
    const image = 'https://img.favpng.com/25/15/22/computer-icons-user-profile-icon-design-png-favpng-0VbLzJjbKEpnLF68K4UituW9P.jpg'
    const imagekey = 'aws-s3-key'


    let errors = [];

    if(!username || !email || !password || !firstname || !lastname){
        errors.push({msg: 'Please fill in all fields'})
    }

    if(password.length < 5){
        errors.push({msg: 'Password Should be at least 6'})
    }

    if(errors.length > 0){
        res.render('register', {errors, username, email, password, lastname, firstname})
    }else{
        
      User.findOne({email: email}, function(err, emailExist){ //Check if email already exist
        if(err){
            errors.push({msg: err})
        }else{
            if(emailExist){
                //res.redirect('/flasherror')
                errors.push({msg: 'Email already exists'});
                res.render('register', {errors, username, email, password, lastname, firstname})
            }else{
                    User.findOne({username: username}, function(err, userExist){
                        if(err){
                            errors.push({msg: err})
                        }else{
                            if(userExist){
                                errors.push({msg: 'Username already exists'});
                                res.render('register', {errors, username, email, password, lastname, firstname})
                               
                            }else{
                               /* let userAvatar
                                if(req.file){
                                    avatar = req.file.path
                                    userAvatar = avatar
                                }*/
                                User.register({username: username, email: email, firstname: firstname, lastname: lastname, avatar: image, avatarKey: imagekey}, password, function(err, success){
                                    if(err){
                                        
                                        res.redirect('/register')
                                    }else{
                                        passport.authenticate('local')(req, res, function(){
                                            res.redirect('index')
                                        })
                                    }
                                })
                            }
                        }
                    })
                }
            }
        })
    }
})

/* ========== REGISTRATION END HERE ========== */


app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});


app.use(function(req, res){
    if(req.isAuthenticated()){
        res.status(404).render('404')/* When page(s) is not found redirect to error page 404 */
    }else{
        res.redirect('/')
    } 
})
