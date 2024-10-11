require("dotenv").config()
const discord = require("discord.js")
const fs = require("fs")
const path = require("path")
const childProcess = require("child_process")

const serverRootFolder = path.join(path.dirname(__dirname),"versions")

const SlashCommandObject = {
    //スラッシュコマンドの設定
    data:new discord.SlashCommandBuilder()
        .setName(path.basename(__filename).split(".")[0])
        .setDescription("インストールされている起動構成の一覧を表示します。")

    ,
    //呼び出された時の処理
    async execute(interaction,client){

        await interaction.deferReply()
        
        const serverFolders = fs.readdirSync(serverRootFolder)

        let listStr =""

        serverFolders.forEach(elem => {
            
            listStr = listStr+`**・${elem}**\n`

        });
        if(listStr==""){
            listStr="起動構成は存在しません。"
        }

        const embed = new discord.EmbedBuilder()
            .setColor("Blue")
            .setTitle("ServerList")
            .setDescription(listStr)

        await interaction.followUp({embeds:[embed]})

    }
}

module.exports = SlashCommandObject