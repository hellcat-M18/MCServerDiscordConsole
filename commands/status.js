require("dotenv").config()
const discord = require("discord.js")
const fs = require("fs")
const path = require("path")
const childProcess = require("child_process")

const SlashCommandObject = {
    //スラッシュコマンドの設定
    data:new discord.SlashCommandBuilder()
        .setName(path.basename(__filename).split(".")[0])
        .setDescription("サーバーの状態を確認します。")

    ,
    //呼び出された時の処理
    async execute(interaction,client){
        
        await interaction.deferReply()

        //jsonファイルを参照し死活判定
        fs.readFile(path.join(__dirname,"working.json"),"utf-8",async (err,data)=>{
            if(data!==""){
                const serverName = JSON.parse(data).name
                const embed = new discord.EmbedBuilder()
                    .setColor("Blue")
                    .setTitle("STATUS")
                    .setDescription(`${serverName}が起動しています。`)

                await interaction.followUp({embeds:[embed]})


            }else{
                const embed = new discord.EmbedBuilder()
                    .setColor("Blue")
                    .setTitle("STATUS")
                    .setDescription(`サーバーは停止中です。`)

                await interaction.followUp({embeds:[embed]})
            }
        })

    }
}

module.exports = SlashCommandObject