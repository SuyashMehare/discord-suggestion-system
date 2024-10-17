import mongoose from "mongoose";
import { GuildConfiguration } from "./shemas/guildConfiguration.model.js";
import { SuggestionModel } from "./shemas/suggestions.model.js";
import { ActionRowBuilder, ChannelType, Client, GatewayIntentBits, ModalBuilder, SlashCommandBuilder, SlashCommandSubcommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { configDotenv } from "dotenv";
configDotenv()

const client = new Client({
    intents:[
       GatewayIntentBits.Guilds,
       GatewayIntentBits.GuildMembers,
       GatewayIntentBits.GuildMessages,
    ]
})


client.on("ready", async (c) =>{

try {
        mongoose.connect(process.env.MONGO_URI)
            .then((val) => console.log("db connectd...."))
            .catch((res) => console.log("Error connecting database..."))
        
        const _addSuggestion = new SlashCommandSubcommandBuilder()
            .setName("add")
            .setDescription("Select channel to add suggestion model")
            .addChannelOption((option) =>
                option
                    .setName("channel")
                    .setDescription("The channel where suggestions will be posted")
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true)
            );
    
        const _removeSuggestionModel = new SlashCommandSubcommandBuilder()
            .setName("remove")
            .setDescription("Select channel to remove suggestion model")
            .addChannelOption((option) =>
                option
                    .setName("channel")
                    .setDescription("The channel where suggestions will be posted")
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true)
            );
    
        const configSuggestion = new SlashCommandBuilder()
            .setName("configure-suugestion")
            .setDescription("Add suggestion model to channel")
            .addSubcommand(_addSuggestion)
            .addSubcommand(_removeSuggestionModel)
    
        const res = await c.application.commands.create(configSuggestion)
        console.log(`${c.user.username} is ready...`);  
} catch (error) {
    console.log("Error while while on `ready` event :", error);
}
})

client.on("interactionCreate",async (interaction) => {

    if(!interaction.isChatInputCommand()) return;
    await interaction.deferReply({ephemeral:true})

    const commandName = interaction.commandName;
    try {
    
        if(commandName === "configure-suugestion"){
            
            const subCommand = interaction.options.getSubcommand()

            if(subCommand == "remove"){
               const targetChannel = interaction.options.getChannel("channel")
               
               const guildConfiguration = await GuildConfiguration.findOne({
                guildId: interaction.guildId
               })

               if(!guildConfiguration){
                return interaction.editReply(`Suggestion model not yet configured with text channel "${targetChannel.name}" `);
               }
               
               const existChannelIdIndex = guildConfiguration.channelIds.findIndex((channelId) => channelId === targetChannel.id)
               const length = guildConfiguration?.channelIds.length;
               
               if(!(existChannelIdIndex >= 0)){
                   return interaction.editReply(`Suggestion model not yet configured with text channel "${targetChannel.name}" `);
                }
                
               
               const lastElement = guildConfiguration.channelIds[length-1];

               guildConfiguration.channelIds[length-1] = guildConfiguration.channelIds[existChannelIdIndex];
               guildConfiguration.channelIds[existChannelIdIndex] = lastElement;
               guildConfiguration.channelIds.pop();
               
               await guildConfiguration.save()
            
               return interaction.editReply(`Suggestion model is removed from target text channel "${targetChannel.name}"`);
            }


            if(subCommand == "add"){
                const targetChannel = interaction.options.getChannel("channel")
                
                let guildConfiguration = await GuildConfiguration.findOne({
                 guildId: interaction.guildId
                })
                
                // create document if admin execute command first time within server 
                if(!guildConfiguration){
                    guildConfiguration = await GuildConfiguration.create({
                        guildId: targetChannel.guildId,
                    })
                }

                const existChannelId = guildConfiguration?.channelIds.find((channelId) => channelId === String(targetChannel.id))

                if(existChannelId){
                    return interaction.editReply(`Suggestion model not yet configured with text channel "${targetChannel.name}" `);
                }

                guildConfiguration.channelIds.push(targetChannel.id);
                await guildConfiguration.save();

                return interaction.editReply(`Suggestion model is configured with target text channel "${targetChannel.name}"`);
            }
        }

        if(commandName === "suggest"){
            
            await interaction.deferReply({ephemeral:true});

            const targetChannel = interaction.options.getChannel("channel");
            const guildConfiguration = await GuildConfiguration.findOne({guildId: interaction.guildId})

            if(!guildConfiguration?.channelIds.length){
                return interaction.editReply("Server isn't configured yet with suggestion model.\n Ask admin to run `/configure-suugestions`")
            }

            if(!guildConfiguration.channelIds.includes(targetChannel.id)){
                return interaction.editReply(`You can't suggest within this channel <#${targetChannel.id}>.\n
                    Following channels are confiured with suggestion model 
                    ${guildConfiguration.channelIds.map((id)=> `<#${id}`).join(', ')}`)
            }

            const textInput = new TextInputBuilder()
                .setCustomId("text-input")   
                .setLabel("What's your suggestion?")
                .setStyle(TextInputStyle.Paragraph)
                .setMaxLength(500)
                .setRequired(true)
            
            const actionRow = new ActionRowBuilder().addComponents(textInput)

            const modal = new ModalBuilder()
                .setTitle("Create a suggestion")
                .setCustomId(`suggestion-modal-${interaction.user.id}`)
                .addComponents(actionRow)

            await interaction.showModal(modal)

            const filter = (i) => i.customId === `suggestion-modal-${interaction.user.id}`;

            const submittedModal = await interaction.awaitModalSubmit({
                filter: filter,
                time: 1000 * 60 * 3
            }).catch((e)=>console.log(e));

            await submittedModal.deferReply({ephemeral:true})


            
        }


        return interaction.editReply("fallback")
        } catch (error) {
            console.log(error);
            process.exit()
        }

})


client.login(process.env.TOKEN)
