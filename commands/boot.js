const {SlashCommandBuilder, EmbedBuilder} = require("discord.js")
const fs = require("fs")
const path = require("path")
const child_process = require("child_process")

const choices = []
const serverRootFolder = `${path.dirname(__dirname)}/versions`
const serverFolders = fs.readdirSync(serverRootFolder)

for(let folderName of serverFolders){
    choices.push({name:folderName,value:folderName})
}


const SlashCommandObject = {
    data: new SlashCommandBuilder()
        .setName("boot")
        .setDescription("サーバーを起動します")
        .addStringOption(option =>
            option.setName("version")
                .setDescription("起動構成を選択します")
                .setRequired(true)
                .addChoices(choices)
        ),
    async execute(interaction){
        await interaction.deferReply()

        const serverFolder = path.join(__dirname,"versions",interaction.options.getString("version"))

        await child_process.exec(`start ${serverFolder}/run.bat`, async (err,stdout,stderr) => {
            if(stderr){

                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("ERROR")
                    .setDescription(`OS cmd error\n${stderr}`)
                
                await interaction.editReply({embeds:[embed]})
            }
            else if(err){
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("ERROR")
                    .setDescription(`Program error\n${err}`)

                await interaction.editReply({embeds:[embed]})
            }
            else{

                const embed = new EmbedBuilder()
                    .setColor("Green")
                    .setTitle("BOOT")
                    .setDescription("サーバーを起動します")

                await interaction.editReply({embeds:[embed]})
            }
        })

    }
}

module.exports = SlashCommandObject