const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());

connectDB();

app.get('/',(req,res)=>{
    res.send('Questlog Backend Running');
});

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
                email : existingEmail.email,
                username : existingEmail.username
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

app.listen(5000,()=>{
    console.log('Server started on port 5000');
});