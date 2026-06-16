const mongoose=require('mongoose');
const User=require('./User');

const sessionSchema = new mongoose.Schema({
    user:{
        type : mongoose.Schema.Types.ObjectId,
        ref : User,
        required : true
    },

})

const Session = mongoose.model('Session',sessionSchema);

module.exports = Session;