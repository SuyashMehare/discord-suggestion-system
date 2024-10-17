import mongoose,{ Schema } from "mongoose";

const guildConfigurationShema = new Schema({
    guildId:{
        type:String,
        required: true 
    },
    channelIds: {
        type:[String],
        default: [],
        required: true
    }
})

const GuildConfiguration = mongoose.model("guildConfiguration",guildConfigurationShema);

export {
    GuildConfiguration
}