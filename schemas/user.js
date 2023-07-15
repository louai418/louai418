const mongoose = require('mongoose');
const userschema = new mongoose.Schema({

    chatId:{type: Number,required:true,unique:true},
    joinedat:{type:Date,default: ()=> Date.now()},
    userId:{type:Number},
    reciterId:{type:Number},
    username:{type: String},
    surah:{type: String},
    surahId:{type: Number},
    reciter:{type: String},
    Moshaf:{type: String},
    MoshafServer:{type: String}
    
})
module.exports = mongoose.model("user",userschema)
