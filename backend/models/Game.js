const mongoose = require('mongoose');
const User = require('./User');

const gameSchema = new mongoose.Schema({
    user:{
        type : mongoose.Schema.Types.ObjectId,
        ref : User,
        required : true
    },
    title:{
        type : String,
        required : true,
    },
    genre:{
        type : String,
        required : true,
    },
    platform:{
        type : String,
        default : "PC"
    },
    status:{
        type : String,
        default : "Playing"
    },
    progress:{
        type : Number,
        default : 0
    },
    playtime:{
        type : Number,
        default : 0
    },
    rating:{
        type : Number,
        default : 0
    },
    colorAccent:{
        type : String,
        default:"#FFFFFF"
    },
    achievementsEarned:{
        type : Number,
        default : 0
    },
    totalAchievements:{
        type : Number,
        default : 0
    },
    notes:{
        type : String,
        default : ""
    },
    coverImage:{
        type : String,
        default : ""
    },
},
{
    timestamps : true
}

)

const Game = mongoose.model('Game',gameSchema);

module.exports = Game;