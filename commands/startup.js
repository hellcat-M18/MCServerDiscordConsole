require("dotenv").config()
const discord = require("discord.js")
const fs = require("fs")
const path = require("path")
const childProcess = require("child_process")

const targetTXT = path.join(path.dirname(__dirname),"startup.txt")

const choices = []
const serverRootFolder = path.join(path.dirname(__dirname),"versions")
const serverFolders = fs.readdirSync(serverRootFolder)

for(let folderName of serverFolders){
    choices.push({name:folderName,value:folderName})
}

choices.push({name:"<DISABLE>",value:"<DISABLE>"})

if(!choices.length){
    choices.push({name:"[NO INSTALLATION FOUND]",value:"<PLACEHOLDER>"})
}



const SlashCommandObject = {
    //スラッシュコマンドの設定
    data:new discord.SlashCommandBuilder()
        .setName(path.basename(__filename).split(".")[0])
        .setDescription("指定された構成をスタートアップとして登録します。")
        .addStringOption(option =>
            option
                .setName("version")
                .setDescription("起動構成")
                .addChoices(choices)
                .setRequired(false)
        )

    ,
    //呼び出された時の処理
    async execute(interaction,client){

        await interaction.deferReply()
        
        const version = interaction.options.getString("version")

        try{

            if(version){

                if(version=="<DISABLE>"){
                    fs.writeFileSync(targetTXT,"")

                    const embed = new discord.EmbedBuilder()
                    .setColor("Green")
                    .setTitle("STARTUP")
                    .setDescription(`スタートアップを無効化しました。`)

                    await interaction.followUp({embeds:[embed]})

                }else{

                    fs.writeFileSync(targetTXT,version)

                    const embed = new discord.EmbedBuilder()
                        .setColor("Green")
                        .setTitle("STARTUP")
                        .setDescription(`${version} の起動構成をスタートアップとして登録しました。`)

                    await interaction.followUp({embeds:[embed]})

                }

            }else{

                const currentStartUp = fs.readFileSync(targetTXT,"utf-8")

                if(currentStartUp){

                    const embed = new discord.EmbedBuilder()
                        .setColor("Blue")
                        .setTitle("INFO")
                        .setDescription(`${currentStartUp} がスタートアップとして登録されています。`)

                    await interaction.followUp({embeds:[embed]})

                }else{

                    const embed = new discord.EmbedBuilder()
                        .setColor("Blue")
                        .setTitle("INFO")
                        .setDescription(`スタートアップ設定は無効化されています。`)

                    await interaction.followUp({embeds:[embed]})

                }

            }      

        }catch(err){

            const embed = new discord.EmbedBuilder()
                .setColor("Red")
                .setTitle("ERR")
                .setDescription(err)

            await interaction.followUp({embeds:[embed]})
    
        }
    }
}

module.exports = SlashCommandObject