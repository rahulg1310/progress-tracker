require('dotenv').config();
const axios = require('axios');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const User = require('./models/User');
const Game = require('./models/Game')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
        },'questlog_secret');
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

app.put('/profile/:id',async(req,res)=>{
    try{
        const {username,bio,profilePicture} = req.body;
        const existingUser = await User.findOne({
            username
        });
        if(existingUser && existingUser._id.toString()!==req.params.id){
            return res.status(400).json({
                success : false,
                message : "Username already taken"
            }
            )
        }
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
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
app.post('/games',async(req,res)=>{
    try{
        const {user,title,genre,platform,status,progress,playtime,rating,colorAccent,achievementsEarned,totalAchievements,notes} = req.body;
        const rawgResponse = await axios.get("https://api.rawg.io/api/games",
            {
                params:{
                key:process.env.RAWG_API_KEY,
                search:title
                }
            }
        );
        const coverImage = rawgResponse.data.results[0]?.background_image || "";
        if(!user){
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
        const existingUser = await User.findById(user);
        if(!existingUser){
            return res.status(404).json({
                success : false,
                message : "User not found"
            })
        }
        const newGame = await Game.create({user,title,genre,platform,status,progress,playtime,rating,colorAccent,achievementsEarned,totalAchievements,notes,coverImage});
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

app.get('/games/:userId',async(req,res)=>{
    try{
        const existingUser = await User.findById(req.params.userId);
        if(!existingUser){
            return res.status(404).json({
                success : false,
                message : "User not found"
            })
        }
        const existingGames = await Game.find({
                        user:req.params.userId
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

app.delete('/games/:gameId',async(req,res)=>{
    try{
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

app.put('/games/:gameId',async(req,res)=>{
    try{
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

app.listen(5000,()=>{
    console.log('Server started on port 5000');
});