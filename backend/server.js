require('dotenv').config();
const axios = require('axios');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const User = require('./models/User');
const Game = require('./models/Game')
const Session = require('./models/Session')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
app.use(express.json());
app.use(cors());

connectDB();

app.post('/signin',async (req,res)=>{
    try{
        const { email,password} = req.body;
        const existingEmail = await User.findOne({email});
        if(!existingEmail){
            return res.status(400).json({
                success : false,
                message : "Invalid Credentials"
            })
        }
        const isMatch = await bcrypt.compare(password,existingEmail.password);
        if(!isMatch){
            return res.status(400).json({
                success : false,
                message : "Invalid Credentials"
            })
        }
        const token = jwt.sign({
            userId : existingEmail._id
        },process.env.JWT_SECRET,
        {expiresIn : "7d"}
    );
        res.status(200).json({
            success:true,
            message:'Login Successful',
            token,
            userData :{
                _id : existingEmail._id,
                email : existingEmail.email,
                username : existingEmail.username,
                bio : existingEmail.bio,
                profilePicture : existingEmail.profilePicture
            }
        });
    }
    catch(error){
        console.log(error);
        res.status(500).json({
            success : false,
            message : "Server Error"
        });
    }
})

app.post('/google-signin',async (req,res)=>{
    const {accessToken} = req.body;
    try{
        const googleRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo',{
            headers:{
                Authorization : `Bearer ${accessToken}`
            }
        })
        const { email,name,picture } = googleRes.data;
        const existingEmail = await User.findOne({email});
        if(!existingEmail){
            return res.status(404).json({
                success : false,
                message : "User does not exist, Please sign up first"
            })
        }
        const token = jwt.sign(
            {userId : existingEmail._id},
            process.env.JWT_SECRET,
            {expiresIn : "7d"}
        )
        return res.status(200).json({
            success : true,
            message : "Login Succesful",
            token,
            user : {
                _id : existingEmail._id,
                email : existingEmail.email,
                username : existingEmail.username,
                bio : existingEmail.bio,
                profilePicture : existingEmail.profilePicture
            }
        })
    }
    catch{
        return res.status(500).json({
            success : false,
            Message : "Server Error"
        })
    }
})

app.post('/signup',async (req,res)=>{
    try{
        const { username,email,password } = req.body;
        if(!username){
        return res.status(400).json({
            success : false,
            message : "Username required"
            })
        }
        if(!email){
            return res.status(400).json({
                success : false,
                message : "Email is required"
            });
        }
        if(!password){
            return res.status(400).json({
                success : false,
                message : "Password is required"
            });
        }
        if(password.length<6){
            return res.status(400).json({
                success : false,
                message : "Password must be atleast 6 characters"
            });
        }
        const existingUser = await User.findOne({username});
        const existingEmail = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({
                success:false,
                message:'User already exists'
            })
        }
        if(existingEmail){
            return res.status(400).json({
                success:false,
                message:'Email already exists'
            });
        }
        const hashedPass = await bcrypt.hash(password,10);
        const newUser = await User.create({username,email,password : hashedPass});
        res.status(201).json({
            success : true,
            message : "Signup Successful"
        });
    }
    catch(error){
        console.log(error);
        res.status(500).json({
            success:false,
            message:'Server Error'
        });
    }
});

app.put('/profile',authMiddleware,async(req,res)=>{
    try{
        const {username,bio,profilePicture} = req.body;
        const existingUser = await User.findOne({
            username
        });
        if(existingUser && existingUser._id.toString()!==req.user.userId){
            return res.status(400).json({
                success : false,
                message : "Username already taken"
            }
            )
        }
        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId,
            {
                username,
                bio,
                profilePicture
            },
            {new : true}
        );
        
        if(!updatedUser){
            return res.status(404).json({
                success:false,
                message:"User not found"
            })
        }

        res.status(200).json({
            success : true,
            user : updatedUser
        }
        )
    }
    catch(error){
        console.log(error);
        res.status(500).json({
            success : false,
            message : "Server Error"
        })
    }
})
app.post('/games',authMiddleware,async(req,res)=>{
    try{
        const {title,genre,platform,status,progress,playtime,rating,colorAccent,achievementsEarned,totalAchievements,notes} = req.body;
        const rawgResponse = await axios.get("https://api.rawg.io/api/games",
            {
                params:{
                key:process.env.RAWG_API_KEY,
                search:title
                }
            }
        );
        const coverImage = rawgResponse.data.results[0]?.background_image || "";
        if(!req.user.userId){
            return res.status(400).json({
                success : false,
                message : "User required"
            })
        }
        if(!title){
            return res.status(400).json({
                success : false,
                message : "Title required"
            })
        }
        if(!genre){
            return res.status(400).json({
                success : false,
                message : "Genre required"
            })
        }
        const existingUser = await User.findById(req.user.userId);
        if(!existingUser){
            return res.status(404).json({
                success : false,
                message : "User not found"
            })
        }
        const newGame = await Game.create({user : req.user.userId,title,genre,platform,status,progress,playtime,rating,colorAccent,achievementsEarned,totalAchievements,notes,coverImage});
        return res.status(201).json({
            success : true,
            message : "Game created",
            game : newGame
        })
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success : false,
            message : "Server Error"
        })
    }
})

