const mongoose=require('mongoose');
const User=require('./User');

const sessionSchema = new mongoose.Schema({
    user:{
        type : mongoose.Schema.Types.ObjectId,
        ref : User,
        required : true
    },
    game:{
        type : String,
        required : true
    },
    duration:{
        type : Number,
        default : 0
    },
    kills:{
        type : Number,
        default : 0,
    },
    deaths:{
        type : Number,
        default : 0
    },
    assists:{
        type : Number,
        default : 0
    },
    ratio:{
        type : Number,
        default : 0
    },
    rankBefore:{
        type : String,
        default : ""
    },
    rankAfter:{
        type : String,
        default : ""
    },
    result:{
        type : String,
        default : ""
    },
    date:{
        type : Date,
        required : true
    },
    mood:{
        type : String,
        default : ""
    }
},
{
      timestamps:true
   }
)

const Session = mongoose.model('Session',sessionSchema);

module.exports = Session;