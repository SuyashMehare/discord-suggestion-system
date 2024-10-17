import mongoose,{ Schema } from "mongoose";


const suggestions = new Schema({
    guildId:{
        type:String,
        required: true 
    },
    memberId :{
        type:String,
        required: true
    },
    channelId: {
        type:String,
        required: true
    },
    suggestionId: {
        type: String,
        required:true
    },
    content : {
        type:String,
        required: true
    },
    action:{
        type: String,
        enum:{
            values: ["pending","rejected","approved"]
        },
        default: "pending"
    },
    upvotes:{
        type: Number,
        default:0
    },
    downvotes:{
        type: Number,
        default:0
    },
})


const SuggestionModel = mongoose.model("Suggestion",suggestions);

export {
    SuggestionModel
}