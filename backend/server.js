const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.get('/',(req,res)=>{
    res.send('Questlog Backend Running');
});

app.post('/signup',(req,res)=>{
    const { email,password } = req.body;
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
    res.status(201).json({
        success : true,
        message : "Signup Successful"
    });
});

app.listen(5000,()=>{
    console.log('Server started on port 5000');
});