app.get('/games',authMiddleware,async(req,res)=>{
    try{
        const existingUser = await User.findById(req.user.userId);
        if(!existingUser){
            return res.status(404).json({
                success : false,
                message : "User not found"
            })
        }
        const existingGames = await Game.find({
                        user:req.user.userId
                    }).sort({ createdAt: -1 });
        return res.status(200).json({
            success : true,
            message : "Getting games",
            existingGames
        })
        
    }
    catch(error){
        return res.status(500).json({
            success : false,
            message : "Server Error"
        })
    }
})

app.delete('/games/:gameId',authMiddleware,async(req,res)=>{
    try{
        const existingUser = await User.findById(req.user.userId);
        if(!existingUser){
            return res.status(404).json({
                success : false,
                message : "User not found"
            })
        }
        const game = await Game.findById(req.params.gameId);
        if(game.user.toString()!==req.user.userId){
            return res.status(403).json({
                success : false,
                message : "Wrong User"
            })
        }
        if(!game){
            return res.json(404).json({
                success : false,
                message : "Game not found"
            })
        }
        const deletedGame = await Game.findByIdAndDelete(req.params.gameId);
        if(!deletedGame){
            return res.status(404).json({
                success : false,
                message : "Game not found"
            })
        }
        return res.status(200).json({
            success : true,
            message : "Deleting game",
            deletedGame
        })
    }
    catch(error){
        return res.status(500).json({
            success : false,
            message : "Server Error"
        })
    }
})

app.put('/games/:gameId',authMiddleware,async(req,res)=>{
    try{
        const existingUser = await User.findById(req.user.userId);
        if(!existingUser){
            return res.status(404).json({
                success : false,
                message : "User not found"
            })
        }
        const game=await Game.findById(req.params.gameId);
        if(game.user.toString()!==req.user.userId){
            return res.status(403).json({
                success : false,
                message : "Wrong User"
            })
        }
        if(!game){
            return res.json(404).json({
                success : false,
                message : "Game not found"
            })
        }
        const {
            title,
            genre,
            platform,
            status,
            progress,
            playtime,
            rating,
            colorAccent,
            achievementsEarned,
            totalAchievements,
            notes
        } = req.body;
        const updatedGame = await Game.findByIdAndUpdate(
            req.params.gameId,
            {
                title,
                genre,
                platform,
                status,
                progress,
                playtime,
                rating,
                colorAccent,
                achievementsEarned,
                totalAchievements,
                notes
            },
            {new : true}
        )
        if(!updatedGame){
            return res.status(404).json({
                success : false,
                message : "Game not found"
            })
        }
        return res.status(200).json({
            success : true,
            message : "Updating game",
            updatedGame
        })
    }
    catch(error){
        return res.status(500).json({
            success : false,
            message : "Server Error"
        })
    }
})

app.post('/sessions',authMiddleware,async (req,res)=>{
    try{
        const {game,duration,kills,deaths,assists,ratio,rankBefore,rankAfter,result,date,mood} = req.body;
        const newSession = await Session.create({user : req.user.userId,game,duration,kills,deaths,assists,ratio,rankBefore,rankAfter,result,date,mood});
        return res.status(201).json({
            success : true,
            message : "Sending Sessions",
            newSession
        })
    }
    catch(error){
        return res.status(500).json({
            success : false,
            message : "Server Error"
        })
    }
})

app.get('/sessions',authMiddleware,async (req,res)=>{
    try{
        const existingUser = await User.findById(req.user.userId);
        if(!existingUser){
            return res.status(404).json({
                success : false,
                message : "User not found"
            })
        }
        const existingSessions = await Session.find({
                        user:req.user.userId
                    }).sort({ createdAt: -1 });
        return res.status(200).json({
            success : true,
            message : "Getting sessions",
            existingSessions
        })
    }
    catch(error){
        return res.status(500).json({
            success : false,
            message : "Server Error"
        })
    }
})

app.delete('/sessions/:sessionId',authMiddleware,async (req,res)=>{
    try{
        const session = await Session.findById(req.params.sessionId);
        if(session.user.toString()!==req.user.userId){
            return res.status(403).json({
                success : false,
                message : "Wrong User"
            })
        }
        if(!session){
            return res.json(404).json({
                success : false,
                message : "Session not found"
            })
        }
        const deletedSession = await Session.findByIdAndDelete(req.params.sessionId);
        if(!deletedSession){
            return res.status(404).json({
                success : false,
                message : "Session not found"
            })
        }
        return res.status(200).json({
            success : true,
            message : "Deleting session",
            deletedSession
        })
    }
    catch(error){
        return res.status(500).json({
            success : false,
            message : "Server Error"
        })
    }
})

app.listen(5000,()=>{
    console.log('Server started on port 5000');
});